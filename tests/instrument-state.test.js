import test from 'node:test';
import assert from 'node:assert/strict';
import {patterns,transposeEvents} from '../src/utils/music.js';
import {PIANO_NOTES,MARIMBA_NOTES,PANFLUTE_NOTES,guitarChords} from '../src/utils/performance.js';
import {noteMidi} from '../src/utils/autoplay.js';
import {STRING_INSTRUMENTS} from '../src/utils/guitar.js';
import {fluteInput} from '../src/utils/wind.js';

const ROOTS=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

test('fixed bounded ranges cover every instrument phrase in all twelve transposed keys',()=>{
  for(const root of ROOTS)for(const [name,range] of Object.entries({piano:PIANO_NOTES,marimba:MARIMBA_NOTES,panflute:PANFLUTE_NOTES})) {
    assert.ok(range.length<=36);
    for(const event of transposeEvents(patterns[name].flatMap(phrase=>phrase.events),root))for(const value of event.notes??[event.note])assert.ok(range.includes(value),`${name} ${root} ${value}`);
  }
  for(const root of ROOTS)for(const event of transposeEvents(patterns.flute.flatMap(phrase=>phrase.events),root))assert.ok(fluteInput(event.note),`flute ${root} ${event.note}`);
});

test('transposition preserves every pitched event pitch class and leaves percussion unchanged',()=>{
  for(const [name,phrases] of Object.entries(patterns))for(const root of ROOTS){
    const shift=ROOTS.indexOf(root);
    for(const [phraseIndex,phrase] of phrases.entries())for(const [eventIndex,event] of phrase.events.entries()){
      const transformed=transposeEvents([event],root)[0];
      if(event.note&&['kick','snare','hat','shaker','tom','clap','rim','crash','ride','floorTom'].includes(event.note)){
        assert.equal(transformed.note,event.note,`${name} ${root} percussion`);continue;
      }
      const source=event.notes??(event.note?[event.note]:[]);
      const actual=transformed.notes??(transformed.note?[transformed.note]:[]);
      const expectedClasses=new Set(source.map(value=>(noteMidi(value)+shift)%12));
      assert.deepEqual(new Set(actual.map(noteMidi).map(value=>value%12)),expectedClasses,`${name} ${root} phrase ${phraseIndex} event ${eventIndex}`);
    }
  }
});

test('every guitar and ukulele phrase fingering matches its fixed-tuning string and fret',()=>{
  for(const [name,instrument] of Object.entries(STRING_INSTRUMENTS))for(const root of ROOTS){
    const library=instrument.library[root];
    for(const phrase of library.phrases)for(const event of phrase.events){
      const notes=event.notes??[event.note];
      assert.equal(event.fingering.length,notes.length);
      event.fingering.forEach((input,index)=>{
        assert.equal(input.note,notes[index]);
        assert.ok(input.fret>=0&&input.fret<=instrument.frets,`${name} ${root} fret ${input.fret}`);
        assert.equal(noteMidi(input.note),noteMidi(instrument.tuning[input.string])+input.fret);
      });
    }
  }
});

test('guitar labels and notes transpose together but open strings keep standard tuning',()=>{
  const chords=guitarChords('G');
  assert.deepEqual(Object.keys(chords),['Open','G','D','Em','C']);
  assert.deepEqual(chords.G,[null,'G3','B3','D4','G4','B4']);
  assert.deepEqual(chords.Open,guitarChords('C').Open);
});