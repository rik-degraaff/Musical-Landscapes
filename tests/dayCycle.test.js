import test from 'node:test';
import assert from 'node:assert/strict';
import { DAY_PHASES, celestialPosition, nextDayPhase } from '../src/utils/dayCycle.js';

test('sun progresses left to right across a day with midday at the apex', () => {
  const positions = ['dawn', 'farm', 'garden', 'pond', 'dusk'].map(scene => celestialPosition(DAY_PHASES[scene]));
  for (let index = 1; index < positions.length; index++) assert.ok(positions[index].x > positions[index - 1].x);
  assert.equal(positions[2].x, 50);
  assert.equal(positions[2].y, 11);
  assert.ok(positions[0].y > positions[1].y);
  assert.ok(positions[4].y > positions[3].y);
  assert.ok(positions.every(position => !position.moon));
});

test('night follows sunset and dawn wraps forward, including interrupted transitions', () => {
  const night = nextDayPhase(DAY_PHASES.dusk, 'night');
  const dawn = nextDayPhase(night, 'dawn');
  assert.equal(night, 1.5);
  assert.equal(dawn, 2.04);
  assert.equal(nextDayPhase(dawn, 'farm'), 2.22);
  assert.ok(celestialPosition(night).moon);
  assert.ok(!celestialPosition(dawn).moon);
  assert.equal(nextDayPhase(0.7, 'dusk'), 0.96);
});