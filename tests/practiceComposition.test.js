import test from 'node:test';
import assert from 'node:assert/strict';
import {practiceProfile} from '../src/utils/practiceComposition.js';
import {equippedProfile} from '../src/utils/difficulty.js';
import {compositionProfile} from '../src/utils/composition.js';
import {INSTRUMENTS} from '../src/utils/music.js';
import {SCENE_ROOTS} from '../src/utils/dayCycle.js';
import {STRING_INSTRUMENTS} from '../src/utils/guitar.js';
import {noteMidi,trumpetInput} from '../src/utils/autoplay.js';
import {fluteInput} from '../src/utils/wind.js';
import {PIANO_NOTES,MARIMBA_NOTES,PANFLUTE_NOTES} from '../src/utils/performance.js';
import {learningSteps,createTimingAttempt,scoreTimedInput,attemptSummary,beatOffset} from '../src/utils/practice.js';

const roots=[...new Set(['C',...Object.values(SCENE_ROOTS)])];
const names=Object.keys(INSTRUMENTS);
const chordInstruments=['piano','guitar','ukulele'];
const fixedBanks={piano:PIANO_NOTES,marimba:MARIMBA_NOTES,panflute:PANFLUTE_NOTES};

for(const root of roots)for(const complexity of [.35,1,1.5])test(`practice motifs preserve legacy indices and are learnable: ${root} ${complexity}`,()=>{
  for(const name of names){
    const options={complexity};
    const legacy=equippedProfile(name,root,options);
    const profile=practiceProfile(name,root,options);
    const appended=profile.phrases.slice(legacy.phrases.length);
    const expected=[...compositionProfile(name,root,options),...(chordInstruments.includes(name)?compositionProfile(name,root,{...options,role:'melody'}):[])];
    assert.deepEqual(profile.phrases.slice(0,legacy.phrases.length),legacy.phrases);
    legacy.phrases.forEach((phrase,index)=>assert.equal(profile.phrases[index],phrase));
    assert.deepEqual(appended,expected);
    assert.ok(appended.length>0);
    for(const field of ['level','chords','hits','registers','fluteRegisters'])assert.equal(profile[field],legacy[field]);
    assert.deepEqual(profile.keyboardNotes,complexity>1&&['piano','marimba'].includes(name)?fixedBanks[name]:legacy.keyboardNotes);
    const roles=name==='drums'?['rhythm']:chordInstruments.includes(name)?['accompaniment','melody']:['melody'];
    assert.deepEqual([...new Set(appended.map(phrase=>phrase.role))].sort(),roles.sort());
    for(const role of roles){
      const expectedNames=[...new Set(expected.filter(phrase=>phrase.role===role).map(phrase=>phrase.name))].sort();
      const actualNames=[...new Set(appended.filter(phrase=>phrase.role===role).map(phrase=>phrase.name))].sort();
      assert.deepEqual(actualNames,expectedNames);
    }
    for(const phrase of appended){
      assert.ok(phrase.tier<=(complexity<=.5?0:complexity<=1?1:2));
      assert.ok((complexity<=.5?[0,3,4]:complexity<=1?[0,1,2,3,4,5]:[0,1,2,3,4,5,6]).includes(phrase.degree));
      assert.ok(phrase.events.length<=(complexity<=.5?4:complexity<=1?8:9));
      const steps=learningSteps(phrase);
      assert.equal(steps.length,phrase.events.length);
      const attempt=createTimingAttempt(phrase);
      for(const [index,event] of phrase.events.entries()){
        const notes=event.notes??[event.note];
        assert.deepEqual(steps[index].notes,notes);
        assert.ok(notes.length<=(name==='piano'?(complexity<=.5?2:3):STRING_INSTRUMENTS[name]?4:1));
        assert.ok((complexity<=.5?[0]:complexity<=1?[0,2]:[0,1,2,3]).includes(Number(event.time.split(':')[2])));
        for(const note of notes){
          if(name==='drums')assert.ok(profile.hits.includes(note));
          else{
            assert.match(note,/^[A-G]#?\d$/);
            assert.ok(profile.notes.includes(note),`${name} ${root} ${note} missing from practice note bank`);
            if(fixedBanks[name]){
              assert.ok(fixedBanks[name].includes(note));
              assert.ok(profile.keyboardNotes.includes(note));
            }
            if(name==='melody')assert.ok((trumpetInput(note)?.partial??99)<profile.registers);
            if(name==='flute')assert.ok((fluteInput(note)?.register??99)<profile.fluteRegisters);
          }
          assert.equal(scoreTimedInput(attempt,note,beatOffset(event.time)).correct,true);
        }
        if(STRING_INSTRUMENTS[name]){
          const chord=profile.chords.find(value=>value.name===event.chord);
          assert.ok(chord);
          assert.equal(chord.degree,phrase.degree);
          assert.equal(chord.name,phrase.chord);
          assert.equal(event.fingering.length,notes.length);
          assert.equal(new Set(event.fingering.map(value=>value.string)).size,notes.length);
          event.fingering.forEach((value,noteIndex)=>{
            assert.equal(value.note,notes[noteIndex]);
            assert.equal(value.note,chord.notes[value.string]);
            assert.equal(value.fret,chord.frets[value.string]);
            assert.ok(chord.tones.includes(noteMidi(value.note)%12));
          });
        }
      }
      assert.equal(attemptSummary(attempt).percent,100);
    }
  }
});

test('practice caches each genre separately and includes its tiered motifs after the original exercises',()=>{
  for(const name of names)for(const complexity of [.35,1,1.5]){
    const legacy=equippedProfile(name,'Am',{complexity});
    const profiles=['folk','jazz','rock'].map(genre=>practiceProfile(name,'Am',{complexity,genre}));
    assert.equal(new Set(profiles).size,3);
    for(const [index,genre] of ['folk','jazz','rock'].entries()){
      const profile=profiles[index];
      assert.equal(practiceProfile(name,'Am',{complexity,genre}),profile);
      assert.deepEqual(profile.phrases.slice(0,legacy.phrases.length),legacy.phrases);
      const expected=compositionProfile(name,'Am',{complexity,genre});
      assert.deepEqual(profile.phrases.slice(legacy.phrases.length,legacy.phrases.length+expected.length),expected);
    }
    assert.ok(profiles[2].phrases.some(phrase=>phrase.name?.startsWith('rock')));
    assert.ok(!profiles[0].phrases.some(phrase=>phrase.name?.startsWith('rock')));
  }
});

test('practice defaults match Standard and role, degree and optional melody pools have separate cache identities',()=>{
  const options={complexity:.75,noteLabels:false,playbackNotes:false};
  const before=structuredClone(options);
  const standard=practiceProfile('piano','C',options);
  assert.equal(practiceProfile('piano','C'),standard);
  assert.equal(practiceProfile('piano','C',{complexity:1,noteLabels:true}),standard);
  assert.deepEqual(practiceProfile('piano','C',{degree:null}).phrases,equippedProfile('piano','C').phrases);
  assert.equal(practiceProfile('piano','C'),standard);
  assert.deepEqual(options,before);
  for(const name of chordInstruments){
    const legacy=equippedProfile(name,'C');
    const accompaniment=practiceProfile(name,'C',{includeMelody:false});
    assert.deepEqual(accompaniment.phrases.slice(legacy.phrases.length),compositionProfile(name,'C',{complexity:1}));
    const melody=practiceProfile(name,'C',{role:'melody'});
    assert.deepEqual(melody.phrases.slice(legacy.phrases.length),compositionProfile(name,'C',{complexity:1,role:'melody'}));
    const degree=practiceProfile(name,'C',{degree:4});
    assert.ok(degree.phrases.slice(legacy.phrases.length).every(phrase=>phrase.degree===4));
    assert.notEqual(degree,practiceProfile(name,'C'));
    assert.notEqual(accompaniment,melody);
  }
  assert.throws(()=>practiceProfile('drums','C',{role:'melody'}));
});

test('practice profiles are deeply immutable and do not mutate legacy banks',()=>{
  for(const name of names){
    const legacy=equippedProfile(name,'C',{complexity:1.5});
    const before=structuredClone(legacy);
    const profile=practiceProfile(name,'C',{complexity:1.5});
    const check=value=>{
      if(!value||typeof value!=='object')return;
      assert.ok(Object.isFrozen(value));
      Object.values(value).forEach(check);
    };
    check(profile);
    assert.throws(()=>profile.phrases.push({}),TypeError);
    assert.throws(()=>profile.notes.push('C9'),TypeError);
    assert.throws(()=>{profile.phrases.at(-1).events[0].time='0:3:3';},TypeError);
    assert.deepEqual(legacy,before);
  }
});

test('practice cache promotes hits and evicts at 96 entries without changing phrase ordering',()=>{
  const entries=names.flatMap(name=>['C','D','E','F','G','A','B','Am'].flatMap(root=>[.35,1,1.5].map(complexity=>({name,root,complexity}))));
  const get=entry=>practiceProfile(entry.name,entry.root,{complexity:entry.complexity});
  const initial=entries.slice(0,96).map(get);
  assert.equal(get(entries[0]),initial[0]);
  get(entries[96]);
  assert.equal(get(entries[0]),initial[0]);
  assert.notEqual(get(entries[1]),initial[1]);
  assert.deepEqual(get(entries[1]),initial[1]);
});
