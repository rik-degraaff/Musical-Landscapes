import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { SAMPLE_LIBRARY, DRUM_SAMPLES, sampleUrls } from '../src/audio/sampleLibrary.js';
import { SCENE_SOUNDS } from '../src/audio/sceneSounds.js';

const report = JSON.parse(readFileSync(new URL('../src/audio/audioLevels.json', import.meta.url)));

test('every playback asset has current precomputed loudness and safe gain headroom', () => {
  const files = [
    ...Object.keys(SAMPLE_LIBRARY).flatMap(name => Object.values(sampleUrls(name)).map(file => `instruments/${file}`)),
    ...Object.values(DRUM_SAMPLES).map(sample => `instruments/drums/${sample.file}`),
    ...SCENE_SOUNDS.map(type => `scenery/${type}.wav`),
  ];
  assert.deepEqual(Object.keys(report).sort(), files.sort());
  for (const file of files) {
    const measurement = report[file];
    assert.equal(measurement.sha256, createHash('sha256').update(readFileSync(new URL(`../public/audio/${file}`, import.meta.url))).digest('hex'), `Reanalyze changed asset: ${file}`);
    for (const key of ['peakDb', 'rmsDb', 'activeRmsDb', 'gainDb']) assert.ok(Number.isFinite(measurement[key]), `${file} ${key}`);
    assert.ok(measurement.correctedPeakDb <= -4.99, file);
    assert.ok(measurement.gainDb >= -24 && measurement.gainDb <= 18, file);
    assert.ok(measurement.duration > 0.05, file);
  }
});

test('loud scenery is attenuated and quiet instruments gain level without flattening peaks', () => {
  assert.ok(report['scenery/rooster.wav'].gainDb < -10);
  assert.ok(report['scenery/owl.wav'].gainDb < -5);
  assert.ok(report['instruments/piano/C4.mp3'].gainDb > 10);
  assert.equal(report['scenery/water.wav'].target, -26);
  for (const type of SCENE_SOUNDS.filter(name => name !== 'water')) {
    const measurement = report[`scenery/${type}.wav`];
    assert.ok(Math.abs(measurement.correctedLufs - measurement.target) < 1 || Math.abs(measurement.correctedPeakDb + 5) < 0.02 || measurement.gainDb === 18, type);
  }
});