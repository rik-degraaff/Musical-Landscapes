import { test, expect, doubleActivate } from './fixtures.js';
import { INSTRUMENTS } from '../src/utils/music.js';

test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    const key='farmjam-settings-v1';
    const saved=JSON.parse(localStorage.getItem(key)??'{}');
    localStorage.setItem(key,JSON.stringify({...saved,selected:['piano','drums','guitar','melody','marimba','flute']}));
  });
});

const instruments = ['piano', 'drums', 'guitar', 'melody', 'marimba', 'flute'];
const objects = [['Cow', 'Tractor'], ['Outdoor faucet', 'Bird'], ['Frog', 'Windmill'], ['Cricket','Airplane'], ['Little bell', 'Night owl'], ['Fluttering bat', 'Rustling hedgehog'], ['Rooster', 'Wind chimes']];

async function startWorld(page) {
  const viewport=page.viewportSize();
  if(viewport.height>viewport.width)await page.setViewportSize({width:viewport.height,height:viewport.width});
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
  const levels=await measureAudioTogether(page,[name],seconds);
  return levels[name];
}

async function measureAudioTogether(page, names, seconds) {
  return page.evaluate(async ({ names, seconds }) => {
    const probes=names.map(name=>{
      let output=name==='scene'?window.audioEngine.sceneGain:window.audioEngine.nodes[name].gain;
      while(output.output)output=output.output;
      const analyser=output.context.createAnalyser();analyser.fftSize=1024;output.connect(analyser);
      return {name,output,analyser,values:new Float32Array(analyser.fftSize),peak:0};
    });
    try {
      const until=performance.now()+seconds*1000;
      while(performance.now()<until){
        for(const probe of probes){
          probe.analyser.getFloatTimeDomainData(probe.values);
          probe.peak=Math.max(probe.peak,Math.sqrt(probe.values.reduce((sum,value)=>sum+value*value,0)/probe.values.length));
        }
        await new Promise(resolve=>requestAnimationFrame(resolve));
      }
      return Object.fromEntries(probes.map(({name,peak})=>[name,peak]));
    } finally {
      for(const {output,analyser} of probes){output.disconnect(analyser);analyser.disconnect();}
    }
  }, { names, seconds });
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
  const levels=await measureAudioTogether(page,instruments,2.8);
  for (const name of instruments) expect(levels[name], `${name} keeps playing across bars`).toBeGreaterThan(0.0003);
  expect(errors).toEqual([]);
});

test('audio resumes after suspension, mixer settings persist and reduced motion works', async ({ page }, testInfo) => {
  const errors = await startWorld(page);
  const mixerButton = page.getByRole('button', { name: 'Open settings' });
  await tap(mixerButton, testInfo);
  await expect(page.locator('.mixer')).toHaveCount(0);
  await tap(mixerButton, testInfo);
  await expect(page.locator('.mixer')).toHaveCount(1);
  const slider = page.getByRole('slider', { name: 'Piano volume', exact: true });
  await slider.fill('-18');
  await expect(slider).toHaveValue('-18');
  await page.locator('.mixer-head').getByRole('button', { name: 'Close settings' }).click();
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
  const scenery = page.locator('.landscape-art:not([data-visual-layer])');
  await expect(scenery).toBeVisible();
  expect(await scenery.locator('path').count()).toBeGreaterThan(10);
  expect(errors).toEqual([]);
});

test('every object is reachable, audible and animates repeatedly in all seven scenes', async ({ page }, testInfo) => {
  const errors = await startWorld(page);
  for (let sceneIndex = 0; sceneIndex < objects.length; sceneIndex++) {
    // Scene placement updates throughout the sun/moon transition.
    await expect(page.locator('.celestial-control')).toHaveAttribute('data-settled', 'true');
    for (const label of objects[sceneIndex]) {
      const object = page.getByRole('button', { name: label, exact: true });
      await tap(object, testInfo);
      await expect(object.locator('.reacting')).toHaveCount(1);
      // Observe the rooster's crow beyond its quiet lead-in as well as the
      // faucet's first impact; a 350 ms window can contain only background noise.
      const seconds=label==='Rooster'?1.5:label==='Outdoor faucet'?.6:.35;
      expect(await measureAudio(page, 'scene', seconds), `${label} makes sound`).toBeGreaterThan(0.002);
      for (let repeat = 0; repeat < 4; repeat++) await tap(object, testInfo);
      await expect(object.locator('.reacting')).toHaveCount(1);
      const bounds = await object.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize().width);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(page.viewportSize().height);
    }
    await page.screenshot({ path: `test-results/${testInfo.project.name}-scene-${sceneIndex}.png` });
    await page.getByRole('button', { name: 'Change landscape' }).click({force:true});
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
  const button = page.getByRole('button', { name: 'Open settings', exact: true });
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
  await page.locator('.mixer-head').getByRole('button', { name: 'Close settings' }).click();
  await tap(page.getByRole('button', { name: 'Cow', exact: true }), testInfo);
  expect(await measureAudio(page, 'scene', 0.5)).toBeLessThan(0.001);
  await tap(page.locator('#instrument-piano'), testInfo);
  expect(await measureAudio(page, 'piano')).toBeGreaterThan(0.0003);
  const configured = INSTRUMENTS.piano.volume;
  expect(await page.evaluate(() => ({ configured: window.audioEngine.volumes.piano, effective: window.audioEngine.effectiveVolume('piano') }))).toEqual({ configured, effective: configured });
  await expect.poll(() => page.evaluate(() => window.audioEngine.nodes.piano.gain.volume.value)).toBeCloseTo(configured, 2);
  await page.locator('#instrument-piano').focus();await page.keyboard.press('e');
  await expect(page.locator('.performance-piano')).toBeVisible();
  const equipped = Math.min(0, configured + 3);
  expect(await page.evaluate(() => ({ configured: window.audioEngine.volumes.piano, effective: window.audioEngine.effectiveVolume('piano'), scenery: window.audioEngine.sceneVolume }))).toEqual({ configured, effective: equipped, scenery: -60 });
  await expect.poll(() => page.evaluate(() => window.audioEngine.nodes.piano.gain.volume.value)).toBeCloseTo(equipped, 2);
  await page.getByRole('button', { name: 'Put instrument down' }).click();
  expect(await page.evaluate(() => ({ configured: window.audioEngine.volumes.piano, effective: window.audioEngine.effectiveVolume('piano'), active: window.audioEngine.active.piano }))).toEqual({ configured, effective: configured, active: true });
  await expect.poll(() => page.evaluate(() => window.audioEngine.nodes.piano.gain.volume.value)).toBeCloseTo(configured, 2);
  await tap(page.locator('#instrument-piano'), testInfo);
  await page.getByRole('button', { name: 'Change landscape' }).click({force:true});
  await doubleActivate(button, testInfo);
  await expect(scenery).toHaveValue('-60');
  await scenery.fill('-10');
  await page.locator('.mixer-head').getByRole('button', { name: 'Close settings' }).click();
  await tap(page.getByRole('button', { name: 'Bird', exact: true }), testInfo);
  expect(await measureAudio(page, 'scene', 0.5)).toBeGreaterThan(0.01);
  expect(await page.evaluate(() => window.audioEngine.sceneVolume)).toBe(-10);
  expect(errors).toEqual([]);
});

test('faucet drops share impact timing and rapid taps restart a single sequence', async ({ page }, testInfo) => {
  const errors = await startWorld(page);
  await page.getByRole('button', { name: 'Change landscape' }).click({force:true});
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

test('default instrument gains balance representative played notes',async({page},testInfo)=>{
  await startWorld(page);
  const levels=await page.evaluate(async()=>{
    const {parseMidi,selectNearestSample}=await import('/src/audio/sampleSelection.js');
    const {INSTRUMENTS}=await import('/src/utils/music.js');
    const engine=window.audioEngine;
    const levels=[];
    for(const [name,note] of [['piano','C4'],['drums','kick'],['guitar','C4'],['melody','C4'],['marimba','C5'],['flute','C4'],['ukulele','C4'],['panflute','C4']]) {
      const selected=name==='drums'?{note:'C2',midi:36}:selectNearestSample(engine.nodes[name].sampleCandidates,parseMidi(note));
      const loop=engine.nodes[name].sustainLoops?.[selected.note];
      const buffer=loop?.buffer??engine.nodes[name].buffers[selected.note].get();
      const context=new OfflineAudioContext(1,Math.ceil(buffer.sampleRate*.5),buffer.sampleRate);
      const source=context.createBufferSource();source.buffer=buffer;
      source.playbackRate.value=name==='drums'?1:2**((parseMidi(note)-selected.midi)/12);
      if(loop){source.loop=true;source.loopStart=loop.loopStart;source.loopEnd=loop.loopEnd;}
      const gain=context.createGain();gain.gain.setValueAtTime(0,0);
      gain.gain.linearRampToValueAtTime(.65*10**(engine.volumes[name]/20),['flute','panflute'].includes(name)?.035:name==='drums'?.002:.006);
      source.connect(gain);gain.connect(context.destination);source.start();
      const rendered=await context.startRendering();const values=rendered.getChannelData(0);
      let rms=0;
      for(let offset=0;offset+2048<=values.length;offset+=256) {
        const window=values.subarray(offset,offset+2048);
        rms=Math.max(rms,Math.sqrt(window.reduce((sum,value)=>sum+value*value,0)/window.length));
      }
      source.disconnect();gain.disconnect();
      levels.push({name,gain:engine.volumes[name],expectedGain:INSTRUMENTS[name].volume,rms,db:20*Math.log10(rms)});
    }
    return levels;
  });
  await testInfo.attach('default-instrument-levels',{body:JSON.stringify(levels,null,2),contentType:'application/json'});
  for(const level of levels){expect(level.rms,level.name).toBeGreaterThan(.001);expect(level.gain,level.name).toBe(level.expectedGain);}
  const spread=Math.max(...levels.map(level=>level.db))-Math.min(...levels.map(level=>level.db));
  expect(spread,`representative notes stay within 6 dB: ${JSON.stringify(levels)}`).toBeLessThan(6);
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
