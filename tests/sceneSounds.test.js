import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSceneSample, SCENE_SOUNDS, WATER_DROP_TIMES, WATER_DURATION } from '../src/audio/sceneSounds.js';

test('each landscape object has a distinct, audible, bounded, click-free sample', () => {
  const signatures = new Set();
  for (const type of SCENE_SOUNDS) {
    if (type === 'rooster' || type === 'water') continue;
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
  assert.equal(signatures.size, SCENE_SOUNDS.length - 2);
});

test('samples are deterministic and work at the device sample rate', () => {
  assert.deepEqual(createSceneSample('frog', 48000), createSceneSample('frog', 48000));
  assert.throws(() => createSceneSample('water'), /Unknown landscape sound/);
  assert.throws(() => createSceneSample('unknown'), /Unknown landscape sound/);
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