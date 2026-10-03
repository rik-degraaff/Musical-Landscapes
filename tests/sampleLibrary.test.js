import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SAMPLE_LIBRARY, DRUM_SAMPLES, DRUM_NOTES, sampleUrls } from '../src/audio/sampleLibrary.js';
import { INSTRUMENTS, DRUM_HITS, patterns, transposeEvents } from '../src/utils/music.js';

const midi = note => {
  const [, pitch, octave] = /^([A-G]#?)(\d+)$/.exec(note);
  return ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].indexOf(pitch) + (Number(octave) + 1) * 12;
};

test('every instrument has local recordings with valid audio signatures', () => {
  assert.deepEqual(Object.keys(SAMPLE_LIBRARY).sort(), Object.keys(INSTRUMENTS).filter(name => name !== 'drums').sort());
  for (const name of Object.keys(SAMPLE_LIBRARY)) {
    for (const file of Object.values(sampleUrls(name))) {
      const bytes = readFileSync(new URL(`../public/audio/instruments/${file}`, import.meta.url));
      assert.ok(bytes.length > 1000, file);
      assert.ok(bytes.subarray(0, 3).toString() === 'ID3' || (bytes[0] === 255 && (bytes[1] & 224) === 224), file);
    }
  }
  for (const { file } of Object.values(DRUM_SAMPLES)) {
    const bytes = readFileSync(new URL(`../public/audio/instruments/drums/${file}`, import.meta.url));
    assert.ok(bytes.length > 1000, file);
    if (file.endsWith('.flac')) assert.equal(bytes.subarray(0, 4).toString(), 'fLaC');
  }
  assert.deepEqual(Object.keys(DRUM_NOTES).sort(), [...DRUM_HITS].sort());
});

test('phrases in all landscape keys stay within two semitones of a recorded note', () => {
  for (const [name, instrument] of Object.entries(SAMPLE_LIBRARY)) {
    const recorded = instrument.notes.map(midi);
    for (const root of ['C', 'G', 'F', 'A']) {
      for (const phrase of patterns[name]) {
        for (const event of transposeEvents(phrase.events, root)) {
          for (const note of event.notes ?? [event.note]) {
            assert.ok(Math.min(...recorded.map(value => Math.abs(value - midi(note)))) <= 2, `${name} ${root} ${note}`);
          }
        }
      }
    }
  }
});

test('guitar replaces bass with both plucked notes and playable chord voicings', () => {
  assert.equal(INSTRUMENTS.bass, undefined);
  assert.equal(INSTRUMENTS.guitar.label, 'Acoustic guitar');
  assert.ok(patterns.guitar.some(phrase => phrase.events.some(event => event.notes?.length >= 3)));
  assert.ok(patterns.guitar.some(phrase => phrase.events.some(event => event.note)));
  for (const phrase of patterns.guitar) {
    for (const event of phrase.events) {
      for (const note of event.notes ?? [event.note]) assert.ok(midi(note) >= 48 && midi(note) <= 67);
    }
  }
});