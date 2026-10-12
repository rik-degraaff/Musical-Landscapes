import test from 'node:test';
import assert from 'node:assert/strict';
import { disconnectManualVoice, finishManualVoice } from '../src/audio/manualVoice.js';

test('disposed retiring voices stay tracked until ended and disconnect once', () => {
  const calls = [];
  const voice = { source: { disconnect: () => calls.push('source') }, envelope: { disconnect: () => calls.push('envelope') } };
  const active = new Map();
  const retiring = new Set([voice]);
  disconnectManualVoice(voice);
  disconnectManualVoice(voice);
  assert.equal(retiring.has(voice), true);
  finishManualVoice(voice, 'key', active, retiring);
  finishManualVoice(voice, 'key', active, retiring);
  assert.equal(retiring.size, 0);
  assert.deepEqual(calls, ['source', 'envelope']);
});

test('old onended removes only its voice, not a retry using the same token', () => {
  const voice = { source: { disconnect() {} }, envelope: { disconnect() {} } };
  const replacement = {};
  const active = new Map([['key', replacement]]);
  const retiring = new Set([voice]);
  finishManualVoice(voice, 'key', active, retiring);
  assert.equal(active.get('key'), replacement);
  assert.equal(retiring.size, 0);
});