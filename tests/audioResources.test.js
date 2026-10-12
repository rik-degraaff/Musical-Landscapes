import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioResources } from '../src/audio/resources.js';

test('resources dispose once and never dispose another attempt', () => {
  const first = new AudioResources();
  const retry = new AudioResources();
  let firstDisposals = 0;
  let retryDisposals = 0;
  const resource = { dispose: () => firstDisposals++ };
  first.own(resource);
  first.own(resource);
  retry.own({ dispose: () => retryDisposals++ });
  first.dispose();
  first.dispose();
  assert.equal(firstDisposals, 1);
  assert.equal(retryDisposals, 0);
  assert.throws(() => first.own({}), /cancelled/);
});

test('cancelled loads cannot publish and dispose only after late completion', async () => {
  const scope = new AudioResources();
  let complete;
  let disposed = 0;
  let published = false;
  const resource = { dispose: () => disposed++ };
  const loading = scope.load(resource, () => new Promise(resolve => { complete = resolve; }))
    .then(() => { published = true; });
  scope.dispose();
  await scope.cancelled;
  assert.equal(disposed, 0);
  complete();
  await assert.rejects(loading, /cancelled/);
  assert.equal(published, false);
  assert.equal(disposed, 1);
  scope.dispose();
  assert.equal(disposed, 1);
});

test('failed and successful siblings both release their owned resources', async () => {
  const scope = new AudioResources();
  let complete;
  const counts = [0, 0];
  const failed = scope.load({ dispose: () => counts[0]++ }, () => Promise.reject(new Error('load failed')));
  const delayed = scope.load({ dispose: () => counts[1]++ }, () => new Promise(resolve => { complete = resolve; }));
  await assert.rejects(failed, /load failed/);
  scope.dispose();
  assert.deepEqual(counts, [1, 0]);
  complete();
  await assert.rejects(delayed, /cancelled/);
  assert.deepEqual(counts, [1, 1]);
});