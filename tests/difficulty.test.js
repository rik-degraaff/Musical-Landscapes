import test from 'node:test';
import assert from 'node:assert/strict';
import {INSTRUMENTS} from '../src/utils/music.js';
import {equippedProfile} from '../src/utils/difficulty.js';
import {trumpetInput} from '../src/utils/autoplay.js';
import {fluteInput} from '../src/utils/wind.js';

test('every equipped difficulty has phrases reproducible by its available controls in every scene key',()=>{
  for(const name of Object.keys(INSTRUMENTS))for(const root of ['C','G','F','A'])for(const complexity of [.35,1,1.5]){
    const profile=equippedProfile(name,root,{complexity});assert.ok(profile.phrases.length);
    for(const phrase of profile.phrases)for(const event of phrase.events){
      if(['guitar','ukulele'].includes(name))assert.ok(profile.chords.some(chord=>chord.name===event.chord));
      else if(name==='drums')assert.ok(profile.hits.includes(event.note));
      else if(name==='melody')assert.ok(trumpetInput(event.note).partial<profile.registers);
      else if(name==='flute')assert.ok(fluteInput(event.note).register<profile.fluteRegisters);
      else for(const note of event.notes??[event.note])assert.ok(profile.keyboardNotes.includes(note));
    }
  }
});
test('simple strings have only three common triads and drums have only three pads',()=>{
  for(const name of ['guitar','ukulele'])assert.equal(equippedProfile(name,'C',{complexity:.35}).chords.length,3);
  assert.equal(equippedProfile('drums','C',{complexity:.35}).hits.length,3);
  assert.equal(equippedProfile('ukulele','C',{complexity:1.5}).chords.length,14);
});