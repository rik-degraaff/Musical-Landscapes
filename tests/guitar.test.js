import test from 'node:test';
import assert from 'node:assert/strict';
import {GUITAR_LIBRARY,OPEN_STRINGS,fretPosition} from '../src/utils/guitar.js';
import {noteMidi} from '../src/utils/autoplay.js';

test('each key has all seven diatonic triads and seventh chords with playable fingerings',()=>{
  for(const library of Object.values(GUITAR_LIBRARY)) {
    assert.equal(library.chords.length,14);
    for(const chord of library.chords) {
      const pitches=chord.notes.filter(Boolean).map(note=>noteMidi(note)%12);
      assert.ok(chord.tones.every(tone=>pitches.includes(tone)));
      chord.frets.forEach((fret,string)=>{if(fret!==null)assert.equal(noteMidi(chord.notes[string]),noteMidi(OPEN_STRINGS[string])+fret);});
    }
    library.chords.slice(1).forEach((chord,index)=>assert.ok(chord.distanceFromSoundhole>=library.chords[index].distanceFromSoundhole));
  }
});
test('every note event has a precalculated compatible chord and exact playable note positions',()=>{
  for(const library of Object.values(GUITAR_LIBRARY))for(const phrase of library.phrases)for(const event of phrase.events) {
    const chord=library.chords.find(value=>value.name===event.chord);
    const notes=event.notes??[event.note];
    assert.ok(notes.every(note=>chord.tones.includes(noteMidi(note)%12)));
    assert.equal(event.fingering.length,notes.length);
    assert.equal(new Set(event.fingering.map(value=>value.string)).size,notes.length);
  }
  assert.equal(fretPosition(0),0);assert.equal(fretPosition(24),1);
});