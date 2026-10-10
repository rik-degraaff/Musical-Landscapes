import test from 'node:test';
import assert from 'node:assert/strict';
import {INSTRUMENTS} from '../src/utils/music.js';
import {equippedProfile} from '../src/utils/difficulty.js';
import {noteMidi,trumpetInput} from '../src/utils/autoplay.js';
import {fluteInput} from '../src/utils/wind.js';
import {PIANO_NOTES,MARIMBA_NOTES,PANFLUTE_NOTES} from '../src/utils/performance.js';

const ROOTS=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B','C#m','Am','Fm','Db'];

function signature(phrase) {return JSON.stringify(phrase.events.map(event=>[event.time,event.dur,event.notes??event.note]));}
function assertTier(phrase,name,level) {
  assert.ok(phrase.complexity<=(level==='Simple'?.3:.65));
  assert.ok(phrase.events.length<=(level==='Simple'?4:8));
  for(const event of phrase.events){
    const subdivision=Number(event.time.split(':')[2]);
    assert.ok(level==='Simple'?subdivision===0:[0,2].includes(subdivision));
    assert.ok((event.notes?.length??1)<=(['guitar','ukulele'].includes(name)?4:name==='piano'?3:1));
  }
}

test('every key has distinct Simple phrases and at least two additional structurally suitable Standard phrases',()=>{
  for(const name of Object.keys(INSTRUMENTS))for(const root of ROOTS){
    const simple=equippedProfile(name,root,{complexity:.35});const standard=equippedProfile(name,root,{complexity:1});
    const simpleSignatures=new Set(simple.phrases.map(signature));
    const standardSignatures=new Set(standard.phrases.map(signature));
    const additional=[...standardSignatures].filter(value=>!simpleSignatures.has(value));
    const simpleSources=new Set(simple.phrases.map(phrase=>phrase.tierSource));
    const standardSources=new Set(standard.phrases.map(phrase=>phrase.tierSource));
    const additionalSources=[...standardSources].filter(value=>!simpleSources.has(value));
    assert.ok(simpleSignatures.size>=2,`${name} ${root} needs two distinct Simple phrases`);
    assert.ok(standard.phrases.length>=4,`${name} ${root} needs four Standard phrases`);
    assert.ok(additional.length>=2,`${name} ${root} needs two additional Standard phrases`);
    assert.ok(simpleSources.size>=2,`${name} ${root} needs two authored Simple sources`);
    assert.ok(additionalSources.length>=2,`${name} ${root} needs two authored Standard-only sources`);
    for(const phrase of simple.phrases)assertTier(phrase,name,'Simple');
    for(const phrase of standard.phrases)assertTier(phrase,name,'Standard');
    for(const phrase of simple.phrases)assert.ok(standardSignatures.has(signature(phrase)));
  }
});

test('every equipped phrase is playable with its controls and chord pool in every key',()=>{
  for(const name of Object.keys(INSTRUMENTS))for(const root of ROOTS)for(const complexity of [.35,1,1.5]){
    const profile=equippedProfile(name,root,{complexity});assert.ok(profile.phrases.length);
    if(['guitar','ukulele'].includes(name))assert.equal(profile.chords.length,complexity<=.5?3:complexity<=1?6:14);
    const fixedRange=name==='piano'?PIANO_NOTES:name==='marimba'?MARIMBA_NOTES:name==='panflute'?PANFLUTE_NOTES:null;
    if(fixedRange)for(const note of profile.notes)assert.ok(fixedRange.includes(note),`${name} ${root} ${complexity} out of range ${note}`);
    for(const phrase of profile.phrases)for(const event of phrase.events){
      if(name==='piano'&&complexity<=.5)assert.ok((event.notes?.length??1)<=2,`${root} Simple piano chord exceeds two notes`);
      if(['guitar','ukulele'].includes(name)){
        const chord=profile.chords.find(value=>value.name===event.chord);assert.ok(chord,`${name} ${root} missing ${event.chord}`);
        for(const note of event.notes??[event.note])assert.ok(chord.tones.includes(noteMidi(note)%12));
        assert.equal(event.fingering.length,(event.notes??[event.note]).length);
        event.fingering.forEach((input,index)=>assert.equal(input.note,(event.notes??[event.note])[index]));
      }
      else if(name==='drums')assert.ok(profile.hits.includes(event.note));
      else if(name==='melody')assert.ok(trumpetInput(event.note).partial<profile.registers);
      else if(name==='flute')assert.ok(fluteInput(event.note).register<profile.fluteRegisters);
      else if(name==='panflute')for(const note of event.notes??[event.note])assert.ok(PANFLUTE_NOTES.includes(note));
      else for(const note of event.notes??[event.note])assert.ok(profile.keyboardNotes.includes(note));
    }
  }
});
test('Simple strings have I/IV/V, Standard has six triads, and Advanced retains all chords',()=>{
  for(const name of ['guitar','ukulele'])assert.equal(equippedProfile(name,'C',{complexity:.35}).chords.length,3);
  for(const name of ['guitar','ukulele'])assert.equal(equippedProfile(name,'C',{complexity:1}).chords.length,6);
  for(const name of ['guitar','ukulele'])assert.equal(equippedProfile(name,'C',{complexity:1.5}).chords.length,14);
  assert.equal(equippedProfile('drums','C',{complexity:.35}).hits.length,3);
});