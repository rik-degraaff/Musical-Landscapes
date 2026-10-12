import test from 'node:test';
import assert from 'node:assert/strict';
import { capturePracticeSnapshot, restorePracticeSnapshot, findPhraseIndex } from '../src/audio/session.js';
import { equippedProfile } from '../src/utils/difficulty.js';
import { INSTRUMENTS } from '../src/utils/music.js';

test('phrase matching preserves all event data, ordering and duplicate pitches', () => {
  const phrase = { events: [{ time: '0:0:0', dur: '4n', notes: ['C4', 'C4', 'E4'], velocity: .7, chord: 'C', fingering: [{ string: 0, fret: 3, note: 'C4' }, { string: 1, fret: 1, note: 'C4' }] }] };
  const copy = structuredClone(phrase);
  assert.equal(findPhraseIndex([copy], phrase), 0);
  for (const change of [
    event => { event.velocity = .8; },
    event => { event.fingering[0].fret = 4; },
    event => { event.fingering.reverse(); },
    event => { event.notes.shift(); },
    event => { event.notes.reverse(); },
    event => { event.time = '0:1:0'; },
    event => { event.dur = '8n'; },
    event => { event.extra = undefined; },
  ]) {
    const different = structuredClone(phrase);
    change(different.events[0]);
    assert.equal(findPhraseIndex([different, copy], phrase), 1);
  }
  assert.equal(findPhraseIndex([copy], null), -1);
  assert.equal(findPhraseIndex([phrase, copy], phrase), 0);
});

test('pinned phrase identity survives eviction from the 96-entry profile cache', () => {
  const initial = equippedProfile('guitar', 'C', { complexity: 1.5 });
  const selectedIndex = initial.phrases.length - 1;
  const phrase = initial.phrases[selectedIndex];
  const roots = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  for (const name of Object.keys(INSTRUMENTS)) for (const root of roots) for (const complexity of [.35, 1, 1.5]) equippedProfile(name, root, { complexity });
  const rebuilt = equippedProfile('guitar', 'C', { complexity: 1.5 });
  assert.notEqual(rebuilt, initial);
  assert.equal(findPhraseIndex(rebuilt.phrases, phrase), selectedIndex);
  assert.deepEqual(rebuilt.phrases[selectedIndex].events, phrase.events);
});

test('practice capture and restore preserve every saved field without sharing active flags', () => {
  const state = { active: { guitar: true, piano: false }, manualInstrument: 'guitar', root: 'Am', metronomeSound: true, tempo: 137, equippedPhrase: { events: [{ notes: ['C4', 'C4'], velocity: .3, fingering: [{ string: 2, fret: 5 }] }] }, phraseIdentity: 'guitar:Am:1', phrasePinned: true };
  const before = structuredClone(state);
  const saved = capturePracticeSnapshot(state);
  state.active.guitar = false;
  const restored = restorePracticeSnapshot(saved);
  assert.deepEqual(restored, before);
  assert.equal(restored.equippedPhrase, state.equippedPhrase);
  assert.notEqual(saved.active, state.active);
  assert.notEqual(restored.active, saved.active);
  restored.active.piano = true;
  assert.equal(saved.active.piano, false);
  assert.deepEqual(Object.keys(saved).sort(), ['active', 'manual', 'root', 'metronomeSound', 'tempo', 'equippedPhrase', 'phraseIdentity', 'phrasePinned'].sort());
});