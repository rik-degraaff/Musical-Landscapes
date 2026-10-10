import test from 'node:test';
import assert from 'node:assert/strict';
import { DAY_PHASES, SCENE_ROOTS, celestialPosition, nextDayPhase } from '../src/utils/dayCycle.js';

test('scene roots are unique around a circle-of-fifths day/night route',()=>{
  const ids=['farm','garden','pond','dusk','night','lateNight','dawn'];
  const roots=ids.map(id=>SCENE_ROOTS[id]);
  assert.deepEqual(roots,['C','G','D','A','E','B','F#']);
  assert.equal(new Set(roots).size,roots.length);
});

test('sun progresses left to right across a day with midday at the apex', () => {
  const positions = ['dawn', 'farm', 'garden', 'pond', 'dusk'].map(scene => celestialPosition(DAY_PHASES[scene]));
  for (let index = 1; index < positions.length; index++) assert.ok(positions[index].x > positions[index - 1].x);
  assert.equal(positions[2].x, 50);
  assert.equal(positions[2].y, 11);
  assert.ok(positions[0].y > positions[1].y);
  assert.ok(positions[4].y > positions[3].y);
  assert.ok(positions.every(position => !position.moon));
});

test('the moon travels from left to right across two night scenes before dawn', () => {
  const night = nextDayPhase(DAY_PHASES.dusk, 'night');
  const lateNight = nextDayPhase(night, 'late-night');
  const dawn = nextDayPhase(lateNight, 'dawn');
  assert.equal(night, 1.28);
  assert.equal(lateNight, 1.68);
  assert.equal(dawn, 2.04);
  assert.equal(nextDayPhase(dawn, 'farm'), 2.22);
  const firstMoon=celestialPosition(night),secondMoon=celestialPosition(lateNight);
  assert.ok(firstMoon.moon&&secondMoon.moon);
  assert.ok(firstMoon.x<secondMoon.x);
  assert.ok(Math.abs(firstMoon.x-33.28)<1e-8);
  assert.ok(Math.abs(secondMoon.x-63.68)<1e-8);
  assert.ok(!celestialPosition(dawn).moon);
  assert.equal(nextDayPhase(0.7, 'dusk'), 0.96);
});