import * as Tone from 'tone';
import { BPM, BAR, INSTRUMENTS, patterns, nearestBar, transposeEvents } from '../utils/music';
import { createNoisePair } from '../utils/noise';
import { createSceneSample, SCENE_SOUNDS } from './sceneSounds';

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
  }

  async init() {
    if (this.ready) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.initialize();
    try {
      await this.initPromise;
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
    this.reverb = new Tone.Reverb({ decay: 2.4, preDelay: 0.025, wet: 0.16 }).connect(this.master);
    // Tone.Reverb builds its impulse response asynchronously. Wait so the
    // first note is audible even when a child taps an instrument immediately.
    await this.reverb.ready;

    for (const name of instrumentNames) {
      const gain = new Tone.Volume(MIN_GAIN).connect(this.reverb);
      this.nodes[name] = { gain };
    }

    this.createPiano();
    this.createDrums();
    this.createBass();
    this.createTrumpet();
    this.createMarimba();
    this.createFlute();
    this.createSceneSounds();
    this.ready = true;
  }

  createPiano() {
    // A sharp hammer-like attack and short inharmonic FM partials give a
    // rounded, bell-bright piano tone without a brittle, continuous sustain.
    const synth = new Tone.PolySynth(Tone.FMSynth, {
      maxPolyphony: 10,
      harmonicity: 3.2,
      modulationIndex: 1.5,
      oscillator: { type: 'sine' },
      modulation: { type: 'sine' },
      envelope: { attack: 0.003, decay: 0.5, sustain: 0.025, release: 0.75 },
      modulationEnvelope: { attack: 0.001, decay: 0.22, sustain: 0.015, release: 0.15 },
    }).connect(this.nodes.piano.gain);
    this.nodes.piano.synth = synth;
  }

  createDrums() {
    const bus = new Tone.Gain(0.78).connect(this.nodes.drums.gain);
    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.045,
      octaves: 5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.32, sustain: 0, release: 0.22 },
    }).connect(bus);
    const tom = new Tone.MembraneSynth({
      pitchDecay: 0.075,
      octaves: 2.4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.24, sustain: 0, release: 0.18 },
    }).connect(bus);

    const snareFilter = new Tone.Filter(1600, 'highpass').connect(bus);
    const snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.055 },
    }).connect(snareFilter);
    const clapFilter = new Tone.Filter(1250, 'bandpass').connect(bus);
    const clap = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.095, sustain: 0, release: 0.035 },
    }).connect(clapFilter);

    const hat = new Tone.MetalSynth({
      frequency: 340,
      harmonicity: 5.2,
      modulationIndex: 24,
      resonance: 3000,
      octaves: 1.35,
      envelope: { attack: 0.001, decay: 0.055, release: 0.025 },
    }).connect(bus);
    const shakerFilter = new Tone.Filter(4300, 'highpass').connect(bus);
    const shaker = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.045, sustain: 0, release: 0.025 },
    }).connect(shakerFilter);
    const rim = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.045, sustain: 0, release: 0.025 },
    }).connect(bus);

    this.nodes.drums.synth = { kick, tom, snare, clap, hat, shaker, rim };
    this.nodes.drums.effects = { bus, snareFilter, clapFilter, shakerFilter };
  }

  createBass() {
    const synth = new Tone.MonoSynth({
      oscillator: { type: 'fatsawtooth', count: 2, spread: 3 },
      filter: { type: 'lowpass', frequency: 520, rolloff: -24, Q: 0.8 },
      envelope: { attack: 0.003, decay: 0.24, sustain: 0.08, release: 0.14 },
      filterEnvelope: { attack: 0.001, decay: 0.16, sustain: 0.06, release: 0.12, baseFrequency: 85, octaves: 1.8 },
    }).connect(this.nodes.bass.gain);
    this.nodes.bass.synth = synth;
  }

  createTrumpet() {
    const filter = new Tone.Filter({ type: 'lowpass', frequency: 1900, rolloff: -12, Q: 0.7 });
    const vibrato = new Tone.Vibrato(5.1, 0.022);
    const synth = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      filter: { type: 'lowpass', frequency: 1500, rolloff: -12, Q: 0.8 },
      envelope: { attack: 0.022, decay: 0.12, sustain: 0.33, release: 0.16 },
      filterEnvelope: { attack: 0.012, decay: 0.19, sustain: 0.2, release: 0.14, baseFrequency: 390, octaves: 2.15 },
    }).chain(filter, vibrato, this.nodes.melody.gain);
    this.nodes.melody.synth = synth;
    this.nodes.melody.effects = { filter, vibrato };
  }

  createMarimba() {
    // The briefly bright FM attack suggests the woody, uneven partials of a
    // struck bar; the fast decay keeps repeated notes clear.
    const synth = new Tone.PolySynth(Tone.FMSynth, {
      maxPolyphony: 8,
      harmonicity: 3.01,
      modulationIndex: 2.4,
      oscillator: { type: 'sine' },
      modulation: { type: 'sine' },
      envelope: { attack: 0.002, decay: 0.42, sustain: 0.015, release: 0.3 },
      modulationEnvelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 },
    }).connect(this.nodes.marimba.gain);
    this.nodes.marimba.synth = synth;
  }

  createFlute() {
    const vibrato = new Tone.Vibrato(4.8, 0.012);
    const synth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.065, decay: 0.16, sustain: 0.46, release: 0.34 },
    }).chain(vibrato, this.nodes.flute.gain);

    // A quiet, filtered breath transient softens the sine-wave onset.
    const breathFilter = new Tone.Filter(2100, 'bandpass');
    const breathGain = new Tone.Gain(0.08).connect(breathFilter).connect(this.nodes.flute.gain);
    const breath = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.07, sustain: 0, release: 0.04 },
    }).connect(breathGain);

    this.nodes.flute.synth = synth;
    this.nodes.flute.breath = breath;
    this.nodes.flute.effects = { vibrato, breathFilter, breathGain };
  }

  createSceneSounds() {
    this.sceneGain = new Tone.Volume(-4).connect(this.master);
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
      try {
        if (name === 'piano' || name === 'marimba' || name === 'flute') node.synth.releaseAll();
        if (name === 'bass' || name === 'melody') node.synth.triggerRelease();
      } catch {}
    }
    this.ensureTransport();
    // When joining an already-running landscape, let the new instrument answer
    // on the next audio tick instead of making it wait for the next full bar.
    // The regular phrase still enters on the shared bar line.
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
    const synth = this.nodes[name].synth;

    if (name === 'drums') {
      const hits = {
        kick: () => synth.kick.triggerAttackRelease('C1', event.dur ?? '8n', time, velocity),
        tom: () => synth.tom.triggerAttackRelease('G2', event.dur ?? '8n', time, velocity),
        snare: () => synth.snare.triggerAttackRelease(event.dur ?? '16n', time, velocity),
        clap: () => synth.clap.triggerAttackRelease(event.dur ?? '16n', time, velocity),
        hat: () => synth.hat.triggerAttackRelease('F#6', '32n', time, velocity),
        shaker: () => synth.shaker.triggerAttackRelease('32n', time, velocity),
        rim: () => synth.rim.triggerAttackRelease('C6', event.dur ?? '32n', time, velocity),
      };
      hits[event.note]?.();
      return;
    }

    if (name === 'piano' || name === 'marimba' || name === 'flute') {
      synth.triggerAttackRelease(event.notes ?? event.note, event.dur, time, velocity);
      if (name === 'flute') this.nodes.flute.breath.triggerAttackRelease('32n', time, velocity);
      return;
    }

    synth.triggerAttackRelease(event.note, event.dur, time, velocity);
  }

  playSceneSound(type) {
    if (!this.ready || !this.scenePlayers[type]) return;
    Tone.start().catch(console.error);
    const voice = this.sceneVoices[type]++ % this.scenePlayers[type].length;
    const player = this.scenePlayers[type][voice];
    const when = Tone.immediate() + 0.015;
    if (player.state === 'started') player.stop(when);
    player.start(when);
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
