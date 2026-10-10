import { test, expect } from '@playwright/test';

test('moonlit meadow has its own art and two audible, repeatable nocturnal objects', async ({ page }, testInfo) => {
  const viewport = page.viewportSize();
  if (viewport.height > viewport.width) await page.setViewportSize({ width: viewport.height, height: viewport.width });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.evaluate(async () => {
    const { AudioEngine } = await import('/src/audio/AudioEngine.js');
    const initialize = AudioEngine.prototype.initialize;
    AudioEngine.prototype.initialize = async function () {
      await initialize.call(this);
      window.audioEngine = this;
    };
  });
  await page.getByRole('button', { name: 'Tap to play' }).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0, { timeout: 20000 });
  for (const scene of ['garden', 'pond', 'dusk', 'night', 'late-night']) {
    await page.getByRole('button', { name: 'Change landscape' }).click({ force: true });
    await expect(page.locator(`.scene-${scene}`)).toHaveCount(1);
  }
  const scene = page.locator('.scene-late-night');
  await expect(scene.locator('.moonlit-meadow-art')).toBeVisible();
  await expect(scene.locator('.interactive-object')).toHaveCount(2);
  await expect(scene.locator('[data-sound="owl"], [data-sound="bell"]')).toHaveCount(0);
  for (const [sound, label] of [['bat', 'Fluttering bat'], ['hedgehog', 'Rustling hedgehog']]) {
    const object = scene.getByRole('button', { name: label, exact: true });
    const bounds = await object.boundingBox();
    const size = page.viewportSize();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(size.width);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(size.height);
    const output = await page.evaluate(async type => {
      const engine = window.audioEngine;
      const analyser = engine.sceneGain.context.createAnalyser();
      analyser.fftSize = 1024;
      engine.sceneGain.connect(analyser);
      const playback = engine.playSceneSound(type);
      const samples = new Float32Array(analyser.fftSize);
      let peak = 0;
      const until = performance.now() + 600;
      while (performance.now() < until) {
        analyser.getFloatTimeDomainData(samples);
        peak = Math.max(peak, Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length));
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
      engine.sceneGain.disconnect(analyser);
      analyser.disconnect();
      return { peak, startsAt: playback?.startsAt };
    }, sound);
    expect(output.peak, sound).toBeGreaterThan(0.002);
    expect(Number.isFinite(output.startsAt)).toBe(true);
    for (let repeat = 0; repeat < 3; repeat++) {
      if (testInfo.project.use.hasTouch) await object.tap();
      else await object.click();
      await expect(object.locator('.reacting')).toHaveCount(1);
    }
    await expect(object.locator('.reacting')).toHaveCount(0);
    await object.focus();
    await page.keyboard.press('Space');
    await expect(object.locator('.reacting')).toHaveCount(1);
  }
  await page.screenshot({ path: `test-results/${testInfo.project.name}-moonlit-meadow.png` });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await scene.getByRole('button', { name: 'Fluttering bat' }).click();
  await expect(scene.locator('.bat .reacting')).toHaveCount(0);
  expect(errors).toEqual([]);
});