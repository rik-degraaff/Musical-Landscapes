import test from 'node:test';
import assert from 'node:assert/strict';
import {patterns,transposeEvents} from '../src/utils/music.js';
import {PIANO_NOTES,MARIMBA_NOTES,FLUTE_NOTES,guitarChords} from '../src/utils/performance.js';

test('fixed bounded ranges cover every scene-transposed phrase before playback starts',()=>{
  for(const root of ['C','G','F','A'])for(const [name,range] of Object.entries({piano:PIANO_NOTES,marimba:MARIMBA_NOTES,flute:FLUTE_NOTES})) {
    assert.ok(range.length<=36);
    for(const event of transposeEvents(patterns[name].flatMap(phrase=>phrase.events),root))for(const note of event.notes??[event.note])assert.ok(range.includes(note),`${name} ${root} ${note}`);
  }
});

test('guitar labels and notes transpose together but open strings keep standard tuning',()=>{
  const chords=guitarChords('G');
  assert.deepEqual(Object.keys(chords),['Open','G','D','Em','C']);
  assert.deepEqual(chords.G,[null,'G3','B3','D4','G4','B4']);
  assert.deepEqual(chords.Open,guitarChords('C').Open);
});