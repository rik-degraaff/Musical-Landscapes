import { test, expect } from '@playwright/test';

const instruments = ['piano', 'drums', 'guitar', 'melody', 'marimba', 'flute'];
const objects = [['Cow', 'Tractor'], ['Outdoor faucet', 'Bird'], ['Frog', 'Windmill'], ['Cricket','Airplane'], ['Little bell', 'Night owl'], ['Rooster', 'Wind chimes']];

test('all bundled recordings decode and a failed sample load can be retried', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/audio/instruments/piano/C3.mp3', route => route.fulfill({ status: 404, body: 'Missing sample' }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Tap to play' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.locator('.start-overlay')).toHaveCount(1);
  await page.unroute('**/audio/instruments/piano/C3.mp3');
  const requests = [];
  page.on('request', request => { if(request.url().includes('/audio/instruments/')) requests.push(request.url()); });
  await page.getByRole('button', { name: 'Tap to play' }).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:20000});
  await expect(page.getByRole('button', { name: 'Acoustic guitar', exact: true })).toBeVisible();
  const recordings = await page.evaluate(async () => {
    const { SAMPLE_LIBRARY, DRUM_SAMPLES, sampleUrls } = await import('/src/audio/sampleLibrary.js');
    const files = [...Object.keys(SAMPLE_LIBRARY).flatMap(name => Object.values(sampleUrls(name))), ...Object.values(DRUM_SAMPLES).map(sample => `drums/${sample.file}`)];
    const context = new AudioContext();
    try {
      return await Promise.all(files.map(async file => {
        const response = await fetch(`/audio/instruments/${file}`);
        if (!response.ok) throw new Error(`Missing ${file}`);
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        const values = buffer.getChannelData(0);
        return { file, duration: buffer.duration, rms: Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length) };
      }));
    } finally { await context.close(); }
  });
  expect(recordings.length).toBeGreaterThanOrEqual(43);
  for (const recording of recordings) {
    expect(recording.duration, recording.file).toBeGreaterThan(0.05);
    expect(recording.rms, recording.file).toBeGreaterThan(0.0001);
  }
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every(url => url.startsWith('http://127.0.0.1:5173/'))).toBe(true);
  await tap(page.getByRole('button', { name: 'Acoustic guitar', exact: true }), testInfo);
  await expect(page.locator('#instrument-guitar')).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

async function startWorld(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.evaluate(async () => {
    const appSource=await (await fetch('/src/App.jsx')).text();
    const moduleUrl=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(appSource)?.[1]??'/src/audio/AudioEngine.js';
    const { AudioEngine } = await import(moduleUrl);
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
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:20000});
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
  if (testInfo.project.use.hasTouch) await locator.tap();
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
    for (const name of ['guitar', 'melody', 'drums']) {
      await tap(page.locator(`#instrument-${name}`), testInfo);
      await tap(page.locator(`#instrument-${name}`), testInfo);
    }
  }
  for (const name of instruments) expect(await measureAudio(page, name, 2.8), `${name} keeps playing across bars`).toBeGreaterThan(0.0003);
  expect(errors).toEqual([]);
});

test('audio resumes after suspension, mixer settings persist and reduced motion works', async ({ page }, testInfo) => {
  const errors = await startWorld(page);
  const mixerButton = page.getByRole('button', { name: 'Open mixer' });
  await tap(mixerButton, testInfo);
  await expect(page.locator('.mixer')).toHaveCount(0);
  await tap(mixerButton, testInfo);
  await expect(page.locator('.mixer')).toHaveCount(1);
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
  expect(await measureAudio(page, 'scene', 0.5)).toBeGreaterThan(0.005);
  expect(await page.evaluate(() => window.audioEngine.master.context.rawContext.state)).toBe('running');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await tap(page.getByRole('button', { name: 'Cow', exact: true }), testInfo);
  await expect(page.locator('.cow .reacting')).toHaveCount(0);
  const scenery = page.locator('.landscape-art');
  await expect(scenery).toBeVisible();
  expect(await scenery.locator('path').count()).toBeGreaterThan(10);
  expect(errors).toEqual([]);
});

test('every object is reachable, audible and animates repeatedly in all six scenes', async ({ page }, testInfo) => {
  const errors = await startWorld(page);
  for (let sceneIndex = 0; sceneIndex < objects.length; sceneIndex++) {
    for (const label of objects[sceneIndex]) {
      const object = page.getByRole('button', { name: label, exact: true });
      await tap(object, testInfo);
      await expect(object.locator('.reacting')).toHaveCount(1);
      expect(await measureAudio(page, 'scene', label === 'Outdoor faucet' ? 0.6 : 0.35), `${label} makes sound`).toBeGreaterThan(0.002);
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

test('double activation protects the mixer and scenery mute leaves instruments alone', async ({ page }, testInfo) => {
  const errors = await startWorld(page);
  const button = page.getByRole('button', { name: 'Open mixer', exact: true });
  await tap(button, testInfo);
  await expect(page.locator('.mixer')).toHaveCount(0);
  await page.waitForTimeout(500);
  await tap(button, testInfo);
  await expect(page.locator('.mixer')).toHaveCount(0);
  await tap(button, testInfo);
  await expect(page.locator('.mixer')).toHaveCount(1);
  const scenery = page.getByRole('slider', { name: 'Scenery sounds volume', exact: true });
  await scenery.fill('-60');
  await expect(page.locator('.scenery-mixer-row')).toContainText('Muted');
  await page.locator('.mixer-head').getByRole('button', { name: 'Close mixer' }).click();
  await tap(page.getByRole('button', { name: 'Cow', exact: true }), testInfo);
  expect(await measureAudio(page, 'scene', 0.5)).toBeLessThan(0.001);
  await tap(page.locator('#instrument-piano'), testInfo);
  expect(await measureAudio(page, 'piano')).toBeGreaterThan(0.0003);
  expect(await page.evaluate(() => window.audioEngine.volumes.piano)).toBe(-7);
  await tap(page.locator('#instrument-piano'), testInfo);
  await page.getByRole('button', { name: 'Change landscape' }).click();
  await tap(button, testInfo);
  await expect(page.locator('.mixer')).toHaveCount(0);
  await tap(button, testInfo);
  await expect(scenery).toHaveValue('-60');
  await scenery.fill('-10');
  await page.locator('.mixer-head').getByRole('button', { name: 'Close mixer' }).click();
  await tap(page.getByRole('button', { name: 'Bird', exact: true }), testInfo);
  expect(await measureAudio(page, 'scene', 0.5)).toBeGreaterThan(0.01);
  expect(await page.evaluate(() => window.audioEngine.sceneVolume)).toBe(-10);
  expect(errors).toEqual([]);
});

test('faucet drops share impact timing and rapid taps restart a single sequence', async ({ page }, testInfo) => {
  const errors = await startWorld(page);
  await page.getByRole('button', { name: 'Change landscape' }).click();
  const faucet = page.getByRole('button', { name: 'Outdoor faucet', exact: true });
  await tap(faucet, testInfo);
  await expect(faucet.locator('.falling-drop')).toHaveCount(3);
  const timings = await faucet.evaluate(async element => {
    const { WATER_DROP_TIMES, WATER_DROP_FALL } = await import('/src/audio/sceneSounds.js');
    const drops = [...element.querySelectorAll('.falling-drop')];
    const ripples = [...element.querySelectorAll('.drop-ripple')];
    const reactionDelay = parseFloat(element.querySelector('.object-reaction').style.animationDelay);
    return drops.map((drop, index) => {
      const timing = drop.getAnimations()[0].effect.getTiming();
      const ripple = ripples[index].getAnimations()[0].effect.getTiming();
      return { duration: timing.duration, impact: timing.delay + timing.duration - reactionDelay * 1000, ripple: ripple.delay - reactionDelay * 1000, expected: WATER_DROP_TIMES[index] * 1000, fall: WATER_DROP_FALL * 1000 };
    });
  });
  for (const timing of timings) {
    expect(timing.duration).toBeCloseTo(timing.fall, 1);
    expect(timing.impact).toBeCloseTo(timing.expected, 1);
    expect(timing.ripple).toBeCloseTo(timing.expected, 1);
  }
  for (let repeat = 0; repeat < 4; repeat++) await tap(faucet, testInfo);
  await expect(faucet.locator('.water-drops')).toHaveCount(1);
  const voices = await page.evaluate(() => window.audioEngine.scenePlayers.water.filter(player => player.state === 'started').length);
  expect(voices).toBe(1);
  await expect(faucet.locator('.water-drops')).toHaveCount(0);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-quiet-faucet.png` });
  expect(errors).toEqual([]);
});

test('saved loudness corrections are applied and the combined mix retains headroom', async ({ page }, testInfo) => {
  const errors = await startWorld(page);
  const calibration = await page.evaluate(async () => {
    const levels = (await import('/src/audio/audioLevels.json')).default;
    const context = new AudioContext();
    try {
      const source = await context.decodeAudioData(await (await fetch('/audio/instruments/piano/C4.mp3')).arrayBuffer());
      const original = source.getChannelData(0);
      const corrected = window.audioEngine.nodes.piano.buffers.C4.get().getChannelData(0);
      const rms = waveform => Math.sqrt(waveform.reduce((sum, value) => sum + value * value, 0) / waveform.length);
      return {
        actualGain: 20 * Math.log10(rms(corrected) / rms(original)),
        expectedGain: levels['instruments/piano/C4.mp3'].gainDb,
        scenery: Object.entries(window.audioEngine.scenePlayers).map(([type, voices]) => ({ type, expected: levels[`scenery/${type}.wav`].gainDb, actual: voices[0].volume.value })),
      };
    } finally { await context.close(); }
  });
  expect(calibration.actualGain).toBeCloseTo(calibration.expectedGain, 1);
  for (const sound of calibration.scenery) expect(sound.actual, sound.type).toBeCloseTo(sound.expected, 1);
  for (const name of instruments) await tap(page.locator(`#instrument-${name}`), testInfo);
  const mix = await page.evaluate(async () => {
    const engine = window.audioEngine;
    let output = engine.limiter;
    while(output.output) output = output.output;
    const analyser = output.context.createAnalyser();
    analyser.fftSize = 2048;
    output.connect(analyser);
    engine.playSceneSound('rooster');
    engine.playSceneSound('chimes');
    const values = new Float32Array(2048);
    let peak = 0;
    let rms = 0;
    const until = performance.now() + 3200;
    while(performance.now() < until) {
      analyser.getFloatTimeDomainData(values);
      peak = Math.max(peak, ...values.map(value => Math.abs(value)));
      rms = Math.max(rms, Math.sqrt(values.reduce((sum,value) => sum + value * value,0) / values.length));
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    output.disconnect(analyser);
    analyser.disconnect();
    return { peak, rms };
  });
  expect(mix.rms).toBeGreaterThan(0.01);
  expect(mix.peak).toBeLessThan(0.95);
  expect(errors).toEqual([]);
});