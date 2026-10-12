import test from 'node:test';
import assert from 'node:assert/strict';
import {SETTINGS_KEY,defaultSettings,normalizeSettings,loadSettings,defaultSoundMix,resetSoundMix} from '../src/utils/settings.js';
import {INSTRUMENTS,DEFAULT_INSTRUMENTS} from '../src/utils/music.js';

test('defaults include the full catalog, six unique slots, advanced complexity and hidden display details',()=>{
  const defaults=defaultSettings();
  assert.deepEqual(defaults.selected,DEFAULT_INSTRUMENTS);
  assert.equal(new Set(defaults.selected).size,6);
  assert.deepEqual(Object.keys(defaults.instruments),Object.keys(INSTRUMENTS));
  assert.equal(Object.hasOwn(defaults,'preset'),false);
  for(const options of Object.values(defaults.instruments)){
    assert.equal(options.complexity,1.5);
    for(const key of ['fingeringCharts','noteLabels','playbackNotes','fretDots'])assert.equal(options[key],false);
    assert.equal(options.seventhChords,true);
    assert.equal(options.harmonyHints,'notes');
  }
});

test('legacy numeric complexity migrates to the three buckets at their boundaries',()=>{
  for(const [legacy,expected] of [[-99,.35],[0,.35],[.35,.35],[.5,.35],[.50001,1],[.8,1],[1,1],[1.00001,1.5],[1.5,1.5],[2,1.5],[99,1.5]]){
    const saved=normalizeSettings({preset:'Custom',instruments:{guitar:{complexity:legacy}}});
    assert.equal(saved.instruments.guitar.complexity,expected,`legacy ${legacy}`);
    assert.equal(Object.hasOwn(saved,'preset'),false);
    assert.deepEqual(normalizeSettings(saved),saved);
  }
  for(const invalid of [NaN,Infinity,-Infinity,'1',null,undefined]){
    assert.equal(normalizeSettings({instruments:{piano:{complexity:invalid}}}).instruments.piano.complexity,1.5);
  }
});

test('normalization preserves valid six-slot choices and rejects unsafe selections',()=>{
  const valid=['piano','drums','guitar','melody','marimba','flute'];
  const result=normalizeSettings({selected:valid});
  assert.deepEqual(result.selected,valid);
  assert.notEqual(result.selected,valid);
  const catalogSelection=Object.keys(INSTRUMENTS).slice(-6);
  assert.deepEqual(normalizeSettings({selected:catalogSelection}).selected,catalogSelection);
  for(const invalid of [[],valid.slice(1),[...valid,'ukulele'],['piano',...valid.slice(0,5)],[...valid.slice(0,5),'unknown'],[...valid.slice(0,5),'toString'],null,'piano']){
    assert.deepEqual(normalizeSettings({selected:invalid}).selected,DEFAULT_INSTRUMENTS);
  }
});

test('per-instrument complexity and display settings remain independent without mutating saved data',()=>{
  const original=defaultSettings();
  original.instruments.guitar={...original.instruments.guitar,complexity:.35,fingeringCharts:true,noteLabels:true,seventhChords:false};
  original.instruments.piano={...original.instruments.piano,complexity:1,playbackNotes:true};
  const snapshot=structuredClone(original);
  const result=normalizeSettings(original);
  assert.deepEqual(result,original);
  result.instruments.guitar.complexity=1.5;
  result.selected.reverse();
  assert.deepEqual(original,snapshot);
  assert.equal(result.instruments.piano.complexity,1);
  assert.equal(result.instruments.piano.playbackNotes,true);
  assert.equal(result.instruments.guitar.fingeringCharts,true);
  assert.equal(result.instruments.guitar.seventhChords,false);
  for(const name of Object.keys(INSTRUMENTS).filter(name=>!['guitar','piano'].includes(name)))assert.deepEqual(result.instruments[name],defaultSettings().instruments[name]);
});

test('invalid display values and unknown instruments do not change safe defaults',()=>{
  const result=normalizeSettings({instruments:{guitar:{noteLabels:'true',playbackNotes:1,fingeringCharts:true,fretDots:true,seventhChords:false},unknown:{complexity:.35}}});
  assert.deepEqual(result.instruments.guitar,{complexity:1.5,noteLabels:false,playbackNotes:false,fingeringCharts:true,fretDots:true,seventhChords:false,harmonyHints:'notes'});
  assert.deepEqual(Object.keys(result.instruments),Object.keys(INSTRUMENTS));
});

test('storage loads migrate legacy settings and safely recover from missing or malformed data',()=>{
  const legacy={preset:'Balanced',instruments:{piano:{complexity:1},guitar:{complexity:.45,noteLabels:true}}};
  assert.deepEqual(loadSettings({getItem(key){assert.equal(key,SETTINGS_KEY);return JSON.stringify(legacy);}}),normalizeSettings(legacy));
  for(const saved of [null,'','{broken','null','[]','42'])assert.deepEqual(loadSettings({getItem(){return saved;}}),defaultSettings());
  assert.deepEqual(loadSettings({getItem(){throw Error('unavailable');}}),defaultSettings());
  assert.deepEqual(loadSettings(undefined),defaultSettings());
});

test('harmony hints migrate to subtle notes and preserve only supported per-instrument choices',()=>{
  for(const mode of ['off','notes','name']){
    const result=normalizeSettings({instruments:{guitar:{complexity:.35,harmonyHints:mode}}});
    assert.equal(result.instruments.guitar.harmonyHints,mode);
    assert.equal(result.instruments.piano.harmonyHints,'notes');
    assert.deepEqual(normalizeSettings(result),result);
  }
  for(const invalid of [undefined,null,true,1,'chord','NAME'])assert.equal(normalizeSettings({instruments:{piano:{harmonyHints:invalid}}}).instruments.piano.harmonyHints,'notes');
});

test('sound reset restores current catalog gains without changing instrument state or settings',()=>{
  const settings=defaultSettings();settings.instruments.piano.harmonyHints='name';settings.instruments.guitar.complexity=.35;
  const instruments=Object.fromEntries(Object.entries(INSTRUMENTS).map(([name,value])=>[name,{...value,volume:-18,active:name==='piano'}]));
  const snapshot=structuredClone({settings,instruments});
  const reset=resetSoundMix(instruments);
  assert.equal(reset.sceneVolume,-4);
  assert.deepEqual(reset.volumes,defaultSoundMix().volumes);
  for(const [name,instrument] of Object.entries(reset.instruments))assert.deepEqual(instrument,{...instruments[name],volume:INSTRUMENTS[name].volume});
  assert.deepEqual({settings,instruments},snapshot);
});