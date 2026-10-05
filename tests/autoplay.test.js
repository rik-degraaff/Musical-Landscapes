import test from 'node:test';
import assert from 'node:assert/strict';
import { patterns, transposeEvents } from '../src/utils/music.js';
import { guitarInputs, keyboardRange, noteMidi, trumpetInput } from '../src/utils/autoplay.js';
import { trumpetNote } from '../src/utils/performance.js';

test('all normal trumpet phrases have reproducible fingerings in every scene key',()=>{
  for(const root of ['C','G','F','A']) {
    for(const event of transposeEvents(patterns.melody.flatMap(phrase=>phrase.events),root)) {
      const input=trumpetInput(event.note);
      assert.ok(input,event.note);
      assert.equal(trumpetNote(input.valves,input.partial),event.note);
    }
  }
});

test('every normal guitar chord maps to distinct playable strings and frets',()=>{
  const open=['E2','A2','D3','G3','B3','E4'];
  for(const root of ['C','G','F','A']) {
    for(const event of transposeEvents(patterns.guitar.flatMap(phrase=>phrase.events),root)) {
      const notes=event.notes??[event.note];
      const inputs=guitarInputs(notes);
      assert.equal(inputs.length,notes.length);
      assert.equal(new Set(inputs.map(input=>input.string)).size,notes.length);
      inputs.forEach(input=>assert.equal(noteMidi(open[input.string])+input.fret,noteMidi(input.note)));
    }
  }
});

test('keyboard expansion keeps chromatic keys contiguous and preserves existing notes',()=>{
  const result=keyboardRange(['C4','C#4','D4'],['G3','E5']);
  assert.equal(result[0],'G3');assert.equal(result.at(-1),'E5');
  result.slice(1).forEach((note,index)=>assert.equal(noteMidi(note)-noteMidi(result[index]),1));
});