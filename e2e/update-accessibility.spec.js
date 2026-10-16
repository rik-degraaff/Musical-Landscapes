import { test, expect } from './fixtures.js';

test.beforeEach(async ({ page }) => {
  const viewport = page.viewportSize();
  if (viewport.height > viewport.width) await page.setViewportSize({ width: viewport.height, height: viewport.width });
});

async function installApplyProbe(page) {
  await page.evaluate(async () => {
    const { appUpdates } = await import('/src/utils/updatePolicy.js');
    const probe = document.createElement('div');
    probe.id = 'update-probe';
    probe.hidden = true;
    probe.dataset.applied = '0';
    document.body.append(probe);
    appUpdates.setApplyUpdate(() => { probe.dataset.applied = String(Number(probe.dataset.applied) + 1); });
  });
}

async function requestMockUpdate(page) {
  await page.evaluate(async () => {
    const { appUpdates } = await import('/src/utils/updatePolicy.js');
    appUpdates.requestUpdate();
  });
}

async function pendingUpdate(page) {
  return page.evaluate(async () => (await import('/src/utils/updatePolicy.js')).appUpdates.getSnapshot());
}

async function expectDeferred(page, count = 0) {
  await expect(page.locator('#update-probe')).toHaveAttribute('data-applied', String(count));
  expect(await pendingUpdate(page)).toBe(true);
}

async function zoomEvents(page, selector) {
  return page.evaluate(selector => {
    const target = document.querySelector(selector);
    const events = [
      new WheelEvent('wheel', { ctrlKey: true, deltaY: -100, bubbles: true, cancelable: true }),
      new WheelEvent('wheel', { metaKey: true, deltaY: -100, bubbles: true, cancelable: true }),
      ...['+', '=', '-', '_', '0'].flatMap(key => [
        new KeyboardEvent('keydown', { key, ctrlKey: true, bubbles: true, cancelable: true }),
        new KeyboardEvent('keydown', { key, metaKey: true, bubbles: true, cancelable: true }),
      ]),
      ...['gesturestart', 'gesturechange', 'gestureend'].map(type => new Event(type, { bubbles: true, cancelable: true })),
    ];
    const touch = new Event('touchmove', { bubbles: true, cancelable: true });
    Object.defineProperty(touch, 'touches', { value: [{ target }, { target }] });
    events.push(touch);
    return events.map(event => { target.dispatchEvent(event); return { type: event.type, prevented: event.defaultPrevented }; });
  }, selector);
}

async function expectPinchAncestry(page, selector) {
  const actions = await page.locator(selector).evaluate(element => {
    const result = [];
    for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
      result.push({ tag: ancestor.tagName, action: getComputedStyle(ancestor).touchAction });
    }
    return result;
  });
  for (const { tag, action } of actions) expect(action === 'auto' || action.includes('pinch-zoom'), tag).toBe(true);
}

async function start(page) {
  await page.getByRole('button', { name: 'Tap to play' }).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0, { timeout: 30000 });
}

test('pending event before hook subscription survives loading and unsaved setup (mock apply)', async ({ page }) => {
  await page.goto('/');
  await start(page);
  await page.evaluate(async () => {
    const { appUpdates } = await import('/src/utils/updatePolicy.js');
    appUpdates.requestUpdate();
    const hookSource = await (await fetch('/src/components/useAppUpdates.js')).text();
    const mainSource = await (await fetch('/src/main.jsx')).text();
    const reactUrl = /from\s+['"]([^'"]*\/react\.js[^'"]*)['"]/.exec(hookSource)[1];
    const clientUrl = /from\s+['"]([^'"]*react-dom_client[^'"]*)['"]/.exec(mainSource)[1];
    const reactModule = await import(reactUrl);
    const clientModule = await import(clientUrl);
    const { createElement, useEffect } = reactModule.default ?? reactModule;
    const { createRoot } = clientModule.default ?? clientModule;
    const { useAppUpdates } = await import('/src/components/useAppUpdates.js');
    const probe = document.createElement('div');
    probe.id = 'update-probe';
    probe.hidden = true;
    probe.dataset.applied = '0';
    document.body.append(probe);
    const root = createRoot(probe);
    function Harness(state) {
      useAppUpdates(state);
      useEffect(() => { probe.dataset.state = JSON.stringify(state); }, [state]);
      return null;
    }
    probe.addEventListener('app-state', event => root.render(createElement(Harness, event.detail)));
    root.render(createElement(Harness, { started: true, loading: false, parentGuide: false }));
  });
  await expect(page.locator('#update-probe')).toHaveAttribute('data-state', JSON.stringify({ started: true, loading: false, parentGuide: false }));
  await expectDeferred(page);
  await page.evaluate(async () => {
    const { appUpdates } = await import('/src/utils/updatePolicy.js');
    const probe = document.getElementById('update-probe');
    appUpdates.setApplyUpdate(() => { probe.dataset.applied = String(Number(probe.dataset.applied) + 1); });
  });
  for (const state of [
    { started: false, loading: true, parentGuide: false },
    { started: false, loading: false, parentGuide: true },
  ]) {
    await page.evaluate(state => document.getElementById('update-probe').dispatchEvent(new CustomEvent('app-state', { detail: state })), state);
    await expect(page.locator('#update-probe')).toHaveAttribute('data-state', JSON.stringify(state));
    await expectDeferred(page);
  }
  await page.evaluate(() => document.getElementById('update-probe').dispatchEvent(new CustomEvent('app-state', {
    detail: { started: false, loading: false, parentGuide: false },
  })));
  await expect(page.locator('#update-probe')).toHaveAttribute('data-applied', '1');
  expect(await pendingUpdate(page)).toBe(false);
});

test('App defers mock updates during setup and play until returning to menu', async ({ page }) => {
  await page.goto('/');
  await installApplyProbe(page);
  await page.getByRole('button', { name: 'Add child', exact: true }).click();
  await page.getByLabel('Child name or nickname').fill('Unsaved draft');
  await requestMockUpdate(page);
  await expectDeferred(page);
  await expect(page.getByLabel('Child name or nickname')).toHaveValue('Unsaved draft');
  await page.keyboard.press('Escape');
  await expect(page.locator('#update-probe')).toHaveAttribute('data-applied', '1');
  await start(page);
  await requestMockUpdate(page);
  await expectDeferred(page, 1);
  await page.getByRole('button', { name: 'Open settings' }).dblclick();
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
  await expectDeferred(page, 1);
  await page.getByRole('button', { name: 'Return to main menu' }).click();
  await expect(page.locator('#update-probe')).toHaveAttribute('data-applied', '2');
  expect(await pendingUpdate(page)).toBe(false);
});

test('deferred registration events use imported observer without automatic activation (mock worker)', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { createUpdatePolicy, observeAppUpdates } = await import('/src/utils/updatePolicy.js');
    const policy = createUpdatePolicy();
    const serviceWorkers = new EventTarget();
    serviceWorkers.controller = {};
    const registration = new EventTarget();
    registration.active = serviceWorkers.controller;
    const worker = new EventTarget();
    const messages = [];
    worker.postMessage = message => messages.push(message);
    let reloads = 0;
    const cleanup = observeAppUpdates(registration, serviceWorkers, { policy, reload: () => reloads++ });
    await Promise.resolve();
    registration.installing = worker;
    registration.dispatchEvent(new Event('updatefound'));
    registration.waiting = worker;
    worker.dispatchEvent(new Event('statechange'));
    const pending = policy.getSnapshot();
    await policy.applyWhenSafe(() => ({ started: false, loading: false, parentGuide: true }));
    const before = { messages: messages.length, reloads };
    await policy.applyWhenSafe(() => ({ started: false, loading: false, parentGuide: false }));
    serviceWorkers.controller = worker;
    serviceWorkers.dispatchEvent(new Event('controllerchange'));
    serviceWorkers.dispatchEvent(new Event('controllerchange'));
    cleanup();
    return { pending, before, messages, reloads };
  });
  expect(result).toEqual({ pending: true, before: { messages: 0, reloads: 0 }, messages: [{ type: 'SKIP_WAITING' }], reloads: 1 });
});

test('late controller change keeps a reentered caregiver draft until the next menu (mock worker)',async({page})=>{
  await page.goto('/');
  await page.evaluate(async()=>{
    const {appUpdates,observeAppUpdates}=await import('/src/utils/updatePolicy.js');
    const serviceWorkers=new EventTarget();serviceWorkers.controller={};
    const registration=new EventTarget();registration.active=serviceWorkers.controller;
    registration.waiting=new EventTarget();
    window.updateMessages=0;window.updateReloads=0;
    registration.waiting.postMessage=()=>{window.updateMessages++;};
    observeAppUpdates(registration,serviceWorkers,{policy:appUpdates,reload:()=>{window.updateReloads++;}});
    window.finishControllerChange=()=>{
      serviceWorkers.controller=registration.waiting;registration.waiting=null;
      serviceWorkers.dispatchEvent(new Event('controllerchange'));
    };
  });
  await expect.poll(()=>page.evaluate(()=>window.updateMessages)).toBe(1);
  await page.getByRole('button',{name:'Add child',exact:true}).click();
  await page.getByLabel('Child name or nickname').fill('Reentered draft');
  await page.evaluate(()=>window.finishControllerChange());
  await expect(page.getByLabel('Child name or nickname')).toHaveValue('Reentered draft');
  expect(await page.evaluate(()=>window.updateReloads)).toBe(0);
  await page.keyboard.press('Escape');
  await expect.poll(()=>page.evaluate(()=>window.updateReloads)).toBe(1);
  expect(await page.evaluate(()=>window.updateMessages)).toBe(1);
});

test('caregiver menu and unsaved dialog permit zoom events and pinch through every ancestor', async ({ page }) => {
  await page.goto('/');
  const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(viewport).not.toMatch(/maximum-scale|user-scalable\s*=\s*(no|0)/);
  expect((await zoomEvents(page, '.start-button')).every(event => !event.prevented)).toBe(true);
  await expectPinchAncestry(page, '.start-button');
  await page.getByRole('button', { name: 'Add child', exact: true }).click();
  expect((await zoomEvents(page, '.parent-guide-close')).every(event => !event.prevented)).toBe(true);
  await expectPinchAncestry(page, '.parent-guide-close');
  await page.getByLabel('Child name or nickname').fill('Still here');
  expect((await zoomEvents(page, '#parent-child-name')).every(event => !event.prevented)).toBe(true);
  await expectPinchAncestry(page, '#parent-child-name');
  await expect(page.getByLabel('Child name or nickname')).toHaveValue('Still here');
  await page.keyboard.press('Escape');
  expect(await page.locator('body').evaluate(element => element.style.touchAction)).toBe('');
  await expectPinchAncestry(page, '.start-button');
});

test('body-targeted zoom keys use focus or visible dialog; gameplay still suppresses zoom', async ({ page }) => {
  await page.goto('/');
  await start(page);
  expect((await zoomEvents(page, '#instrument-piano')).every(event => event.prevented)).toBe(true);
  await expect(page.locator('.landscape-world')).toHaveCSS('touch-action', 'none');
  await expect(page.locator('#instrument-piano')).toHaveCSS('touch-action', 'none');
  expect((await zoomEvents(page, 'body')).filter(event => event.type === 'keydown').every(event => event.prevented)).toBe(true);
  await page.getByRole('button', { name: 'Open settings' }).dblclick();
  expect((await zoomEvents(page, '.settings-head button[aria-label="Close settings"]')).every(event => !event.prevented)).toBe(true);
  await expectPinchAncestry(page, '.settings-head button[aria-label="Close settings"]');
  await page.getByRole('slider', { name: 'Piano volume', exact: true }).focus();
  expect((await zoomEvents(page, 'body')).filter(event => event.type === 'keydown').every(event => !event.prevented)).toBe(true);
  await page.evaluate(() => document.activeElement.blur());
  expect((await zoomEvents(page, 'body')).filter(event => event.type === 'keydown').every(event => !event.prevented)).toBe(true);
  await page.keyboard.press('Escape');
  expect((await zoomEvents(page, 'body')).filter(event => event.type === 'keydown').every(event => event.prevented)).toBe(true);
  await page.locator('#instrument-piano').click();
  await expect(page.locator('#instrument-piano')).toHaveAttribute('aria-pressed', 'true');
});

test('caregiver scrolling is allowed and gameplay multi-touch remains cancelled', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add child', exact: true }).click();
  await page.getByLabel('Child name or nickname').fill('Scroll draft');
  await page.getByRole('button', { name: 'Next step' }).click();
  const scroll = await page.locator('.parent-guide-content').evaluate(element => {
    const wheel = new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true });
    const touch = new Event('touchmove', { bubbles: true, cancelable: true });
    Object.defineProperty(touch, 'touches', { value: [{ target: element }] });
    element.dispatchEvent(wheel);
    element.dispatchEvent(touch);
    element.scrollTop = 80;
    return { wheel: wheel.defaultPrevented, touch: touch.defaultPrevented, scrollTop: element.scrollTop };
  });
  expect(scroll.wheel).toBe(false);
  expect(scroll.touch).toBe(false);
  expect(scroll.scrollTop).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await start(page);
  expect((await zoomEvents(page, '#instrument-piano')).filter(event => event.type === 'touchmove').every(event => event.prevented)).toBe(true);
});

test('Chromium touch pinch changes caregiver viewport scale but not gameplay scale', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'desktop', 'Requires a touch-enabled Chromium viewport');
  await page.goto('/');
  const client = await page.context().newCDPSession(page);
  const pinch = async selector => {
    const bounds = await page.locator(selector).boundingBox();
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const points = distance => [
      { id: 1, x: centerX - distance, y: centerY, radiusX: 8, radiusY: 8, force: 1 },
      { id: 2, x: centerX + distance, y: centerY, radiusX: 8, radiusY: 8, force: 1 },
    ];
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(25) });
    for (let step = 1; step <= 8; step++) {
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(25 + step * 5) });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
    }
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  try {
    await pinch('.start-overlay');
    await expect.poll(() => page.evaluate(() => window.visualViewport.scale)).toBeGreaterThan(1.01);
    await client.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 });
    await page.getByRole('button', { name: 'Add child', exact: true }).click();
    await pinch('.parent-guide-content');
    await expect.poll(() => page.evaluate(() => window.visualViewport.scale)).toBeGreaterThan(1.01);
    await page.screenshot({ path: testInfo.outputPath('caregiver-pinch.png') });
    await client.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 });
    await page.keyboard.press('Escape');
    await start(page);
    await pinch('.landscape-world');
    expect(await page.evaluate(() => window.visualViewport.scale)).toBe(1);
    await page.getByRole('button', { name: 'Open settings' }).dblclick();
    await pinch('.settings-head');
    await expect.poll(() => page.evaluate(() => window.visualViewport.scale)).toBeGreaterThan(1.01);
  } finally {
    await client.detach();
  }
});