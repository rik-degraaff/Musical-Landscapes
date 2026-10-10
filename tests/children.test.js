import test from 'node:test';
import assert from 'node:assert/strict';
import {AGE_SIZES,CHILDREN_KEY,DEFAULT_AVATAR,loadChildren,normalizeAvatar,normalizeChildren,saveChildren} from '../src/utils/children.js';
import {defaultSettings} from '../src/utils/settings.js';

const child={id:'child-1',name:'  Alex  ',age:'5to7',avatar:{hair:'curls',top:'overalls',bottom:'shorts',hairColor:'#201f25'},profile:{music:'some',parent:'confident',instruments:['piano','piano','invalid']}};
test('children require a name and age, preserve independent avatars, and select only existing profiles',()=>{
  const result=normalizeChildren({children:[child,{...child,id:'child-2',name:'Sam',age:'8plus'},{...child,name:' '},child],selectedId:'missing'});
  assert.equal(result.children.length,2);assert.equal(result.selectedId,'child-1');assert.equal(result.children[0].name,'Alex');
  assert.deepEqual(result.children[0].profile.instruments,['piano']);assert.equal(result.children[0].avatar.hair,'curls');
  assert.ok(AGE_SIZES.under3<AGE_SIZES['3to4']&&AGE_SIZES['3to4']<AGE_SIZES['5to7']&&AGE_SIZES['5to7']<AGE_SIZES['8plus']);
  assert.deepEqual(normalizeAvatar({hair:'script',eyes:'url(bad)'}),DEFAULT_AVATAR);
});
test('child storage recovers malformed data and persists profiles without creating legacy children',()=>{
  const data=new Map();const storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
  assert.deepEqual(loadChildren(storage),{children:[],selectedId:null});
  assert.equal(saveChildren(storage,{children:[child],selectedId:child.id}),true);assert.equal(loadChildren(storage).children[0].name,'Alex');
  data.set(CHILDREN_KEY,'broken');assert.deepEqual(loadChildren(storage),{children:[],selectedId:null});
  assert.equal(saveChildren({setItem(){throw Error('blocked');}},{children:[child]}),false);
});

test('saved gameplay children may omit avatar and settings and receive normalized defaults',()=>{
  const result=normalizeChildren({children:[{id:'player',name:'Player',age:'5to7'}],selectedId:'player'});
  assert.equal(result.selectedId,'player');assert.equal(result.children.length,1);
  assert.deepEqual(result.children[0].avatar,DEFAULT_AVATAR);
  assert.deepEqual(result.children[0].settings,defaultSettings());
  assert.deepEqual(result.children[0].profile,{age:'5to7',music:'new',parent:'some',instruments:[]});
  assert.equal(normalizeChildren({children:[{...child,name:'A'.repeat(41)}]}).children[0].name.length,40);
});

test('normalizing and saving children preserves independent profile settings without mutating input',()=>{
  const firstSettings=defaultSettings();firstSettings.instruments.piano.complexity=.35;firstSettings.instruments.guitar.fingeringCharts=true;
  const secondSettings=defaultSettings();secondSettings.instruments.piano.complexity=1;secondSettings.instruments.flute.noteLabels=true;
  const input={children:[{...child,settings:firstSettings},{...child,id:'child-2',name:'Sam',age:'8plus',settings:secondSettings,avatar:{hair:'bob',top:'sweater',bottom:'skirt'}}],selectedId:'child-2'};
  const original=structuredClone(input);const result=normalizeChildren(input);
  assert.deepEqual(input,original);assert.equal(result.selectedId,'child-2');
  assert.deepEqual(result.children[0].settings,firstSettings);assert.deepEqual(result.children[1].settings,secondSettings);
  result.children[0].settings.instruments.piano.complexity=1.5;
  assert.equal(result.children[1].settings.instruments.piano.complexity,1);assert.equal(firstSettings.instruments.piano.complexity,.35);
  const data=new Map();const storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
  assert.equal(saveChildren(storage,input),true);assert.deepEqual(loadChildren(storage),normalizeChildren(input));
});