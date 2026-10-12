import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as music from '../src/utils/music.js';
import { createNoisePair } from '../src/utils/noise.js';
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
  const runtime = { nodes: [], starts: 0, startGate: null, onLoad: null, loads: 0, cancellations: 0, schedules: new Map(), cleared: [] };
  const parameter = () => ({ value: 0, rampTo() {}, setValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {}, cancelAndHoldAtTime() {} });
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
    connect() { return this; }
    toDestination() { return this; }
    dispose() { this.disposals++; }
    triggerRelease() {}
    releaseAll() {}
  }
  class Buffer extends Node {
    async load(url) {
      runtime.loads++;
      await runtime.onLoad?.(url, runtime.loads, this);
      this.buffer = context.createBuffer(1, 88200, 44100);
      return this;
    }
    get() { return this.buffer; }
    dispose() { super.dispose(); this.buffer = undefined; }
  }
  class Reverb extends Node { constructor() { super(); this.ready = Promise.resolve(); } }
  class Sampler extends Node { constructor(options) { super(); queueMicrotask(options.onload); } }
  let scheduleId = 0;
  const schedule = callback => { const id = scheduleId++; runtime.schedules.set(id, callback); return id; };
  const Tone = {
    start() { runtime.starts++; return runtime.startGate?.promise ?? Promise.resolve(); },
    getContext: () => ({ rawContext: context }), immediate: () => 1, now: () => 1,
    connect() {}, dbToGain: value => 10 ** (value / 20),
    Limiter: Node, Gain: Node, Volume: Node, Synth: Node, Player: Node,
    Reverb, Sampler, ToneAudioBuffer: Buffer, Draw: { schedule() {} },
    Transport: {
      bpm: { value: 92 }, state: 'stopped', PPQ: 192,
      scheduleRepeat: schedule, scheduleOnce: schedule,
      clear(id) { runtime.cleared.push(id); runtime.schedules.delete(id); },
      cancel() { runtime.cancellations++; runtime.schedules.clear(); },
      start() { this.state = 'started'; }, stop() { this.state = 'stopped'; },
    },
  };
  const dependencies = { Tone, ...music, createNoisePair, SCENE_SOUNDS, audioLevels, ...samples, ...envelopes, STRING_INSTRUMENTS, equippedProfile, beatOffset, releaseManualVoice, AudioResources, ...selection, ...voices, ...session };
  const AudioEngine = new Function(...Object.keys(dependencies), `${source}\nreturn AudioEngine;`)(...Object.values(dependencies));
  return { engine: new AudioEngine(), runtime, Tone };
}

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