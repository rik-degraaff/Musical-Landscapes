import {test,expect,waitForInstrumentSettling} from './fixtures.js';

async function start(page) {
  const size=page.viewportSize();
  if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});
  await page.goto('/');
  await page.evaluate(async()=>{
    const app=await(await fetch('/src/App.jsx')).text();
    const url=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(app)[1];
    const {AudioEngine}=await import(url);
    const initialize=AudioEngine.prototype.initialize;
    AudioEngine.prototype.initialize=async function(){await initialize.call(this);window.audioEngine=this;};
  });
  await page.getByRole('button',{name:'Tap to play',exact:true}).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  await waitForInstrumentSettling(page);
  await page.evaluate(()=>{
    window.semanticNotes=[];
    const engine=window.audioEngine;
    const play=engine.manualNoteOn;
    engine.manualNoteOn=function(note,token,...args){window.semanticNotes.push({note,token,instrument:this.manualInstrument});return play.call(this,note,token,...args);};
  });
}

async function equip(page,name) {
  await page.locator(`#instrument-${name}`).focus();await page.keyboard.press('e');
  await expect(page.locator(`.performance-${name}`)).toBeVisible();
  await waitForInstrumentSettling(page);
}

async function clickOnly(locator) {await locator.evaluate(element=>element.click());}
async function resetNotes(page) {await page.evaluate(()=>{window.semanticNotes=[];});}
async function notes(page) {return page.evaluate(()=>window.semanticNotes);}

test('semantic note activation plays once and releases its owned voice on timeout, reset and unmount',async({page})=>{
  await start(page);await equip(page,'piano');
  const key=page.getByRole('button',{name:'Piano key C5',exact:true});
  await clickOnly(key);
  expect((await notes(page)).map(value=>value.note)).toEqual(['C5']);
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.retiringVoices.size)).toBe(0);
  await expect(key).toHaveAttribute('aria-pressed','false');

  await resetNotes(page);await clickOnly(key);
  expect((await notes(page)).map(value=>value.note)).toEqual(['C5']);
  await page.evaluate(()=>window.dispatchEvent(new Event('farmjam-input-reset')));
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  await expect(key).toHaveAttribute('aria-pressed','false');
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.retiringVoices.size)).toBe(0);

  await clickOnly(key);
  await page.getByRole('button',{name:'Put instrument down',exact:true}).click();
  await expect(page.locator('.performance-panel')).toHaveCount(0);
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.manualVoices.size+window.audioEngine.retiringVoices.size)).toBe(0);
});

test('physical taps, keyboard holds and swipes do not gain a second semantic attack',async({page},testInfo)=>{
  await start(page);await equip(page,'piano');
  const key=page.getByRole('button',{name:'Piano key C4',exact:true});
  if(testInfo.project.use.hasTouch)await key.tap();else await key.click();
  expect((await notes(page)).map(value=>value.note)).toEqual(['C4']);
  await resetNotes(page);await key.focus();
  await page.keyboard.down('Space');
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(1);
  await page.keyboard.up('Space');
  expect((await notes(page)).map(value=>value.note)).toEqual(['C4']);
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);

  await resetNotes(page);
  const end=page.getByRole('button',{name:'Piano key D4',exact:true});
  const [first,last]=await Promise.all([key.boundingBox(),end.boundingBox()]);
  const startPoint={x:first.x+first.width/2,y:first.y+first.height*.85};
  const finish={x:last.x+last.width/2,y:last.y+last.height*.85};
  await page.mouse.move(startPoint.x,startPoint.y);await page.mouse.down();
  await page.mouse.move(finish.x,finish.y,{steps:8});await page.mouse.up();
  expect((await notes(page)).map(value=>value.note)).toEqual(['C4','D4']);
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
});

test('rapid semantic wind activations keep distinct release owners',async({page})=>{
  await start(page);await equip(page,'panflute');
  await page.locator('.panflute-pipe').evaluateAll(elements=>{elements[0].click();elements[1].click();});
  const played=await notes(page);
  expect(played).toHaveLength(2);
  expect(played[0].token).not.toBe(played[1].token);
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.manualVoices.size+window.audioEngine.retiringVoices.size)).toBe(0);
  await expect(page.locator('.panflute-pipe[aria-pressed="true"]')).toHaveCount(0);
});

test('semantic chord selection stays available for string activation and clears on reset',async({page})=>{
  await start(page);await equip(page,'ukulele');
  const chord=page.getByRole('button',{name:'Hold ukulele chord A',exact:true});
  await clickOnly(chord);
  await expect(chord).toHaveAttribute('aria-pressed','true');
  const labels=await page.locator('.playable-string').evaluateAll(elements=>elements.map(element=>element.getAttribute('aria-label')));
  await clickOnly(page.locator('.playable-string').first());
  expect((await notes(page)).map(value=>value.note)).toEqual([labels[0].split(' ').at(-1)]);
  await expect(chord).toHaveAttribute('aria-pressed','true');
  await clickOnly(chord);await expect(chord).toHaveAttribute('aria-pressed','false');
  await clickOnly(chord);await page.evaluate(()=>window.dispatchEvent(new Event('farmjam-input-reset')));
  await expect(chord).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('.neck-chord-name')).toHaveCount(0);
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.manualVoices.size+window.audioEngine.retiringVoices.size)).toBe(0);
});

test('semantic landscape and avatar activation reaches playback and practice without duplicating physical taps',async({page},testInfo)=>{
  await start(page);
  const piano=page.locator('#instrument-piano');
  await clickOnly(piano);await expect(piano).toHaveAttribute('aria-pressed','true');
  if(testInfo.project.use.hasTouch)await piano.tap();else await piano.click();
  await expect(piano).toHaveAttribute('aria-pressed','false');
  await piano.focus();await page.keyboard.press('Space');await expect(piano).toHaveAttribute('aria-pressed','true');
  await clickOnly(page.locator('#young-musician'));
  await expect(page.getByRole('dialog',{name:'Farm practice room'})).toBeVisible();
  await page.getByRole('button',{name:'Leave practice through the open door'}).click();
  await expect(piano).toHaveAttribute('aria-pressed','true');
});
