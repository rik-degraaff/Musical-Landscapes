import test from 'node:test';
import assert from 'node:assert/strict';
import { createSceneSample, SCENE_SOUNDS } from '../src/audio/sceneSounds.js';

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
  assert.equal(createSceneSample('water', 48000).length, 72000);
  assert.throws(() => createSceneSample('unknown'), /Unknown landscape sound/);
});