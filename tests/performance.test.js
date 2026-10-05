import test from 'node:test';
import assert from 'node:assert/strict';
import { PIANO_NOTES, GUITAR_CHORDS, trumpetNote, slidePosition } from '../src/utils/performance.js';
test('manual instruments have extended piano, open strings and acoustic trumpet valve intervals', () => {
  assert.equal(PIANO_NOTES.length, 34);
  assert.equal(PIANO_NOTES.at(-1), 'A5');
  assert.deepEqual(GUITAR_CHORDS.Open, ['E2','A2','D3','G3','B3','E4']);
  assert.equal(trumpetNote([false,false,false], 0), 'C4');
  assert.equal(trumpetNote([true,false,false], 0), 'A#3');
  assert.equal(trumpetNote([false,true,false], 0), 'B3');
  assert.equal(trumpetNote([true,true,true], 1), 'C#4');
});
test('overlapping instruments slide apart inside screen bounds', () => {
  const result = slidePosition({x:200,y:200}, {width:100,height:80}, [{x:200,y:200,width:100,height:80}], {left:0,top:0,right:600,bottom:500});
  assert.ok(Math.abs(result.x-200)>=110 || Math.abs(result.y-200)>=90);
});