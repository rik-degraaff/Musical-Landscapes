import test from 'node:test';
import assert from 'node:assert/strict';
import {FLUTE_FINGERINGS,fluteNote,fluteInput,lipPosition} from '../src/utils/wind.js';
import {patterns,transposeEvents} from '../src/utils/music.js';

test('Boehm fingerings distinguish D octaves and support standard B-flat alternatives',()=>{
  assert.equal(fluteNote(['T','L1','L2','L3','R1','R2','R3'],0),'D4');
  assert.equal(fluteNote(['T','L2','L3','R1','R2','R3'],1),'D5');
  assert.equal(fluteNote(['T','L2','L3','Eb'],2),'D6');
  for(const keys of [['T','L1','R1','Eb'],['Bb','L1','Eb'],['T','L1','BbLever','Eb']])assert.equal(fluteNote(keys,0),'A#4');
  assert.equal(fluteNote(['L3'],0),null);
  for(const entry of FLUTE_FINGERINGS)assert.equal(fluteNote(entry.keys,entry.register),entry.note);
});
test('every authored flute note has a physical-key autoplay fingering',()=>{
  for(const root of ['C','F','G','A'])for(const event of transposeEvents(patterns.flute.flatMap(phrase=>phrase.events),root))assert.ok(fluteInput(event.note),event.note);
});
test('lip segments cover six harmonics with continuous within-segment pitch control',()=>{
  assert.deepEqual(lipPosition(.25,6),{partial:1,cents:0});
  assert.equal(lipPosition(-1,6).partial,0);assert.equal(lipPosition(1,6).partial,5);
  assert.ok(lipPosition(.27,6).cents>0);
});