import test from 'node:test';
import assert from 'node:assert/strict';
import { attachOwnedSamplerVoices } from '../src/audio/samplerVoices.js';

function setup(buffers = { C4: { duration: 4 } }, release = 0.4) {
  const runtime = { immediate: 1, lookAhead: 0.1, sources: [], releases: [], disposals: 0, attacks: 0, times: [] };
  const pitches = { C2: 36, 'C#2': 37, 'D#2': 39, F2: 41, 'A#2': 46, 'C#3': 49, 'D#3': 51, C4: 60, D4: 62, E4: 64, F4: 65, 'F#4': 66, A4: 69, C5: 72 };
  const context = {};
  const output = {};
  class ToneBufferSource {
    constructor(options) {
      this.options = options;
      this.fadeOut = options.fadeOut;
      this.starts = [];
      this.stops = [];
      this.disconnections = 0;
      this.disposals = 0;
      this.disposed = false;
      runtime.sources.push(this);
    }
    connect(destination) { this.destination = destination; return this; }
    start(...args) {
      this.starts.push(args);
      this.stop(args[0] + args[2]);
      return this;
    }
    stop(time) { this.stops.push({ time, fadeOut: this.fadeOut }); return this; }
    disconnect() { this.disconnections++; return this; }
    dispose() {
      this.disposals++;
      this.disposed = true;
      this.onended = () => {};
      return this;
    }
    end() {
      this.onended?.(this);
      if (!this.disposed) this.dispose();
    }
  }
  const Tone = {
    ToneBufferSource,
    immediate: () => runtime.immediate,
    now: () => runtime.immediate + runtime.lookAhead,
    Time(value) {
      runtime.times.push(value);
      return { toSeconds() {
        if (value === undefined) return Tone.now();
        if (value === '4n') return 0.5;
        if (value === '8n') return 0.25;
        if (typeof value === 'string' && value.startsWith('+')) return Tone.now() + Number(value.slice(1));
        return Number(value);
      } };
    },
    Frequency(note) {
      const midi = pitches[note];
      const frequency = typeof note === 'number' ? note : 440 * 2 ** ((midi - 69) / 12);
      return { toFrequency: () => frequency, toMidi: () => Math.round(69 + 12 * Math.log2(frequency / 440)) };
    },
  };
  const triggerRelease = () => {};
  const sampler = {
    context, output, release,
    triggerAttackRelease() { runtime.attacks++; },
    triggerRelease,
    releaseAll(time) { assert.equal(this, sampler); runtime.releases.push(time); return this; },
    dispose() { assert.equal(this, sampler); runtime.disposals++; return this; },
  };
  const owner = attachOwnedSamplerVoices(Tone, sampler, buffers);
  return { Tone, sampler, owner, runtime, buffers, triggerRelease };
}

function near(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} should equal ${expected}`);
}

test('single note uses the public sampler API and exact Tone source duration, envelope, and velocity', () => {
  const { sampler, owner, runtime, buffers, triggerRelease } = setup();
  assert.equal(sampler.triggerAttackRelease('C4', '4n', 2, 0.63), sampler);
  const [source] = runtime.sources;
  assert.equal(runtime.attacks, 0);
  assert.equal(sampler.triggerRelease, triggerRelease);
  assert.deepEqual(source.options, {
    url: buffers.C4, context: sampler.context, fadeIn: 0.002, fadeOut: 0.4, curve: 'exponential', playbackRate: 1,
  });
  assert.equal(source.destination, sampler.output);
  assert.deepEqual(source.starts, [[2, 0, 4, 0.63]]);
  assert.deepEqual(source.stops, [{ time: 6, fadeOut: 0.4 }, { time: 2.5, fadeOut: 0.4 }]);
  assert.deepEqual([...owner.voices], [{ source, startTime: 2, stopTime: 2.5, note: 'C4' }]);
  assert.ok(runtime.times.includes('4n'));
});

test('default time includes lookahead, relative times and duration are converted, and default velocity is one', () => {
  const { sampler, runtime, owner } = setup();
  sampler.triggerAttackRelease('C4', '8n');
  sampler.triggerAttackRelease('C4', '4n', '+0.2', 0);
  near(runtime.sources[0].starts[0][0], 1.1);
  near(runtime.sources[0].stops.at(-1).time, 1.35);
  assert.equal(runtime.sources[0].starts[0][3], 1);
  near(runtime.sources[1].starts[0][0], 1.3);
  assert.equal(runtime.sources[1].starts[0][3], 0);
  assert.equal(owner.voices.size, 2);
});

test('closest sample prefers the higher pitch on ties regardless of caller insertion order', () => {
  for (const buffers of [{ C4: { duration: 3 }, E4: { duration: 5 } }, { E4: { duration: 5 }, C4: { duration: 3 } }]) {
    const { sampler, runtime } = setup(buffers);
    sampler.triggerAttackRelease('D4', 0.2, 2, 0.7);
    const [source] = runtime.sources;
    assert.equal(source.options.url, buffers.E4);
    near(source.options.playbackRate, 2 ** (-2 / 12));
    near(source.starts[0][2], buffers.E4.duration / source.options.playbackRate);
  }
});

test('sample selection rounds fractional MIDI first, then preserves fractional transposition', () => {
  const buffers = { C4: { duration: 2 }, F4: { duration: 3 } };
  const { sampler, runtime } = setup(buffers);
  const pitch = 62.49;
  sampler.triggerAttackRelease(440 * 2 ** ((pitch - 69) / 12), 0.25, 2);
  const [source] = runtime.sources;
  assert.equal(source.options.url, buffers.C4);
  near(source.options.playbackRate, 2 ** ((pitch - 60) / 12));
  near(source.starts[0][2], 2 / source.options.playbackRate);
});

test('nearest sample transposes upward and accepts caller MIDI-number buffer keys', () => {
  const buffer = { duration: 6 };
  const { sampler, runtime } = setup({ 60: buffer });
  sampler.triggerAttackRelease('C5', 0.3, 3);
  assert.equal(runtime.sources[0].options.url, buffer);
  assert.equal(runtime.sources[0].options.playbackRate, 2);
  assert.deepEqual(runtime.sources[0].starts, [[3, 0, 3, 1]]);
});

test('missing samples and Tone eight-octave search limit allocate no voice', () => {
  for (const buffers of [{}, { 156: { duration: 1 } }, { '-36': { duration: 1 } }]) {
    const { sampler, owner, runtime } = setup(buffers);
    assert.throws(() => sampler.triggerAttackRelease('C4', 0.5, 2), /No available buffers for note: 60/);
    assert.equal(runtime.sources.length, 0);
    assert.equal(owner.voices.size, 0);
  }
  const { sampler, runtime } = setup({ 155: { duration: 1 } });
  sampler.triggerAttackRelease('C4', 0.5, 2);
  assert.equal(runtime.sources.length, 1);
});

test('drum note mapping comes entirely from caller buffers with no hardcoded instrument assumptions', () => {
  const notes = ['C2', 'C#2', 'D#2', 'F2', 'A#2', 'C#3', 'D#3'];
  const buffers = Object.fromEntries(notes.map((note, index) => [note, { duration: index + 1 }]));
  const { sampler, runtime, owner } = setup(buffers, 0.08);
  notes.forEach((note, index) => sampler.triggerAttackRelease(note, 0.12 + index / 10, 2, 0.55));
  runtime.sources.forEach((source, index) => {
    assert.equal(source.options.url, buffers[notes[index]]);
    near(source.options.playbackRate, 1);
    near(source.starts[0][2], buffers[notes[index]].duration);
    assert.equal(source.starts[0][3], 0.55);
    near(source.stops.at(-1).time, 2.12 + index / 10);
  });
  assert.equal(owner.voices.size, notes.length);
});

test('releaseAll forwards original time and never extends the earliest owned release', () => {
  const { sampler, runtime, owner } = setup();
  sampler.triggerAttackRelease('C4', 2, 1);
  const [entry] = owner.voices;
  assert.equal(sampler.releaseAll(2), sampler);
  assert.equal(entry.stopTime, 2);
  assert.equal(owner.voices.size, 1);
  sampler.releaseAll(2.5);
  sampler.releaseAll(2);
  assert.deepEqual(runtime.releases, [2, 2.5, 2]);
  assert.deepEqual(entry.source.stops, [{ time: 5, fadeOut: 0.4 }, { time: 3, fadeOut: 0.4 }, { time: 2, fadeOut: 0.4 }]);
  sampler.releaseAll(1.5);
  assert.equal(entry.stopTime, 1.5);
  assert.equal(entry.source.stops.at(-1).time, 1.5);
});

test('releaseAll uses changed sampler release including short suspension tails without extending old fades', () => {
  const { sampler, owner } = setup();
  sampler.triggerAttackRelease('C4', 5, 1);
  const [entry] = owner.voices;
  sampler.releaseAll(2);
  sampler.release = 0.005;
  sampler.releaseAll(2);
  assert.deepEqual(entry.source.stops.at(-1), { time: 2, fadeOut: 0.005 });
  sampler.release = 1;
  sampler.releaseAll(2);
  assert.equal(entry.source.stops.length, 4);
  sampler.releaseAll(1.9);
  near(entry.source.stops.at(-1).fadeOut, 0.105);
  near(entry.stopTime + entry.source.fadeOut, 2.005);
  sampler.triggerAttackRelease('C4', 1, 3);
  assert.equal([...owner.voices][1].source.options.fadeOut, 1);
});

test('a shorter release still shortens an already-fading note without moving its original stop later', () => {
  const { sampler, owner, runtime } = setup();
  sampler.triggerAttackRelease('C4', 0.1, 1);
  const [entry] = owner.voices;
  runtime.immediate = 1.2;
  sampler.release = 0.005;
  sampler.releaseAll(1.2);
  assert.deepEqual(entry.source.stops.at(-1), { time: 1.1, fadeOut: 0.005 });
  assert.equal(entry.stopTime, 1.1);
  assert.equal(owner.voices.has(entry), true);
  sampler.release = 0.8;
  sampler.releaseAll(1.25);
  owner.cancelFrom(1);
  assert.equal(entry.source.stops.length, 3);
  entry.source.end();
  assert.equal(owner.voices.size, 0);
});

test('releaseAll default timestamp uses Tone lookahead but keeps original arguments unchanged', () => {
  const { sampler, owner, runtime } = setup();
  sampler.triggerAttackRelease('C4', 5, 1);
  sampler.release = 0.005;
  sampler.releaseAll();
  assert.deepEqual(runtime.releases, [undefined]);
  assert.deepEqual([...owner.voices][0].source.stops.at(-1), { time: 1.1, fadeOut: 0.005 });
});

test('voices remain tracked through scheduled stop and release until their own actual onended', () => {
  const { sampler, owner, runtime } = setup();
  sampler.triggerAttackRelease('C4', 0.1, 1);
  sampler.triggerAttackRelease('C4', 0.1, 1.2);
  const [first, second] = owner.voices;
  const finishFirst = first.source.onended;
  sampler.releaseAll(1.05);
  runtime.immediate = 4;
  assert.equal(owner.voices.size, 2);
  first.source.end();
  assert.deepEqual([...owner.voices], [second]);
  finishFirst();
  assert.deepEqual([...owner.voices], [second]);
  second.source.end();
  assert.equal(owner.voices.size, 0);
  assert.equal(first.source.disposals, 1);
  assert.equal(second.source.disposals, 1);
});

test('bar cancellation fades current-bar started notes and disposes future notes using immediate, not lookahead', () => {
  const { sampler, owner, runtime } = setup();
  runtime.immediate = 10;
  runtime.lookAhead = 0.1;
  for (const time of [8, 9.8, 10, 10.05, 11]) sampler.triggerAttackRelease('C4', 5, time);
  const [previousBar, currentBar, audibleNow, inLookahead, future] = owner.voices;
  owner.cancelFrom(9.8);
  assert.equal(previousBar.stopTime, 13);
  for (const entry of [currentBar, audibleNow]) {
    assert.equal(owner.voices.has(entry), true);
    assert.deepEqual(entry.source.stops.at(-1), { time: 10, fadeOut: 0.035 });
    assert.equal(entry.source.disposals, 0);
    assert.equal(entry.source.disconnections, 0);
  }
  for (const entry of [inLookahead, future]) {
    assert.equal(owner.voices.has(entry), false);
    assert.equal(entry.source.disposals, 1);
    assert.equal(entry.source.disconnections, 1);
  }
  owner.cancelFrom(9.8);
  assert.equal(currentBar.source.stops.length, 3);
  assert.equal(inLookahead.source.disposals, 1);
  currentBar.source.end();
  audibleNow.source.end();
  assert.deepEqual([...owner.voices], [previousBar]);
});

test('repeated cancellation cannot move a fading stop later or extend a shorter existing release', () => {
  const { sampler, owner, runtime } = setup(undefined, 0.005);
  sampler.triggerAttackRelease('C4', 0.01, 1);
  const [entry] = owner.voices;
  owner.cancelFrom(1);
  near(entry.source.fadeOut, 0.015);
  near(entry.stopTime + entry.source.fadeOut, 1.015);
  runtime.immediate = 1.02;
  owner.cancelFrom(1);
  assert.equal(entry.source.stops.length, 3);
  sampler.releaseAll(1.1);
  assert.equal(entry.stopTime, 1);
  assert.equal(entry.source.stops.length, 4);
  assert.deepEqual(entry.source.stops.at(-1), { time: 1, fadeOut: 0.005 });
  assert.equal(owner.voices.has(entry), true);
  entry.source.end();
  assert.equal(owner.voices.size, 0);
});

test('owner disposal closes every owned handle and original sampler exactly once without disposing caller buffers', () => {
  let bufferDisposals = 0;
  const { sampler, owner, runtime } = setup({ C4: { duration: 3, dispose() { bufferDisposals++; } } });
  sampler.triggerAttackRelease('C4', 4, 1);
  sampler.triggerAttackRelease('C4', 4, 5);
  const [current, future] = owner.voices;
  const finishCurrent = current.source.onended;
  assert.equal(owner.dispose(), sampler);
  assert.equal(owner.voices.size, 0);
  assert.equal(runtime.disposals, 1);
  assert.equal(bufferDisposals, 0);
  for (const entry of [current, future]) {
    assert.equal(entry.source.disposals, 1);
    assert.equal(entry.source.disconnections, 1);
  }
  sampler.dispose();
  owner.dispose();
  owner.cancelFrom(0);
  sampler.releaseAll();
  sampler.triggerAttackRelease('C4', 4, 10);
  finishCurrent();
  assert.equal(runtime.sources.length, 2);
  assert.equal(runtime.disposals, 1);
  assert.equal(current.source.disposals, 1);
  assert.equal(future.source.disposals, 1);
});

test('sampler disposal directly also disposes owned voices and does not affect another attempt', () => {
  const previous = setup();
  const retry = setup();
  previous.sampler.triggerAttackRelease('C4', 0.5, 1);
  retry.sampler.triggerAttackRelease('C4', 0.5, 1);
  const [old] = previous.owner.voices;
  const ended = old.source.onended;
  assert.equal(previous.sampler.dispose(), previous.sampler);
  ended();
  assert.equal(previous.owner.voices.size, 0);
  assert.equal(retry.owner.voices.size, 1);
  assert.equal(retry.runtime.sources[0].disposals, 0);
  assert.equal(retry.runtime.disposals, 0);
});

test('failed source start disposes and disconnects the allocated handle without leaving an owned entry', () => {
  const { Tone, sampler, owner, runtime } = setup();
  const start = Tone.ToneBufferSource.prototype.start;
  Tone.ToneBufferSource.prototype.start = () => { throw new Error('Could not start'); };
  assert.throws(() => sampler.triggerAttackRelease('C4', 0.5, 1), /Could not start/);
  assert.equal(owner.voices.size, 0);
  assert.equal(runtime.sources[0].disconnections, 1);
  assert.equal(runtime.sources[0].disposals, 1);
  Tone.ToneBufferSource.prototype.start = start;
  sampler.triggerAttackRelease('C4', 0.5, 1);
  assert.equal(owner.voices.size, 1);
});