import * as Tone from 'tone';
import { BPM, BAR, INSTRUMENTS, patterns, nearestBar, transposeEvents } from '../utils/music';
import { createNoisePair } from '../utils/noise';
import { SCENE_SOUNDS } from './sceneSounds';
import audioLevels from './audioLevels.json';
import { DRUM_NOTES, DRUM_SAMPLES, SAMPLE_LIBRARY, sampleUrls } from './sampleLibrary';
import { createSustainLoop, MANUAL_RELEASE } from './envelopes';

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
    this.manualInstrument = null;
    this.manualAutoplay = false;
    this.manualAutoplayVersion = 0;
    this.onManualAutoplayEvent = null;
    this.manualVoices = new Map();
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
    await this.createSceneSounds();
    this.ready = true;
  }

  async createSampledInstrument(name) {
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
    this.nodes[name].buffers = buffers;
    await Promise.all(Object.entries(urls).map(async ([note, file]) => {
      const buffer = new Tone.ToneAudioBuffer();
      buffers[note] = buffer;
      await buffer.load(`${baseUrl}${file}`);
      const correction = Tone.dbToGain(audioLevels[`instruments/${file}`].gainDb);
      const decoded = buffer.get();
      for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
        const waveform = decoded.getChannelData(channel);
        for (let index = 0; index < waveform.length; index++) waveform[index] *= correction;
      }
      if (name === 'melody' || name === 'flute') {
        const parts = /^([A-G]#?)(\d+)$/.exec(note);
        const midi = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].indexOf(parts[1]) + (Number(parts[2]) + 1) * 12;
        const channels = Array.from({length:decoded.numberOfChannels},(_,channel)=>decoded.getChannelData(channel));
        const loop = createSustainLoop(channels, decoded.sampleRate, 440 * 2 ** ((midi - 69) / 12));
        const sustain = Tone.getContext().rawContext.createBuffer(decoded.numberOfChannels, loop.waveforms[0].length, decoded.sampleRate);
        loop.waveforms.forEach((waveform,channel)=>sustain.copyToChannel(waveform,channel));
        this.nodes[name].sustainLoops ??= {};
        this.nodes[name].sustainLoops[note] = { buffer:sustain, loopStart:loop.loopStart, loopEnd:loop.loopEnd };
      }
    }));
    return new Promise((resolve, reject) => {
      const sampler = new Tone.Sampler({
        urls: buffers,
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

  async createSceneSounds() {
    this.sceneGain = new Tone.Volume(this.sceneVolume).connect(this.master);
    this.sceneBuffers = {};
    this.scenePlayers = {};
    this.sceneVoices = {};
    await Promise.all(SCENE_SOUNDS.map(async type => {
      const buffer = new Tone.ToneAudioBuffer();
      this.sceneBuffers[type] = buffer;
      await buffer.load(`${import.meta.env.BASE_URL}audio/scenery/${type}.wav`);
      this.scenePlayers[type] = Array.from({ length: 3 }, () => new Tone.Player({ url: buffer, fadeOut: 0.025, volume: audioLevels[`scenery/${type}.wav`].gainDb }).connect(this.sceneGain));
      this.sceneVoices[type] = 0;
    }));
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
    node.gain.volume.rampTo(active || this.manualInstrument === name ? this.volumes[name] : MIN_GAIN, FADE_SECONDS);
    if (!active) {
      this.clearPendingEvents(name);
      node.synth.releaseAll();
    }
    this.ensureTransport();
    if (active && transportWasPlaying && this.manualInstrument !== name) this.playPickup(name);
  }

  setManualInstrument(name) {
    if (!this.ready || name === this.manualInstrument) return;
    this.setManualAutoplay(false);
    this.stopManualVoices();
    const previous = this.manualInstrument;
    this.manualInstrument = name;
    if (previous) this.nodes[previous].gain.volume.rampTo(this.active[previous] ? this.volumes[previous] : MIN_GAIN, FADE_SECONDS);
    if (name) {
      this.clearPendingEvents(name);
      this.nodes[name].synth.releaseAll();
      this.nodes[name].gain.volume.rampTo(this.volumes[name], FADE_SECONDS);
    }
    if (name && this.active[name]) this.setManualAutoplay(true);
    this.ensureTransport();
  }

  manualNoteOn(note, token, velocity = 0.65) {
    if (this.manualAutoplay) this.setManualAutoplay(false);
    const name = this.manualInstrument;
    if (!this.ready || !name) return;
    Tone.start().catch(console.error);
    this.manualNoteOff(token, true);
    if (name === 'drums') {
      this.playEvent(name, { note, velocity }, Tone.immediate() + 0.015);
      return;
    }
    const match = /^([A-G]#?)(\d+)$/.exec(note);
    if (!match) return;
    const pitch = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].indexOf(match[1]) + (Number(match[2]) + 1) * 12;
    const candidates = Object.keys(this.nodes[name].buffers).map(value => {
      const parts = /^([A-G]#?)(\d+)$/.exec(value);
      return { note: value, midi: ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].indexOf(parts[1]) + (Number(parts[2]) + 1) * 12 };
    });
    candidates.sort((first, second) => Math.abs(first.midi - pitch) - Math.abs(second.midi - pitch));
    const selected = candidates[0];
    const context = Tone.getContext().rawContext;
    const source = context.createBufferSource();
    const envelope = context.createGain();
    const loop = this.nodes[name].sustainLoops?.[selected.note];
    source.buffer = loop?.buffer ?? this.nodes[name].buffers[selected.note].get();
    source.playbackRate.value = 2 ** ((pitch - selected.midi) / 12);
    if (name === 'melody' || name === 'flute') {
      source.loop = true;
      source.loopStart = loop.loopStart;
      source.loopEnd = loop.loopEnd;
    }
    source.connect(envelope);
    Tone.connect(envelope, this.nodes[name].gain);
    const when = context.currentTime + 0.015;
    envelope.gain.setValueAtTime(0, when);
    envelope.gain.linearRampToValueAtTime(velocity, when + (name === 'flute' ? 0.035 : 0.006));
    const voice = { source, envelope, note, name };
    this.manualVoices.set(token, voice);
    source.onended = () => {
      source.disconnect(); envelope.disconnect();
      if (this.manualVoices.get(token) === voice) this.manualVoices.delete(token);
    };
    source.start(when);
  }

  manualNoteOff(token, quick = false) {
    const voice = this.manualVoices.get(token);
    if (!voice) return;
    this.manualVoices.delete(token);
    const when = Tone.getContext().rawContext.currentTime;
    voice.envelope.gain.cancelAndHoldAtTime(when);
    const release = quick ? 0.04 : MANUAL_RELEASE[voice.name] ?? 0.08;
    voice.envelope.gain.setTargetAtTime(0, when, release / 5);
    voice.envelope.gain.cancelAndHoldAtTime(when + Math.max(0.005, release - 0.02));
    voice.envelope.gain.linearRampToValueAtTime(0, when + release);
    voice.source.stop(when + release + 0.005);
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

  stopManualVoices() {
    for (const token of [...this.manualVoices.keys()]) this.manualNoteOff(token, true);
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
    const anyActive = this.manualAutoplay || Object.entries(this.active).some(([name, active]) => active && name !== this.manualInstrument);
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

  setManualAutoplay(enabled) {
    const next = Boolean(enabled && this.manualInstrument && this.ready);
    if (next === this.manualAutoplay) return;
    this.manualAutoplay = next;
    this.manualAutoplayVersion++;
    const name = this.manualInstrument;
    if (name) {
      this.clearPendingEvents(name);
      this.nodes[name].synth.releaseAll();
    }
    this.onManualAutoplayEvent?.(null);
    if (next) {
      this.stopManualVoices();
      Tone.start().catch(console.error);
    }
    this.ensureTransport();
  }

  shouldSchedule(name) {
    return name === this.manualInstrument ? this.manualAutoplay : this.active[name];
  }

  scheduleBar(time) {
    const bar = this.barIndex++;
    // `scheduleBar` is driven by the Transport, so its recurring callback's
    // `time` is audio-clock seconds. `scheduleOnce` expects a position on the
    // Transport timeline; derive that from the bar index instead.
    const barPosition = bar * Tone.Time(BAR).toSeconds();
    for (const name of instrumentNames) {
      if (!this.shouldSchedule(name)) continue;
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
          if (!this.shouldSchedule(name)) return;
          this.playEvent(name, event, at);
        }, barPosition + offset);
        this.pendingEvents.set(id, name);
      }
    }
  }

  playEvent(name, event, time) {
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
      this.nodes[name].gain.volume.rampTo(this.active[name] || name === this.manualInstrument ? this.volumes[name] : MIN_GAIN, FADE_SECONDS);
    }
  }

  dispose() {
    this.manualAutoplay = false;
    this.manualAutoplayVersion++;
    this.onManualAutoplayEvent = null;
    this.stopManualVoices();
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
