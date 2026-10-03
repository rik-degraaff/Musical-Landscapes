import { test, expect } from '@playwright/test';

const instruments = ['piano', 'drums', 'bass', 'melody', 'marimba', 'flute'];
const objects = [['Cow', 'Tractor'], ['Outdoor faucet', 'Bird'], ['Frog', 'Windmill'], ['Little bell', 'Night owl']];

async function startWorld(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.evaluate(async () => {
    const { AudioEngine } = await import('/src/audio/AudioEngine.js');
    const original = AudioEngine.prototype.setInstrumentActive;
    AudioEngine.prototype.setInstrumentActive = function (...args) {
      window.audioEngine = this;
      return original.apply(this, args);
    };
    const initialize = AudioEngine.prototype.initialize;
    AudioEngine.prototype.initialize = async function () {
      await initialize.call(this);
      window.audioEngine = this;
    };
  });
  await page.getByRole('button', { name: 'Tap to play' }).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0);
  return errors;
}

async function measureAudio(page, name, seconds = 0.8) {
  return page.evaluate(async ({ name, seconds }) => {
    let output = name === 'scene' ? window.audioEngine.sceneGain : window.audioEngine.nodes[name].gain;
    while (output.output) output = output.output;
    const analyser = output.context.createAnalyser();
    analyser.fftSize = 1024;
    output.connect(analyser);
    const values = new Float32Array(analyser.fftSize);
    let peak = 0;
    const until = performance.now() + seconds * 1000;
    while (performance.now() < until) {
      analyser.getFloatTimeDomainData(values);
      peak = Math.max(peak, Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length));
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    output.disconnect(analyser);
    analyser.disconnect();
    return peak;
  }, { name, seconds });
}

async function tap(locator, testInfo) {
  if (testInfo.project.name === 'phone') await locator.tap();
  else await locator.click();
}

test('all six instruments produce audio, stop, restart and survive rapid toggles', async ({ page }, testInfo) => {
  const errors = await startWorld(page);
  for (const name of instruments) {
    const instrument = page.locator(`#instrument-${name}`);
    await tap(instrument, testInfo);
    await expect(instrument).toHaveAttribute('aria-pressed', 'true');
    expect(await measureAudio(page, name), `${name} starts audibly`).toBeGreaterThan(0.0003);
    await tap(instrument, testInfo);
    await expect(instrument).toHaveAttribute('aria-pressed', 'false');
    await tap(instrument, testInfo);
    expect(await measureAudio(page, name), `${name} restarts audibly`).toBeGreaterThan(0.0003);
    await tap(instrument, testInfo);
  }
  for (const name of instruments) await tap(page.locator(`#instrument-${name}`), testInfo);
  for (let round = 0; round < 3; round++) {
    for (const name of ['bass', 'melody', 'drums']) {
      await tap(page.locator(`#instrument-${name}`), testInfo);
      await tap(page.locator(`#instrument-${name}`), testInfo);
    }
  }
  for (const name of instruments) expect(await measureAudio(page, name, 2.8), `${name} keeps playing across bars`).toBeGreaterThan(0.0003);
  expect(errors).toEqual([]);
});

test('audio resumes after suspension, mixer settings persist and reduced motion works', async ({ page }, testInfo) => {
  const errors = await startWorld(page);
  await page.getByRole('button', { name: 'Open mixer' }).click();
  const slider = page.getByRole('slider', { name: 'Piano volume', exact: true });
  await slider.fill('-18');
  await expect(slider).toHaveValue('-18');
  await page.locator('.mixer-head').getByRole('button', { name: 'Close mixer' }).click();
  await tap(page.locator('#instrument-piano'), testInfo);
  expect(await measureAudio(page, 'piano')).toBeGreaterThan(0.0003);
  await tap(page.locator('#instrument-piano'), testInfo);
  await tap(page.locator('#instrument-piano'), testInfo);
  expect(await page.evaluate(() => window.audioEngine.volumes.piano)).toBe(-18);
  await tap(page.locator('#instrument-piano'), testInfo);
  expect(await page.evaluate(() => window.audioEngine.pendingEvents.size)).toBe(0);
  await page.evaluate(() => window.audioEngine.master.context.rawContext.suspend());
  await tap(page.getByRole('button', { name: 'Cow', exact: true }), testInfo);
  expect(await measureAudio(page, 'scene', 0.5)).toBeGreaterThan(0.01);
  expect(await page.evaluate(() => window.audioEngine.master.context.rawContext.state)).toBe('running');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await tap(page.getByRole('button', { name: 'Cow', exact: true }), testInfo);
  await expect(page.locator('.cow .reacting')).toHaveCount(0);
  const scenery = page.locator('.landscape-art');
  await expect(scenery).toBeVisible();
  expect(await scenery.locator('path').count()).toBeGreaterThan(10);
  expect(errors).toEqual([]);
});

test('every object is reachable, audible and animates repeatedly in all four scenes', async ({ page }, testInfo) => {
  const errors = await startWorld(page);
  for (let sceneIndex = 0; sceneIndex < objects.length; sceneIndex++) {
    for (const label of objects[sceneIndex]) {
      const object = page.getByRole('button', { name: label, exact: true });
      await tap(object, testInfo);
      await expect(object.locator('.reacting')).toHaveCount(1);
      expect(await measureAudio(page, 'scene', 0.35), `${label} makes sound`).toBeGreaterThan(0.01);
      for (let repeat = 0; repeat < 4; repeat++) await tap(object, testInfo);
      await expect(object.locator('.reacting')).toHaveCount(1);
      const bounds = await object.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize().width);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(page.viewportSize().height);
    }
    await page.screenshot({ path: `test-results/${testInfo.project.name}-scene-${sceneIndex}.png` });
    await page.getByRole('button', { name: 'Change landscape' }).click();
  }
  await expect(page.locator('.scene-farm')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('dragging does not toggle and canceled touch does not block the next tap', async ({ page }) => {
  const errors = await startWorld(page);
  const piano = page.locator('#instrument-piano');
  const bounds = await piano.boundingBox();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 + 40, bounds.y + bounds.height / 2 + 30, { steps: 8 });
  await page.mouse.up();
  await expect(piano).toHaveAttribute('aria-pressed', 'false');
  await piano.hover();
  await page.mouse.down();
  await piano.dispatchEvent('pointercancel', { pointerId: 1, pointerType: 'mouse' });
  await page.mouse.up();
  await piano.click();
  await expect(piano).toHaveAttribute('aria-pressed', 'true');
  await piano.focus();
  await page.keyboard.press('Space');
  await expect(piano).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
});