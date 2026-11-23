import test from 'node:test';
import assert from 'node:assert/strict';
import {AVAILABLE_INSTRUMENTS} from '../src/utils/music.js';
import {SCENE_ROOTS} from '../src/utils/dayCycle.js';
import {practiceProfile} from '../src/utils/practiceComposition.js';
import {guidedExercise,practiceOpening,rhythmEcho} from '../src/utils/guidedPractice.js';
import {trumpetInput} from '../src/utils/autoplay.js';

test('guided openings account for age and preserve the equipped instrument where one action is possible',()=>{
  for(const age of ['under3','3to4','5to7','8plus']){
    const opening=practiceOpening(age,'guitar');
    assert.equal(opening.count,age==='8plus'?3:1);
    assert.equal(opening.showTools,age==='8plus');
    assert.equal(opening.shared,age==='under3');
    assert.equal(opening.instrument,'guitar');
  }
  assert.equal(practiceOpening('under3','melody').instrument,'drums');
  assert.equal(practiceOpening('3to4','melody').instrument,'melody');
});

test('guided actions match canonical controls in each scene key and saved difficulty',()=>{
  for(const name of Object.keys(AVAILABLE_INSTRUMENTS)){
    for(const root of new Set(Object.values(SCENE_ROOTS))){
      for(const complexity of [.35,1,1.5]){
        const profile=practiceProfile(name,root,{complexity});
        const phrase=guidedExercise(name,profile,3);
        const first=guidedExercise(name,profile);
        assert.deepEqual(first.events[0],phrase.events[0]);
        assert.equal(phrase.events.length,3);
        assert.equal(phrase.events.some(event=>event.notes),false);
        assert.notEqual(phrase.events[0].note,phrase.events[1].note);
        for(const event of phrase.events){
          if(event.fingering){
            const [{string,fret,note}]=event.fingering;
            const chord=profile.chords.find(value=>value.name===event.chord);
            assert.equal(event.note,note);
            assert.equal(chord.notes[string],note);
            assert.equal(chord.frets[string],fret);
          }else if(name==='melody'){
            const input=trumpetInput(event.note);
            assert.ok(input.partial<profile.registers);
            assert.ok(input.valves.every(value=>!value));
          }else{
            const bank=name==='drums'?profile.hits:name==='panflute'?profile.notes:profile.keyboardNotes;
            assert.ok(bank.includes(event.note));
          }
        }
        assert.deepEqual(rhythmEcho(phrase).events.map(event=>event.time),phrase.events.map(event=>event.time));
        assert.deepEqual(rhythmEcho(phrase,true).events.map(event=>event.time),['0:0:0','0:1:0','0:2:0']);
      }
    }
  }
});
