import test from 'node:test';
import assert from 'node:assert/strict';
import { DRUM_HITS, INSTRUMENTS, nearestBar, patterns, transposeEvents } from '../src/utils/music.js';

test('every instrument has several authored, well-formed bars', () => {
  assert.deepEqual([...Object.keys(patterns)].sort(), [...Object.keys(INSTRUMENTS)].sort());

  for (const [name, bars] of Object.entries(patterns)) {
    assert.ok(bars.length >= 6, `${name} needs a varied phrase library`);
    for (const bar of bars) {
      assert.ok(bar.energy >= 0 && bar.energy <= 1);
      assert.ok(bar.complexity >= 0 && bar.complexity <= 1);
      assert.ok(bar.events.length > 0);
      for (const event of bar.events) {
        assert.match(event.time, /^0:[0-3]:[0-3]$/);
        if (event.dur) assert.match(event.dur, /^(1m|[1248]n\.?)$/);
        if (event.note && name === 'drums') assert.ok(DRUM_HITS.has(event.note));
        if (event.note && name !== 'drums') assert.match(event.note, /^[A-G]#?\d+$/);
        for (const note of event.notes ?? []) assert.match(note, /^[A-G]#?\d+$/);
      }
    }
  }
});

test('nearest bar chooses the closest energy and complexity point', () => {
  const bars = [
    { energy: 0.1, complexity: 0.9, label: 'sparse-loud' },
    { energy: 0.8, complexity: 0.2, label: 'busy-soft' },
  ];
  assert.equal(nearestBar(bars, 0.75, 0.25).label, 'busy-soft');
  assert.equal(nearestBar(bars, 0.12, 0.88).label, 'sparse-loud');
});

test('root transposition moves pitched notes and leaves every drum voice unchanged', () => {
  const drumEvents = [...DRUM_HITS].map(note => ({ note, time: '0:0:0' }));
  assert.deepEqual(transposeEvents(drumEvents, 'A').map(event => event.note), [...DRUM_HITS]);
  const triad = [{ notes: ['C4', 'E4', 'G4'], time: '0:0:0' }];
  assert.deepEqual(transposeEvents(triad, 'C')[0].notes, ['C4', 'E4', 'G4']);
  assert.deepEqual(transposeEvents(triad, 'G')[0].notes, ['G4', 'B4', 'D5']);
  assert.deepEqual(transposeEvents(triad, 'F')[0].notes, ['F4', 'A4', 'C5']);
  assert.deepEqual(transposeEvents(triad, 'A')[0].notes, ['A4', 'C#5', 'E5']);
});
