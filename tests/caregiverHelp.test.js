import test from 'node:test';
import assert from 'node:assert/strict';
import {caregiverHelp,discoveryHelp,instrumentHelp} from '../src/utils/caregiverHelp.js';

test('discovery appears until each action is used, with familiarity-aware explanations',()=>{
  assert.equal(discoveryHelp().length,2);
  assert.deepEqual(discoveryHelp({hasEquipped:true}).map(item=>item[0]),['Enter the practice room']);
  assert.deepEqual(discoveryHelp({hasPracticed:true}).map(item=>item[0]),['Equip an instrument']);
  assert.deepEqual(discoveryHelp({hasEquipped:true,hasPracticed:true}),[]);
  assert.match(discoveryHelp({},'new')[1][1],/with or without/);
  assert.equal(new Set(['new','some','confident'].map(level=>discoveryHelp({},level)[0][1])).size,3);
});

test('all eight instruments have distinct explanations for each familiarity level',()=>{
  for(const instrument of ['piano','marimba','drums','guitar','ukulele','panflute','flute','melody']) {
    const variants=['new','some','confident'].map(level=>instrumentHelp(instrument,level));
    assert.equal(new Set(variants.map(content=>content.note)).size,3);
    assert.ok(variants.every(content=>content.action));
    assert.deepEqual(instrumentHelp(instrument,'invalid'),variants[1]);
  }
  assert.equal(instrumentHelp('invalid'),null);
});

test('each help topic explains its own concepts at all three familiarity levels',()=>{
  for(const topic of ['menu','instruments','landscape','practice','settings']) {
    const variants=['new','some','confident'].map(level=>caregiverHelp(topic,level));
    assert.equal(new Set(variants.map(content=>content.note)).size,3);
    assert.ok(variants.every(content=>content.title&&content.items.length>=3));
    assert.deepEqual(caregiverHelp(topic,'invalid'),variants[1]);
  }
  assert.match(caregiverHelp('practice','new').note,/chord means several notes/);
  assert.match(caregiverHelp('landscape','confident').note,/next downbeat/);
  assert.match(caregiverHelp('settings','confident').note,/I, IV and V/);
  assert.deepEqual(caregiverHelp('unknown'),caregiverHelp('menu'));
  assert.equal(new Set(['instruments','landscape','practice','settings'].map(topic=>caregiverHelp(topic,'new').note)).size,4);
});