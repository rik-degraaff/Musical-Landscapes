import test from 'node:test';
import assert from 'node:assert/strict';
import { createUpdatePolicy, observeAppUpdates } from '../src/utils/updatePolicy.js';

const menu = { started: false, loading: false, parentGuide: false };

function worker() {
  const target = new EventTarget();
  target.messages = [];
  target.postMessage = message => target.messages.push(message);
  return target;
}

test('retains an early event before a subscriber and apply function exist', async () => {
  const policy = createUpdatePolicy();
  policy.requestUpdate();
  assert.equal(policy.getSnapshot(), true);
  assert.equal(await policy.applyWhenSafe(() => menu), false);
  let calls = 0;
  let notifications = 0;
  const unsubscribe = policy.subscribe(() => notifications++);
  policy.setApplyUpdate(() => calls++);
  assert.equal(await policy.applyWhenSafe(() => menu), true);
  assert.equal(calls, 1);
  assert.equal(notifications, 2);
  assert.equal(policy.getSnapshot(), false);
  unsubscribe();
  policy.requestUpdate();
  assert.equal(notifications, 2);
});

test('notifies an existing consumer when a late apply function becomes ready', async () => {
  const policy = createUpdatePolicy();
  let calls = 0;
  const unsubscribe = policy.subscribe(() => { void policy.applyWhenSafe(() => menu); });
  policy.requestUpdate();
  assert.equal(calls, 0);
  policy.setApplyUpdate(() => calls++);
  await Promise.resolve();
  assert.equal(calls, 1);
  assert.equal(policy.getSnapshot(), false);
  unsubscribe();
});

test('requires an explicitly safe menu, including the latest provider state', async () => {
  let calls = 0;
  const policy = createUpdatePolicy({ applyUpdate: () => calls++ });
  policy.requestUpdate();
  for (const state of [undefined, {}, { ...menu, started: true }, { ...menu, loading: true }, { ...menu, parentGuide: true }]) {
    assert.equal(await policy.applyWhenSafe(() => state), false);
    assert.equal(policy.getSnapshot(), true);
  }
  let current = { ...menu, loading: true };
  const provider = () => current;
  assert.equal(await policy.applyWhenSafe(provider), false);
  current = menu;
  assert.equal(await policy.applyWhenSafe(provider), true);
  assert.equal(calls, 1);
});

test('deduplicates repeated events and concurrent application', async () => {
  let complete;
  let calls = 0;
  let notifications = 0;
  const policy = createUpdatePolicy({ applyUpdate: () => {
    calls++;
    return new Promise(resolve => { complete = resolve; });
  } });
  policy.subscribe(() => notifications++);
  policy.requestUpdate();
  policy.requestUpdate();
  const applying = policy.applyWhenSafe(() => menu);
  assert.equal(await policy.applyWhenSafe(() => menu), false);
  assert.equal(calls, 1);
  assert.equal(notifications, 1);
  complete();
  assert.equal(await applying, true);
  assert.equal(notifications, 2);
  assert.equal(await policy.applyWhenSafe(() => menu), false);
});

test('keeps a failed update pending for a later safe attempt', async () => {
  const policy = createUpdatePolicy({ applyUpdate: () => { throw new Error('offline'); } });
  policy.requestUpdate();
  assert.equal(await policy.applyWhenSafe(() => menu), false);
  assert.equal(policy.getSnapshot(), true);
  policy.setApplyUpdate(() => Promise.reject(new Error('offline')));
  assert.equal(await policy.applyWhenSafe(() => menu), false);
  policy.setApplyUpdate(() => {});
  assert.equal(await policy.applyWhenSafe(() => menu), true);
});

test('first installation activates without requesting an update or reloading', async () => {
  const policy = createUpdatePolicy();
  const serviceWorkers = new EventTarget();
  serviceWorkers.controller = null;
  const registration = new EventTarget();
  registration.installing = worker();
  registration.active = null;
  registration.waiting = null;
  let reloads = 0;
  const cleanup = observeAppUpdates(registration, serviceWorkers, { policy, reload: () => reloads++ });
  registration.installing.dispatchEvent(new Event('statechange'));
  serviceWorkers.controller = registration.installing;
  serviceWorkers.dispatchEvent(new Event('controllerchange'));
  assert.equal(policy.getSnapshot(), false);
  assert.equal(await policy.applyWhenSafe(() => menu), false);
  assert.equal(reloads, 0);
  cleanup();
});

test('detects already waiting workers and reloads only after explicit activation', async () => {
  const policy = createUpdatePolicy();
  const serviceWorkers = new EventTarget();
  serviceWorkers.controller = worker();
  const registration = new EventTarget();
  registration.active = serviceWorkers.controller;
  registration.waiting = worker();
  let reloads = 0;
  const cleanup = observeAppUpdates(registration, serviceWorkers, { policy, reload: () => reloads++ });
  assert.equal(policy.getSnapshot(), true);
  serviceWorkers.dispatchEvent(new Event('controllerchange'));
  assert.equal(reloads, 0);
  assert.equal(await policy.applyWhenSafe(() => ({ ...menu, started: true })), false);
  assert.deepEqual(registration.waiting.messages, []);
  assert.equal(await policy.applyWhenSafe(() => menu), true);
  assert.deepEqual(registration.waiting.messages, [{ type: 'SKIP_WAITING' }]);
  serviceWorkers.dispatchEvent(new Event('controllerchange'));
  assert.equal(reloads, 0);
  serviceWorkers.controller = registration.waiting;
  serviceWorkers.dispatchEvent(new Event('controllerchange'));
  serviceWorkers.dispatchEvent(new Event('controllerchange'));
  assert.equal(reloads, 1);
  cleanup();
});

test('observes a later installing worker and removes listeners on cleanup', async () => {
  const policy = createUpdatePolicy();
  const serviceWorkers = new EventTarget();
  serviceWorkers.controller = worker();
  const registration = new EventTarget();
  registration.active = serviceWorkers.controller;
  registration.waiting = null;
  registration.installing = null;
  const cleanup = observeAppUpdates(registration, serviceWorkers, { policy, reload: () => assert.fail('unexpected reload') });
  registration.installing = worker();
  registration.dispatchEvent(new Event('updatefound'));
  registration.waiting = registration.installing;
  registration.installing.dispatchEvent(new Event('statechange'));
  assert.equal(policy.getSnapshot(), true);
  cleanup();
  assert.equal(await policy.applyWhenSafe(() => menu), false);
  assert.deepEqual(registration.waiting.messages, []);
  const otherPolicy = createUpdatePolicy();
  const remove = observeAppUpdates(registration, serviceWorkers, { policy: otherPolicy });
  await otherPolicy.applyWhenSafe(() => menu);
  remove();
  registration.installing = worker();
  registration.dispatchEvent(new Event('updatefound'));
  registration.installing.dispatchEvent(new Event('statechange'));
  assert.equal(otherPolicy.getSnapshot(), false);
});

test('controller activation after menu reentry waits for the next safe menu before reload',async()=>{
  const policy=createUpdatePolicy();
  const serviceWorkers=new EventTarget();serviceWorkers.controller=worker();
  const registration=new EventTarget();registration.active=serviceWorkers.controller;registration.waiting=worker();
  let state=menu,reloads=0;
  const cleanup=observeAppUpdates(registration,serviceWorkers,{policy,reload:()=>reloads++});
  await policy.applyWhenSafe(()=>state);
  state={...menu,parentGuide:true};
  serviceWorkers.controller=registration.waiting;registration.waiting=null;
  serviceWorkers.dispatchEvent(new Event('controllerchange'));
  assert.equal(reloads,0);assert.equal(policy.getSnapshot(),true);
  assert.equal(await policy.applyWhenSafe(()=>state),false);
  state=menu;
  assert.equal(await policy.applyWhenSafe(()=>state),true);
  assert.equal(reloads,1);assert.equal(policy.getSnapshot(),false);
  cleanup();
});