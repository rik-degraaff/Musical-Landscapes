import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as music from '../src/utils/music.js';
import * as composition from '../src/utils/composition.js';
import {compositionStyle,blendCompositionStyles} from '../src/data/compositionStyles.js';
import { SCENE_SOUNDS } from '../src/audio/sceneSounds.js';
import * as samples from '../src/audio/sampleLibrary.js';
import * as envelopes from '../src/audio/envelopes.js';
import { STRING_INSTRUMENTS } from '../src/utils/guitar.js';
import { equippedProfile } from '../src/utils/difficulty.js';
import { beatOffset } from '../src/utils/practice.js';
import { releaseManualVoice } from '../src/audio/voiceCleanup.js';
import { AudioResources } from '../src/audio/resources.js';
import * as selection from '../src/audio/sampleSelection.js';
import * as voices from '../src/audio/manualVoice.js';
import * as session from '../src/audio/session.js';
import { attachOwnedSamplerVoices } from '../src/audio/samplerVoices.js';

const source = readFileSync(new URL('../src/audio/AudioEngine.js', import.meta.url), 'utf8')
  .replace(/^import .+;\r?$/gm, '')
  .replace('export class AudioEngine', 'class AudioEngine')
  .replaceAll('import.meta.env.BASE_URL', "'/'");
const audioLevels = JSON.parse(readFileSync(new URL('../src/audio/audioLevels.json', import.meta.url), 'utf8'));

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

function setup() {
  globalThis.document = Object.assign(new EventTarget(), { hidden: false });
  globalThis.window = new EventTarget();
  const runtime = { nodes: [], starts: 0, startGate: null, onLoad: null, loads: 0, cancellations: 0, schedules: new Map(), schedulePositions: new Map(), cleared: [], ticks: 0, draws: [] };
  const parameter = () => ({ value: 0, automation:[], rampTo(value) { this.value=value; }, setValueAtTime() {}, linearRampToValueAtTime(value,time) { this.automation.push(['ramp',value,time]); }, setTargetAtTime() {}, cancelAndHoldAtTime(time) { this.automation.push(['cancel',time]); } });
  const context = Object.assign(new EventTarget(), {
    state: 'running', currentTime: 1,
    createBuffer(channels, length, sampleRate) {
      const waveforms = Array.from({ length: channels }, () => new Float32Array(length));
      return { numberOfChannels: channels, sampleRate, getChannelData: channel => waveforms[channel], copyToChannel: (waveform, channel) => waveforms[channel].set(waveform) };
    },
    createBufferSource() {
      return { playbackRate: parameter(), stops: [], disconnections: 0, connect() {}, start() {}, stop(time) { this.stops.push(time); }, disconnect() { this.disconnections++; } };
    },
    createGain() {
      return { gain: parameter(), disconnections: 0, disconnect() { this.disconnections++; } };
    },
  });
  class Node {
    constructor() { this.disposals = 0; this.volume = parameter(); runtime.nodes.push(this); }
    connect(target) { this.output=target;return this; }
    toDestination() { return this; }
    dispose() { this.disposals++; }
    triggerRelease() {}
    releaseAll() {}
  }
  class Buffer extends Node {
    async load(url) {
      runtime.loads++;
      await runtime.onLoad?.(url, runtime.loads, this);
      // Ownership tests need two seconds of audio, not device-rate waveforms.
      // Real-rate loop quality is covered by envelopes.test.js and browser audio.
      this.buffer = context.createBuffer(1, 2000, 1000);
      return this;
    }
    get() { return this.buffer; }
    dispose() { super.dispose(); this.buffer = undefined; }
  }
  class Reverb extends Node { constructor() { super(); this.ready = Promise.resolve(); } }
  class Filter extends Node { constructor() { super(); this.frequency=parameter(); } }
  class Sampler extends Node { constructor(options) { super(); queueMicrotask(options.onload); } }
  let scheduleId = 0;
  const schedule = (callback,position) => { const id = scheduleId++; runtime.schedules.set(id, callback); runtime.schedulePositions.set(id,position); return id; };
  const Tone = {
    start() { runtime.starts++; return runtime.startGate?.promise ?? Promise.resolve(); },
    getContext: () => ({ rawContext: context }), immediate: () => 1, now: () => 1,
    connect(source,target) { source.output=target; }, dbToGain: value => 10 ** (value / 20),
    Limiter: Node, Gain: Node, Volume: Node, Synth: Node, Player: Node, Filter,
    Time: value => ({ toTicks: () => beatOffset(value) * 192, toSeconds: () => typeof value==='number'?value:1 }),
    Frequency: note => ({ toMidi: () => selection.parseMidi(note) }),
    Reverb, Sampler, ToneAudioBuffer: Buffer, Draw: { schedule(callback,time) { runtime.draws.push({callback,time}); } },
    Transport: {
      bpm: { value: 92 }, state: 'stopped', PPQ: 192,
      getTicksAtTime: time => runtime.ticks + (time - 1) * 192 * 92 / 60,
      scheduleRepeat: schedule, scheduleOnce: schedule,
      clear(id) { runtime.cleared.push(id); runtime.schedules.delete(id); },
      cancel() { runtime.cancellations++; runtime.schedules.clear(); },
      start() { this.state = 'started'; }, stop() { this.state = 'stopped'; }, pause() { this.state = 'paused'; },
    },
  };
  const dependencies = { Tone, ...music, ...composition, compositionStyle, blendCompositionStyles, SCENE_SOUNDS, audioLevels, ...samples, ...envelopes, STRING_INSTRUMENTS, equippedProfile, beatOffset, releaseManualVoice, AudioResources, ...selection, ...voices, ...session, attachOwnedSamplerVoices };
  const AudioEngine = new Function(...Object.keys(dependencies), `${source}\nreturn AudioEngine;`)(...Object.values(dependencies));
  const engine = new AudioEngine();
  engine.composition = new composition.Composition({random:()=>.9});
  return { engine, runtime, Tone };
}

test('transport bar positions survive tempo holds that skip downbeat callbacks', async () => {
  const {engine,runtime,Tone}=setup();
  await engine.init();
  engine.active.piano=true;engine.active.drums=true;engine.playEvent=()=>{};
  const callback=runtime.schedules.get(engine.transportEvent);
  callback(1);
  engine.holdTempo(true);
  runtime.ticks=Tone.Transport.PPQ*4;
  callback(1);
  assert.equal(engine.barIndex,1);
  engine.setTempo(208);engine.holdTempo(false);
  runtime.ticks=Tone.Transport.PPQ*8;
  callback(1);
  assert.equal(engine.barIndex,3);
  assert.ok(engine.scheduledBars.has(2));
  const pending=[...engine.pendingEventBars].filter(([,bar])=>bar===2);
  assert.ok(pending.length>0);
  for(const [id] of pending)assert.ok(Number(runtime.schedulePositions.get(id).slice(0,-1))>runtime.ticks);
});

test('scene changes finish captured old-key events and next bar uses the latest key on the same transport', async () => {
  const { engine, runtime, Tone } = setup();
  await engine.init();engine.setSceneKey('A');engine.active.piano=true;engine.active.drums=true;
  const played=[];
  engine.playEvent=(name,event,time,root)=>played.push({name,event,time,root});
  engine.scheduleBar(1);
  const pending=new Map(engine.pendingEvents);
  assert.ok(pending.size>0);
  const releases=[];
  for(const [name,node] of Object.entries(engine.nodes))node.synth.releaseAll=()=>releases.push(name);
  runtime.ticks=192;
  const schedules=runtime.schedules.size;
  engine.setSceneKey('E');engine.setSceneKey('Fm');
  assert.deepEqual(engine.pendingEvents,pending);
  assert.deepEqual(releases,[]);
  assert.equal(engine.root,'Fm');assert.equal(engine.barRoot,'A');
  assert.equal(engine.barIndex,1);assert.equal(runtime.schedules.size,schedules);
  for(const id of pending.keys())runtime.schedules.get(id)(1.5);
  assert.ok(played.length>2);
  assert.ok(played.every(value=>value.root==='A'));
  assert.equal(engine.pendingEvents.size,0);
  played.length=0;
  engine.scheduleBar(3);
  assert.equal(engine.barRoot,'Fm');assert.equal(engine.barIndex,2);
  assert.ok(played.every(value=>value.root==='Fm'));
  assert.equal(Tone.Transport.state,'started');
});

test('held manual voices and their controls keep the audible key until the next downbeat', async () => {
  const { engine, runtime } = setup();
  await engine.init();engine.setSceneKey('A');engine.setManualInstrument('piano');
  engine.scheduleBar(1);runtime.ticks=192;
  engine.manualNoteOn('C4','held');
  const voice=engine.manualVoices.get('held');assert.ok(voice);
  const changes=[];engine.onSceneKeyChange=root=>changes.push(root);
  engine.setSceneKey('E');engine.setSceneKey('Fm');
  assert.equal(engine.playbackRoot,'A');assert.equal(engine.manualVoices.get('held'),voice);
  assert.deepEqual(voice.source.stops,[]);assert.deepEqual(changes,[]);
  engine.scheduleBar(3);
  assert.equal(engine.playbackRoot,'A');assert.equal(engine.manualVoices.get('held'),voice);
  for(const draw of runtime.draws)draw.callback();
  assert.equal(engine.playbackRoot,'Fm');assert.deepEqual(changes,['Fm']);
  assert.equal(engine.manualVoices.size,0);assert.ok(engine.retiringVoices.has(voice));
});

test('a ringing manual drum source also defers a scene change without releasing it midbar', async () => {
  const { engine, runtime } = setup();
  await engine.init();engine.setSceneKey('A');engine.scheduleBar(1);runtime.ticks=192;
  engine.nodes.drums.samplerVoices.voices.add({startTime:1});
  let released=false;engine.nodes.drums.synth.releaseAll=()=>{released=true;};
  engine.setSceneKey('E');
  assert.equal(engine.playbackRoot,'A');assert.equal(engine.barRoot,'A');assert.equal(released,false);
  engine.scheduleBar(3);runtime.draws.at(-1).callback();
  assert.equal(engine.playbackRoot,'E');assert.equal(released,false);
});

test('replacing an already queued A bar with E and A invalidates its obsolete cues only', async () => {
  const { engine, runtime } = setup();
  await engine.init();engine.setSceneKey('A');engine.setManualInstrument('piano');engine.active.piano=true;
  engine.nodes.piano.synth.triggerAttackRelease=()=>{};
  const cues=[];engine.onManualAutoplayEvent=event=>{if(event)cues.push(event);};
  engine.scheduleBar(1);
  const current=runtime.draws.slice();runtime.draws.length=0;
  engine.scheduleBar(3);
  const obsolete=runtime.draws.slice();runtime.draws.length=0;
  runtime.ticks=740;engine.setSceneKey('E');engine.setSceneKey('A');
  for(const draw of obsolete)draw.callback();
  assert.equal(cues.length,0);
  for(const draw of current)draw.callback();
  assert.ok(cues.length>0);cues.length=0;
  for(const draw of runtime.draws)draw.callback();
  assert.ok(cues.length>0);
  assert.ok(runtime.draws.every(draw=>draw.time>3));
});

test('pickups during a key transition stay in the current bar key', async () => {
  const { engine, runtime } = setup();
  await engine.init();engine.setSceneKey('A');engine.active.piano=true;
  const played=[];engine.playEvent=(name,event,time,root)=>played.push({name,event,root});
  engine.scheduleBar(1);runtime.ticks=192;engine.setSceneKey('E');
  const plan=engine.scheduledBars.get(0).plan;
  const state=structuredClone(engine.composition.state);
  engine.composition.planBar=()=>{throw new Error('Pickup must not replan the audible bar');};
  engine.active.ukulele=true;
  engine.playPickup('ukulele');
  const actual=played.at(-1);
  assert.equal(actual.root,'A');
  assert.equal(actual.event.chord,plan.currentChord.name);
  assert.deepEqual(engine.composition.state,state);
  assert.equal(engine.scheduledBars.get(0).plan,plan);
});

test('even a first-quarter-beat key change leaves the current bar uninterrupted', async () => {
  const { engine, runtime, Tone } = setup();
  await engine.init();engine.setSceneKey('A');engine.active.piano=true;
  const played=[];engine.playEvent=(name,event,time,root)=>played.push({name,event,root});
  engine.scheduleBar(1);engine.beatIndex=9;
  const previous=[...engine.pendingEvents.keys()];assert.ok(previous.length>0);
  runtime.ticks=24;played.length=0;engine.setSceneKey('E');
  assert.equal(engine.barRoot,'A');assert.equal(engine.barIndex,1);assert.equal(engine.beatIndex,9);
  assert.equal(Tone.Transport.state,'started');
  assert.ok(previous.every(id=>engine.pendingEvents.has(id)&&!runtime.cleared.includes(id)));
  assert.equal(played.length,0);
  for(const id of engine.pendingEvents.keys())runtime.schedules.get(id)(1.5);
  assert.ok(played.every(value=>value.root==='A'));
  played.length=0;engine.scheduleBar(3);
  assert.ok(played.every(value=>value.root==='E'));
});

test('quarter-beat boundary defers replacement and inactive or suspended scene changes still clean stale work', async () => {
  const { engine, runtime } = setup();
  await engine.init();engine.setSceneKey('A');engine.active.piano=true;engine.playEvent=()=>{};
  engine.scheduleBar(1);runtime.ticks=48;
  const pending=new Map(engine.pendingEvents);
  engine.setSceneKey('E');assert.deepEqual(engine.pendingEvents,pending);assert.equal(engine.barRoot,'A');
  engine.suspendPlayback();engine.setSceneKey('G');
  assert.equal(engine.barRoot,'G');assert.equal(engine.pendingEvents.size,0);
  const barIndex=engine.barIndex;engine.scheduleBar(2);assert.equal(engine.barIndex,barIndex);
});

test('harmony publishes the scheduled plan only at its audible draw and ignores invalidated draws', async () => {
  const {engine,runtime}=setup();
  await engine.init();engine.setSceneKey('A');engine.active.piano=true;
  engine.playEvent=()=>{};
  const publications=[];
  engine.onHarmonyChange=plan=>publications.push({plan,root:engine.playbackRoot});
  engine.scheduleBar(1);
  const first=engine.scheduledBars.get(0);
  assert.equal(publications.length,0);
  assert.ok(runtime.draws[0].time>=first.time);
  runtime.draws[0].callback();
  assert.equal(publications.length,1);
  assert.equal(publications[0].plan,first.plan);
  assert.equal(publications[0].root,first.plan.root);
  runtime.ticks=192;engine.setSceneKey('E');engine.scheduleBar(3);
  const next=engine.scheduledBars.get(1);
  assert.equal(publications.length,2);assert.equal(publications.at(-1).plan,null);assert.equal(engine.playbackRoot,'A');
  runtime.draws.at(-1).callback();
  assert.equal(publications.at(-1).plan,next.plan);
  assert.equal(publications.at(-1).root,'E');
  engine.scheduleBar(5);
  const stale=runtime.draws.at(-1);
  engine.suspendPlayback();
  assert.equal(publications.at(-1).plan,null);
  stale.callback();assert.equal(publications.length,4);
});

for(const boundary of ['background','practice','dispose'])test(`${boundary} restart resets composer history before planning bar zero`,async()=>{
  const {engine,runtime}=setup();
  await engine.init();engine.setSceneKey('A');engine.active.piano=true;
  engine.playEvent=()=>{};
  for(let bar=0;bar<10;bar++)engine.scheduleBar(1+bar*2);
  assert.ok(engine.composition.plans.size>0);
  const stale=runtime.draws.slice();
  if(boundary==='background'){engine.suspendPlayback();await engine.resumePlayback();}
  if(boundary==='practice'){engine.beginPractice('piano');engine.endPractice();}
  if(boundary==='dispose'){engine.dispose();await engine.init();engine.setSceneKey('A');engine.active.piano=true;}
  assert.equal(engine.barIndex,0);
  assert.equal(engine.composition.plans.size,0);
  assert.equal(engine.composition.nextBar,0);
  const publications=[];engine.onHarmonyChange=plan=>publications.push(plan);
  for(const draw of stale)draw.callback();
  assert.equal(publications.length,0);
  engine.scheduleBar(30);
  const plan=engine.scheduledBars.get(0).plan;
  const expected=new composition.Composition({random:()=>.9}).planBar(0,'A',engine.compositionOptions());
  assert.deepEqual(plan,expected);
  runtime.draws.at(-1).callback();
  assert.equal(publications.at(-1),plan);
});

test('shared landscape callbacks cannot plan bars while practice owns the transport',async()=>{
  const {engine,runtime,Tone}=setup();
  await engine.init();engine.active.piano=true;engine.playEvent=()=>{};
  const transportId=engine.transportEvent;
  const callback=runtime.schedules.get(transportId);
  callback(1);
  engine.beginPractice('drums');
  // Practice starts, stops and repeats on the same rewound transport. Landscape
  // callbacks still exist, but must not advance or publish composition history.
  for(const bar of [0,1,10,0]){
    runtime.ticks=Tone.Transport.PPQ*4*bar;
    assert.doesNotThrow(()=>callback(1));
    assert.equal(engine.barIndex,0);
    assert.equal(engine.composition.nextBar,0);
    assert.equal(engine.scheduledBars.size,0);
    assert.equal(engine.pendingEvents.size,0);
  }
  runtime.ticks=0;
  engine.endPractice();
  assert.equal(engine.transportEvent,transportId);
  assert.doesNotThrow(()=>callback(1));
  assert.equal(engine.scheduledBars.get(0).plan.bar,0);
  assert.equal(engine.active.piano,true);
});

test('init unlocks synchronously, coalesces calls, and supports no-argument wrappers', async () => {
  const { engine, runtime } = setup();
  const entered = deferred();
  const gate = deferred();
  runtime.onLoad = async (url, count) => { if (count === 1) { entered.resolve(); await gate.promise; } };
  const initialize = engine.initialize;
  let wrappers = 0;
  engine.initialize = async function () {
    assert.equal(arguments.length, 0);
    wrappers++;
    await initialize.call(this);
  };
  const first = engine.init();
  assert.equal(runtime.starts, 1);
  const second = engine.init();
  await entered.promise;
  assert.equal(engine.ready, false);
  assert.deepEqual(engine.nodes, {});
  gate.resolve();
  await Promise.all([first, second]);
  assert.equal(engine.ready, true);
  assert.equal(wrappers, 1);
  assert.equal(runtime.starts, 1);
  assert.equal(engine.metronomeEvent, 0);
  assert.equal(runtime.schedules.size, 2);
  for (const node of Object.values(engine.nodes)) assert.deepEqual(node.sampleCandidates, selection.prepareSampleCandidates(node.buffers));
});

for (const phase of ['instruments', 'scenery']) {
  test(`failed ${phase} load cleans late siblings without touching a successful retry`, async () => {
    const { engine, runtime } = setup();
    const gate = deferred();
    let lateBuffer;
    let count = 0;
    runtime.onLoad = async (url, index, buffer) => {
      if (!url.includes(`/audio/${phase}/`)) return;
      count++;
      if (count === 1) throw new Error('recording unavailable');
      if (count === 2) { lateBuffer = buffer; await gate.promise; }
    };
    const first = engine.init();
    await assert.rejects(first, /recording unavailable/);
    const oldNodes = [...runtime.nodes];
    assert.equal(engine.ready, false);
    assert.deepEqual(engine.nodes, {});
    assert.equal(lateBuffer.disposals, 0);
    runtime.onLoad = null;
    await engine.init();
    const current = engine.nodes;
    const newNodes = runtime.nodes.slice(oldNodes.length);
    gate.resolve();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(engine.ready, true);
    assert.equal(engine.nodes, current);
    assert.equal(lateBuffer.get(), undefined);
    assert.ok(oldNodes.every(node => node.disposals === 1));
    assert.ok(newNodes.every(node => node.disposals === 0));
    assert.equal(runtime.schedules.size, 2);
  });
}

test('dispose during unlock cancels promptly and the late initialize cannot resurrect', async () => {
  const { engine, runtime } = setup();
  const gate = deferred();
  runtime.startGate = gate;
  const first = engine.init();
  const rejection = assert.rejects(first, /cancelled/);
  engine.dispose();
  await rejection;
  assert.equal(runtime.nodes.length, 0);
  runtime.startGate = null;
  await engine.init();
  const current = engine.nodes;
  gate.resolve();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(engine.nodes, current);
  assert.equal(engine.ready, true);
  assert.ok(runtime.nodes.every(node => node.disposals === 0));
});

test('dispose while decoding cancels without waiting and stale finalizers cannot clear a pending retry', async () => {
  const { engine, runtime } = setup();
  const gate = deferred();
  const entered = deferred();
  runtime.onLoad = async (url, count) => { if (count === 1) { entered.resolve(); await gate.promise; } };
  const first = engine.init();
  const rejection = assert.rejects(first, /cancelled/);
  await entered.promise;
  engine.dispose();
  const oldNodes = [...runtime.nodes];
  runtime.onLoad = null;
  const retryGate = deferred();
  runtime.startGate = retryGate;
  const retry = engine.init();
  const retryPromise = engine.initPromise;
  await rejection;
  assert.equal(engine.initPromise, retryPromise);
  gate.resolve();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(engine.initPromise, retryPromise);
  retryGate.resolve();
  await retry;
  assert.ok(oldNodes.every(node => node.disposals === 1));
  assert.equal(engine.ready, true);
});

test('a stale resume cannot wake or clear the promise of a new session', async () => {
  const { engine, runtime } = setup();
  await engine.init();
  engine.suspendPlayback();
  const oldGate = deferred();
  runtime.startGate = oldGate;
  const oldResume = engine.resumePlayback();
  engine.dispose();
  runtime.startGate = null;
  await engine.init();
  engine.suspendPlayback();
  const newGate = deferred();
  runtime.startGate = newGate;
  const newResume = engine.resumePlayback();
  oldGate.resolve();
  await oldResume;
  assert.equal(engine.backgrounded, true);
  assert.equal(engine.resumePromise, newResume);
  newGate.resolve();
  await newResume;
  assert.equal(engine.backgrounded, false);
});

test('dispose clears only owned schedules and voices, preserving retirement until onended', async () => {
  const { engine, runtime, Tone } = setup();
  const foreignSchedule = Tone.Transport.scheduleRepeat(() => {}, '1m');
  await engine.init();
  engine.setManualInstrument('piano');
  engine.manualNoteOn('C4', 'key');
  const oldVoice = engine.manualVoices.get('key');
  const oldNodes = [...runtime.nodes];
  engine.dispose();
  engine.dispose();
  assert.equal(runtime.cancellations, 0);
  assert.equal(runtime.schedules.size, 1);
  assert.equal(runtime.schedules.has(foreignSchedule), true);
  assert.ok(oldNodes.every(node => node.disposals === 1));
  assert.equal(oldVoice.source.disconnections, 1);
  assert.equal(oldVoice.envelope.disconnections, 1);
  assert.equal(engine.retiringVoices.has(oldVoice), true);
  await engine.init();
  engine.manualNoteOn('E4', 'key');
  const replacement = engine.manualVoices.get('key');
  oldVoice.source.onended();
  assert.equal(engine.manualVoices.get('key'), replacement);
  assert.equal(engine.retiringVoices.has(oldVoice), false);
  assert.equal(oldVoice.source.disconnections, 1);
});

test('adding a pickup preserves the published bar and its promised next chord', async () => {
  const {engine,runtime}=setup();
  await engine.init();engine.active.piano=true;
  const played=[];engine.playEvent=(name,event)=>played.push({name,event});
  engine.scheduleBar(1);runtime.draws.at(-1).callback();runtime.ticks=192;
  const published=engine.harmonyPlan;
  const state=structuredClone(engine.composition.state);
  const cursor=engine.composition.cursor;
  engine.setInstrumentActive('ukulele',true);
  assert.equal(engine.harmonyPlan,published);
  assert.equal(engine.scheduledBars.get(0).plan,published);
  assert.deepEqual(engine.composition.state,state);
  assert.equal(engine.composition.cursor,cursor);
  assert.equal(played.at(-1).event.chord,published.currentChord.name);
  engine.scheduleBar(3);
  const next=engine.scheduledBars.get(1).plan;
  assert.deepEqual(next.currentChord,published.nextChord);
  assert.equal(next.progression,published.progression);
});

test('a pin clears when chord membership changes the globally assigned role', async () => {
  const {engine,runtime}=setup();
  await engine.init();engine.playEvent=()=>{};engine.setManualInstrument('ukulele');
  engine.active.piano=true;engine.active.guitar=true;engine.active.ukulele=true;
  engine.scheduleBar(1);runtime.ticks=192;
  assert.equal(engine.skipEquippedPhrase(),true);
  assert.equal(engine.equippedPhrase.role,'melody');assert.equal(engine.phrasePinned,true);
  engine.setInstrumentActive('piano',false);
  assert.equal(engine.phrasePinned,false);
  assert.deepEqual(engine.compositionOptions().phraseOverrides,{});
  assert.doesNotThrow(()=>engine.scheduleBar(3));
  assert.equal(engine.scheduledBars.get(1).plan.roles.ukulele,'accompaniment');
});

test('next phrase activates stopped autoplay in its active role without pickup overwriting the pin', async () => {
  const {engine,runtime}=setup();
  await engine.init();engine.playEvent=()=>{};engine.setManualInstrument('piano');
  engine.scheduleBar(1);runtime.ticks=192;
  const audible=engine.scheduledBars.get(0).plan;
  assert.equal(audible.roles.piano,'melody');
  const state=structuredClone(engine.composition.state);
  const pool=composition.compositionProfile('piano',audible.root,{role:'accompaniment',degree:audible.currentChord.degree});
  assert.ok(pool.length>=2);
  assert.equal(engine.skipEquippedPhrase(),true);
  assert.equal(engine.active.piano,true);assert.equal(engine.phrasePinned,true);
  assert.equal(engine.equippedPhrase.role,'accompaniment');assert.equal(engine.equippedPhrase.name,pool[1].name);
  assert.deepEqual(engine.composition.state,state);
  engine.scheduleBar(3);
  assert.equal(engine.scheduledBars.get(1).plan.phrases.piano.name,pool[1].name);
});

for(const change of ['skip','difficulty','equipment'])test(`${change} replaces obsolete lookahead attacks and cues without replacing the audible bar`,async()=>{
  const {engine,runtime}=setup();
  await engine.init();engine.setManualInstrument('piano');engine.active.piano=true;engine.active.drums=true;
  engine.nodes.piano.synth.triggerAttackRelease=()=>{};
  engine.nodes.drums.synth.triggerAttackRelease=()=>{};
  const cancellations=[];
  for(const node of Object.values(engine.nodes))node.samplerVoices.cancelFrom=time=>cancellations.push(time);
  const cues=[];engine.onManualAutoplayEvent=event=>{if(event)cues.push(event);};
  engine.scheduleBar(1);runtime.ticks=192;
  const current=engine.scheduledBars.get(0);
  const pendingCurrent=[...engine.pendingEventBars].filter(([,bar])=>bar===0).map(([id])=>({id,name:engine.pendingEvents.get(id)}));
  engine.scheduleBar(3);
  const obsolete=engine.scheduledBars.get(1);
  const obsoleteDraws=runtime.draws.filter(draw=>draw.time>=3);
  const obsoletePending=[...engine.pendingEventBars].filter(([,bar])=>bar===1).map(([id])=>id);
  if(change==='skip')engine.skipEquippedPhrase();
  if(change==='difficulty')engine.updatePerformanceSettings({piano:{complexity:.5}});
  if(change==='equipment')engine.setManualInstrument('ukulele');
  assert.equal(engine.scheduledBars.get(0),current);
  for(const {id,name} of pendingCurrent){
    if(change==='difficulty'&&name==='piano')assert.ok(runtime.cleared.includes(id)&&!engine.pendingEvents.has(id));
    else assert.ok(engine.pendingEvents.has(id)&&!runtime.cleared.includes(id));
  }
  assert.notEqual(engine.scheduledBars.get(1),obsolete);
  if(change!=='difficulty')assert.deepEqual(engine.scheduledBars.get(1).plan.currentChord,current.plan.nextChord);
  else assert.ok([0,3,4].includes(engine.scheduledBars.get(1).plan.currentChord.degree));
  assert.ok(cancellations.length>0&&cancellations.every(time=>time===obsolete.time));
  assert.ok(obsoletePending.every(id=>runtime.cleared.includes(id)&&!engine.pendingEvents.has(id)));
  for(const draw of obsoleteDraws)draw.callback();
  assert.equal(cues.length,0);assert.notEqual(engine.harmonyPlan,obsolete.plan);
});

test('practice partners stay on exercise harmony and the saved motif pin survives restoration', async () => {
  const {engine,runtime}=setup();
  await engine.init();engine.setManualInstrument('piano');engine.playEvent=()=>{};
  engine.skipEquippedPhrase();
  const saved=engine.equippedPhrase;
  engine.beginPractice('piano');
  const exercise=composition.compositionProfile('piano','C',{role:'accompaniment',degree:4})[0];
  const played=[];engine.playEvent=(name,event)=>played.push({name,event});
  engine.metronomeSynth.triggerAttackRelease=()=>{};
  engine.startPracticeRun(exercise,true);
  const callbacks=engine.practiceRun.ids.map(id=>runtime.schedules.get(id));
  for(let cycle=0;cycle<4;cycle++)for(const callback of callbacks)callback(3+cycle*3);
  const partner=played.filter(value=>value.name==='ukulele');
  assert.ok(partner.length>0);assert.ok(partner.every(value=>value.event.chord===exercise.chord));
  engine.endPractice();
  assert.equal(engine.phrasePinned,true);assert.equal(engine.equippedPhrase,saved);
  engine.scheduleBar(20);
  assert.equal(engine.scheduledBars.get(0).plan.phrases.piano.name,saved.name);
});

test('selection and pickups rebuild stale rendered pitches from the current profile and key', async () => {
  const {engine}=setup();
  await engine.init();engine.playEvent=()=>{};
  engine.active.flute=true;engine.scheduleBar(1);
  const plan=engine.scheduledBars.get(0).plan;
  const advanced=plan.phrases.flute;
  engine.performanceSettings={flute:{complexity:.5}};
  engine.setManualInstrument('flute');
  const pool=composition.compositionProfile('flute',plan.root,{complexity:.5,role:'melody',degree:plan.currentChord.degree});
  const expected=pool.find(phrase=>phrase.name===advanced.name)??pool[0];
  assert.notDeepEqual(advanced.events,expected.events);
  assert.deepEqual(engine.selectPhrase('flute',0).events,expected.events);
  const played=[];engine.playEvent=(name,event,time,root)=>played.push({name,event,root});
  engine.playPickup('flute');
  assert.deepEqual(played.at(-1).event,expected.events[0]);
  engine.equippedPhrase={...expected,events:advanced.events};engine.phrasePinned=true;
  engine.playPickup('flute');
  assert.deepEqual(played.at(-1).event,expected.events[0]);
  assert.deepEqual(engine.selectPhrase('flute',0).events,expected.events);
  engine.scheduledBars.clear();engine.harmonyPlan=null;engine.root='E';
  const transposed=composition.compositionProfile('flute','E',{complexity:.5,role:'melody',degree:0}).find(phrase=>phrase.name===expected.name);
  assert.deepEqual(engine.selectPhrase('flute',4).events,transposed.events);
});

for(const name of ['guitar','ukulele'])test(`${name} stale pins rebuild canonical current-key string voicings`, async () => {
  const {engine}=setup();
  await engine.init();engine.setManualInstrument(name);engine.active[name]=true;
  engine.performanceSettings={[name]:{complexity:.5}};
  const previous=composition.compositionProfile(name,'C',{complexity:1.5,role:'accompaniment',degree:0})[0];
  engine.equippedPhrase=previous;engine.phrasePinned=true;engine.root='Fm';
  const pool=composition.compositionProfile(name,'Fm',{complexity:.5,role:'accompaniment',degree:0});
  const expected=pool.find(phrase=>phrase.name===previous.name)??pool[0];
  const played=[];engine.playEvent=(instrument,event)=>played.push(event);
  engine.playPickup(name);assert.deepEqual(played.at(-1),expected.events[0]);
  assert.deepEqual(engine.selectPhrase(name,0),expected);
  assert.notDeepEqual(expected.events,previous.events);
});

test('first-tap autoplay toggles retain a pin through inactive planning and practice restoration', async () => {
  const {engine}=setup();
  await engine.init();engine.playEvent=()=>{};engine.setManualInstrument('piano');
  engine.skipEquippedPhrase();
  const pinned=engine.equippedPhrase;
  const identity=engine.phraseIdentity;
  engine.setInstrumentActive('piano',false);
  assert.equal(engine.phrasePinned,true);assert.equal(engine.equippedPhrase,pinned);
  assert.deepEqual(engine.compositionOptions().phraseOverrides,{});
  assert.doesNotThrow(()=>engine.scheduleBar(1));
  assert.equal(engine.equippedPhrase,pinned);
  engine.setInstrumentActive('piano',true);
  assert.equal(engine.phrasePinned,true);assert.equal(engine.equippedPhrase,pinned);
  engine.setInstrumentActive('piano',false);
  engine.beginPractice('piano');
  assert.equal(engine.practiceSession.equippedPhrase,pinned);
  assert.equal(engine.practiceSession.phrasePinned,true);
  engine.endPractice();
  assert.equal(engine.phrasePinned,true);assert.equal(engine.equippedPhrase,pinned);
  assert.equal(engine.phraseIdentity,identity);assert.equal(engine.active.piano,false);
  assert.doesNotThrow(()=>engine.scheduleBar(3));
  engine.setInstrumentActive('piano',true);engine.scheduleBar(5);
  assert.equal(engine.scheduledBars.get(1).plan.phrases.piano.name,pinned.name);
});

test('positive mixer gain remains raw unequipped and only equipped boost is capped through holds', async () => {
  const {engine}=setup();
  await engine.init();engine.playEvent=()=>{};engine.active.piano=true;
  engine.setVolumes({piano:6});
  assert.equal(engine.effectiveVolume('piano'),6);assert.equal(engine.nodes.piano.gain.volume.value,6);
  engine.setManualInstrument('piano');
  assert.equal(engine.effectiveVolume('piano'),0);assert.equal(engine.nodes.piano.gain.volume.value,0);
  engine.holdTempo(true);assert.equal(engine.nodes.piano.gain.volume.value,-60);
  engine.holdTempo(false);assert.equal(engine.nodes.piano.gain.volume.value,0);
  engine.setManualInstrument(null);assert.equal(engine.nodes.piano.gain.volume.value,6);
  engine.holdTempo(true);engine.holdTempo(false);
  assert.equal(engine.nodes.piano.gain.volume.value,6);assert.equal(engine.volumes.piano,6);
  engine.setVolumes({piano:-60});engine.setManualInstrument('piano');
  engine.holdTempo(true);engine.holdTempo(false);engine.setManualInstrument(null);
  assert.equal(engine.effectiveVolume('piano'),-60);assert.equal(engine.nodes.piano.gain.volume.value,-60);
});

test('requested key clears guidance without discarding the audible pickup plan', async () => {
  const {engine,runtime}=setup();
  await engine.init();engine.active.piano=true;engine.playEvent=()=>{};
  const publications=[];engine.onHarmonyChange=plan=>publications.push(plan);
  engine.scheduleBar(1);runtime.draws.at(-1).callback();runtime.ticks=192;
  const audible=engine.harmonyPlan;
  engine.setSceneKey('E');
  assert.equal(publications.at(-1),null);assert.equal(engine.harmonyPlan,audible);
  engine.composition.planBar=()=>{throw new Error('Pickup must use captured harmony');};
  const played=[];engine.playEvent=(name,event,time,root)=>played.push({event,root});
  engine.playPickup('ukulele');assert.equal(played.at(-1).root,audible.root);
});

test('an old-key downbeat draw cannot republish guidance after a new key is requested', async () => {
  const {engine,runtime}=setup();
  await engine.init();engine.active.piano=true;engine.playEvent=()=>{};
  const publications=[];engine.onHarmonyChange=plan=>publications.push(plan);
  engine.scheduleBar(1);
  const captured=engine.scheduledBars.get(0).plan;
  runtime.ticks=24;engine.setSceneKey('E');runtime.draws.at(-1).callback();
  assert.ok(publications.length>0&&publications.every(plan=>plan===null));
  assert.equal(engine.harmonyPlan,captured);
  engine.scheduleBar(3);runtime.draws.at(-1).callback();
  assert.equal(publications.at(-1).root,'E');
});

for(const lookahead of [false,true])test(`incompatible future harmony clears guidance with lookahead ${lookahead}`, async () => {
  const {engine,runtime}=setup();
  await engine.init();engine.active.piano=true;engine.playEvent=()=>{};
  engine.scheduleBar(1);runtime.draws.at(-1).callback();runtime.ticks=192;
  const audible=engine.harmonyPlan;
  assert.ok(![0,3,4].includes(audible.nextChord.degree));
  if(lookahead)engine.scheduleBar(3);
  const publications=[];engine.onHarmonyChange=plan=>publications.push(plan);
  engine.performanceSettings={piano:{complexity:.5}};engine.setManualInstrument('piano');
  assert.equal(publications.at(-1),null);assert.equal(engine.harmonyPlan,audible);
  assert.equal(engine.scheduledBars.get(0).plan,audible);
  if(!lookahead)engine.scheduleBar(3);
  runtime.draws.at(-1).callback();
  assert.equal(publications.at(-1),engine.scheduledBars.get(1).plan);
  assert.ok([0,3,4].includes(publications.at(-1).currentChord.degree));
});

test('genre changes retain the captured current bar and interpolate only from the next bar',async()=>{
  const {engine}=setup();
  await engine.init();engine.active.piano=true;engine.playEvent=()=>{};
  engine.scheduleBar(1);
  const current=engine.scheduledBars.get(0).plan;
  assert.equal(engine.setGenre('jazz'),true);
  assert.equal(engine.scheduledBars.get(0).plan,current);
  engine.scheduleBar(3);
  const first=engine.scheduledBars.get(1).plan;
  assert.equal(first.genre,'jazz');assert.equal(first.genreBlend,0);
  assert.equal(engine.scheduledBars.get(0).plan,current);
  engine.scheduleBar(5);
  assert.equal(engine.scheduledBars.get(2).plan.genreBlend,.125);
  assert.equal(engine.setGenre('jazz'),false);
  assert.throws(()=>engine.setGenre('unknown'),/Unknown composition genre/);
});

test('shared owned tone routing applies gated events and replaces future automation before cleanup',async()=>{
  const {engine}=setup();
  await engine.init();
  const node=engine.nodes.melody;
  assert.equal(node.synth.output,node.tone);assert.equal(node.tone.output,node.gain);
  assert.equal(engine.nodes.drums.tone,null);assert.equal(engine.nodes.drums.synth.output,engine.nodes.drums.gain);
  engine.setManualInstrument('melody');engine.manualNoteOn('C4','brass');
  assert.equal(engine.manualVoices.get('brass').envelope.output,node.tone);
  const played=[];node.synth.triggerAttackRelease=(...args)=>played.push(args);
  engine.playEvent('melody',{note:'C4',dur:'8n',gate:.7,velocity:.55},2);
  assert.equal(played[0][1],.7); // The test clock resolves Tone durations to one second.
  engine.scheduleBar(3,0);
  const frequency=node.tone.frequency;
  assert.deepEqual(frequency.automation.slice(-2),[['cancel',3],['ramp',engine.scheduledBars.get(0).plan.movement.performance.melody.cutoff,3.12]]);
  engine.applyPerformance({movement:{performance:{melody:{cutoff:8500}}}},3);
  assert.deepEqual(frequency.automation.slice(-2),[['cancel',3],['ramp',8500,3.12]]);
  engine.clearPendingEvents();assert.deepEqual(frequency.automation.at(-1),['cancel',1]);
  engine.dispose();assert.equal(node.tone.disposals,1);
});

test('reversing genre during a blend starts tone and articulation from the current intermediate style',async()=>{
  const {engine,runtime}=setup();await engine.init();engine.playEvent=()=>{};
  engine.scheduleBar(1);engine.setGenre('jazz');
  runtime.ticks=5*192*4;engine.barIndex=6;
  const halfway=blendCompositionStyles('folk','jazz',.5).performance;
  engine.setGenre('folk');assert.deepEqual(engine.genreTransition.fromPerformance,halfway);
  engine.setGenre('jazz');assert.deepEqual(engine.genreTransition.fromPerformance,halfway);
  engine.setGenre('rock');assert.deepEqual(engine.genreTransition.fromPerformance,halfway);
  const plan=engine.composition.planBar(6,'C',engine.compositionOptions());
  assert.equal(plan.genreBlend,0);
  assert.ok(Math.abs(plan.movement.performance.melody.cutoff/halfway.melody.cutoff-1)<.035);
});
