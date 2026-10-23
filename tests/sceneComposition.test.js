import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENE_SOUNDS} from '../src/audio/sceneSounds.js';
import {OBJECT_PLACEMENT,sceneObjectGeometry,habitatAnchor,landmarkGeometry} from '../src/utils/sceneComposition.js';

const sizes=[{width:360,height:240},{width:360,height:130},{width:780,height:284},{width:780,height:165},{width:700,height:700},{width:1180,height:250},{width:1440,height:900},{width:1920,height:1080}];

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
