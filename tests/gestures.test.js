import test from 'node:test';
import assert from 'node:assert/strict';
import {gestureFrame} from '../src/utils/gestures.js';

const sample=(gesture,phase,options={})=>gestureFrame({gesture,elapsed:phase*3000,from:{x:10,y:20},to:{x:90,y:80},...options});

test('single and double taps release between contacts and burst only at contact onset',()=>{
  assert.equal(sample('tap',.1).pressed,false);
  assert.equal(sample('tap',.23).pressed,true);
  assert.notEqual(sample('tap',.23).burst,null);
  assert.equal(sample('tap',.32).burst,null);
  assert.equal(sample('tap',.38).pressed,false);
  for(const phase of [.23,.35])assert.equal(sample('double-tap',phase).pressed,true);
  for(const phase of [.1,.29,.5])assert.equal(sample('double-tap',phase).pressed,false);
  assert.notEqual(sample('double-tap',.35).burst,null);
});

test('all movement gestures press before travelling and release at their destination',()=>{
  for(const gesture of ['drag','swipe','tempo']) {
    assert.equal(sample(gesture,.1).pressed,false);
    assert.equal(sample(gesture,.25).x,10);
    for(const phase of [.31,.5,.69]) {
      const frame=sample(gesture,phase);
      assert.equal(frame.pressed,true);
      assert.ok(frame.x>10&&frame.x<90);
      assert.equal(frame.burst,null);
    }
    const released=sample(gesture,.82);
    assert.equal(released.pressed,false);
    assert.equal(released.x,90);
    assert.equal(released.y,80);
    assert.equal(released.opacity,1);
    assert.ok(sample(gesture,.95).opacity<1);
  }
});

test('hold, speed, route, completion and reduced motion use the same timeline',()=>{
  assert.equal(sample('hold',.7).pressed,true);
  assert.equal(sample('hold',.8).pressed,false);
  assert.deepEqual(sample('drag',.25,{speed:2}),sample('drag',.5));
  assert.equal(sample('drag',.5,{waypoints:[{x:40,y:10}]}).x,40);
  const finished=sample('drag',2,{iterations:2});
  assert.equal(finished.finished,true);assert.equal(finished.pressed,false);assert.equal(finished.x,90);
  for(const phase of [.1,.5,.95]) {
    const still=sample('drag',phase,{reduced:true});
    assert.equal(still.x,10);assert.equal(still.pressed,true);assert.equal(still.burst,null);assert.equal(still.opacity,1);
  }
});
