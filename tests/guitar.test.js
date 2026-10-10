import test from 'node:test';
import assert from 'node:assert/strict';
import {GUITAR_LIBRARY,OPEN_STRINGS,fretPosition,voiceStringEvent} from '../src/utils/guitar.js';
import {noteMidi} from '../src/utils/autoplay.js';
import {patterns,transposeEvents} from '../src/utils/music.js';

test('each key has all seven diatonic triads and seventh chords with playable fingerings',()=>{
  for(const library of Object.values(GUITAR_LIBRARY)) {
    assert.equal(library.chords.length,14);
    for(const chord of library.chords) {
      assert.equal(chord.notes.length,6);
      assert.ok(chord.frets.every(fret=>Number.isInteger(fret)&&fret>=0&&fret<=24));
      assert.ok(Math.max(...chord.frets)-Math.min(...chord.frets)<=4);
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
    event.fingering.forEach((input,index)=>{
      assert.equal(input.note,notes[index]);
      assert.equal(input.note,chord.notes[input.string]);
      assert.equal(input.fret,chord.frets[input.string]);
      assert.equal(noteMidi(input.note),noteMidi(OPEN_STRINGS[input.string])+input.fret);
    });
  }
  assert.equal(fretPosition(0),0);assert.equal(fretPosition(24),1);
});

test('guitar revoicing preserves source pitch classes, occurrences and event timing in every root',()=>{
  for(const [root,library] of Object.entries(GUITAR_LIBRARY))library.phrases.forEach((phrase,phraseIndex)=>{
    const source=transposeEvents(patterns.guitar[phraseIndex].events,root,{preserveUnisons:true});
    phrase.events.forEach((event,index)=>{
      assert.deepEqual((event.notes??[event.note]).map(note=>noteMidi(note)%12),(source[index].notes??[source[index].note]).map(note=>noteMidi(note)%12));
      for(const property of ['time','dur','velocity'])assert.equal(event[property],source[index][property]);
    });
  });
});

test('exact chord voicing rejects missing pitch occurrences and never trusts stale cue frets',()=>{
  const chord={name:'C',notes:['C4','E4','G4','C5'],frets:[5,4,3,3]};
  const cue={notes:['C3','E3','G3','C4'],chord:'Other',fingering:[{string:0,fret:99,note:'C3'}]};
  const voiced=voiceStringEvent(cue,chord);
  assert.deepEqual(voiced.notes,chord.notes);
  assert.deepEqual(voiced.fingering.map(input=>input.fret),chord.frets);
  assert.equal(voiced.chord,'C');
  assert.equal(cue.fingering[0].fret,99);
  assert.equal(voiceStringEvent({notes:['C4','C4','C4']},chord),null);
  assert.equal(voiceStringEvent({note:'D4'},chord),null);
});