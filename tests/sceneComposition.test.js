import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENE_SOUNDS} from '../src/audio/sceneSounds.js';
import {OBJECT_PLACEMENT,sceneObjectGeometry,habitatAnchor,landmarkGeometry,cloudLayouts,SCENE_SKY_RESIDENTS} from '../src/utils/sceneComposition.js';
import {DAY_PHASES,celestialPosition} from '../src/utils/dayCycle.js';
import {SCENE_VISITORS,sceneObjectPair} from '../src/utils/sceneVisitors.js';

const sizes=[[1440,900],[1024,768],[852,393],[780,284],[640,360],[360,240],[1920,1080],[768,700],[1180,250]]
  .flatMap(([width,height])=>[{width,height},{width,height:height-Math.max(110,Math.min(270,height*.42))}]);

test('weather silhouettes stay inside short worlds and clear of every settled celestial target',()=>{
  for(const size of [...sizes,{width:1180,height:140}])for(const [scene,phase] of Object.entries(DAY_PHASES))for(const cloud of cloudLayouts(size,scene)){
    assert.ok(cloud.left>=0&&cloud.left+cloud.width<=size.width);
    assert.ok(cloud.top>=0&&cloud.y<=size.height);
    const position=celestialPosition(phase),x=size.width*position.x/100,y=Math.max(36,size.height*position.y/100);
    assert.ok(cloud.left>=x+32||cloud.left+cloud.width<=x-32||cloud.top>=y+32||cloud.y<=y-32,`${size.width}×${size.height} ${scene} cloud overlaps sun/moon`);
    for(const sound of [...(SCENE_SKY_RESIDENTS[scene]??[]),...SCENE_VISITORS[scene].map(visitor=>visitor.sound)].filter(sound=>OBJECT_PLACEMENT[sound].habitat==='sky')){
      const box=sceneObjectGeometry(sound,size);
      assert.ok(cloud.left>=box.x+box.width/2||cloud.left+cloud.width<=box.x-box.width/2||cloud.top>=box.y+box.height/2||cloud.y<=box.y-box.height/2,`${size.width}×${size.height} ${scene} cloud overlaps ${sound}`);
    }
  }
});

test('every regular and visitor pair stays separate across full and panel worlds',()=>{
  const residents={farm:['moo','tractor'],garden:['water','bird'],pond:['frog','windmill'],dusk:['cricket','airplane'],night:['bell','owl'],'late-night':['bat','hedgehog'],dawn:['rooster','chimes']};
  for(const size of sizes)for(const [scene,sounds] of Object.entries(residents))for(const roll of [.9,.1,.27]){
    const pair=sceneObjectPair(scene,sounds.map(sound=>({sound})),roll).map(({sound})=>sceneObjectGeometry(sound,size));
    const [one,two]=pair;
    assert.ok(Math.abs(one.x-two.x)>=(one.width+two.width)/2||Math.abs(one.y-two.y)>=(one.height+two.height)/2,`${size.width}×${size.height} ${scene} tier ${roll} overlaps`);
  }
});

test('every sound has a bounded, undistorted target in the real available world',()=>{
  assert.deepEqual(Object.keys(OBJECT_PLACEMENT).sort(),[...SCENE_SOUNDS].sort());
  for(const size of sizes)for(const sound of SCENE_SOUNDS){
    const box=sceneObjectGeometry(sound,size);
    assert.ok(box.width>=44&&box.height>=44,`${sound} touch bounds`);
    assert.ok(Math.abs(box.height/box.width-.875)<1e-10);
    assert.ok(box.x-box.width/2>=3.99&&box.x+box.width/2<=size.width-3.99,`${sound} horizontal bounds`);
    assert.ok(box.y-box.height/2>=3.99&&box.y+box.height/2<=size.height-3.99,`${sound} vertical bounds`);
  }
});

test('opening a performance panel reduces scale without detaching birds from trees',()=>{
  const full={width:780,height:284},panel={width:780,height:165};
  for(const sound of SCENE_SOUNDS)assert.ok(sceneObjectGeometry(sound,panel).width<=sceneObjectGeometry(sound,full).width);
  for(const size of sizes)for(const sound of ['bird','owl','dove','woodpecker','cicada']){
    const box=sceneObjectGeometry(sound,size),anchor=habitatAnchor(sound,size);
    const [x,y]=OBJECT_PLACEMENT[sound].contact;
    assert.ok(Math.abs(box.x+(x/160-.5)*box.width-anchor.x)<.01,`${sound} horizontal contact`);
    assert.ok(Math.abs(box.y+(y/140-.5)*box.height-anchor.y)<.01,`${sound} vertical contact`);
  }
});

test('all house paths begin at a doorway edge in the same world coordinate system',()=>{
  for(const size of sizes)for(const scene of ['farm','garden','dusk','night','dawn']){
    const {door,road}=landmarkGeometry(scene,size);
    const [left,top]=road.match(/^M([\d.]+) ([\d.]+)/).slice(1).map(Number);
    assert.ok(Math.abs(left-(door.x-door.width/2)*1440/size.width)<1e-8);
    assert.ok(Math.abs(top-door.y*900/size.height)<1e-8);
    assert.ok(door.width>0&&door.x>0&&door.y<size.height);
  }
  assert.equal(landmarkGeometry('pond',sizes[0]),null);
  assert.equal(landmarkGeometry('late-night',sizes[0]),null);
});
