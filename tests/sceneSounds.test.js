import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ffmpeg from 'ffmpeg-static';
import { createSceneSample, SCENE_SOUNDS, FIELD_RECORDINGS, WATER_DROP_TIMES, WATER_DURATION } from '../src/audio/sceneSounds.js';

const recordedSounds = ['rooster', 'water', ...Object.keys(FIELD_RECORDINGS)];

test('cow and cricket WAVs reproduce the CC0 recordings, not synthetic replacements', () => {
  const rate = 48000;
  for (const [type, recording] of Object.entries(FIELD_RECORDINGS)) {
    assert.equal(recording.license, 'CC0-1.0');
    const source = fileURLToPath(new URL(`../public/audio/scenery/source/${recording.file}`, import.meta.url));
    const decoded = spawnSync(ffmpeg, ['-v', 'error', '-i', source, '-f', 'f32le', '-ac', '1', '-ar', String(rate), 'pipe:1'], { maxBuffer: 4 * 1024 * 1024 });
    assert.equal(decoded.status, 0, decoded.stderr?.toString());
    const wave = readFileSync(new URL(`../public/audio/scenery/${type}.wav`, import.meta.url));
    const length = Math.round(recording.duration * rate);
    assert.equal(wave.toString('ascii', 0, 4), 'RIFF');
    assert.equal(wave.readUInt32LE(24), rate);
    assert.equal(wave.readUInt16LE(22), 1);
    assert.equal(wave.readUInt16LE(34), 16);
    assert.equal(wave.length, 44 + length * 2);
    let energy = 0;
    for (let index = 0; index < length; index++) {
      const fade = Math.min(1, index / (rate * recording.fadeIn), (length - index - 1) / (rate * recording.fadeOut));
      const faded = Math.fround(decoded.stdout.readFloatLE(index * 4) * fade);
      const expected = Math.round(Math.max(-1, Math.min(1, faded)) * 32767) || 0;
      const actual = wave.readInt16LE(44 + index * 2);
      assert.equal(actual, expected, `${type} sample ${index}`);
      energy += (actual / 32768) ** 2;
    }
    assert.ok(Math.sqrt(energy / length) > 0.005, `${type} is audible`);
    assert.equal(wave.readInt16LE(44), 0);
    assert.equal(wave.readInt16LE(wave.length - 2), 0);
  }
});

test('late night adds two distinct foley IDs at both supported sample rates', () => {
  assert.equal(new Set(SCENE_SOUNDS).size, SCENE_SOUNDS.length);
  for (const rate of [44100, 48000]) {
    const bat = createSceneSample('bat', rate);
    const hedgehog = createSceneSample('hedgehog', rate);
    assert.equal(bat.length, Math.ceil(rate * 1.8));
    assert.equal(hedgehog.length, rate * 2);
    assert.deepEqual(bat, createSceneSample('bat', rate));
    assert.deepEqual(hedgehog, createSceneSample('hedgehog', rate));
    assert.notDeepEqual(bat.slice(500, 510), hedgehog.slice(500, 510));
  }
});

test('each landscape object has a distinct, audible, bounded, click-free sample', () => {
  const signatures = new Set();
  for (const type of SCENE_SOUNDS) {
    if (recordedSounds.includes(type)) continue;
    const sample = createSceneSample(type);
    assert.ok(sample.length >= 44100, type);
    assert.equal(Math.abs(sample[0]), 0, type);
    assert.ok(Math.abs(sample.at(-1)) < 0.001, type);
    let energy = 0;
    for (const value of sample) {
      assert.ok(Number.isFinite(value) && Math.abs(value) <= 0.9, type);
      energy += value * value;
    }
    assert.ok(Math.sqrt(energy / sample.length) > 0.025, `${type} must be audible`);
    signatures.add(sample.slice(500, 510).join(','));
  }
  assert.equal(signatures.size, SCENE_SOUNDS.length - recordedSounds.length);
});

test('samples are deterministic and work at the device sample rate', () => {
  assert.deepEqual(createSceneSample('frog', 48000), createSceneSample('frog', 48000));
  assert.throws(() => createSceneSample('water'), /Unknown landscape sound/);
  assert.throws(() => createSceneSample('unknown'), /Unknown landscape sound/);
  for (const type of Object.keys(FIELD_RECORDINGS)) assert.throws(() => createSceneSample(type), /Unknown landscape sound/);
});

test('faucet has three gentle impacts and silence between drops', () => {
  const rate = 48000;
  const bytes = readFileSync(new URL('../public/audio/scenery/water.wav', import.meta.url));
  const sample = Float32Array.from({ length: (bytes.length - 44) / 2 }, (_, index) => bytes.readInt16LE(44 + index * 2) / 32768);
  assert.equal(sample.length, WATER_DURATION * rate);
  for (let index = 0; index < sample.length; index++) {
    const time = index / rate;
    if (!WATER_DROP_TIMES.some(impact => time >= impact && time <= impact + 0.35)) assert.equal(Math.abs(sample[index]), 0);
    assert.ok(Math.abs(sample[index]) <= 0.5);
  }
  for (const impact of WATER_DROP_TIMES) {
    const burst = sample.slice(Math.round(impact * rate), Math.round((impact + 0.1) * rate));
    assert.ok(Math.sqrt(burst.reduce((sum, value) => sum + value * value, 0) / burst.length) > 0.005);
  }
});