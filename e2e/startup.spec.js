import {test,expect} from './fixtures.js';

test.beforeEach(async({page})=>{
  const viewport=page.viewportSize();
  if(viewport.height>viewport.width)await page.setViewportSize({width:viewport.height,height:viewport.width});
});

async function instrumentEngine(page,delay=false) {
  await page.evaluate(async delay=>{
    const source=await(await fetch('/src/App.jsx')).text();
    const url=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(source)[1];
    const {AudioEngine}=await import(url);
    const original=AudioEngine.prototype.initialize;
    AudioEngine.prototype.initialize=async function(){
      window.audioEngine=this;
      if(delay)await new Promise(resolve=>{window.finishStartup=resolve;});
      await original.call(this);
    };
  },delay);
}

test('manual input after a failed-load retry keeps the drawing synchronized',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/audio/instruments/piano/C3.mp3',route=>route.abort());
  await page.goto('/');await instrumentEngine(page);
  await page.getByRole('button',{name:'Tap to play'}).click();
  await expect(page.getByRole('alert')).toContainText('could not start');
  await page.unroute('**/audio/instruments/piano/C3.mp3');
  const requests=[];
  page.on('request',request=>{if(request.url().includes('/audio/instruments/'))requests.push(request.url());});
  await page.getByRole('button',{name:'Tap to play'}).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  const piano=page.locator('#instrument-piano');
  await piano.click();await expect(piano).toHaveAttribute('aria-pressed','true');
  await piano.focus();await page.keyboard.press('e');
  await page.getByRole('button',{name:'Piano key C4',exact:true}).focus();
  await page.keyboard.down('Space');
  expect(await page.evaluate(()=>window.audioEngine.active.piano)).toBe(false);
  await expect(piano).toHaveAttribute('aria-pressed','false');
  await page.keyboard.up('Space');
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every(url=>new URL(url).origin===new URL(page.url()).origin)).toBe(true);
  expect(errors).toEqual([]);
});

test('selected child settings lock while loading and supply the final performance settings',async({page})=>{
  await page.goto('/');
  await page.evaluate(()=>{
    const family=JSON.parse(localStorage.getItem('farmjam-children-v1'));
    const child=structuredClone(family.children[0]);child.id='advanced';child.name='Advanced';
    child.settings={instruments:{piano:{complexity:1.5}}};
    const initial=family.children[0];
    initial.settings={...initial.settings,instruments:{...initial.settings?.instruments,piano:{...initial.settings?.instruments?.piano,complexity:.35}}};
    family.children.push(child);localStorage.setItem('farmjam-children-v1',JSON.stringify(family));
  });
  await page.reload();await instrumentEngine(page,true);
  const advanced=page.getByRole('radio',{name:'Select Advanced'});
  await advanced.click();await expect(advanced).toBeChecked();
  await page.getByRole('button',{name:'Tap to play'}).click();
  await expect.poll(()=>page.evaluate(()=>typeof window.finishStartup)).toBe('function');
  await expect(advanced).toBeDisabled();await expect(advanced).toBeChecked();
  await page.evaluate(()=>window.finishStartup());
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  expect(await page.evaluate(()=>window.audioEngine.performanceSettings.piano.complexity)).toBe(1.5);
  await expect(page.locator('#young-musician')).toHaveAttribute('data-child-name','Advanced');
  await page.locator('#instrument-piano').focus();await page.keyboard.press('e');
  await expect(page.locator('.performance-piano')).toBeVisible();
  const supported=await page.evaluate(async()=>(await import('/src/utils/performance.js')).PIANO_NOTES);
  const controls=await page.getByRole('button',{name:/^Piano key /}).evaluateAll(keys=>keys.map(key=>key.getAttribute('aria-label').replace('Piano key ','')));
  expect(controls).toEqual(supported);
  await page.locator('#instrument-piano').click();
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.harmonyPlan?.roles.piano)).toBe('accompaniment');
  const selected=await page.evaluate(async()=>{
    const {compositionProfile}=await import('/src/utils/composition.js');
    const {noteMidi}=await import('/src/utils/autoplay.js');
    const engine=window.audioEngine;const plan=engine.harmonyPlan;const phrase=plan.phrases.piano;
    const pool=compositionProfile('piano',plan.root,{...engine.performanceSettings.piano,role:plan.roles.piano,degree:plan.currentChord.degree});
    return {phrase,supported:pool.some(candidate=>candidate.name===phrase.name&&candidate.role===phrase.role&&candidate.tier===phrase.tier),degree:plan.currentChord.degree,harmonic:phrase.events.every(event=>(event.notes??[event.note]).every(note=>plan.currentChord.tones.includes(noteMidi(note)%12)))};
  });
  expect(selected.supported).toBe(true);expect(selected.harmonic).toBe(true);
  expect(selected.phrase.degree).toBe(selected.degree);
  expect(selected.phrase.events.length).toBeGreaterThan(0);
  for(const event of selected.phrase.events)for(const note of event.notes??[event.note])expect(controls).toContain(note);
});
