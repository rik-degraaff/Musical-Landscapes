import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENE_VISITORS,chooseSceneVisitor,sceneObjectPair} from '../src/utils/sceneVisitors.js';

test('every scene has two unique visitors with exact 1/4 and 1/20 selection bands',()=>{
  const sounds=new Set();
  for(const [scene,visitors] of Object.entries(SCENE_VISITORS)){
    assert.equal(visitors.length,2);
    assert.equal(chooseSceneVisitor(scene,0),visitors[0]);assert.equal(chooseSceneVisitor(scene,.249999),visitors[0]);
    assert.equal(chooseSceneVisitor(scene,.25),visitors[1]);assert.equal(chooseSceneVisitor(scene,.299999),visitors[1]);
    assert.equal(chooseSceneVisitor(scene,.30),null);assert.equal(chooseSceneVisitor(scene,.999999),null);
    const counts=[0,0,0];
    for(let index=0;index<200;index++){const visitor=chooseSceneVisitor(scene,(index+.5)/200);counts[visitor===visitors[0]?0:visitor===visitors[1]?1:2]++;}
    assert.deepEqual(counts,[50,10,140]);
    for(const visitor of visitors){assert.ok(!sounds.has(visitor.sound));sounds.add(visitor.sound);assert.ok([0,1].includes(visitor.slot));}
  }
  assert.equal(sounds.size,14);
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