import test from 'node:test';
import assert from 'node:assert/strict';
import {createFamilyStorage,recoverFamilySnapshot} from '../src/utils/familyStorage.js';
import {CHILDREN_KEY,normalizeChildren} from '../src/utils/children.js';
import {SETTINGS_KEY,defaultSettings,normalizeSettings} from '../src/utils/settings.js';

test('profile replacement writes family last and never removes children on either write failure',()=>{
  const originalFamily=normalizeChildren({children:[{id:'alex',name:'Alex',age:'5to7',settings:defaultSettings()}],selectedId:'alex'});
  const previousSettings=normalizeSettings({instruments:{piano:{complexity:.35}}});
  for(const failedKey of [CHILDREN_KEY,SETTINGS_KEY]) {
    const data=new Map([[CHILDREN_KEY,JSON.stringify(originalFamily)],[SETTINGS_KEY,JSON.stringify(previousSettings)]]);
    let blocked=true;
    const adapter=createFamilyStorage(()=>({getItem:key=>data.get(key)??null,setItem(key,value){if(blocked&&key===failedKey)throw Error('blocked');data.set(key,value);},removeItem:key=>data.delete(key)}));
    const snapshot={family:{children:[],selectedId:null},settings:defaultSettings()};
    assert.equal(adapter.saveProfileSnapshot(snapshot).ok,false);
    assert.deepEqual(JSON.parse(data.get(CHILDREN_KEY)),originalFamily);assert.deepEqual(JSON.parse(data.get(SETTINGS_KEY)),previousSettings);
    blocked=false;assert.equal(adapter.saveProfileSnapshot(snapshot).ok,true);
    assert.deepEqual(JSON.parse(data.get(CHILDREN_KEY)),snapshot.family);assert.deepEqual(JSON.parse(data.get(SETTINGS_KEY)),snapshot.settings);
  }
});

test('profile write failure restores an absent settings mirror and read errors prevent profile writes',()=>{
  const data=new Map([[CHILDREN_KEY,'{"children":[],"selectedId":null}']]);
  const adapter=createFamilyStorage(()=>({getItem:key=>data.get(key)??null,setItem(key,value){if(key===CHILDREN_KEY)throw Error('blocked');data.set(key,value);},removeItem:key=>data.delete(key)}));
  assert.equal(adapter.saveProfileSnapshot({family:{children:[],selectedId:null},settings:defaultSettings()}).ok,false);
  assert.equal(data.has(SETTINGS_KEY),false);
  let writes=0;
  const unreadable=createFamilyStorage(()=>({getItem(){throw Error('read blocked');},setItem(){writes++;}}));
  unreadable.load();assert.equal(unreadable.saveProfileSnapshot({family:{children:[],selectedId:null},settings:defaultSettings()}).ok,false);assert.equal(writes,0);
});

const child={id:'child-1',name:'Alex',age:'5to7'};
function storage(initial={}) {
  const values=new Map(Object.entries(initial));
  return {values,getItem(key){return values.get(key)??null;},setItem(key,value){values.set(key,value);}};
}

test('startup mirrors legacy normalization without freezing missing per-child settings',()=>{
  const local=storage({[CHILDREN_KEY]:JSON.stringify({children:[child]})});
  const originalFamily=local.getItem(CHILDREN_KEY);
  const adapter=createFamilyStorage(()=>local);
  assert.deepEqual(adapter.saveLegacySettings({instruments:{piano:{complexity:.45}}}),{ok:true,error:null});
  assert.equal(local.getItem(CHILDREN_KEY),originalFamily);
  assert.equal(adapter.load().settings.instruments.piano.complexity,.35);
  const denied=createFamilyStorage(()=>{throw new DOMException('Denied','SecurityError');});
  assert.equal(denied.saveLegacySettings(defaultSettings()).ok,false);
});

test('the default provider guards the localStorage getter and retries it on later operations',context=>{
  const error=new DOMException('Storage blocked','SecurityError');
  const local=storage();let blocked=true,accesses=0;
  const originalWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
  context.after(()=>{if(originalWindow)Object.defineProperty(globalThis,'window',originalWindow);else Reflect.deleteProperty(globalThis,'window');});
  Object.defineProperty(globalThis,'window',{configurable:true,value:{get localStorage(){accesses++;if(blocked)throw error;return local;}}});
  const adapter=createFamilyStorage();
  assert.equal(accesses,0);
  assert.deepEqual(adapter.load(),{family:normalizeChildren(null),settings:defaultSettings(),saveError:error});
  const snapshot={family:normalizeChildren({children:[child]}),settings:defaultSettings()};
  const original=structuredClone(snapshot);
  assert.deepEqual(adapter.saveSnapshot(snapshot),{ok:false,error});
  assert.deepEqual(snapshot,original);
  blocked=false;
  assert.equal(adapter.saveSnapshot(snapshot).ok,false);
  adapter.load();
  assert.deepEqual(adapter.saveSnapshot(snapshot),{ok:true,error:null});
  assert.deepEqual(adapter.load(),{...snapshot,saveError:null});
  assert.equal(accesses,4);
});

test('explicit selected-child settings beat legacy settings without modifying stored data',()=>{
  const saved={instruments:{piano:{complexity:.45,noteLabels:true}}};
  const legacy={instruments:{guitar:{complexity:1,fretDots:true}}};
  const raw={children:[{...child,settings:saved}],selectedId:child.id};
  const local=storage({[CHILDREN_KEY]:JSON.stringify(raw),[SETTINGS_KEY]:JSON.stringify(legacy)});
  const original=new Map(local.values);
  const snapshot=createFamilyStorage(()=>local).load();
  assert.deepEqual(snapshot,{family:normalizeChildren(raw),settings:normalizeSettings(saved),saveError:null});
  assert.deepEqual(local.values,original);
});

test('a selected child without settings keeps the normalized legacy fallback in memory',()=>{
  const legacy={instruments:{guitar:{complexity:.35,fingeringCharts:true}}};
  const raw={children:[child,{...child,id:'child-2',name:'Sam'}],selectedId:child.id};
  const local=storage({[CHILDREN_KEY]:JSON.stringify(raw),[SETTINGS_KEY]:JSON.stringify(legacy)});
  const original=new Map(local.values);
  const snapshot=createFamilyStorage(()=>local).load();
  assert.deepEqual(snapshot.settings,normalizeSettings(legacy));
  assert.deepEqual(snapshot.family.children[0].settings,snapshot.settings);
  assert.deepEqual(snapshot.family.children[1].settings,defaultSettings());
  assert.equal(snapshot.saveError,null);
  assert.deepEqual(local.values,original);
  assert.deepEqual(createFamilyStorage(()=>local).saveSnapshot(snapshot),{ok:true,error:null});
  assert.deepEqual(JSON.parse(local.getItem(SETTINGS_KEY)),normalizeSettings(legacy));
});

test('empty storage loads defaults without writing or creating a child',()=>{
  const local=storage();
  assert.deepEqual(createFamilyStorage(()=>local).load(),{family:normalizeChildren(null),settings:defaultSettings(),saveError:null});
  assert.equal(local.values.size,0);
});

for(const failedKey of [CHILDREN_KEY,SETTINGS_KEY]) {
  test(`getItem failure for ${failedKey} preserves the other readable data and recovers later`,()=>{
    const error=new DOMException('Read blocked','SecurityError');let blocked=true;
    const legacy=normalizeSettings({instruments:{piano:{complexity:.35,noteLabels:true}}});
    const raw={children:[child],selectedId:child.id};
    const local=storage({[CHILDREN_KEY]:JSON.stringify(raw),[SETTINGS_KEY]:JSON.stringify(legacy)});
    const adapter=createFamilyStorage(()=>({getItem(key){if(blocked&&key===failedKey)throw error;return local.getItem(key);}}));
    const snapshot=adapter.load();
    assert.equal(snapshot.saveError,error);
    assert.deepEqual(snapshot.settings,failedKey===SETTINGS_KEY?defaultSettings():legacy);
    assert.equal(snapshot.family.children.length,failedKey===CHILDREN_KEY?0:1);
    blocked=false;
    const recovered=adapter.load();
    assert.equal(recovered.saveError,null);
    assert.deepEqual(recovered.settings,legacy);
    assert.deepEqual(recovered.family.children[0].settings,legacy);
  });
}

test('all-read failures return defaults with the first error and no writes',()=>{
  const error=new Error('Unavailable');const keys=[];
  const adapter=createFamilyStorage(()=>({getItem(key){keys.push(key);throw error;},setItem(){assert.fail('load must not write');}}));
  assert.deepEqual(adapter.load(),{family:normalizeChildren(null),settings:defaultSettings(),saveError:error});
  assert.deepEqual(keys,[CHILDREN_KEY,SETTINGS_KEY]);
});

test('malformed or unusable family JSON safely retains legacy fallback settings',()=>{
  const legacy=normalizeSettings({instruments:{guitar:{complexity:1,fretDots:true}}});
  for(const saved of ['{broken','','null','[]','42','{"children":{}}','{"children":[null,1,{}]}']) {
    const local=storage({[CHILDREN_KEY]:saved,[SETTINGS_KEY]:JSON.stringify(legacy)});
    const snapshot=createFamilyStorage(()=>local).load();
    assert.deepEqual(snapshot.family,normalizeChildren(null));
    assert.deepEqual(snapshot.settings,legacy);
    if(saved==='{broken'||saved==='')assert.ok(snapshot.saveError instanceof SyntaxError);
    else assert.equal(snapshot.saveError,null);
  }
});

test('malformed or unusable legacy JSON supplies defaults to a child missing settings',()=>{
  for(const saved of ['{broken','','null','[]','42']) {
    const local=storage({[CHILDREN_KEY]:JSON.stringify({children:[child]}),[SETTINGS_KEY]:saved});
    const snapshot=createFamilyStorage(()=>local).load();
    assert.deepEqual(snapshot.settings,defaultSettings());
    assert.deepEqual(snapshot.family.children[0].settings,defaultSettings());
    if(saved==='{broken'||saved==='')assert.ok(snapshot.saveError instanceof SyntaxError);
    else assert.equal(snapshot.saveError,null);
  }
});

test('explicit settings are normalized even when empty or invalid and do not read the legacy mirror',()=>{
  for(const settings of [{},null,false,0,'invalid',[],{instruments:{piano:{complexity:.5}}}]) {
    const raw={children:[{...child,settings}],selectedId:child.id};const keys=[];
    const adapter=createFamilyStorage(()=>({getItem(key){keys.push(key);if(key===SETTINGS_KEY)throw Error('Mirror unreadable');return JSON.stringify(raw);}}));
    const snapshot=adapter.load();
    assert.deepEqual(snapshot.settings,normalizeSettings(settings));
    assert.deepEqual(snapshot.family,normalizeChildren(raw));
    assert.equal(snapshot.saveError,null);
    assert.deepEqual(keys,[CHILDREN_KEY]);
  }
});

test('fallback selection ignores invalid and duplicate raw children when detecting explicit settings',()=>{
  const legacy=normalizeSettings({instruments:{flute:{complexity:1,noteLabels:true}}});
  const raw={children:[{...child,name:' ',settings:defaultSettings()},child,{...child,settings:defaultSettings()}],selectedId:'missing'};
  const local=storage({[CHILDREN_KEY]:JSON.stringify(raw),[SETTINGS_KEY]:JSON.stringify(legacy)});
  const snapshot=createFamilyStorage(()=>local).load();
  assert.equal(snapshot.family.children.length,1);
  assert.equal(snapshot.family.selectedId,child.id);
  assert.deepEqual(snapshot.settings,legacy);
});

test('raw child settings remain authoritative when normalization truncates the selected id',()=>{
  const settings=normalizeSettings({instruments:{piano:{complexity:.35}}});
  const raw={children:[{...child,id:'A'.repeat(101),settings}],selectedId:'A'.repeat(101)};
  const local=storage({[CHILDREN_KEY]:JSON.stringify(raw),[SETTINGS_KEY]:JSON.stringify(defaultSettings())});
  const snapshot=createFamilyStorage(()=>local).load();
  assert.equal(snapshot.family.selectedId,'A'.repeat(100));
  assert.deepEqual(snapshot.settings,settings);
});

test('saving normalized input leaves it unchanged and preserves all existing schema keys',()=>{
  const first=normalizeSettings({selected:['piano','drums','guitar','melody','marimba','flute'],instruments:{guitar:{complexity:.35,noteLabels:true,playbackNotes:true,fingeringCharts:true,fretDots:true,seventhChords:false}}});
  const second=normalizeSettings({instruments:{piano:{complexity:1},flute:{noteLabels:true}}});
  const family=normalizeChildren({children:[{...child,settings:first,avatar:{hair:'longCurls',top:'hoodie',bottom:'joggers',hairColor:'#201f25'},profile:{parent:'confident',music:'familiar',instruments:['piano','guitar']}},{...child,id:'child-2',name:'Sam',age:'8plus',settings:second}],selectedId:child.id});
  const snapshot={family,settings:second};const original=structuredClone(snapshot);const local=storage();
  assert.deepEqual(createFamilyStorage(()=>local).saveSnapshot(snapshot),{ok:true,error:null});
  assert.deepEqual(snapshot,original);
  const savedFamily=JSON.parse(local.getItem(CHILDREN_KEY));
  const savedSettings=JSON.parse(local.getItem(SETTINGS_KEY));
  assert.deepEqual(savedFamily,family);
  assert.deepEqual(savedSettings,first);
  assert.deepEqual(savedSettings,savedFamily.children[0].settings);
  assert.deepEqual(Object.keys(savedFamily),['children','selectedId']);
  assert.deepEqual(Object.keys(savedFamily.children[0]),['id','name','age','avatar','profile','settings']);
  assert.deepEqual(Object.keys(savedSettings),['selected','instruments']);
  assert.equal(local.values.size,2);
});

test('saving an empty family normalizes the provided settings without inventing children',()=>{
  const snapshot={family:{children:[],selectedId:'missing'},settings:{instruments:{piano:{complexity:.45,noteLabels:true}},preset:'ignored'}};
  const original=structuredClone(snapshot);const local=storage();const adapter=createFamilyStorage(()=>local);
  assert.deepEqual(adapter.saveSnapshot(snapshot),{ok:true,error:null});
  assert.deepEqual(JSON.parse(local.getItem(CHILDREN_KEY)),normalizeChildren(null));
  assert.deepEqual(JSON.parse(local.getItem(SETTINGS_KEY)),normalizeSettings(snapshot.settings));
  assert.deepEqual(adapter.load(),{family:normalizeChildren(null),settings:normalizeSettings(snapshot.settings),saveError:null});
  assert.deepEqual(snapshot,original);
});

for(const failedKey of [CHILDREN_KEY,SETTINGS_KEY]) {
  test(`a ${failedKey} write failure reports failure, retains in-memory choices and permits retry`,()=>{
    const error=new DOMException('Quota exceeded','QuotaExceededError');let blocked=true;const writes=[];
    const previous=normalizeChildren({children:[{...child,settings:defaultSettings()}],selectedId:child.id});
    const currentSettings=normalizeSettings({instruments:{piano:{complexity:.35,noteLabels:true}}});
    const family=normalizeChildren({children:[{...child,name:'New name',settings:currentSettings}],selectedId:child.id});
    const snapshot={family,settings:currentSettings};const original=structuredClone(snapshot);
    const local=storage({[CHILDREN_KEY]:JSON.stringify(previous),[SETTINGS_KEY]:JSON.stringify(defaultSettings())});
    const adapter=createFamilyStorage(()=>({getItem:key=>local.getItem(key),setItem(key,value){writes.push(key);if(blocked&&key===failedKey)throw error;local.setItem(key,value);}}));
    assert.deepEqual(adapter.saveSnapshot(snapshot),{ok:false,error});
    assert.deepEqual(snapshot,original);
    assert.deepEqual(writes,failedKey===CHILDREN_KEY?[CHILDREN_KEY]:[CHILDREN_KEY,SETTINGS_KEY]);
    assert.deepEqual(JSON.parse(local.getItem(CHILDREN_KEY)),failedKey===CHILDREN_KEY?previous:family);
    assert.deepEqual(JSON.parse(local.getItem(SETTINGS_KEY)),defaultSettings());
    assert.deepEqual(adapter.load().settings,failedKey===CHILDREN_KEY?defaultSettings():currentSettings);
    blocked=false;writes.length=0;
    assert.deepEqual(adapter.saveSnapshot(snapshot),{ok:true,error:null});
    assert.deepEqual(writes,[CHILDREN_KEY,SETTINGS_KEY]);
    assert.deepEqual(adapter.load(),{...snapshot,saveError:null});
    assert.deepEqual(snapshot,original);
  });
}

test('both writes are prepared before storage-provider or write callbacks can change caller data',()=>{
  const settings=normalizeSettings({instruments:{piano:{complexity:.35}}});
  const snapshot={family:normalizeChildren({children:[{...child,settings}]}),settings};
  const expected=structuredClone(snapshot);const local=storage();
  const adapter=createFamilyStorage(()=>{
    snapshot.family.children[0].name='Changed during provider';
    return {setItem(key,value){local.setItem(key,value);snapshot.family.children[0].settings.instruments.piano.complexity=1.5;}};
  });
  assert.deepEqual(adapter.saveSnapshot(snapshot),{ok:true,error:null});
  assert.deepEqual(JSON.parse(local.getItem(CHILDREN_KEY)),expected.family);
  assert.deepEqual(JSON.parse(local.getItem(SETTINGS_KEY)),expected.settings);
});

test('loading, editing and switching children keep sibling settings independent of the legacy mirror',()=>{
  const first=normalizeSettings({instruments:{piano:{complexity:.35},guitar:{fingeringCharts:true}}});
  const second=normalizeSettings({instruments:{piano:{complexity:1},flute:{noteLabels:true}}});
  const family=normalizeChildren({children:[{...child,settings:first},{...child,id:'child-2',name:'Sam',settings:second}],selectedId:child.id});
  const local=storage({[CHILDREN_KEY]:JSON.stringify(family),[SETTINGS_KEY]:JSON.stringify(second)});
  const adapter=createFamilyStorage(()=>local);const snapshot=adapter.load();
  snapshot.settings.instruments.piano.complexity=1.5;
  assert.deepEqual(snapshot.family.children[0].settings,first);
  assert.deepEqual(snapshot.family.children[1].settings,second);
  snapshot.family.children[0].settings=normalizeSettings(snapshot.settings);
  assert.deepEqual(adapter.saveSnapshot(snapshot),{ok:true,error:null});
  const switched={family:{...snapshot.family,selectedId:'child-2'},settings:snapshot.settings};
  const original=structuredClone(switched);
  assert.deepEqual(adapter.saveSnapshot(switched),{ok:true,error:null});
  const reloaded=adapter.load();
  assert.deepEqual(reloaded.settings,second);
  assert.deepEqual(reloaded.family.children[0].settings,snapshot.settings);
  assert.deepEqual(reloaded.family.children[1].settings,second);
  assert.deepEqual(switched,original);
});

test('a failed startup read cannot overwrite temporarily inaccessible profiles',()=>{
  const original={children:[child,{...child,id:'sibling',name:'Sam'}],selectedId:child.id};
  const local=storage({[CHILDREN_KEY]:JSON.stringify(original)});let denied=true;
  const adapter=createFamilyStorage(()=>{if(denied)throw Error('Denied');return local;});
  const initial=adapter.load();denied=false;
  assert.equal(adapter.saveSnapshot(initial).ok,false);
  assert.equal(adapter.saveLegacySettings(defaultSettings()).ok,false);
  assert.equal(local.getItem(CHILDREN_KEY),JSON.stringify(original));
  const recovered=adapter.load();
  const snapshot=recoverFamilySnapshot(initial,initial,recovered);
  assert.equal(adapter.saveSnapshot(snapshot).ok,true);
  assert.deepEqual(adapter.load().family,normalizeChildren(original));
});

test('read recovery merges known edits without losing newly readable sibling profiles',()=>{
  const initial={family:normalizeChildren({children:[child]}),settings:defaultSettings()};
  const current=structuredClone(initial);current.family.children[0].settings.instruments.piano.complexity=.35;
  const recovered={family:normalizeChildren({children:[child,{...child,id:'sibling',name:'Sam'}]}),settings:defaultSettings()};
  const snapshot=recoverFamilySnapshot(initial,current,recovered);
  assert.equal(snapshot.family.children.length,2);
  assert.equal(snapshot.settings.instruments.piano.complexity,.35);
  assert.deepEqual(snapshot.family.children[1],recovered.family.children[1]);
});

test('legacy read recovery preserves untouched options when one in-session setting changes',()=>{
  const saved=normalizeSettings({selected:['panflute','ukulele','guitar','piano','drums','flute'],instruments:{
    piano:{complexity:1,noteLabels:true},guitar:{complexity:.35,fretDots:true},flute:{fingeringCharts:true},
  }});
  const raw={children:[child,{...child,id:'sibling',name:'Sam',settings:{instruments:{guitar:{complexity:1}}}}],selectedId:child.id};
  const local=storage({[CHILDREN_KEY]:JSON.stringify(raw),[SETTINGS_KEY]:JSON.stringify(saved)});
  let blocked=true;
  const adapter=createFamilyStorage(()=>({...local,getItem(key){if(blocked&&key===SETTINGS_KEY)throw Error('read blocked');return local.getItem(key);}}));
  const initial=adapter.load();
  assert.ok(initial.saveError);
  const current=structuredClone(initial);
  current.family.children[0].settings.instruments.piano.complexity=.35;
  current.settings=current.family.children[0].settings;
  assert.equal(adapter.saveSnapshot(current).ok,false);
  const originals=structuredClone({initial,current});
  const before=new Map(local.values);
  blocked=false;
  const recovered=adapter.load();
  const recoveredOriginal=structuredClone(recovered);
  const snapshot=recoverFamilySnapshot(initial,current,recovered);
  const expected=structuredClone(saved);expected.instruments.piano.complexity=.35;
  assert.deepEqual(snapshot.settings,expected);
  assert.deepEqual(snapshot.family.children[0].settings,expected);
  assert.deepEqual(snapshot.family.children[1],recovered.family.children[1]);
  assert.deepEqual(local.values,before,'recovery itself must not write');
  assert.deepEqual({initial,current},originals);
  assert.deepEqual(recovered,recoveredOriginal);
  assert.equal(adapter.saveSnapshot(snapshot).ok,true);
  assert.deepEqual(adapter.load().settings,expected);
  assert.deepEqual(JSON.parse(local.getItem(SETTINGS_KEY)),expected);
});

test('recovery merges profile and instrument fields independently, with local edits winning conflicts',()=>{
  const initial={family:normalizeChildren({children:[child]}),settings:defaultSettings()};
  const current=structuredClone(initial);
  current.family.children[0].name='Ally';
  current.family.children[0].avatar.hair='bob';
  current.family.children[0].settings.instruments.piano.complexity=.35;
  current.family.children[0].settings.instruments.piano.noteLabels=true;
  current.family.children[0].settings.selected.reverse();
  const recovered=structuredClone(initial);
  const saved=recovered.family.children[0];
  saved.name='Recovered name';saved.age='8plus';saved.avatar.eyes='#537b91';
  saved.settings.instruments.piano.complexity=1;
  saved.settings.instruments.guitar.fretDots=true;
  saved.settings.instruments.piano.playbackNotes=true;
  const result=recoverFamilySnapshot(initial,current,recovered);
  const merged=result.family.children[0];
  assert.equal(merged.name,'Ally');assert.equal(merged.age,'8plus');
  assert.equal(merged.avatar.hair,'bob');assert.equal(merged.avatar.eyes,'#537b91');
  assert.equal(merged.settings.instruments.piano.complexity,.35);
  assert.equal(merged.settings.instruments.piano.noteLabels,true);
  assert.equal(merged.settings.instruments.piano.playbackNotes,true);
  assert.equal(merged.settings.instruments.guitar.fretDots,true);
  assert.deepEqual(merged.settings.selected,current.family.children[0].settings.selected);
  assert.deepEqual(result.settings,merged.settings);
});

test('recovery keeps explicit child selection and uses that child\'s recovered settings',()=>{
  const first=normalizeChildren({children:[child,{...child,id:'sibling',name:'Sam'}],selectedId:child.id});
  const initial={family:first,settings:first.children[0].settings};
  const current=structuredClone(initial);current.family.selectedId='sibling';
  const recovered=structuredClone(initial);
  recovered.family.children[1].settings.instruments.flute.noteLabels=true;
  const result=recoverFamilySnapshot(initial,current,recovered);
  assert.equal(result.family.selectedId,'sibling');
  assert.equal(result.settings.instruments.flute.noteLabels,true);
  assert.deepEqual(result.family.children,recovered.family.children);
});

test('recovery uses saved selection when local selection is unchanged or no longer exists',()=>{
  const initial={family:normalizeChildren({children:[child,{...child,id:'sibling',name:'Sam'}]}),settings:defaultSettings()};
  const recovered=structuredClone(initial);recovered.family.selectedId='sibling';
  assert.equal(recoverFamilySnapshot(initial,initial,recovered).family.selectedId,'sibling');
  const current=structuredClone(initial);current.family.selectedId='missing';
  assert.equal(recoverFamilySnapshot(initial,current,recovered).family.selectedId,'sibling');
  assert.deepEqual(recoverFamilySnapshot(initial,current,{family:{children:[],selectedId:null},settings:defaultSettings()}),
    {family:{children:[],selectedId:null},settings:defaultSettings()});
});
