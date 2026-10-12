import { readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { test as base, expect } from '@playwright/test';

function recordings(directory, prefix = '/audio') {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = `${prefix}/${encodeURIComponent(entry.name)}`;
    if (entry.isDirectory()) return recordings(new URL(`${entry.name}/`, directory), path);
    return /\.(mp3|wav|flac)$/.test(entry.name) ? [path] : [];
  });
}

const audioPaths = recordings(new URL('../../public/audio/', import.meta.url)).sort();
const instrumentNames = ['piano', 'drums', 'guitar', 'melody', 'marimba', 'flute', 'ukulele', 'panflute'];
const selected = instrumentNames.slice(0, 6);
const failedRecording = '/audio/instruments/piano/C3.mp3';

function unexpectedErrors(errors) {
  const optionalFont = 'https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap';
  return errors.filter(error => !(error.type === 'console'
    && error.location?.url === optionalFont
    && error.message === 'Failed to load resource: net::ERR_INTERNET_DISCONNECTED'));
}

const test = base.extend({
  browserErrors: [async ({ context, page }, use, testInfo) => {
    const errors = [];
    context.on('console', message => {
      if (message.type() === 'error') errors.push({ type: 'console', message: message.text(), location: message.location() });
    });
    page.on('pageerror', error => errors.push({ type: 'pageerror', message: error.message }));
    try {
      await use(errors);
    } finally {
      await testInfo.attach('production-browser-errors', {
        body: JSON.stringify(errors, null, 2), contentType: 'application/json',
      });
    }
  }, { auto: true }],
});

async function seedProfile(page) {
  await page.evaluate(({ instrumentNames, selected }) => {
    const settings = {
      selected,
      instruments: Object.fromEntries(instrumentNames.map(name => [name, {
        complexity: 1.5, noteLabels: false, playbackNotes: false,
        fingeringCharts: false, fretDots: false, seventhChords: true,
      }])),
    };
    const child = {
      id: 'release-player', name: 'Release Player', age: '5to7',
      avatar: {
        hair: 'short', top: 'tee', bottom: 'trousers', skin: '#f2c99e',
        hairColor: '#594946', eyes: '#484543', topPrimary: '#de866e',
        topSecondary: '#fff1be', bottomPrimary: '#4e7e93', bottomSecondary: '#e1bd6a',
      },
      profile: { age: '5to7', parent: 'some', music: 'new', instruments: [] },
      settings,
    };
    localStorage.setItem('farmjam-settings-v1', JSON.stringify(settings));
    localStorage.setItem('farmjam-children-v1', JSON.stringify({ children: [child], selectedId: child.id }));
  }, { instrumentNames, selected });
}

async function waitForOfflineReady(page) {
  await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.state),
    { message: 'First installation must activate before a navigation can acquire its controller' }).toBe('activated');
  if (!await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) await page.reload({ waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(async paths => {
    const registration = await navigator.serviceWorker.getRegistration();
    const names = (await caches.keys()).filter(name => name.includes('workbox-precache'));
    const cachedPaths = new Set();
    for (const name of names) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) cachedPaths.add(new URL(request.url).pathname);
    }
    return {
      controlled: Boolean(navigator.serviceWorker.controller),
      activated: registration?.active?.state === 'activated',
      missing: ['/index.html', ...paths].filter(path => !cachedPaths.has(path)),
    };
  }, audioPaths), { message: 'An activated controller and complete HTML/audio precache are required' })
    .toEqual({ controlled: true, activated: true, missing: [] });
}

async function verifyOfflineSession(page, context, testInfo) {
  const session = await context.newCDPSession(page);
  await session.send('Network.enable');
  await session.send('Network.setCacheDisabled', { cacheDisabled: true });
  const servedByWorker = new Map();
  page.on('response', response => {
    const path = new URL(response.url()).pathname;
    if (audioPaths.includes(path)) servedByWorker.set(path, response.fromServiceWorker());
  });
  await context.setOffline(true);
  const response = await page.reload({ waitUntil: 'domcontentloaded' });
  expect(response.fromServiceWorker(), 'Offline navigation must come from the worker, not the HTTP cache').toBe(true);
  await expect(page.getByRole('radio', { name: 'Select Release Player', exact: true })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Tap to play', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  const decoded = await page.evaluate(async paths => {
    const audioContext = new AudioContext();
    const results = [];
    try {
      for (const path of paths) {
        const response = await fetch(path, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Offline recording ${path}: HTTP ${response.status}`);
        const buffer = await audioContext.decodeAudioData(await response.arrayBuffer());
        let peak = 0;
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          for (const value of buffer.getChannelData(channel)) peak = Math.max(peak, Math.abs(value));
        }
        results.push({ path, duration: buffer.duration, channels: buffer.numberOfChannels, peak });
      }
      return results;
    } finally {
      await audioContext.close();
    }
  }, audioPaths);
  await testInfo.attach('offline-recording-decodes', {
    body: JSON.stringify(decoded, null, 2), contentType: 'application/json',
  });
  expect(decoded.map(recording => recording.path)).toEqual(audioPaths);
  for (const name of selected) expect(decoded.some(recording => recording.path.startsWith(`/audio/instruments/${name}/`)), name).toBe(true);
  expect(decoded.some(recording => recording.path.startsWith('/audio/scenery/'))).toBe(true);
  for (const recording of decoded) {
    expect(servedByWorker.get(recording.path), `${recording.path} must be served by the worker offline`).toBe(true);
    expect(recording.duration, recording.path).toBeGreaterThan(0);
    expect(recording.channels, recording.path).toBeGreaterThan(0);
    expect(recording.peak, recording.path).toBeGreaterThan(0);
  }

  await page.getByRole('button', { name: 'Tap to play', exact: true }).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0);
  await expect(page.locator('#young-musician')).toHaveAttribute('data-child-name', 'Release Player');
  await page.locator('#instrument-piano').focus();
  await page.keyboard.press('e');
  const note = page.getByRole('button', { name: 'Piano key C4', exact: true });
  await note.focus();
  await page.keyboard.down('Space');
  await expect(note).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.up('Space');
  await expect(note).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Open settings', exact: true }).dblclick();
  await expect(page.getByRole('dialog', { name: 'Settings', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Return to main menu', exact: true }).click();
  await expect(page.locator('.start-overlay')).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Select Release Player', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Tap to play', exact: true }).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0);
}

test('complete production precache supports offline reload, recordings, keyboard play and menu', async ({ page, context, browserErrors }, testInfo) => {
  await page.goto('/');
  await seedProfile(page);
  await page.reload();
  await waitForOfflineReady(page);
  await verifyOfflineSession(page, context, testInfo);
  expect(unexpectedErrors(browserErrors)).toEqual([]);
});

for (const phase of ['play', 'guide', 'activation-reentry']) test(phase === 'activation-reentry'
  ? 'genuine production worker activation reentry retains a new unsaved guide until cancel, then reloads once without a second SKIP_WAITING'
  : `genuine production worker update waits for ${phase === 'play' ? 'play' : 'unsaved guide'}, then reloads once at a safe menu`, async ({ page, context, browserErrors, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'Worker-owned network routing is only supported here in Chromium');
  const activationReentry = phase === 'activation-reentry';
  const startsInPlay = phase !== 'guide';
  await page.addInitScript(({ holdSkipWaiting }) => {
    if (window.top !== window) return;
    const record = key => sessionStorage.setItem(key, String(Number(sessionStorage.getItem(key) || 0) + 1));
    record('release-boots');
    navigator.serviceWorker.addEventListener('controllerchange', () => record('release-controller-changes'));
    const postMessage = ServiceWorker.prototype.postMessage;
    let holdNextSkipWaiting = holdSkipWaiting;
    let heldMessage;
    ServiceWorker.prototype.postMessage = function (...args) {
      if (args[0]?.type === 'SKIP_WAITING') {
        record('release-skip-waiting');
        if (holdNextSkipWaiting) {
          holdNextSkipWaiting = false;
          heldMessage = { worker: this, args };
          return;
        }
      }
      return postMessage.apply(this, args);
    };
    if (holdSkipWaiting) window.releaseHeldSkipWaiting = () => {
      if (!heldMessage) throw new Error('No native SKIP_WAITING message is held');
      const { worker, args } = heldMessage;
      heldMessage = undefined;
      return postMessage.apply(worker, args);
    };
  }, { holdSkipWaiting: activationReentry });
  const observations = () => page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    const cacheEntries = [];
    for (const name of (await caches.keys()).filter(name => name.includes('workbox-precache'))) {
      for (const request of await (await caches.open(name)).keys()) cacheEntries.push(request.url);
    }
    return {
      boots: Number(sessionStorage.getItem('release-boots') || 0),
      controllerChanges: Number(sessionStorage.getItem('release-controller-changes') || 0),
      skipWaiting: Number(sessionStorage.getItem('release-skip-waiting') || 0),
      family: localStorage.getItem('farmjam-children-v1'),
      settings: localStorage.getItem('farmjam-settings-v1'),
      cacheEntries: cacheEntries.sort(),
      waiting: Boolean(registration?.waiting),
      activated: registration?.active?.state === 'activated',
      sameController: navigator.serviceWorker.controller === window.releaseOriginalController,
      sameWaiting: registration?.waiting === window.releaseWaitingWorker,
    };
  });
  const workerResponses = [];
  const buildMarker = `installed-${phase}-v1`;
  await context.route('**/workbox-*.js', async route => {
    if (!route.request().serviceWorker()) return route.continue();
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    const original = await response.text();
    const body = `${original}\n/* release-validation-build:${buildMarker} */\n`;
    workerResponses.push({
      marker: buildMarker,
      url: route.request().url(),
      workerOwned: true,
      originalHash: createHash('sha256').update(original).digest('hex'),
      updatedHash: createHash('sha256').update(body).digest('hex'),
    });
    await route.fulfill({ response, body, contentType: 'application/javascript' });
  });
  await page.goto('/');
  await seedProfile(page);
  await page.reload();
  await waitForOfflineReady(page);
  const initial = await observations();
  expect(workerResponses.length, 'The initial built worker import must be byte-marked through a worker-owned route').toBeGreaterThan(0);
  try {
    {
      const before = await observations();
      if (startsInPlay) {
        await page.getByRole('button', { name: 'Tap to play', exact: true }).click();
        await expect(page.locator('.start-overlay')).toHaveCount(0);
      } else {
        await page.getByRole('button', { name: 'Add child', exact: true }).click();
        for (let step = 0; step < 3; step++) await page.getByRole('button', { name: 'Next step', exact: true }).click();
        await page.getByRole('textbox', { name: 'Child name or nickname', exact: true }).fill('Unsaved Release Draft');
        await page.getByRole('radio', { name: '8+', exact: true }).check();
      }
      await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        window.releaseOriginalController = navigator.serviceWorker.controller;
        window.releaseOriginalActive = registration.active;
        await registration.update();
      });
      await expect.poll(() => page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration.waiting) return false;
        window.releaseWaitingWorker = registration.waiting;
        return registration.waiting.state === 'installed'
          && registration.waiting !== window.releaseOriginalActive
          && registration.active === window.releaseOriginalActive;
      }), { message: `A real successor must remain waiting during ${phase}` }).toBe(true);

      if (startsInPlay) {
        await page.locator('#instrument-piano').focus();
        await page.keyboard.press('e');
        const note = page.getByRole('button', { name: 'Piano key C4', exact: true });
        await note.focus();
        await page.keyboard.down('Space');
        await expect(note).toHaveAttribute('aria-pressed', 'true');
        await page.keyboard.up('Space');
        await expect(note).toHaveAttribute('aria-pressed', 'false');
        await expect(page.locator('#young-musician')).toHaveAttribute('data-child-name', 'Release Player');
      } else {
        await page.getByRole('button', { name: 'Next step', exact: true }).click();
        await page.getByRole('button', { name: 'Previous step', exact: true }).click();
        await expect(page.getByRole('textbox', { name: 'Child name or nickname', exact: true })).toHaveValue('Unsaved Release Draft');
        await expect(page.getByRole('radio', { name: '8+', exact: true })).toBeChecked();
        await expect(page.getByRole('dialog', { name: 'Add a child', exact: true })).toBeVisible();
      }
      expect(await observations(), `No activation, reload, profile loss or revision mixing during ${phase}`).toEqual({
        ...before, waiting: true, sameController: true, sameWaiting: true,
      });

      if (startsInPlay) {
        await page.getByRole('button', { name: 'Open settings', exact: true }).dblclick();
        await expect(page.getByRole('dialog', { name: 'Settings', exact: true })).toBeVisible();
        expect((await observations()).waiting).toBe(true);
        if (activationReentry) {
          await page.getByRole('button', { name: 'Return to main menu', exact: true }).click();
        } else {
          await Promise.all([
            page.waitForEvent('load'),
            page.getByRole('button', { name: 'Return to main menu', exact: true }).click(),
          ]);
        }
      } else {
        await Promise.all([
          page.waitForEvent('load'),
          page.getByRole('button', { name: 'Cancel child setup', exact: true }).click(),
        ]);
      }
      if (activationReentry) {
        await expect(page.locator('.start-overlay')).toBeVisible();
        await expect.poll(observations, { message: 'Safe return must request activation exactly once while native delivery is held' }).toEqual({
          ...before, skipWaiting: before.skipWaiting + 1,
          waiting: true, sameController: true, sameWaiting: true,
        });
        await page.getByRole('button', { name: 'Add child', exact: true }).click();
        for (let step = 0; step < 3; step++) await page.getByRole('button', { name: 'Next step', exact: true }).click();
        const draftName = page.getByRole('textbox', { name: 'Child name or nickname', exact: true });
        await draftName.fill('Reentered Release Draft');
        await page.getByRole('radio', { name: '8+', exact: true }).check();
        expect(await observations(), 'Reentry must preserve the waiting worker until native delivery resumes').toEqual({
          ...before, skipWaiting: before.skipWaiting + 1,
          waiting: true, sameController: true, sameWaiting: true,
        });
        await page.evaluate(async () => {
          const controllerChanged = new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
          window.releaseHeldSkipWaiting();
          await controllerChanged;
        });
        await expect.poll(observations, { message: 'Real controller change must retain this document, draft, profile and cache revisions during guide reentry' }).toEqual({
          ...before, controllerChanges: before.controllerChanges + 1,
          skipWaiting: before.skipWaiting + 1, waiting: false, activated: true,
          sameController: false, sameWaiting: false,
        });
        expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).active === window.releaseWaitingWorker),
          'The original real waiting worker must become active').toBe(true);
        await expect(draftName).toHaveValue('Reentered Release Draft');
        await expect(page.getByRole('radio', { name: '8+', exact: true })).toBeChecked();
        await expect(page.getByRole('dialog', { name: 'Add a child', exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Next step', exact: true }).click();
        await page.getByRole('button', { name: 'Previous step', exact: true }).click();
        await expect(draftName).toHaveValue('Reentered Release Draft');
        expect((await observations()).boots, 'Guide interaction after activation must not reload the document').toBe(before.boots);
        await Promise.all([
          page.waitForEvent('load'),
          page.getByRole('button', { name: 'Cancel child setup', exact: true }).click(),
        ]);
      }
      await expect.poll(observations, { message: 'Safe menu must send SKIP_WAITING, change controller and reload exactly once' }).toEqual({
        ...before, boots: before.boots + 1, controllerChanges: before.controllerChanges + 1,
        skipWaiting: before.skipWaiting + 1, waiting: false, activated: true,
        sameController: false, sameWaiting: false,
      });
      await waitForOfflineReady(page);
      await expect(page.getByRole('radio', { name: 'Select Release Player', exact: true })).toBeChecked();
    }
    expect(new Set(workerResponses.map(response => response.originalHash)).size).toBe(1);
    expect(new Set(workerResponses.map(response => response.updatedHash)).size).toBe(1);
    expect(workerResponses.every(response => response.originalHash !== response.updatedHash)).toBe(true);
    await testInfo.attach('production-worker-updates', {
      body: JSON.stringify(workerResponses, null, 2), contentType: 'application/json',
    });
    const updated = await observations();
    expect(updated.boots).toBe(initial.boots + 1);
    expect(updated.skipWaiting).toBe(initial.skipWaiting + 1);
    expect(updated.controllerChanges).toBe(initial.controllerChanges + 1);
    await verifyOfflineSession(page, context, testInfo);
    const offline = await observations();
    expect(offline).toEqual({ ...updated, boots: updated.boots + 1 });
    await page.getByRole('button', { name: 'Open settings', exact: true }).dblclick();
    await page.getByRole('button', { name: 'Return to main menu', exact: true }).click();
    await expect(page.locator('.start-overlay')).toBeVisible();
    await page.getByRole('button', { name: 'Tap to play', exact: true }).click();
    await expect(page.locator('.start-overlay')).toHaveCount(0);
    expect(await observations()).toEqual(offline);
    await testInfo.attach('production-update-lifecycle', {
      body: JSON.stringify({ phase, initial, updated, offline }, null, 2), contentType: 'application/json',
    });
  } finally {
    await context.unrouteAll({ behavior: 'wait' });
  }
  expect(unexpectedErrors(browserErrors)).toEqual([]);
});

test('interrupted first precache fails installation, then an online reload retries and works offline', async ({ page, context, browserErrors, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'Worker-owned network routing is only supported here in Chromium');
  let blockedRequests = 0;
  let releaseFailure;
  const failureGate = new Promise(resolve => { releaseFailure = resolve; });
  await context.route(`**${failedRecording}*`, async route => {
    if (!route.request().serviceWorker() || blockedRequests > 0) return route.continue();
    blockedRequests++;
    await failureGate;
    await route.fulfill({ status: 503, contentType: 'text/plain', body: 'Release check: interrupted first precache' });
  });
  try {
    await page.goto('/');
    await seedProfile(page);
    await expect.poll(() => blockedRequests, { message: 'Must intercept a worker-owned precache request, not a page audio request' }).toBe(1);
    await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.installing?.state)).toBe('installing');
    await page.evaluate(async () => {
      const worker = (await navigator.serviceWorker.getRegistration()).installing;
      window.releaseInstallOutcome = new Promise(resolve => {
        worker.addEventListener('statechange', () => {
          if (worker.state === 'redundant') resolve(worker.state);
        });
      });
    });
    releaseFailure();
    expect(await page.evaluate(() => window.releaseInstallOutcome)).toBe('redundant');
    expect(await page.evaluate(async path => ({
      controlled: Boolean(navigator.serviceWorker.controller),
      failedRecordingCached: Boolean(await caches.match(path, { ignoreSearch: true })),
    }), failedRecording)).toEqual({ controlled: false, failedRecordingCached: false });
  } finally {
    releaseFailure();
    await context.unrouteAll({ behavior: 'wait' });
  }
  expect(browserErrors.filter(error => error.type === 'pageerror')).toEqual([]);
  const retryErrorIndex = browserErrors.length;
  await page.reload();
  await waitForOfflineReady(page);
  await verifyOfflineSession(page, context, testInfo);
  expect(unexpectedErrors(browserErrors.slice(retryErrorIndex)), 'Online retry and offline play must have no unexpected browser errors').toEqual([]);
});