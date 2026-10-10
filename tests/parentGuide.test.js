import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultSettings} from '../src/utils/settings.js';
import {loadParentProfile,PARENT_GUIDE_KEY,recommendParentSettings,saveParentProfile} from '../src/utils/parentGuide.js';

function storage(initial={}) {
  const values=new Map(Object.entries(initial));
  return {values,getItem(key){return values.get(key)??null;},setItem(key,value){values.set(key,String(value));}};
}

test('age and experience tailor Simple or Standard setup while preserving instrument slots',()=>{
  const settings=defaultSettings();
  const young=recommendParentSettings({age:'3to4',music:'familiar',instrument:'familiar',parent:'confident'},settings);
  assert.equal(young.level,'Simple');assert.deepEqual(young.settings.selected,settings.selected);
  assert.equal(young.settings.instruments.piano.complexity,.35);
  assert.equal(young.settings.instruments.ukulele.fingeringCharts,true);
  assert.equal(young.settings.instruments.piano.noteLabels,true);
  const early=recommendParentSettings({age:'under3',music:'new',instrument:'new',parent:'new'},settings);
  assert.match(early.explanation,/under 2/);
  const older=recommendParentSettings({age:'8plus',music:'new',instrument:'new',parent:'new'},settings);
  assert.equal(older.level,'Standard');assert.match(older.explanation,/everyday language/);
  const familiar=recommendParentSettings({age:'5to7',music:'some',instrument:'new',parent:'some'},settings);
  assert.equal(familiar.level,'Standard');
  assert.ok(Object.values(familiar.settings.instruments).every(value=>value.complexity===1));
  assert.ok(Object.values(settings.instruments).every(value=>value.complexity===1.5));
});

test('parent profile storage validates age bands and remains local and non-identifying',()=>{
  const profile={age:'5to7',music:'some',instrument:'familiar',parent:'confident'};
  const local=storage();assert.equal(saveParentProfile(local,profile),true);
  assert.deepEqual(JSON.parse(local.getItem(PARENT_GUIDE_KEY)),profile);
  assert.deepEqual(loadParentProfile(local),profile);
  local.setItem(PARENT_GUIDE_KEY,JSON.stringify({age:'birthday',music:'invalid',instrument:'new',parent:'confident',name:'not retained'}));
  assert.deepEqual(loadParentProfile(local),{age:'5to7',music:'new',instrument:'new',parent:'confident'});
  assert.deepEqual(loadParentProfile(storage()),{age:'5to7',music:'new',instrument:'new',parent:'some'});
  assert.equal(saveParentProfile({setItem(){throw Error('blocked');}},profile),false);
});
