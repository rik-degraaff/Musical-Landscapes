import * as Tone from 'tone';
import { BPM, BAR, INSTRUMENTS, patterns, nearestBar, transposeEvents } from '../utils/music';
import { createNoisePair } from '../utils/noise';
import { createSceneSample, SCENE_SOUNDS } from './sceneSounds';
import { DRUM_NOTES, DRUM_SAMPLES, SAMPLE_LIBRARY, sampleUrls } from './sampleLibrary';

const MIN_GAIN = -60;
const FADE_SECONDS = 0.045;
const instrumentNames = Object.keys(INSTRUMENTS);

export class AudioEngine {
  constructor() {
    this.ready = false;
    this.started = false;
    this.transportEvent = null;
    this.barIndex = 0;
    this.active = Object.fromEntries(instrumentNames.map(name => [name, false]));
    this.volumes = Object.fromEntries(instrumentNames.map(name => [name, INSTRUMENTS[name].volume]));
    this.noise = Object.fromEntries(instrumentNames.map(name => [name, createNoisePair(INSTRUMENTS[name].seed)]));
    this.pendingEvents = new Map();
    this.nodes = {};
    this.root = 'C';
    this.sceneVolume = -4;
  }

  async init() {
    if (this.ready) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.initialize();
    try {
      await this.initPromise;
    } catch (error) {
      this.dispose();
      throw error;
    } finally {
      this.initPromise = null;
    }
  }

  async initialize() {
    await Tone.start();
    Tone.Transport.bpm.value = BPM;
    Tone.Transport.swing = 0;
    Tone.Transport.swingSubdivision = '8n';
    this.limiter = new Tone.Limiter(-1).toDestination();
    this.master = new Tone.Gain(0.8).connect(this.limiter);
    this.reverb = new Tone.Reverb({ decay: 1.2, preDelay: 0.018, wet: 0.09 }).connect(this.master);
    const loads = [];
    for (const name of instrumentNames) {
      const gain = new Tone.Volume(MIN_GAIN).connect(name === 'drums' ? this.master : this.reverb);
      this.nodes[name] = { gain };
      loads.push(this.createSampledInstrument(name));
    }
    await Promise.all([this.reverb.ready, ...loads]);
    this.createSceneSounds();
    this.ready = true;
  }

  createSampledInstrument(name) {
    const baseUrl = `${import.meta.env.BASE_URL}audio/instruments/`;
    const urls = name === 'drums' ? {
      C2: `drums/${DRUM_SAMPLES.kick.file}`,
      D2: `drums/${DRUM_SAMPLES.snare.file}`,
      'F#2': `drums/${DRUM_SAMPLES.hat.file}`,
      G2: `drums/${DRUM_SAMPLES.tom.file}`,
      'D#2': `drums/${DRUM_SAMPLES.clap.file}`,
      'C#2': `drums/${DRUM_SAMPLES.snare.file}`,
      'A#2': `drums/${DRUM_SAMPLES.hat.file}`,
    } : sampleUrls(name);
    return new Promise((resolve, reject) => {
      const sampler = new Tone.Sampler({
        urls,
        baseUrl,
        attack: 0.002,
        release: name === 'drums' ? 0.08 : SAMPLE_LIBRARY[name].release,
        curve: 'exponential',
        onload: resolve,
        onerror: error => reject(new Error(`Could not load ${INSTRUMENTS[name].label} recordings`, { cause: error })),
      }).connect(this.nodes[name].gain);
      this.nodes[name].synth = sampler;
    });
  }

  createSceneSounds() {
    this.sceneGain = new Tone.Volume(this.sceneVolume).connect(this.master);
    this.sceneBuffers = {};
    this.scenePlayers = {};
    this.sceneVoices = {};
    for (const type of SCENE_SOUNDS) {
      const buffer = new Tone.ToneAudioBuffer().fromArray(createSceneSample(type, Tone.getContext().sampleRate));
      this.sceneBuffers[type] = buffer;
      this.scenePlayers[type] = Array.from({ length: 3 }, () => new Tone.Player({ url: buffer, fadeOut: 0.025 }).connect(this.sceneGain));
      this.sceneVoices[type] = 0;
    }
  }

  setSceneKey(root) {
    this.root = root;
  }

  setInstrumentActive(name, active) {
    if (!this.ready || !this.nodes[name]) return;
    Tone.start().catch(console.error);
    const transportWasPlaying = Tone.Transport.state === 'started' && this.barIndex > 0;
    this.active[name] = active;
    const node = this.nodes[name];
    node.gain.volume.rampTo(active ? this.volumes[name] : MIN_GAIN, FADE_SECONDS);
    if (!active) {
      this.clearPendingEvents(name);
      node.synth.releaseAll();
    }
    this.ensureTransport();
    if (active && transportWasPlaying) this.playPickup(name);
  }

  playPickup(name) {
    const currentBar = Math.max(0, this.barIndex - 1);
    const energy = this.noise[name].energyAt(currentBar);
    const complexity = this.noise[name].complexityAt(currentBar);
    const phrase = nearestBar(patterns[name], energy, complexity);
    const [firstEvent] = transposeEvents(phrase.events.slice(0, 1), this.root);
    if (firstEvent) this.playEvent(name, firstEvent, Tone.now() + FADE_SECONDS + 0.01);
  }

  ensureTransport() {
    if (!this.ready) return;
    const anyActive = Object.values(this.active).some(Boolean);
    if (!anyActive) {
      this.clearPendingEvents();
      Tone.Transport.stop();
      Tone.Transport.position = 0;
      this.barIndex = 0;
      return;
    }
    if (this.transportEvent === null) {
      this.transportEvent = Tone.Transport.scheduleRepeat(time => this.scheduleBar(time), BAR);
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

  scheduleBar(time) {
    const bar = this.barIndex++;
    // `scheduleBar` is driven by the Transport, so its recurring callback's
    // `time` is audio-clock seconds. `scheduleOnce` expects a position on the
    // Transport timeline; derive that from the bar index instead.
    const barPosition = bar * Tone.Time(BAR).toSeconds();
    for (const name of instrumentNames) {
      if (!this.active[name]) continue;
      const energy = this.noise[name].energyAt(bar);
      const complexity = this.noise[name].complexityAt(bar);
      const selected = nearestBar(patterns[name], energy, complexity);
      const events = transposeEvents(selected.events, this.root);
      for (const event of events) {
        const offset = Tone.Time(event.time).toSeconds();
        if (offset === 0) {
          this.playEvent(name, event, time);
          continue;
        }
        let id;
        id = Tone.Transport.scheduleOnce(at => {
          this.pendingEvents.delete(id);
          if (!this.active[name]) return;
          this.playEvent(name, event, at);
        }, barPosition + offset);
        this.pendingEvents.set(id, name);
      }
    }
  }

  playEvent(name, event, time) {
    const velocity = event.velocity ?? 0.55;
    const sampler = this.nodes[name].synth;
    if (name === 'drums') {
      const durations = { kick: 0.5, snare: 0.3, hat: 0.12, tom: 0.5, clap: 0.23, rim: 0.045, shaker: 0.045 };
      sampler.triggerAttackRelease(DRUM_NOTES[event.note], durations[event.note], time, velocity);
      return;
    }
    const notes = event.notes ?? [event.note];
    notes.forEach((note, index) => {
      const strumOffset = name === 'guitar' ? index * 0.016 : 0;
      sampler.triggerAttackRelease(note, event.dur, time + strumOffset, velocity * (1 - index * 0.04));
    });
  }

  playSceneSound(type) {
    if (!this.ready || !this.scenePlayers[type]) return;
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
      this.nodes[name].gain.volume.rampTo(this.active[name] ? this.volumes[name] : MIN_GAIN, FADE_SECONDS);
    }
  }

  dispose() {
    this.clearPendingEvents();
    if (this.transportEvent !== null) Tone.Transport.clear(this.transportEvent);
    this.transportEvent = null;
    Tone.Transport.stop();
    Tone.Transport.cancel();

    const disposed = new WeakSet();
    const disposeNode = node => {
      if (!node || typeof node !== 'object' || disposed.has(node)) return;
      disposed.add(node);
      if (typeof node.dispose === 'function') {
        node.dispose();
        return;
      }
      Object.values(node).forEach(disposeNode);
    };
    disposeNode(this.nodes);
    disposeNode(this.scenePlayers);
    disposeNode(this.sceneBuffers);
    disposeNode(this.sceneGain);
    disposeNode(this.reverb);
    disposeNode(this.master);
    disposeNode(this.limiter);
    this.ready = false;
  }
}
