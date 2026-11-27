import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENE_VISITORS,chooseSceneVisitor,sceneObjectPair} from '../src/utils/sceneVisitors.js';
import {ENVIRONMENTS,JUNGLE_SCENES} from '../src/data/environments.js';

test('each environment has seven scenes with distinct visitors and exact 1/4 and 1/20 selection bands',()=>{
  for(const {scenes} of Object.values(ENVIRONMENTS)){
    assert.equal(scenes.length,7);
    assert.equal(new Set(scenes.flatMap(scene=>SCENE_VISITORS[scene].map(visitor=>visitor.sound))).size,14);
  }
  assert.deepEqual(Object.values(ENVIRONMENTS).flatMap(environment=>environment.scenes).sort(),Object.keys(SCENE_VISITORS).sort());
  for(const [scene,visitors] of Object.entries(SCENE_VISITORS)){
    assert.equal(visitors.length,2);
    assert.equal(chooseSceneVisitor(scene,0),visitors[0]);assert.equal(chooseSceneVisitor(scene,.249999),visitors[0]);
    assert.equal(chooseSceneVisitor(scene,.25),visitors[1]);assert.equal(chooseSceneVisitor(scene,.299999),visitors[1]);
    assert.equal(chooseSceneVisitor(scene,.30),null);assert.equal(chooseSceneVisitor(scene,.999999),null);
    const counts=[0,0,0];
    for(let index=0;index<200;index++){const visitor=chooseSceneVisitor(scene,(index+.5)/200);counts[visitor===visitors[0]?0:visitor===visitors[1]?1:2]++;}
    assert.deepEqual(counts,[50,10,140]);
    assert.deepEqual(visitors.map(visitor=>visitor.slot).sort(),[0,1]);
  }
});

test('each Jungle animal belongs to one scene and appears only in the Jungle',()=>{
  const farmSounds=new Set([
    'moo','tractor','water','bird','frog','windmill','cricket','airplane','bell','owl','bat','hedgehog','rooster','chimes',
    ...ENVIRONMENTS.farm.scenes.flatMap(scene=>SCENE_VISITORS[scene].map(({sound})=>sound)),
  ]);
  const jungleSounds=Object.values(JUNGLE_SCENES).flatMap(({residents,visitors})=>
    [...residents,...visitors].map(({sound})=>sound));
  assert.equal(jungleSounds.length,28);
  assert.equal(new Set(jungleSounds).size,jungleSounds.length);
  assert.deepEqual(jungleSounds.filter(sound=>farmSounds.has(sound)),[]);
  const {residents}=JUNGLE_SCENES['jungle-river'];
  assert.ok(sceneObjectPair('jungle-river',residents,.9).some(({sound})=>sound==='crocodile'));
  assert.ok(sceneObjectPair('jungle-river',residents,.27).some(({sound})=>sound==='crocodile'));
});

test('visitors replace exactly one regular object and leave the input unchanged',()=>{
  const regular=[{sound:'moo',label:'Cow',className:'cow'},{sound:'tractor',label:'Tractor',className:'tractor'}];
  for(const roll of [.1,.27,.8]){
    const pair=sceneObjectPair('farm',regular,roll);assert.equal(pair.length,2);
    assert.equal(pair.filter((object,index)=>object.sound!==regular[index].sound).length,roll<.3?1:0);
    pair.forEach((object,index)=>assert.equal(object.className,regular[index].className));
  }
  assert.equal(regular[0].sound,'moo');
  for(const roll of [-1,1,NaN,Infinity])assert.throws(()=>chooseSceneVisitor('farm',roll),RangeError);
});
