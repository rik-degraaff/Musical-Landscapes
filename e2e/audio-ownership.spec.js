import { test, expect } from './fixtures.js';

async function prepare(page, options = {}) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.evaluate(async ({ phase, failure }) => {
    const source = await (await fetch('/src/App.jsx')).text();
    const url = /from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(source)[1];
    const { AudioEngine } = await import(url);
    const audioSource = await (await fetch(url)).text();
    const Tone = await import(/import\s+\*\s+as\s+Tone\s+from\s+["']([^"']+)["']/.exec(audioSource)[1]);
    const { AudioResources } = await import('/src/audio/resources.js');
    const state = window.ownership = { attempts: [], records: new Map(), wrapperArguments: [], matched: 0, lateStarted: false, lateCompleted: false, cleared: [], cancellations: 0 };
    window.testTone = Tone;
    const initialize = AudioEngine.prototype.initialize;
    AudioEngine.prototype.initialize = async function () {
      window.audioEngine = this;
      state.wrapperArguments.push(arguments.length);
      state.attempts.push({ scope: this.initializationAttempt.resources, resources: [] });
      await initialize.call(this);
    };
    const own = AudioResources.prototype.own;
    AudioResources.prototype.own = function (resource, ...args) {
      const result = own.call(this, resource, ...args);
      if (!state.records.has(resource)) {
        const attempt = state.attempts.find(value => value.scope === this);
        const record = { resource, attempt, disposals: 0 };
        attempt.resources.push(record);
        state.records.set(resource, record);
        const dispose = resource.dispose;
        resource.dispose = function () { record.disposals++; return dispose.call(this); };
      }
      return result;
    };
    const gate = new Promise(resolve => { state.releaseLate = resolve; });
    const load = Tone.ToneAudioBuffer.prototype.load;
    Tone.ToneAudioBuffer.prototype.load = async function (sampleUrl) {
      const record = state.records.get(this);
      if (phase && record?.attempt === state.attempts[0] && sampleUrl.includes(`/audio/${phase}/`)) {
        const matched = ++state.matched;
        if (failure && matched === 1) throw new Error('Ownership test recording failure');
        if (matched === (failure ? 2 : 1)) {
          state.lateStarted = true;
          state.lateBuffer = this;
          await gate;
          const result = await load.call(this, sampleUrl);
          state.lateCompleted = true;
          return result;
        }
      }
      return load.call(this, sampleUrl);
    };
    const clear = Tone.Transport.clear;
    Tone.Transport.clear = function (id) { state.cleared.push(id); return clear.call(this, id); };
    const cancel = Tone.Transport.cancel;
    Tone.Transport.cancel = function (...args) { state.cancellations++; return cancel.apply(this, args); };
  }, options);
  return errors;
}

async function play(page) {
  await page.getByRole('button', { name: 'Tap to play' }).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0, { timeout: 30000 });
}

for (const phase of ['instruments', 'scenery']) for (const failure of [true, false]) {
  test(`${failure ? 'failed' : 'disposed'} ${phase} attempt cannot publish late resources or dispose its retry`, async ({ page }) => {
    const errors = await prepare(page, { phase, failure });
    await page.getByRole('button', { name: 'Tap to play' }).click();
    await expect.poll(() => page.evaluate(() => window.ownership.lateStarted)).toBe(true);
    if (!failure) {
      expect(await page.evaluate(() => ({ ready: window.audioEngine.ready, nodes: Object.keys(window.audioEngine.nodes).length }))).toEqual({ ready: false, nodes: 0 });
      await page.evaluate(() => window.audioEngine.dispose());
    }
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tap to play' })).toBeEnabled();
    await page.evaluate(() => { window.ownership.oldCount = window.ownership.attempts[0].resources.length; });
    await play(page);
    await page.evaluate(() => {
      window.ownership.retryMaster = window.audioEngine.master;
      window.ownership.retryNodes = window.audioEngine.nodes;
      window.ownership.releaseLate();
    });
    await expect.poll(() => page.evaluate(() => window.ownership.lateCompleted)).toBe(true);
    await expect.poll(() => page.evaluate(() => window.ownership.attempts[0].resources.every(record => record.disposals === 1))).toBe(true);
    expect(await page.evaluate(() => {
      const state = window.ownership;
      const engine = window.audioEngine;
      return {
        ready: engine.ready,
        sameMaster: engine.master === state.retryMaster,
        sameNodes: engine.nodes === state.retryNodes,
        lateBufferCleared: !state.lateBuffer.get(),
        noLateResources: state.attempts[0].resources.length === state.oldCount,
        retryUntouched: state.attempts[1].resources.every(record => record.disposals === 0),
        wrapperArguments: state.wrapperArguments,
        cancellations: state.cancellations,
        schedules: [engine.metronomeEvent, engine.transportEvent].filter(id => id !== null).length,
      };
    })).toEqual({ ready: true, sameMaster: true, sameNodes: true, lateBufferCleared: true, noLateResources: true, retryUntouched: true, wrapperArguments: [0, 0], cancellations: 0, schedules: 2 });
    await page.locator('#instrument-piano').click();
    await expect(page.locator('#instrument-piano')).toHaveAttribute('aria-pressed', 'true');
    expect(errors).toEqual([]);
  });
}

test('dispose disconnects only owned voices and preserves retirement until the old onended', async ({ page }) => {
  const errors = await prepare(page);
  await play(page);
  const disposed = await page.evaluate(() => {
    const state = window.ownership;
    const engine = window.audioEngine;
    const Tone = window.testTone;
    state.foreign = new Tone.Gain(.1).toDestination();
    state.foreignEvent = Tone.Transport.scheduleRepeat(() => {}, '4n');
    engine.setManualInstrument('piano');
    engine.manualNoteOn('C4', 'ownership-key');
    state.oldVoice = engine.manualVoices.get('ownership-key');
    state.disconnections = { source: 0, envelope: 0 };
    for (const key of ['source', 'envelope']) {
      const node = state.oldVoice[key];
      const disconnect = node.disconnect;
      node.disconnect = function (...args) { state.disconnections[key]++; return disconnect.apply(this, args); };
    }
    const ended = state.oldVoice.source.onended;
    state.finishOldVoice = ended;
    state.oldVoice.source.onended = () => {};
    engine.dispose();
    engine.dispose();
    return {
      active: engine.manualVoices.size,
      retiring: engine.retiringVoices.has(state.oldVoice),
      disconnections: state.disconnections,
      foreignDisposed: state.foreign.disposed,
      foreignCleared: state.cleared.includes(state.foreignEvent),
      cancellations: state.cancellations,
      disposedOnce: state.attempts[0].resources.every(record => record.disposals === 1),
    };
  });
  expect(disposed).toEqual({ active: 0, retiring: true, disconnections: { source: 1, envelope: 1 }, foreignDisposed: false, foreignCleared: false, cancellations: 0, disposedOnce: true });
  await page.evaluate(() => {
    const button = document.createElement('button');
    button.id = 'ownership-retry';
    button.textContent = 'Ownership retry';
    button.onclick = () => { window.ownership.retry = window.audioEngine.init(); };
    document.body.append(button);
  });
  await page.locator('#ownership-retry').click();
  await page.evaluate(() => window.ownership.retry);
  expect(await page.evaluate(() => {
    const engine = window.audioEngine;
    const state = window.ownership;
    engine.manualNoteOn('E4', 'ownership-key');
    const replacement = engine.manualVoices.get('ownership-key');
    state.finishOldVoice();
    const result = { replacementPresent: Boolean(replacement) && engine.manualVoices.get('ownership-key') === replacement, retiringRemoved: !engine.retiringVoices.has(state.oldVoice), disconnections: state.disconnections };
    engine.manualNoteOff('ownership-key', true);
    window.testTone.Transport.clear(state.foreignEvent);
    state.foreign.dispose();
    return result;
  })).toEqual({ replacementPresent: true, retiringRemoved: true, disconnections: { source: 1, envelope: 1 } });
  expect(errors).toEqual([]);
});

test('practice restores every saved field and keeps its pinned phrase after profile cache eviction', async ({ page }) => {
  const errors = await prepare(page);
  await play(page);
  const result = await page.evaluate(async () => {
    const { equippedProfile } = await import('/src/utils/difficulty.js');
    const { Composition, compositionProfile } = await import('/src/utils/composition.js');
    const { INSTRUMENTS } = await import('/src/utils/music.js');
    const { capturePracticeSnapshot } = await import('/src/audio/session.js');
    const engine = window.audioEngine;
    engine.setManualInstrument('ukulele');
    engine.setInstrumentActive('drums', true);
    engine.setTempo(137);
    engine.setMetronomeSound(true);
    engine.skipEquippedPhrase();
    const before = capturePracticeSnapshot(engine);
    const selected = engine.equippedPhrase;
    const cachedProfile = equippedProfile('ukulele', engine.root, engine.performanceSettings.ukulele);
    engine.beginPractice('piano');
    engine.setTempo(82);
    engine.setMetronomeSound(false);
    engine.root = 'C';
    const roots = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    for (const name of Object.keys(INSTRUMENTS)) for (const root of roots) for (const complexity of [.35, 1, 1.5]) equippedProfile(name, root, { complexity });
    engine.endPractice();
    const restored = capturePracticeSnapshot(engine);
    const plan = new Composition({random:()=>.5}).planBar(42, engine.root, engine.compositionOptions('ukulele'));
    engine.scheduledBars.set(42, { plan });
    const rebuilt = engine.selectPhrase('ukulele', 42, 0);
    engine.scheduledBars.delete(42);
    const expected = compositionProfile('ukulele', plan.root, { ...engine.performanceSettings.ukulele, role: plan.roles.ukulele, degree: plan.currentChord.degree }).find(phrase => phrase.name === selected.name);
    const rebuiltProfile = equippedProfile('ukulele', plan.root, engine.performanceSettings.ukulele);
    const canonical = rebuiltProfile.chords.find(chord => chord.degree === plan.currentChord.degree && chord.size === 3);
    return { before, restored, rebuilt, expected, canonical, chord: plan.currentChord.name, differentReference: rebuilt !== selected, evicted: rebuiltProfile !== cachedProfile };
  });
  expect(result.evicted).toBe(true);
  expect(result.differentReference).toBe(true);
  expect(result.restored).toEqual(result.before);
  expect(result.rebuilt.name).toBe(result.before.equippedPhrase.name);
  expect(result.rebuilt.role).toBe(result.before.equippedPhrase.role);
  expect(result.expected).toBeDefined();
  expect(result.rebuilt).toEqual(result.expected);
  expect(result.canonical).toBeDefined();
  for (const event of result.rebuilt.events) {
    expect(event.chord).toBe(result.chord);
    expect(event.fingering.map(finger => finger.note)).toEqual(event.notes ?? [event.note]);
    expect(new Set(event.fingering.map(finger => finger.string)).size).toBe(event.fingering.length);
    for (const finger of event.fingering) {
      expect(finger.fret).toBe(result.canonical.frets[finger.string]);
      expect(finger.note).toBe(result.canonical.notes[finger.string]);
    }
  }
  const snapshot = await page.evaluate(async () => {
    const { capturePracticeSnapshot } = await import('/src/audio/session.js');
    const engine = window.audioEngine;
    return { restored: capturePracticeSnapshot(engine), pinned: engine.phrasePinned, practice: engine.practiceSession };
  });
  expect(snapshot.pinned).toBe(true);
  expect(snapshot.practice).toBeNull();
  expect(snapshot.restored).toMatchObject({ manual: 'ukulele', tempo: 137, metronomeSound: true, active: { drums: true, ukulele: true } });
  expect(errors).toEqual([]);
});