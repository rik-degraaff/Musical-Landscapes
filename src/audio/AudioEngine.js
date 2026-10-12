import * as Tone from 'tone';
import { BPM, BAR, INSTRUMENTS, patterns, nearestBar, transposeEvents } from '../utils/music';
import { createNoisePair } from '../utils/noise';
import { SCENE_SOUNDS } from './sceneSounds';
import audioLevels from './audioLevels.json';
import { DRUM_NOTES, DRUM_SAMPLES, SAMPLE_LIBRARY, sampleUrls } from './sampleLibrary';
import { createSustainLoop, MANUAL_RELEASE } from './envelopes';
import { STRING_INSTRUMENTS } from '../utils/guitar';
import {equippedProfile} from '../utils/difficulty';
import {beatOffset} from '../utils/practice';
import {releaseManualVoice} from './voiceCleanup';
import { AudioResources } from './resources';
import { parseMidi, prepareSampleCandidates, selectNearestSample } from './sampleSelection';
import { disconnectManualVoice, finishManualVoice } from './manualVoice';
import { capturePracticeSnapshot, restorePracticeSnapshot, findPhraseIndex } from './session';

const MIN_GAIN = -60;
const FADE_SECONDS = 0.045;
const instrumentNames = Object.keys(INSTRUMENTS);

export class AudioEngine {
  constructor() {
    this.ready = false;
    this.started = false;
    this.transportEvent = null;
    this.tempo = BPM;
    this.tempoHeld = false;
    this.metronomeSound = false;
    this.metronomeEvent = null;
    this.onMetronomeBeat = null;
    this.beatIndex = 0;
    this.barIndex = 0;
    this.active = Object.fromEntries(instrumentNames.map(name => [name, false]));
    this.volumes = Object.fromEntries(instrumentNames.map(name => [name, INSTRUMENTS[name].volume]));
    this.noise = Object.fromEntries(instrumentNames.map(name => [name, createNoisePair(INSTRUMENTS[name].seed)]));
    this.pendingEvents = new Map();
    this.nodes = {};
    this.root = 'C';
    this.performanceSettings = {};
    this.sceneVolume = -4;
    this.manualInstrument = null;
    this.onActiveChange = null;
    this.manualAutoplayVersion = 0;
    this.onManualAutoplayEvent = null;
    this.manualVoices = new Map();
    this.retiringVoices = new Set();
    this.playingNotes = new Map();
    this.pendingManualNotes = new Map();
    this.backgrounded = false;
    this.resumePromise = null;
    this.lifecycleCleanup = null;
    this.playbackVersion = 0;
    this.equippedPhrase=null;
    this.phraseIdentity=null;
    this.phrasePinned=false;
    this.practiceSession=null;
    this.onPracticeInput=null;
    this.practiceRun=null;
    this.practiceRunVersion=0;
    this.onPracticeInterrupt=null;
    this.audioGeneration = 0;
    this.initPromise = null;
    this.initializationAttempt = null;
    this.resources = null;
  }

  async init() {
    if (this.ready) return;
    if (this.initPromise) return this.initPromise;
    const attempt = { generation: ++this.audioGeneration, resources: new AudioResources(), nodes: {} };
    this.initializationAttempt = attempt;
    const promise = Promise.race([
      this.initialize(),
      attempt.resources.cancelled.then(() => { throw new Error('Audio initialization cancelled'); }),
    ]);
    this.initPromise = promise;
    try {
      await promise;
    } catch (error) {
      attempt.resources.dispose();
      if (this.initializationAttempt === attempt) this.dispose();
      throw error;
    } finally {
      if (this.initPromise === promise) this.initPromise = null;
      if (this.initializationAttempt === attempt) this.initializationAttempt = null;
    }
  }

  async initialize() {
    const attempt = this.initializationAttempt;
    const resources = attempt.resources;
    await Tone.start();
    resources.check();
    Tone.Transport.bpm.value = this.tempo;
    Tone.Transport.swing = 0;
    Tone.Transport.swingSubdivision = '8n';
    attempt.limiter = resources.own(new Tone.Limiter(-1)).toDestination();
    attempt.master = resources.own(new Tone.Gain(0.8)).connect(attempt.limiter);
    attempt.metronomeSynth = resources.own(new Tone.Synth({oscillator:{type:'sine'},envelope:{attack:.001,decay:.035,sustain:0,release:.015},volume:-20})).connect(attempt.master);
    attempt.reverb = resources.own(new Tone.Reverb({ decay: 1.2, preDelay: 0.018, wet: 0.09 })).connect(attempt.master);
    const loads = [resources.load(attempt.reverb, () => attempt.reverb.ready)];
    for (const name of instrumentNames) {
      const gain = resources.own(new Tone.Volume(MIN_GAIN)).connect(name === 'drums' ? attempt.master : attempt.reverb);
      attempt.nodes[name] = { gain };
      loads.push(this.createSampledInstrument(name, attempt));
    }
    await Promise.all(loads);
    resources.check();
    await this.createSceneSounds(attempt);
    resources.check();
    if (this.initializationAttempt !== attempt || this.audioGeneration !== attempt.generation) throw new Error('Audio initialization cancelled');
    for (const key of ['nodes', 'limiter', 'master', 'metronomeSynth', 'reverb', 'sceneGain', 'sceneBuffers', 'scenePlayers', 'sceneVoices']) this[key] = attempt[key];
    this.resources = resources;
    this.ready = true;
    this.metronomeEvent = Tone.Transport.scheduleRepeat(time=>{
      if(!this.ready||attempt.generation!==this.audioGeneration||this.tempoHeld||this.backgrounded)return;
      const version=this.playbackVersion;
      const beat=this.beatIndex++;
      if(this.metronomeSound)this.metronomeSynth.triggerAttackRelease(beat%4===0?'C6':'G5',.035,time,.5);
      Tone.Draw.schedule(()=>{if(this.ready&&!this.tempoHeld&&!this.backgrounded&&version===this.playbackVersion)this.onMetronomeBeat?.(beat);},time);
    },'4n');
    this.installLifecycle();
    this.ensureTransport();
  }

  installLifecycle() {
    this.lifecycleCleanup?.();
    const context=Tone.getContext().rawContext;
    const hidden=()=>{if(document.hidden)this.suspendPlayback();else this.resumePlayback();};
    const suspend=()=>this.suspendPlayback();
    const resume=()=>{if(!document.hidden)this.resumePlayback();};
    const state=()=>{if(context.state==='running')resume();else if(context.state!=='closed')suspend();};
    document.addEventListener('visibilitychange',hidden);
    window.addEventListener('pagehide',suspend);
    window.addEventListener('pageshow',resume);
    window.addEventListener('focus',resume);
    window.addEventListener('pointerdown',resume,true);
    window.addEventListener('keydown',resume,true);
    context.addEventListener('statechange',state);
    this.lifecycleCleanup=()=>{
      document.removeEventListener('visibilitychange',hidden);
      window.removeEventListener('pagehide',suspend);
      window.removeEventListener('pageshow',resume);
      window.removeEventListener('focus',resume);
      window.removeEventListener('pointerdown',resume,true);
      window.removeEventListener('keydown',resume,true);
      context.removeEventListener('statechange',state);
    };
    if(document.hidden||context.state!=='running')this.suspendPlayback();
  }

  suspendPlayback() {
    if(!this.ready||this.backgrounded)return;
    this.backgrounded=true;
    if(this.practiceSession){this.stopPracticeRun();this.onPracticeInterrupt?.();}
    window.dispatchEvent(new Event('farmjam-input-reset'));
    this.playbackVersion++;
    this.manualAutoplayVersion++;
    Tone.Transport.stop();
    Tone.Transport.position=0;
    this.clearPendingEvents();
    this.barIndex=0;
    this.beatIndex=0;
    this.stopManualVoices();
    this.metronomeSynth.triggerRelease();
    this.onManualAutoplayEvent?.(null);
    for(const node of Object.values(this.nodes)){
      node.gain.volume.value=MIN_GAIN;
      const release=node.synth.release;
      node.synth.release=.005;
      node.synth.releaseAll(Tone.immediate());
      node.synth.release=release;
    }
    for(const players of Object.values(this.scenePlayers??{}))for(const player of players)if(player.state==='started')player.stop();
  }

  resumePlayback() {
    if(!this.ready||!this.backgrounded||document.hidden)return Promise.resolve();
    if(this.resumePromise)return this.resumePromise;
    const generation=this.audioGeneration;
    const promise=Tone.start().then(()=>{
      if(generation!==this.audioGeneration||!this.ready||document.hidden||Tone.getContext().rawContext.state!=='running')return;
      this.backgrounded=false;
      for(const [name,node] of Object.entries(this.nodes))node.gain.volume.rampTo(!this.tempoHeld&&(this.active[name]||this.manualInstrument===name)?this.volumes[name]:MIN_GAIN,.025);
      this.ensureTransport();
    }).catch(error=>console.warn('Audio resume requires a new user gesture',error)).finally(()=>{if(this.resumePromise===promise)this.resumePromise=null;});
    this.resumePromise=promise;
    return promise;
  }

  async createSampledInstrument(name, attempt) {
    const { resources, nodes } = attempt;
    const baseUrl = `${import.meta.env.BASE_URL}audio/instruments/`;
    const urls = name === 'drums' ? {
      C2: `drums/${DRUM_SAMPLES.kick.file}`,
      D2: `drums/${DRUM_SAMPLES.snare.file}`,
      'F#2': `drums/${DRUM_SAMPLES.hat.file}`,
      G2: `drums/${DRUM_SAMPLES.tom.file}`,
      'D#2': `drums/${DRUM_SAMPLES.clap.file}`,
      'C#2': `drums/${DRUM_SAMPLES.snare.file}`,
      'A#2': `drums/${DRUM_SAMPLES.hat.file}`,
      'C#3': `drums/${DRUM_SAMPLES.crash.file}`,
      'D#3': `drums/${DRUM_SAMPLES.ride.file}`,
      F2: `drums/${DRUM_SAMPLES.floorTom.file}`,
    } : sampleUrls(name);
    const buffers = {};
    nodes[name].buffers = buffers;
    await Promise.all(Object.entries(urls).map(async ([note, file]) => {
      const buffer = resources.own(new Tone.ToneAudioBuffer());
      buffers[note] = buffer;
      await resources.load(buffer, () => buffer.load(`${baseUrl}${file}`));
      resources.check();
      const correction = Tone.dbToGain(audioLevels[`instruments/${file}`].gainDb);
      const decoded = buffer.get();
      for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
        const waveform = decoded.getChannelData(channel);
        for (let index = 0; index < waveform.length; index++) waveform[index] *= correction;
      }
      if (['melody','flute','panflute'].includes(name)) {
        const midi = parseMidi(note);
        const channels = Array.from({length:decoded.numberOfChannels},(_,channel)=>decoded.getChannelData(channel));
        const loop = createSustainLoop(channels, decoded.sampleRate, 440 * 2 ** ((midi - 69) / 12));
        const sustain = Tone.getContext().rawContext.createBuffer(decoded.numberOfChannels, loop.waveforms[0].length, decoded.sampleRate);
        loop.waveforms.forEach((waveform,channel)=>sustain.copyToChannel(waveform,channel));
        nodes[name].sustainLoops ??= {};
        nodes[name].sustainLoops[note] = { buffer:sustain, loopStart:loop.loopStart, loopEnd:loop.loopEnd };
      }
    }));
    resources.check();
    nodes[name].sampleCandidates = prepareSampleCandidates(buffers);
    return new Promise((resolve, reject) => {
      const sampler = resources.own(new Tone.Sampler({
        urls: buffers,
        baseUrl,
        attack: 0.002,
        release: name === 'drums' ? 0.08 : SAMPLE_LIBRARY[name].release,
        curve: 'exponential',
        onload: resolve,
        onerror: error => reject(new Error(`Could not load ${INSTRUMENTS[name].label} recordings`, { cause: error })),
      })).connect(nodes[name].gain);
      nodes[name].synth = sampler;
    });
  }

  async createSceneSounds(attempt) {
    const { resources } = attempt;
    attempt.sceneGain = resources.own(new Tone.Volume(this.sceneVolume)).connect(attempt.master);
    attempt.sceneBuffers = {};
    attempt.scenePlayers = {};
    attempt.sceneVoices = {};
    await Promise.all(SCENE_SOUNDS.map(async type => {
      const buffer = resources.own(new Tone.ToneAudioBuffer());
      attempt.sceneBuffers[type] = buffer;
      await resources.load(buffer, () => buffer.load(`${import.meta.env.BASE_URL}audio/scenery/${type}.wav`));
      resources.check();
      attempt.scenePlayers[type] = Array.from({ length: 3 }, () => resources.own(new Tone.Player({ url: buffer, fadeOut: 0.025, volume: audioLevels[`scenery/${type}.wav`].gainDb })).connect(attempt.sceneGain));
      attempt.sceneVoices[type] = 0;
    }));
  }

  setSceneKey(root) {
    if(root===this.root)return;
    this.root = root;
    if(this.ready){
      window.dispatchEvent(new Event('farmjam-input-reset'));
      this.clearPendingEvents();this.stopManualVoices();
      for(const node of Object.values(this.nodes))node.synth.releaseAll(Tone.immediate());
      this.playingNotes.clear();
    }
    if(this.ready&&this.manualInstrument){
      this.clearPendingEvents(this.manualInstrument);this.nodes[this.manualInstrument].synth.releaseAll();this.stopManualVoices();
      this.equippedPhrase=null;this.phraseIdentity=null;this.phrasePinned=false;
      this.manualAutoplayVersion++;this.onManualAutoplayEvent?.(null);
    }
  }

  setInstrumentActive(name, active) {
    if (!this.ready || !this.nodes[name]) return;
    Tone.start().catch(console.error);
    const transportWasPlaying = Tone.Transport.state === 'started' && this.barIndex > 0;
    if (this.active[name] === active) return;
    this.active[name] = active;
    this.onActiveChange?.(name, active);
    if (name === this.manualInstrument) {
      this.manualAutoplayVersion++;
      this.onManualAutoplayEvent?.(null);
    }
    const node = this.nodes[name];
    node.gain.volume.rampTo(!this.tempoHeld && !this.backgrounded && (active || this.manualInstrument === name) ? this.volumes[name] : MIN_GAIN, FADE_SECONDS);
    if (!active) {
      this.clearPendingEvents(name);
      node.synth.releaseAll();
      this.playingNotes.delete(name);
    }
    this.ensureTransport();
    if (active && transportWasPlaying && !this.tempoHeld && !this.backgrounded) this.playPickup(name);
  }

  setManualInstrument(name) {
    if (!this.ready || name === this.manualInstrument) return;
    this.stopManualVoices();
    const previous = this.manualInstrument;
    this.manualInstrument = name;
    this.equippedPhrase=null;this.phraseIdentity=null;this.phrasePinned=false;
    if(name&&(this.performanceSettings[name]?.complexity??1.5)<=1){
      this.clearPendingEvents(name);this.nodes[name].synth.releaseAll();
      this.manualAutoplayVersion++;
    }
    if (previous) this.nodes[previous].gain.volume.rampTo(!this.tempoHeld&&!this.backgrounded&&this.active[previous] ? this.volumes[previous] : MIN_GAIN, FADE_SECONDS);
    if (name) {
      this.nodes[name].gain.volume.rampTo(this.tempoHeld||this.backgrounded?MIN_GAIN:this.volumes[name], FADE_SECONDS);
    }
    this.ensureTransport();
  }

  get manualAutoplay() {
    return Boolean(this.manualInstrument && this.active[this.manualInstrument]);
  }

  manualNoteOn(note, token, velocity = 0.65, legato = false) {
    if(this.tempoHeld||document.hidden)return;
    if(this.backgrounded){
      if(!this.ready)return;
      const pending={note,token,velocity,legato,instrument:this.manualInstrument};
      this.pendingManualNotes.set(token,pending);
      this.resumePlayback().then(()=>{
        if(this.pendingManualNotes.get(token)!==pending)return;
        this.pendingManualNotes.delete(token);
        if(!this.backgrounded&&!document.hidden&&this.manualInstrument===pending.instrument)this.manualNoteOn(note,token,velocity,legato);
      });
      return;
    }
    if (this.manualAutoplay) this.setManualAutoplay(false);
    const name = this.manualInstrument;
    if (!this.ready || !name) return;
    const existing=this.manualVoices.get(token);
    if(this.practiceSession&&(!['flute','melody','panflute'].includes(name)||existing?.note!==note))this.onPracticeInput?.({name,note,token,time:Tone.immediate(),ticks:Tone.Transport.ticks});
    Tone.start().catch(console.error);
    if (['flute','melody','panflute'].includes(name)) {
      const current=this.manualVoices.get(token);
      if(current?.note===note) {
        current.envelope.gain.setTargetAtTime(velocity,Tone.getContext().rawContext.currentTime,.025);
        return;
      }
      for(const owner of [...this.manualVoices.keys()])this.manualNoteOff(owner,true);
    }
    this.manualNoteOff(token, true);
    if (name === 'drums') {
      this.playEvent(name, { note, velocity }, Tone.immediate() + 0.015);
      return;
    }
    const pitch = parseMidi(note);
    if (pitch === null) return;
    const selected = selectNearestSample(this.nodes[name].sampleCandidates, pitch);
    if (!selected) return;
    const context = Tone.getContext().rawContext;
    const source = context.createBufferSource();
    const envelope = context.createGain();
    const loop = this.nodes[name].sustainLoops?.[selected.note];
    source.buffer = loop?.buffer ?? this.nodes[name].buffers[selected.note].get();
    source.playbackRate.value = 2 ** ((pitch - selected.midi) / 12);
    if (['melody','flute','panflute'].includes(name)) {
      source.loop = true;
      source.loopStart = loop.loopStart;
      source.loopEnd = loop.loopEnd;
    }
    source.connect(envelope);
    Tone.connect(envelope, this.nodes[name].gain);
    const when = context.currentTime + 0.015;
    envelope.gain.setValueAtTime(0, when);
    envelope.gain.linearRampToValueAtTime(velocity, when + (['flute','panflute'].includes(name) ? 0.035 : 0.006));
    const voice = { source, envelope, note, name, rate:source.playbackRate.value };
    this.manualVoices.set(token, voice);
    source.onended = () => finishManualVoice(voice, token, this.manualVoices, this.retiringVoices);
    source.start(when,legato && loop ? loop.loopStart : 0);
  }

  manualNoteOff(token, quick = false) {
    this.pendingManualNotes.delete(token);
    const voice = this.manualVoices.get(token);
    if (!voice) return;
    this.manualVoices.delete(token);
    this.retiringVoices.add(voice);
    const when = Tone.getContext().rawContext.currentTime;
    const release = quick ? 0.04 : MANUAL_RELEASE[voice.name] ?? 0.08;
    releaseManualVoice(voice,when,release);
  }

  setManualPitchBend(token, cents) {
    const voice=this.manualVoices.get(token);
    if(voice)voice.source.playbackRate.setTargetAtTime(voice.rate*2**(Math.max(-30,Math.min(30,cents))/1200),Tone.getContext().rawContext.currentTime,.025);
  }

  manualStrike(note, token, velocity = 0.65) {
    this.manualNoteOn(note, token, velocity);
    const voice = this.manualVoices.get(token);
    if (voice) {
      const when = Tone.getContext().rawContext.currentTime;
      voice.envelope.gain.setTargetAtTime(0, when + 0.35, 0.35);
      voice.source.stop(when + 2);
    }
  }

  stopManualVoices(instrumentName) {
    for(const [token,pending] of this.pendingManualNotes)if(!instrumentName||pending.instrument===instrumentName)this.pendingManualNotes.delete(token);
    for (const [token,voice] of [...this.manualVoices])if(!instrumentName||voice.name===instrumentName)this.manualNoteOff(token, true);
    const when=Tone.getContext().rawContext.currentTime;
    for(const voice of this.retiringVoices){
      if(!instrumentName||voice.name===instrumentName)releaseManualVoice(voice,when,.035);
    }
  }

  playPickup(name) {
    const currentBar = Math.max(0, this.barIndex - 1);
    const energy = this.noise[name].energyAt(currentBar);
    const phrase=this.selectPhrase(name,currentBar,energy);
    const [firstEvent] = name===this.manualInstrument||STRING_INSTRUMENTS[name]?phrase.events:transposeEvents(phrase.events.slice(0, 1), this.root);
    if (firstEvent) this.playEvent(name, firstEvent, Tone.now() + FADE_SECONDS + 0.01);
  }

  ensureTransport() {
    if (!this.ready) return;
    if(this.tempoHeld||this.backgrounded||document.hidden)return;
    if(this.practiceSession)return;
    if (this.transportEvent === null) {
      const generation = this.audioGeneration;
      this.transportEvent = Tone.Transport.scheduleRepeat(time => { if(this.ready&&generation===this.audioGeneration)this.scheduleBar(time); }, BAR);
    }
    if (Tone.Transport.state !== 'started') Tone.Transport.start('+0.04');
  }

  clearPendingEvents(instrumentName) {
    for (const [id, name] of this.pendingEvents) {
      if (instrumentName && name !== instrumentName) continue;
      Tone.Transport.clear(id);
      this.pendingEvents.delete(id);
    }
  }

  setTempo(value) {
    this.tempo=Math.max(40,Math.min(208,Math.round(Number(value)||BPM)));
    if(this.ready)Tone.Transport.bpm.value=this.tempo;
    return this.tempo;
  }

  getMetronomePhase() {
    return Tone.Transport.getTicksAtTime(Tone.immediate()) / Tone.Transport.PPQ;
  }

  setMetronomeSound(enabled) {
    this.metronomeSound=Boolean(enabled);
    if(!enabled)this.metronomeSynth?.triggerRelease();
    if(enabled)Tone.start().catch(console.error);
    this.ensureTransport();
  }

  holdTempo(held) {
    if(!this.ready||held===this.tempoHeld)return;
    this.tempoHeld=held;
    if(held){
      Tone.Transport.pause();
      this.metronomeSynth.triggerRelease();
      this.stopManualVoices();
      this.manualAutoplayVersion++;
      this.onManualAutoplayEvent?.(null);
      for(const node of Object.values(this.nodes))node.gain.volume.rampTo(MIN_GAIN,.015);
    }else{
      for(const [name,node] of Object.entries(this.nodes))node.gain.volume.rampTo(!this.backgrounded&&(this.active[name]||this.manualInstrument===name)?this.volumes[name]:MIN_GAIN,.025);
      this.ensureTransport();
    }
  }

  setManualAutoplay(enabled) {
    const name = this.manualInstrument;
    if (!name) return;
    if (enabled) this.stopManualVoices();
    this.setInstrumentActive(name, Boolean(enabled));
  }

  shouldSchedule(name) {
    if(this.practiceSession)return false;
    return this.active[name];
  }

  beginPractice(name) {
    if(this.practiceSession)return;
    this.practiceSession=capturePracticeSnapshot(this);
    this.stopPracticeRun();this.clearPendingEvents();this.stopManualVoices();
    window.dispatchEvent(new Event('farmjam-input-reset'));
    for(const node of Object.values(this.nodes)){node.synth.releaseAll();node.gain.volume.value=MIN_GAIN;}
    Tone.Transport.stop();Tone.Transport.position=0;this.barIndex=0;this.beatIndex=0;
    this.active=Object.fromEntries(instrumentNames.map(id=>[id,false]));
    this.metronomeSound=false;this.tempoHeld=false;
    this.setManualInstrument(name);
    this.nodes[name].gain.volume.value=this.volumes[name];
  }

  stopPracticeRun() {
    this.practiceRunVersion++;
    if(this.practiceRun)for(const id of this.practiceRun.ids)Tone.Transport.clear(id);
    this.practiceRun=null;
    if(this.practiceSession){
      Tone.Transport.stop();Tone.Transport.position=0;
      this.stopManualVoices();this.metronomeSynth?.triggerRelease();
      for(const [name,node] of Object.entries(this.nodes)){node.synth.releaseAll();if(name!==this.manualInstrument)node.gain.volume.value=MIN_GAIN;}
    }
  }

  switchPracticeInstrument(name) {
    if(!this.practiceSession)return;
    this.stopPracticeRun();window.dispatchEvent(new Event('farmjam-input-reset'));this.setManualInstrument(name);
  }

  startPracticeRun(phrase,accompaniment,onStep,onCycle,onBeat,onAccompaniment,{demo=false}={}) {
    if(!this.practiceSession||this.backgrounded)return null;
    this.stopPracticeRun();
    const version=this.practiceRunVersion;
    const ids=[];
    this.practiceRun={ids};
    const valid=()=>this.practiceSession&&version===this.practiceRunVersion&&!this.backgrounded;
    const draw=(callback,time)=>Tone.Draw.schedule(()=>{if(valid())callback();},time);
    const beatSeconds=60/this.tempo;
    const startTime=Tone.now()+.12;
    const ticksPerBeat=Tone.Transport.PPQ;
    const ticksPerBar=ticksPerBeat*4;
    const phraseStartTick=ticksPerBar;
    const repeat=(callback,interval,start)=>ids.push(Tone.Transport.scheduleRepeat(time=>{if(valid())callback(time);},interval,start));
    let beatCount=0;
    let lastBeatTime=-Infinity;
    repeat(time=>{
      if(time<=lastBeatTime+.001)return;
      lastBeatTime=time;
      const count=beatCount++;
      const countIn=count<4;
      const beat=countIn?count:(count-4)%4;
      const cycle=countIn?0:Math.floor((count-4)/4);
      if(!this.metronomeSound)this.metronomeSynth.triggerAttackRelease(beat===0?'C6':'G5',.035,time,.45);
      draw(()=>onBeat?.(beat,cycle,countIn),time);
    },'4n','0i');
    let cycle=0;
    repeat(time=>{
      const current=cycle++;
      draw(()=>onCycle?.(current),time);
    },'1m','1m');
    for(const [eventIndex,event] of phrase.events.entries()){
      const startTick=phraseStartTick+Math.round(beatOffset(event.time)*ticksPerBeat);
      let eventCycle=0;
      repeat(time=>{
        const current=eventCycle++;
        if(demo)this.playEvent(this.manualInstrument,event,time);
        draw(()=>onStep?.({...event,eventIndex,cycle:current,duration:Tone.Time(event.dur??'16n').toSeconds()}),time);
      },'1m',`${startTick}i`);
    }
    if(accompaniment){
      const partners=this.manualInstrument==='drums'?['piano','ukulele']:['drums',this.manualInstrument==='piano'?'ukulele':'piano'];
      for(const name of partners){
        this.nodes[name].gain.volume.value=this.volumes[name]-6;
        const pool=STRING_INSTRUMENTS[name]?.library[this.root].phrases??patterns[name];
        let phraseIndex=Math.max(0,pool.indexOf(nearestBar(pool,.25,.2)));
        repeat(time=>{
          const selected=pool[phraseIndex];
          const selectedIndex=phraseIndex;
          phraseIndex=(phraseIndex+1)%pool.length;
          const events=STRING_INSTRUMENTS[name]?selected.events:transposeEvents(selected.events,this.root);
          const secondsPerBeat=60/this.tempo;
          for(const event of events)this.playEvent(name,event,time+beatOffset(event.time)*secondsPerBeat);
          draw(()=>onAccompaniment?.(name,selectedIndex),time);
        },'1m','1m');
      }
    }
    Tone.start().catch(console.error);Tone.Transport.start(startTime,0);
    return {startTime:startTime+4*beatSeconds,beatSeconds,startTick:phraseStartTick,beatTicks:ticksPerBeat,barTicks:ticksPerBar};
  }

  practiceTime() {return Tone.immediate();}
  practiceTicks() {return Tone.Transport.ticks;}

  endPractice() {
    const saved=this.practiceSession;if(!saved)return;
    const restored=restorePracticeSnapshot(saved);
    this.stopPracticeRun();this.onPracticeInput=null;this.onPracticeInterrupt=null;
    window.dispatchEvent(new Event('farmjam-input-reset'));
    this.practiceSession=null;this.active=restored.active;this.root=restored.root;this.metronomeSound=restored.metronomeSound;this.setTempo(restored.tempo);
    this.setManualInstrument(restored.manualInstrument);this.barIndex=0;this.beatIndex=0;
    this.equippedPhrase=restored.equippedPhrase;this.phraseIdentity=restored.phraseIdentity;this.phrasePinned=restored.phrasePinned;
    for(const [name,node] of Object.entries(this.nodes))node.gain.volume.value=!this.backgrounded&&!this.tempoHeld&&(this.active[name]||name===this.manualInstrument)?this.volumes[name]:MIN_GAIN;
    this.ensureTransport();
  }

  selectPhrase(name,bar,energy=this.noise[name].energyAt(bar)) {
    const complexity=this.noise[name].complexityAt(bar);
    if(name!==this.manualInstrument)return nearestBar(STRING_INSTRUMENTS[name]?.library[this.root].phrases??patterns[name],energy,complexity);
    const identity=`${name}:${this.root}:${this.performanceSettings[name]?.complexity??1}`;
    const pool=equippedProfile(name,this.root,this.performanceSettings[name]).phrases;
    if(this.phraseIdentity!==identity){this.equippedPhrase=null;this.phraseIdentity=identity;this.phrasePinned=false;}
    const pinnedIndex=this.phrasePinned?findPhraseIndex(pool,this.equippedPhrase):-1;
    this.equippedPhrase=pinnedIndex>=0?pool[pinnedIndex]:nearestBar(pool,energy,complexity);
    return this.equippedPhrase;
  }

  skipEquippedPhrase() {
    const name=this.manualInstrument;
    if(!name||!this.ready)return false;
    const pool=equippedProfile(name,this.root,this.performanceSettings[name]).phrases;
    const current=this.selectPhrase(name,Math.max(0,this.barIndex-1));
    const index=findPhraseIndex(pool,current);
    this.equippedPhrase=pool[(index+1)%pool.length];
    this.phrasePinned=true;
    this.clearPendingEvents(name);
    this.nodes[name].synth.releaseAll();
    this.stopManualVoices();this.manualAutoplayVersion++;this.onManualAutoplayEvent?.(null);
    this.setInstrumentActive(name,true);
    return pool.length>1;
  }

  updatePerformanceSettings(settings) {
    const name=this.manualInstrument;
    const changed=name&&(this.performanceSettings[name]?.complexity??1.5)!==(settings[name]?.complexity??1.5);
    this.performanceSettings=settings;
    if(changed){
      this.clearPendingEvents(name);this.nodes[name]?.synth.releaseAll();this.stopManualVoices();
      this.equippedPhrase=null;this.phraseIdentity=null;this.phrasePinned=false;
      this.manualAutoplayVersion++;this.onManualAutoplayEvent?.(null);
    }
  }

  scheduleBar(time) {
    if(this.backgrounded||this.tempoHeld)return;
    const bar = this.barIndex++;
    const barPosition = bar * Tone.Transport.PPQ * 4;
    for (const name of instrumentNames) {
      if (!this.shouldSchedule(name)) continue;
      const selected = this.selectPhrase(name,bar);
      const events = name===this.manualInstrument||STRING_INSTRUMENTS[name]?selected.events:transposeEvents(selected.events, this.root);
      for (const event of events) {
        const offset = Tone.Time(event.time).toTicks();
        if (offset === 0) {
          this.playEvent(name, event, time);
          continue;
        }
        let id;
        id = Tone.Transport.scheduleOnce(at => {
          this.pendingEvents.delete(id);
          if (!this.shouldSchedule(name)) return;
          this.playEvent(name, event, at);
        }, `${barPosition + offset}i`);
        this.pendingEvents.set(id, name);
      }
    }
  }

  playEvent(name, event, time) {
    if(this.backgrounded||this.tempoHeld)return;
    if (name === this.manualInstrument && this.manualAutoplay) {
      const version = this.manualAutoplayVersion;
      Tone.Draw.schedule(() => {
        if (this.manualAutoplay && version === this.manualAutoplayVersion && name === this.manualInstrument) this.onManualAutoplayEvent?.({...event, duration:Tone.Time(event.dur??'16n').toSeconds()});
      }, time);
    }
    const velocity = event.velocity ?? 0.55;
    const sampler = this.nodes[name].synth;
    if (name === 'drums') {
      const durations = { kick: 0.5, snare: 0.3, hat: 0.12, tom: 0.5, clap: 0.23, rim: 0.045, shaker: 0.045, crash:2.4,ride:1.4,floorTom:.9 };
      sampler.triggerAttackRelease(DRUM_NOTES[event.note], durations[event.note], time, velocity);
      return;
    }
    const notes = event.notes ?? [event.note];
    const signature=JSON.stringify([...notes].sort());
    if(this.playingNotes.get(name)!==signature){
      sampler.releaseAll(time);
      this.playingNotes.set(name,signature);
    }
    notes.forEach((note, index) => {
      const strumOffset = STRING_INSTRUMENTS[name] ? index * (name==='ukulele'?.012:.016) : 0;
      sampler.triggerAttackRelease(note, event.dur, time + strumOffset, velocity * (1 - index * 0.04));
    });
  }

  playSceneSound(type) {
    if (!this.ready || document.hidden || !this.scenePlayers[type]) return;
    if(this.backgrounded){
      const version=this.playbackVersion;
      this.resumePlayback().then(()=>{if(!this.backgrounded&&!document.hidden&&version===this.playbackVersion)this.playSceneSound(type);});
      return;
    }
    Tone.start().catch(console.error);
    const voice = this.sceneVoices[type]++ % this.scenePlayers[type].length;
    const player = this.scenePlayers[type][voice];
    const when = Tone.immediate() + 0.015;
    if (type === 'water') {
      for (const previous of this.scenePlayers.water) {
        if (previous.state === 'started') previous.stop(Tone.immediate());
      }
    }
    if (player.state === 'started') player.stop(when);
    player.start(when);
    const context = Tone.getContext().rawContext;
    const timestamp = context.getOutputTimestamp?.();
    const startsAt = timestamp?.performanceTime > 0
      ? timestamp.performanceTime + (when - timestamp.contextTime) * 1000
      : performance.now() + (when - context.currentTime + (context.outputLatency ?? 0)) * 1000;
    return { startsAt };
  }

  setSceneVolume(value) {
    this.sceneVolume = Math.max(-60, Math.min(0, Number(value)));
    this.sceneGain?.volume.rampTo(this.sceneVolume, FADE_SECONDS);
  }

  setVolumes(volumes) {
    for (const name of instrumentNames) {
      if (volumes[name] == null || !this.nodes[name]) continue;
      this.volumes[name] = Number(volumes[name]);
      this.nodes[name].gain.volume.rampTo(!this.tempoHeld && !this.backgrounded && (this.active[name] || name === this.manualInstrument) ? this.volumes[name] : MIN_GAIN, FADE_SECONDS);
    }
  }

  dispose() {
    this.audioGeneration++;
    this.ready = false;
    this.initPromise = null;
    const attempt = this.initializationAttempt;
    this.initializationAttempt = null;
    attempt?.resources.dispose();
    this.resumePromise = null;
    this.backgrounded = false;
    this.playingNotes.clear();
    this.stopPracticeRun();this.practiceSession=null;this.onPracticeInput=null;this.onPracticeInterrupt=null;
    this.lifecycleCleanup?.();
    this.lifecycleCleanup=null;
    this.playbackVersion++;
    this.onMetronomeBeat = null;
    this.onActiveChange = null;
    this.manualAutoplayVersion++;
    this.onManualAutoplayEvent = null;
    this.stopManualVoices();
    for(const voice of this.retiringVoices)disconnectManualVoice(voice);
    this.clearPendingEvents();
    if (this.transportEvent !== null) Tone.Transport.clear(this.transportEvent);
    this.transportEvent = null;
    if(this.metronomeEvent!==null)Tone.Transport.clear(this.metronomeEvent);
    this.metronomeEvent=null;
    Tone.Transport.stop();
    this.resources?.dispose();
    this.resources = null;
    this.nodes = {};
    for(const key of ['metronomeSynth','scenePlayers','sceneBuffers','sceneVoices','sceneGain','reverb','master','limiter'])this[key]=null;
  }
}
