import test from 'node:test';
import assert from 'node:assert/strict';
import {GUIDES,HINTS,childLearning,createLearningStorage,emptyLearning,guideStatus,nextHint,normalizeLearning,updateChildLearning,updateHint} from '../src/utils/learning.js';

test('guides distinguish unread, changed revisions and completed revisions',()=>{
  const state=emptyLearning(),guide=GUIDES[0];
  assert.equal(guideStatus(state,guide),'Unread');state.guides[guide.id]=1;
  assert.equal(guideStatus(state,guide),'New');state.guides[guide.id]=guide.version;assert.equal(guideStatus(state,guide),'Read');
  state.guides[guide.id]=3;assert.equal(guideStatus(state,guide),'Read');
});
test('automatic suggestions respect age, active time, prerequisites and child isolation',()=>{
  let state=emptyLearning();const child={id:'a',age:'5to7'};
  assert.equal(nextHint(state,child).id,'tap');
  state=updateHint(state,'a','tap',{completed:true});assert.equal(nextHint(state,child),null);
  state=updateChildLearning(state,'a',value=>({...value,seconds:500}));
  assert.equal(nextHint(state,child).id,'landscape');
  for(const id of ['landscape','weather'])state=updateHint(state,'a',id,{completed:true});
  assert.equal(nextHint(state,child).id,'equip');
  state=updateHint(state,'a','equip',{seen:true});assert.equal(nextHint(state,child),null);
  state=updateHint(state,'a','equip',{completed:true});assert.equal(nextHint(state,child).id,'practice');
  assert.equal(nextHint(state,{...child,age:'3to4'}),null);
  assert.equal(nextHint(state,{id:'b',age:'under3'}).id,'tap');
  assert.equal(childLearning(state,'b').seconds,0);
});
test('parent resuggestion survives reload and can override automatic age/time eligibility',()=>{
  let state=updateHint(emptyLearning(),'a','practice',{suggested:true,seen:false,completed:false});
  state=normalizeLearning(JSON.parse(JSON.stringify(state)));
  assert.equal(nextHint(state,{id:'a',age:'under3'}).id,'practice');
  state=updateChildLearning(state,'a',value=>({...value,enabled:false}));assert.equal(nextHint(state,{id:'a',age:'8plus'}),null);
  state=updateChildLearning(state,'a',value=>({...value,enabled:true}));assert.equal(nextHint(state,{id:'a',age:'under3'}).id,'practice');
  assert.equal(HINTS.length,new Set(HINTS.map(hint=>hint.id)).size);
});
test('failed reads block writes; retries preserve existing progress and support quota recovery',()=>{
  let blocked=true,quota=false,writes=0;const original=updateHint(emptyLearning(),'sibling','tap',{completed:true});let raw=JSON.stringify(original);
  const store=createLearningStorage(()=>({getItem(){if(blocked)throw Error('denied');return raw;},setItem(_key,value){writes++;if(quota)throw Error('full');raw=value;}}));
  assert.ok(store.load().error);assert.equal(store.save(emptyLearning()).ok,false);assert.equal(writes,0);
  blocked=false;assert.deepEqual(store.load().state,normalizeLearning(original));quota=true;
  assert.equal(store.save(original).ok,false);quota=false;assert.equal(store.save(original).ok,true);
  assert.equal(store.load().state.children.sibling.hints.tap.completed,true);
});
test('invalid progress is normalized without trusting unknown hints or negative time',()=>{
  const state=normalizeLearning({guides:{instruments:-1,bad:99},children:{a:{seconds:-4,hints:{bad:{completed:true},tap:{seen:'yes',suggested:true}}}}});
  assert.deepEqual(state.guides,{});assert.equal(state.children.a.seconds,0);assert.equal(state.children.a.hints.tap.seen,false);
  assert.equal(state.children.a.hints.bad,undefined);
});

test('unfinished live coaching resumes across reload while explicit dismissal survives',()=>{
  let state=updateHint(emptyLearning(),'a','equip',{suggested:true,seen:true,dismissed:false});
  state=normalizeLearning(JSON.parse(JSON.stringify(state)));
  assert.equal(nextHint(state,{id:'a',age:'under3'}).id,'equip');
  state=updateHint(state,'a','equip',{dismissed:true});
  assert.notEqual(nextHint(normalizeLearning(state),{id:'a',age:'under3'})?.id,'equip');
  const legacy=normalizeLearning({children:{a:{hints:{equip:{suggested:true,seen:true}}}}});
  assert.equal(legacy.children.a.hints.equip.dismissed,true);
});
