import test from 'node:test';
import assert from 'node:assert/strict';
import {CAREGIVER_SETTINGS_KEY,createCaregiverStorage,normalizeFamiliarity} from '../src/utils/caregiverSettings.js';

test('global familiarity defaults from legacy profile without writing and persists independently',()=>{
  const values=new Map();
  const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  const adapter=createCaregiverStorage(()=>storage);
  assert.deepEqual(adapter.load('confident'),{familiarity:'confident',established:false,error:null});
  assert.equal(values.size,0);
  assert.equal(adapter.save('new').ok,true);
  assert.deepEqual(adapter.load('confident'),{familiarity:'new',established:true,error:null});
  assert.deepEqual([...values.keys()],[CAREGIVER_SETTINGS_KEY]);
  assert.equal(normalizeFamiliarity('invalid'),'some');
  assert.equal(adapter.save('invalid').ok,true);assert.equal(adapter.load().familiarity,'some');
});

test('failed reads block fallback writes until recovery; failed writes can be retried',()=>{
  let blockedRead=true,blockedWrite=false,writes=0;
  const values=new Map([[CAREGIVER_SETTINGS_KEY,'{"familiarity":"confident"}']]);
  const adapter=createCaregiverStorage(()=>({getItem(key){if(blockedRead)throw Error('blocked');return values.get(key);},setItem(key,value){writes++;if(blockedWrite)throw Error('full');values.set(key,value);}}));
  assert.ok(adapter.load().error);assert.equal(adapter.save('new').ok,false);assert.equal(writes,0);
  blockedRead=false;assert.equal(adapter.load().familiarity,'confident');
  blockedWrite=true;assert.equal(adapter.save('new').ok,false);assert.equal(adapter.load().familiarity,'confident');
  blockedWrite=false;assert.equal(adapter.save('new').ok,true);assert.equal(adapter.load().familiarity,'new');
});

test('invalid documents use legacy familiarity without claiming it was saved',()=>{
  for(const raw of ['null','{}','{"familiarity":"unknown"}']) {
    const adapter=createCaregiverStorage(()=>({getItem:()=>raw}));
    assert.deepEqual(adapter.load('new'),{familiarity:'new',established:false,error:null});
  }
});