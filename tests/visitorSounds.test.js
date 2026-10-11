import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createVisitorSample, VISITOR_SOUNDS, VISITOR_FOLEY, VISITOR_RECORDINGS } from '../src/audio/visitorSounds.js';
import { createSceneSample, SCENE_SOUNDS, FIELD_RECORDINGS } from '../src/audio/sceneSounds.js';

test('visitor IDs are exact and unique', () => {
  assert.deepEqual(VISITOR_SOUNDS, ['sheep', 'horse', 'bee', 'woodpecker', 'duck', 'otter', 'cicada', 'balloon', 'fox', 'badger', 'moth', 'shootingStar', 'dove', 'deer']);
  assert.equal(new Set(VISITOR_SOUNDS).size, 14);
});

test('original visitor foley is deterministic, distinct, audible and faded at both device rates', () => {
  for (const rate of [44100, 48000]) {
    const signatures = new Set();
    for (const [type, specification] of Object.entries(VISITOR_FOLEY)) {
      const samples = createVisitorSample(type, rate);
      assert.equal(samples.length, Math.ceil(specification.duration * rate), type);
      assert.ok(samples.length >= rate, type);
      assert.deepEqual(samples, createVisitorSample(type, rate), type);
      assert.equal(Math.abs(samples[0]), 0, type);
      assert.equal(Math.abs(samples.at(-1)), 0, type);
      let energy = 0;
      for (const value of samples) {
        assert.ok(Number.isFinite(value) && Math.abs(value) <= 0.9, type);
        energy += value * value;
      }
      assert.ok(Math.sqrt(energy / samples.length) > 0.025, `${type} RMS`);
      signatures.add(createHash('sha256').update(Buffer.from(samples.buffer)).digest('hex'));
    }
    assert.equal(signatures.size, Object.keys(VISITOR_FOLEY).length);
  }
});

test('foley rejects recording IDs, unknown IDs and invalid sample rates', () => {
  for (const type of ['sheep', 'horse', 'duck', 'fox', 'dove', 'unknown']) assert.throws(() => createVisitorSample(type), /Unknown visitor foley/);
  for (const rate of [0, -1, NaN, Infinity]) assert.throws(() => createVisitorSample('bee', rate), /Invalid visitor sample rate/);
});

test('scene audio registers all visitors and forwards only original foley to the generator', () => {
  assert.deepEqual(SCENE_SOUNDS.slice(-14), VISITOR_SOUNDS);
  assert.deepEqual(Object.keys(VISITOR_RECORDINGS), ['sheep', 'horse', 'duck', 'fox', 'dove']);
  assert.equal(Object.keys(VISITOR_RECORDINGS).length + Object.keys(VISITOR_FOLEY).length, 14);
  for (const type of VISITOR_SOUNDS) {
    if (Object.hasOwn(VISITOR_FOLEY, type)) {
      assert.deepEqual(createSceneSample(type, 48000), createVisitorSample(type, 48000), type);
    } else {
      assert.equal(FIELD_RECORDINGS[type], VISITOR_RECORDINGS[type]);
      assert.equal(VISITOR_RECORDINGS[type].license, 'CC0-1.0');
      assert.equal(VISITOR_RECORDINGS[type].verified, '2026-10-11');
      assert.throws(() => createSceneSample(type), /Unknown landscape sound/);
    }
  }
});

test('all production visitor WAVs are distinct mono PCM with bounded peaks and faded endpoints', () => {
  const signatures = new Set();
  for (const type of VISITOR_SOUNDS) {
    const bytes = readFileSync(new URL(`../public/audio/scenery/${type}.wav`, import.meta.url));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', type);
    assert.equal(bytes.toString('ascii', 8, 16), 'WAVEfmt ', type);
    assert.equal(bytes.readUInt16LE(20), 1, type);
    assert.equal(bytes.readUInt16LE(22), 1, type);
    assert.equal(bytes.readUInt32LE(24), 48000, type);
    assert.equal(bytes.readUInt16LE(34), 16, type);
    const specification = VISITOR_FOLEY[type] ?? VISITOR_RECORDINGS[type];
    const length = Object.hasOwn(VISITOR_FOLEY, type) ? Math.ceil(specification.duration * 48000) : Math.round(specification.duration * 48000);
    assert.equal(bytes.length, 44 + length * 2, type);
    assert.equal(bytes.readInt16LE(44), 0, type);
    assert.equal(bytes.readInt16LE(bytes.length - 2), 0, type);
    let energy = 0;
    for (let index = 44; index < bytes.length; index += 2) {
      const value = bytes.readInt16LE(index) / 32768;
      assert.ok(Math.abs(value) <= 0.9, `${type} peak`);
      energy += value * value;
    }
    assert.ok(Math.sqrt(energy / length) > (Object.hasOwn(VISITOR_FOLEY, type) ? 0.025 : 0.005), `${type} RMS`);
    if (Object.hasOwn(VISITOR_FOLEY, type)) {
      const samples = createVisitorSample(type, 48000);
      const expected = Buffer.alloc(samples.length * 2);
      samples.forEach((value, index) => expected.writeInt16LE(Math.round(value * 32767), index * 2));
      assert.deepEqual(bytes.subarray(44), expected, `${type} matches the original generator`);
    }
    signatures.add(createHash('sha256').update(bytes.subarray(44)).digest('hex'));
  }
  assert.equal(signatures.size, 14);
});

test('foley preserves separated woody rolls, paw splashes, leaf sniffs and hoof steps', () => {
  const rate = 48000;
  const rms = (samples, start, end) => {
    const window = samples.subarray(Math.round(start * rate), Math.round(end * rate));
    return Math.sqrt(window.reduce((energy, value) => energy + value * value, 0) / window.length);
  };
  const woodpecker = createVisitorSample('woodpecker', rate);
  assert.ok(rms(woodpecker, 0.04, 0.14) > 0.08);
  assert.equal(rms(woodpecker, 0.66, 0.82), 0);
  assert.ok(rms(woodpecker, 0.83, 1.02) > 0.08);
  const otter = createVisitorSample('otter', rate);
  assert.ok(rms(otter, 0.42, 0.55) > 3 * rms(otter, 2.15, 2.3));
  const badger = createVisitorSample('badger', rate);
  assert.ok(rms(badger, 0.94, 1.05) > 0.025);
  assert.ok(rms(badger, 1.92, 2.02) > 0.025);
  const deer = createVisitorSample('deer', rate);
  assert.ok(rms(deer, 0.04, 0.13) > 0.08);
  assert.equal(rms(deer, 1.59, 1.75), 0);
  assert.ok(rms(deer, 1.85, 2.05) > 0.025);
});