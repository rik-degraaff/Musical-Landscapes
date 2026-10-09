import test from 'node:test';
import assert from 'node:assert/strict';
import {patterns,transposeEvents,DEFAULT_INSTRUMENTS,INSTRUMENTS} from '../src/utils/music.js';
import {PIANO_NOTES,PANFLUTE_NOTES} from '../src/utils/performance.js';

test('new default six retain the legacy instruments in the catalog',()=>{
  assert.equal(DEFAULT_INSTRUMENTS.length,6);assert.equal(new Set(DEFAULT_INSTRUMENTS).size,6);
  assert.ok(DEFAULT_INSTRUMENTS.includes('ukulele'));assert.ok(DEFAULT_INSTRUMENTS.includes('panflute'));
  assert.ok(INSTRUMENTS.guitar&&INSTRUMENTS.flute);
});
test('all piano keys and scene-transposed phrases fit a 19-note keyboard',()=>{
  assert.equal(PIANO_NOTES.length,19);
  for(const root of ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'])for(const phrase of patterns.piano)for(const event of transposeEvents(phrase.events,root))for(const note of event.notes)assert.ok(PIANO_NOTES.includes(note),`${root} ${note}`);
});
test('new instruments have varied authored phrases with playable pan pipes',()=>{
  for(const name of ['ukulele','panflute'])assert.ok(patterns[name].length>=5);
  for(const root of ['C','F','G','A'])for(const phrase of patterns.panflute)for(const event of transposeEvents(phrase.events,root))assert.ok(PANFLUTE_NOTES.includes(event.note));
});