import test from 'node:test';
import assert from 'node:assert/strict';
import { createSceneSample, SCENE_SOUNDS, WATER_DROP_TIMES, WATER_DURATION } from '../src/audio/sceneSounds.js';

test('each landscape object has a distinct, audible, bounded, click-free sample', () => {
  const signatures = new Set();
  for (const type of SCENE_SOUNDS) {
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
  assert.equal(signatures.size, SCENE_SOUNDS.length);
});

test('samples are deterministic and work at the device sample rate', () => {
  assert.deepEqual(createSceneSample('frog', 48000), createSceneSample('frog', 48000));
  assert.equal(createSceneSample('water', 48000).length, WATER_DURATION * 48000);
  assert.throws(() => createSceneSample('unknown'), /Unknown landscape sound/);
});

test('faucet has three gentle impacts and silence between drops', () => {
  const rate = 48000;
  const sample = createSceneSample('water', rate);
  for (let index = 0; index < sample.length; index++) {
    const time = index / rate;
    if (!WATER_DROP_TIMES.some(impact => time >= impact && time <= impact + 0.18)) assert.equal(Math.abs(sample[index]), 0);
    assert.ok(Math.abs(sample[index]) <= 0.32);
  }
  for (const impact of WATER_DROP_TIMES) {
    const burst = sample.slice(Math.round(impact * rate), Math.round((impact + 0.1) * rate));
    assert.ok(Math.sqrt(burst.reduce((sum, value) => sum + value * value, 0) / burst.length) > 0.04);
  }
});