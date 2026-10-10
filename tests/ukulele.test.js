import test from 'node:test';
import assert from 'node:assert/strict';
import {UKULELE_LIBRARY,UKULELE_STRINGS,UKULELE_FRETS,fretPosition,guitarChord,guitarEvent} from '../src/utils/guitar.js';
import {guitarInput,guitarInputs,noteMidi} from '../src/utils/autoplay.js';
import {patterns,transposeEvents} from '../src/utils/music.js';

test('ukulele has fourteen all-string diatonic shapes in every supported major and minor key',()=>{
  assert.equal(Object.keys(UKULELE_LIBRARY).length,16);
  assert.deepEqual(UKULELE_STRINGS,['G4','C4','E4','A4']);
  for(const [root,library] of Object.entries(UKULELE_LIBRARY)) {
    assert.equal(library.chords.length,14);
    for(const chord of library.chords) {
      assert.equal(chord.notes.length,4);
      assert.equal(chord.frets.length,4);
      assert.ok(chord.frets.every(fret=>Number.isInteger(fret)&&fret>=0&&fret<=UKULELE_FRETS));
      assert.ok(Math.max(...chord.frets)-Math.min(...chord.frets)<=4);
      const pitches=chord.notes.map(note=>noteMidi(note)%12);
      assert.ok(chord.tones.every(tone=>pitches.includes(tone)));
      assert.ok(pitches.every(pitch=>chord.tones.includes(pitch)));
      chord.frets.forEach((fret,string)=>assert.equal(noteMidi(chord.notes[string]),noteMidi(UKULELE_STRINGS[string])+fret));
      assert.equal(guitarChord(root,chord.name,'ukulele'),chord);
    }
  }
  assert.equal(fretPosition(UKULELE_FRETS,UKULELE_FRETS),1);
});

test('ukulele events retain every transposed note occurrence on a distinct playable string',()=>{
  for(const [root,library] of Object.entries(UKULELE_LIBRARY)) {
    library.phrases.forEach((phrase,phraseIndex)=>phrase.events.forEach((event,eventIndex)=>{
      const source=transposeEvents(patterns.ukulele[phraseIndex].events,root,{preserveUnisons:true})[eventIndex];
      const notes=event.notes??[event.note];
      assert.deepEqual(notes,source.notes??[source.note]);
      const chord=library.chords.find(value=>value.name===event.chord);
      assert.ok(notes.every(note=>chord.tones.includes(noteMidi(note)%12)));
      assert.equal(event.fingering.length,notes.length);
      assert.equal(new Set(event.fingering.map(input=>input.string)).size,notes.length);
      event.fingering.forEach((input,index)=>{
        assert.equal(input.note,notes[index]);
        assert.ok(input.fret>=0&&input.fret<=UKULELE_FRETS);
        assert.equal(noteMidi(input.note),noteMidi(UKULELE_STRINGS[input.string])+input.fret);
      });
      assert.deepEqual(guitarEvent(root,event,'ukulele')?.fingering,event.fingering);
    }));
  }
});

test('input mapping supports reentrant unisons and rejects impossible assignments',()=>{
  for(const notes of [['G4','D4','G4','B4'],['A4','C4','E4','A4']]) {
    const inputs=guitarInputs(notes,UKULELE_STRINGS);
    assert.equal(inputs.length,4);
    assert.equal(new Set(inputs.map(input=>input.string)).size,4);
    inputs.forEach((input,index)=>assert.equal(noteMidi(UKULELE_STRINGS[input.string])+input.fret,noteMidi(notes[index])));
  }
  assert.deepEqual(guitarInputs(['C4','C4'],UKULELE_STRINGS),[]);
  assert.equal(guitarInput('C4',UKULELE_STRINGS).string,1);
  assert.equal(guitarInput('E6',UKULELE_STRINGS),undefined);
});