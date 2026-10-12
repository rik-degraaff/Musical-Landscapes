import test from 'node:test';
import assert from 'node:assert/strict';
import {caregiverHelp} from '../src/utils/caregiverHelp.js';

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