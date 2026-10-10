import {test,expect} from '@playwright/test';
async function start(page){const size=page.viewportSize();if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});await page.goto('/');await page.evaluate(async()=>{const text=await(await fetch('/src/App.jsx')).text();const url=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(text)[1];const {AudioEngine}=await import(url);const init=AudioEngine.prototype.initialize;AudioEngine.prototype.initialize=async function(){await init.call(this);window.audioEngine=this;};});await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});}
async function equip(page,name){await page.locator(`#instrument-${name}`).focus();await page.keyboard.press('e');await expect(page.locator(`.performance-${name}`)).toBeVisible();}
async function difficulty(page,name,level){await page.getByRole('button',{name:'Open settings'}).dblclick();await page.getByRole('tab',{name:'Instruments',exact:true}).click();await page.getByRole('combobox',{name:'Configure instrument'}).selectOption(name);await page.getByRole('radio',{name:level,exact:true}).check();await page.keyboard.press('Escape');}

test('instrument difficulty reduces equipped controls and only plays available chords',async({page},testInfo)=>{
  await start(page);await equip(page,'ukulele');await difficulty(page,'ukulele','Simple');await expect(page.locator('.chord-control')).toHaveCount(3);
  await page.locator('#instrument-ukulele').click();
  await page.evaluate(()=>{window.chordEvents=[];const engine=window.audioEngine;const original=engine.playEvent;engine.playEvent=function(name,event,time){if(name==='ukulele')window.chordEvents.push(event.chord);return original.call(this,name,event,time);};});
  await expect.poll(()=>page.evaluate(()=>window.chordEvents.length)).toBeGreaterThan(1);
  const available=await page.locator('.chord-name').allTextContents();for(const chord of await page.evaluate(()=>window.chordEvents))expect(available).toContain(chord);
  await page.screenshot({path:`test-results/${testInfo.project.name}-simple-ukulele.png`});
  await difficulty(page,'ukulele','Standard');await expect(page.locator('.chord-control')).toHaveCount(6);
  await difficulty(page,'ukulele','Advanced');await expect(page.locator('.chord-control')).toHaveCount(14);
  await page.getByRole('button',{name:'Put instrument down'}).click();await equip(page,'drums');await difficulty(page,'drums','Simple');await expect(page.locator('.drum-pad')).toHaveCount(3);
  await page.getByRole('button',{name:'Put instrument down'}).click();await equip(page,'melody');await difficulty(page,'melody','Simple');await expect(page.locator('.lip-segment')).toHaveCount(2);
  await page.getByRole('button',{name:'Put instrument down'}).click();await equip(page,'panflute');await difficulty(page,'panflute','Simple');expect(await page.locator('.panflute-pipe').count()).toBeLessThan(22);
});

test('complexity leaves unequipped phrases unchanged and next phrase selects another compatible phrase',async({page})=>{
  await start(page);await difficulty(page,'ukulele','Simple');
  expect(await page.evaluate(async()=>{const engine=window.audioEngine;const {nearestBar}=await import('/src/utils/music.js');const {UKULELE_LIBRARY}=await import('/src/utils/guitar.js');const bar=4;return JSON.stringify(engine.selectPhrase('ukulele',bar))===JSON.stringify(nearestBar(UKULELE_LIBRARY.C.phrases,engine.noise.ukulele.energyAt(bar),engine.noise.ukulele.complexityAt(bar)));})).toBe(true);
  await equip(page,'ukulele');await page.locator('#instrument-ukulele').click();await expect.poll(()=>page.evaluate(()=>Boolean(window.audioEngine.equippedPhrase))).toBe(true);
  const before=await page.evaluate(()=>JSON.stringify(window.audioEngine.equippedPhrase.events));await page.getByRole('button',{name:'Next phrase'}).click();
  expect(await page.evaluate(()=>JSON.stringify(window.audioEngine.equippedPhrase.events))).not.toBe(before);
  expect(await page.evaluate(()=>window.audioEngine.active.ukulele)).toBe(true);
  const selected=await page.evaluate(()=>JSON.stringify(window.audioEngine.equippedPhrase.events));
  await page.waitForTimeout(2900);expect(await page.evaluate(()=>JSON.stringify(window.audioEngine.equippedPhrase.events))).toBe(selected);
  await page.getByRole('button',{name:'Put instrument down'}).click();expect(await page.evaluate(()=>window.audioEngine.active.ukulele)).toBe(true);
});

test('equipping and changing difficulty remove incompatible queued events without changing accompaniment',async({page})=>{
  await start(page);await difficulty(page,'ukulele','Simple');await page.locator('#instrument-ukulele').click();await page.locator('#instrument-drums').click();
  await expect.poll(()=>page.evaluate(()=>[...window.audioEngine.pendingEvents.values()].includes('ukulele'))).toBe(true);
  await equip(page,'ukulele');
  expect(await page.evaluate(()=>[...window.audioEngine.pendingEvents.values()].includes('ukulele'))).toBe(false);
  await difficulty(page,'ukulele','Advanced');await page.getByRole('button',{name:'Next phrase'}).click();
  await difficulty(page,'ukulele','Simple');
  const available=await page.locator('.chord-name').allTextContents();
  const choice=await page.evaluate(()=>window.audioEngine.selectPhrase('ukulele',Math.max(0,window.audioEngine.barIndex-1)));
  expect(choice.events.every(event=>available.includes(event.chord))).toBe(true);
  expect(await page.evaluate(()=>window.audioEngine.active.drums)).toBe(true);
  await page.getByRole('button',{name:'Change landscape'}).click({force:true});
  const newChords=await page.locator('.chord-name').allTextContents();
  const next=await page.evaluate(()=>window.audioEngine.selectPhrase('ukulele',Math.max(0,window.audioEngine.barIndex-1)));
  expect(next.events.every(event=>newChords.includes(event.chord))).toBe(true);
});