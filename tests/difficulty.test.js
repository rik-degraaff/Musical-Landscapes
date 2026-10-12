import test from 'node:test';
import assert from 'node:assert/strict';
import {INSTRUMENTS,nearestBar,patterns,transposeEvents} from '../src/utils/music.js';
import {buildEquippedProfile,equippedProfile} from '../src/utils/difficulty.js';
import {STRING_INSTRUMENTS,voiceStringEvent} from '../src/utils/guitar.js';
import {noteMidi,trumpetInput} from '../src/utils/autoplay.js';
import {fluteInput} from '../src/utils/wind.js';
import {midiNote,PIANO_NOTES,MARIMBA_NOTES,PANFLUTE_NOTES} from '../src/utils/performance.js';

const ROOTS=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B','C#m','Am','Fm','Db'];

function signature(phrase) {return JSON.stringify(phrase.events.map(event=>[event.time,event.dur,event.notes??event.note]));}
function referenceProfile(name,root,options={}) {
  const complexity=options.complexity??1;
  const tier=complexity<=.5?0:complexity<=1?1:2;
  const library=STRING_INSTRUMENTS[name]?.library[root];
  const chordPools=[0,1,2].map(index=>(library?.chords??[]).filter(chord=>index===2||chord.size===3&&(index===0?[0,3,4].includes(chord.degree):chord.degree<6)));
  const hitPools=[['kick','snare','hat'],['kick','snare','hat','shaker','tom','clap','rim'],['kick','snare','hat','shaker','tom','clap','rim','crash','ride','floorTom']];
  const source=library?.phrases??patterns[name].map(phrase=>({...phrase,events:transposeEvents(phrase.events,root)}));
  function fitPitch(value,index) {
    const accepts=note=>name==='flute'?(fluteInput(note)?.register??99)<index+1:name==='melody'?(trumpetInput(note)?.partial??99)<(index+1)*2:PANFLUTE_NOTES.includes(note);
    return [0,-12,12,-24,24].map(shift=>shift===0?value:midiNote(noteMidi(value)+shift)).find(accepts)??null;
  }
  function prepare(index) {
    const prepared=[];
    for(const [tierSource,phrase] of source.entries()){
      const events=[];
      for(const authored of phrase.events){
        let event={...authored};
        if(index===0&&name==='piano'&&event.notes?.length>2)event.notes=[event.notes[0],event.notes.at(-1)];
        if(['flute','melody','panflute'].includes(name)){
          if(event.notes)event.notes=event.notes.map(value=>fitPitch(value,index));
          if(event.note)event.note=fitPitch(event.note,index);
          if((event.notes??[event.note]).some(value=>!value))break;
        }
        if(library){
          const pitches=(event.notes??[event.note]).map(value=>noteMidi(value)%12);
          const candidates=chordPools[index].filter(chord=>pitches.every(pitch=>chord.tones.includes(pitch))).map(chord=>({chord,event:voiceStringEvent(event,chord)})).filter(value=>value.event);
          candidates.sort((first,second)=>Number(second.chord.name===authored.chord)-Number(first.chord.name===authored.chord)||Number(second.chord.tones[0]===pitches[0])-Number(first.chord.tones[0]===pitches[0])||first.chord.degree-second.chord.degree);
          if(!candidates.length)break;
          event=candidates[0].event;
        }
        if(name==='drums'&&!hitPools[index].includes(event.note))break;
        events.push(event);
      }
      if(events.length===phrase.events.length)prepared.push({...phrase,tierSource,events});
    }
    return prepared;
  }
  function unique(phrases) {
    return phrases.filter((phrase,index)=>phrases.findIndex(value=>signature(value)===signature(phrase))===index);
  }
  function suitable(phrase,index) {
    const maxNotes=library?4:name==='piano'?index+2:1;
    return phrase.complexity<=[.3,.65][index]&&phrase.events.length<=[4,8][index]&&phrase.events.every(event=>(index===0?[0]:[0,2]).includes(Number(event.time.split(':')[2]))&&(event.notes?.length??1)<=maxNotes);
  }
  const simple=unique(prepare(0).filter(phrase=>suitable(phrase,0)));
  const standardOnly=unique(prepare(1).filter(phrase=>suitable(phrase,1)&&!simple.some(value=>value.tierSource===phrase.tierSource)));
  assert.ok(simple.length>=2&&standardOnly.length>=2,`${name} ${root} reference tier coverage`);
  const phrases=tier===0?simple:tier===1?[...simple,...standardOnly]:unique(prepare(2));
  const notes=name==='drums'?[]:[...new Set(phrases.flatMap(phrase=>phrase.events.flatMap(event=>event.notes??[event.note])))].sort((first,second)=>noteMidi(first)-noteMidi(second));
  const keyboardNotes=notes.length?Array.from({length:noteMidi(notes.at(-1))-noteMidi(notes[0])+1},(_,index)=>midiNote(noteMidi(notes[0])+index)):[];
  return {level:['Simple','Standard','Advanced'][tier],phrases,chords:chordPools[tier],notes,keyboardNotes,hits:hitPools[tier],registers:(tier+1)*2,fluteRegisters:tier+1};
}
function referenceNearest(bars,energy,complexity) {
  const ranked=bars.map((bar,index)=>({bar,index,distance:(bar.energy-energy)**2+(bar.complexity-complexity)**2}));
  return ranked.filter(value=>Number.isFinite(value.distance)).sort((first,second)=>first.distance-second.distance||first.index-second.index)[0]?.bar??bars[0];
}
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
        const source=transposeEvents(patterns[name][phrase.tierSource].events,root,{preserveUnisons:true})[phrase.events.indexOf(event)];
        assert.deepEqual((event.notes??[event.note]).map(note=>noteMidi(note)%12),(source.notes??[source.note]).map(note=>noteMidi(note)%12));
        for(const note of event.notes??[event.note])assert.ok(chord.tones.includes(noteMidi(note)%12));
        assert.equal(event.fingering.length,(event.notes??[event.note]).length);
        assert.equal(new Set(event.fingering.map(input=>input.string)).size,event.fingering.length);
        event.fingering.forEach((input,index)=>{
          assert.equal(input.note,(event.notes??[event.note])[index]);
          assert.equal(input.note,chord.notes[input.string]);
          assert.equal(input.fret,chord.frets[input.string]);
        });
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

test('cached and uncached profiles match an independent reference for every instrument, supported key and normalized tier',()=>{
  const tonics=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B','Db','Eb','Gb','Ab','Bb'];
  const roots=tonics.flatMap(root=>[root,`${root}m`]);
  assert.equal(Object.keys(INSTRUMENTS).length,8);
  for(const name of Object.keys(INSTRUMENTS))for(const root of STRING_INSTRUMENTS[name]?Object.keys(STRING_INSTRUMENTS[name].library):roots){
    for(const complexity of [undefined,null,-Infinity,-1,0,.35,.5,.50001,1,1.00001,1.5,Infinity,NaN]){
      const options={complexity,noteLabels:false,playbackNotes:false,fingeringCharts:true};
      const cached=equippedProfile(name,root,options),uncached=buildEquippedProfile(name,root,options);
      const reference=referenceProfile(name,root,options);
      assert.deepEqual(cached,reference,`${name} ${root} ${complexity} cached`);
      assert.deepEqual(uncached,reference,`${name} ${root} ${complexity} uncached`);
      for(const energy of [0,.25,.5,.75,1,Infinity,-Infinity,NaN])for(const selectionComplexity of [0,.5,1,Infinity,NaN]){
        assert.deepEqual(nearestBar(cached.phrases,energy,selectionComplexity),referenceNearest(reference.phrases,energy,selectionComplexity));
      }
    }
  }
});

test('reference selection preserves first-on-tie and first-bar fallback for nonfinite distances',()=>{
  const bars=[{energy:1,complexity:1},{energy:0,complexity:0}];
  for(const select of [nearestBar,referenceNearest]){
    assert.equal(select(bars,0,0),bars[1]);
    assert.equal(select(bars,.5,.5),bars[0]);
    for(const value of [Infinity,-Infinity,NaN]){
      assert.equal(select(bars,value,0),bars[0]);
      assert.equal(select(bars,0,value),bars[0]);
    }
    assert.equal(select([],0,0),undefined);
  }
});

test('cache hits use name, root and normalized difficulty, independently of display options',()=>{
  const options={complexity:.35,noteLabels:false,playbackNotes:false,fingeringCharts:false};
  const before=structuredClone(options);
  const simple=equippedProfile('guitar','C',options);
  assert.equal(equippedProfile('guitar','C',{complexity:.5,noteLabels:true,playbackNotes:true,fingeringCharts:true}),simple);
  const standard=equippedProfile('guitar','C');
  assert.equal(equippedProfile('guitar','C',{complexity:.75}),standard);
  const advanced=equippedProfile('guitar','C',{complexity:1.5});
  assert.equal(equippedProfile('guitar','C',{complexity:2}),advanced);
  for(const other of [standard,advanced,equippedProfile('ukulele','C',options),equippedProfile('guitar','D',options)])assert.notEqual(other,simple);
  assert.deepEqual(options,before);
  assert.notEqual(buildEquippedProfile('guitar','C',options),buildEquippedProfile('guitar','C',options));
});

test('cached profiles reject deep mutations without freezing or modifying authored libraries',()=>{
  const authored={patterns,libraries:Object.fromEntries(Object.entries(STRING_INSTRUMENTS).map(([name,value])=>[name,value.library]))};
  const before=structuredClone(authored);
  function assertFrozen(value,frozen) {
    if(!value||typeof value!=='object')return;
    assert.equal(Object.isFrozen(value),frozen);
    for(const nested of Object.values(value))assertFrozen(nested,frozen);
  }
  for(const name of Object.keys(INSTRUMENTS))for(const complexity of [.35,1,1.5]){
    const profile=equippedProfile(name,'C',{complexity});
    const snapshot=structuredClone(profile);
    assertFrozen(profile,true);
    assert.throws(()=>{profile.level='Other';},TypeError);
    assert.throws(()=>profile.phrases.push({}),TypeError);
    assert.throws(()=>{profile.phrases[0].events[0].time='0:3:3';},TypeError);
    assert.throws(()=>profile.hits.reverse(),TypeError);
    if(profile.phrases[0].events[0].notes)assert.throws(()=>profile.phrases[0].events[0].notes.push('C9'),TypeError);
    if(profile.chords.length){
      assert.throws(()=>{profile.chords[0].frets[0]=99;},TypeError);
      assert.throws(()=>{profile.phrases[0].events[0].fingering[0].fret=99;},TypeError);
      const derived=buildEquippedProfile(name,'C',{complexity});
      derived.chords[0].frets[0]=99;derived.phrases[0].events[0].fingering[0].fret=99;
    }
    assert.deepEqual(equippedProfile(name,'C',{complexity}),snapshot);
  }
  assertFrozen(authored,false);
  assert.deepEqual(authored,before);
});

test('96-entry LRU promotes cache hits and evicts old profiles without changing musical ordering',()=>{
  const entries=Object.keys(INSTRUMENTS).flatMap(name=>ROOTS.flatMap(root=>[.35,1,1.5].map(complexity=>({name,root,options:{complexity}}))));
  const get=entry=>equippedProfile(entry.name,entry.root,entry.options);
  for(const name of ['piano','guitar','ukulele']){
    const target=entries.find(entry=>entry.name===name&&entry.root==='Db'&&entry.options.complexity===1.5);
    const ordered=[target,...entries.filter(entry=>entry!==target)];
    const initial=ordered.slice(0,96).map(get);
    assert.equal(get(ordered[0]),initial[0]);
    get(ordered[96]);
    assert.equal(get(ordered[0]),initial[0]);
    for(let index=2;index<96;index++)assert.equal(get(ordered[index]),initial[index]);
    assert.notEqual(get(ordered[1]),initial[1]);
    for(const entry of ordered.slice(97))get(entry);
    const rebuilt=get(target);
    assert.notEqual(rebuilt,initial[0]);
    assert.deepEqual(rebuilt,initial[0]);
    assert.deepEqual(rebuilt,referenceProfile(target.name,target.root,target.options));
    if(STRING_INSTRUMENTS[name])for(const phrase of rebuilt.phrases)for(const event of phrase.events){
      const chord=rebuilt.chords.find(value=>value.name===event.chord);
      event.fingering.forEach((input,index)=>{
        assert.equal(input.note,(event.notes??[event.note])[index]);
        assert.equal(input.note,chord.notes[input.string]);
        assert.equal(input.fret,chord.frets[input.string]);
        assert.equal(noteMidi(input.note),noteMidi(STRING_INSTRUMENTS[name].tuning[input.string])+input.fret);
      });
    }
  }
});