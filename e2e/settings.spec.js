import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    const key='farmjam-settings-v1';
    const saved=JSON.parse(localStorage.getItem(key)??'{}');
    localStorage.setItem(key,JSON.stringify({...saved,selected:['piano','drums','guitar','melody','marimba','flute']}));
  });
});

async function start(page) {
  const viewport=page.viewportSize();if(viewport.height>viewport.width)await page.setViewportSize({width:viewport.height,height:viewport.width});
  await page.goto('/');
  await page.evaluate(async()=>{
    const source=await (await fetch('/src/App.jsx')).text();
    const url=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(source)[1];
    const {AudioEngine}=await import(url);
    const initialize=AudioEngine.prototype.initialize;
    AudioEngine.prototype.initialize=async function(){await initialize.call(this);window.audioEngine=this;};
  });
  await page.getByRole('button',{name:'Tap to play'}).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:20000});
}
async function equip(page,name) {await page.locator(`#instrument-${name}`).focus();await page.keyboard.press('e');await expect(page.locator(`.performance-${name}`)).toBeVisible();}
async function settings(page,tab) {await page.getByRole('button',{name:'Open settings'}).dblclick();await expect(page.getByRole('dialog',{name:'Settings'})).toBeVisible();if(tab)await page.getByRole('tab',{name:tab,exact:true}).click();}

test('guitar buttons overlay the neck with diagrams off by default and display options persist',async({page},testInfo)=>{
  await start(page);await equip(page,'guitar');
  await expect(page.locator('.chord-diagram')).toHaveCount(0);
  await expect(page.locator('.chord-control')).toHaveCount(14);
  const neck=await page.locator('.guitar-neck').boundingBox();
  for(const button of await page.locator('.chord-control').all()){
    const bounds=await button.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(neck.x);expect(bounds.y).toBeGreaterThanOrEqual(neck.y);
    expect(bounds.x+bounds.width).toBeLessThanOrEqual(neck.x+neck.width+1);expect(bounds.y+bounds.height).toBeLessThanOrEqual(neck.y+neck.height+1);
  }
  await page.screenshot({path:`test-results/${testInfo.project.name}-guitar-default-settings.png`});
  await settings(page,'Display');
  await page.getByLabel('Show chord fingering charts').check();
  await page.keyboard.press('Escape');
  await expect(page.locator('.chord-diagram')).toHaveCount(14);
  const chord=page.getByRole('button',{name:'Hold guitar chord C',exact:true});
  await chord.focus();await page.keyboard.down('Space');await expect(page.locator('.fingering-dot').first()).toBeVisible();
  await page.screenshot({path:`test-results/${testInfo.project.name}-guitar-advanced-settings.png`});await page.keyboard.up('Space');
  await page.reload();await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:20000});await equip(page,'guitar');
  await expect(page.locator('.chord-diagram')).toHaveCount(14);
});

test('complexity presets and individual controls are functional and do not reset other instruments',async({page})=>{
  await start(page);await settings(page,'Playback');
  await page.getByLabel('Simple',{exact:true}).check();
  const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('farmjam-settings-v1')));
  expect(Object.values((await stored()).instruments).every(value=>value.complexity===.35)).toBe(true);
  await page.getByRole('slider',{name:'Acoustic guitar phrase complexity'}).fill('1.25');
  expect((await stored()).preset).toBe('Custom');expect((await stored()).instruments.guitar.complexity).toBe(1.25);expect((await stored()).instruments.piano.complexity).toBe(.35);
  await page.getByRole('tab',{name:'Display',exact:true}).click();await page.getByRole('combobox',{name:'Configure instrument'}).selectOption('piano');
  await page.getByLabel('Show note and control labels').check();await page.getByLabel('Show playback note names').check();
  await page.getByRole('button',{name:'Close settings',exact:true}).click();await equip(page,'piano');
  await expect(page.locator('.note-key span').first()).toBeVisible();
  await page.getByRole('button',{name:'Put instrument down'}).click();await equip(page,'guitar');await expect(page.locator('.chord-control')).toHaveCount(7);
});

test('settings modal keeps sound controls, traps focus, and hides advanced information per instrument by default',async({page},testInfo)=>{
  await start(page);await equip(page,'piano');await expect(page.locator('.note-key span').first()).toBeHidden();await expect(page.locator('.autoplay-notes')).toBeHidden();
  await settings(page);
  await page.getByRole('slider',{name:'Piano volume',exact:true}).fill('-18');await expect(page.getByRole('slider',{name:'Piano volume',exact:true})).toHaveValue('-18');
  await page.getByRole('button',{name:'Close settings',exact:true}).focus();await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(()=>document.querySelector('.settings-dialog').contains(document.activeElement))).toBe(true);
  await page.screenshot({path:`test-results/${testInfo.project.name}-settings-modal.png`});
  await page.keyboard.press('Escape');await expect(page.locator('.settings-dialog')).toHaveCount(0);
});

test('complexity settings select the corresponding authored phrases in the audio engine',async({page})=>{
  await start(page);
  await page.evaluate(()=>{
    const engine=window.audioEngine;
    engine.noise.piano.energyAt=()=>.5;engine.noise.piano.complexityAt=()=>.8;
    window.selectedPhrases=[];
    const original=engine.playEvent;
    engine.playEvent=function(name,event,time){if(name==='piano'&&event.time==='0:0:0')window.selectedPhrases.push({event,factor:this.performanceSettings.piano.complexity});return original.call(this,name,event,time);};
  });
  await settings(page,'Playback');await page.getByLabel('Simple',{exact:true}).check();await page.keyboard.press('Escape');
  await page.locator('#instrument-piano').click();
  await expect.poll(()=>page.evaluate(()=>window.selectedPhrases.some(value=>value.factor===.35))).toBe(true);
  await settings(page,'Playback');await page.getByRole('combobox',{name:'Configure instrument'}).selectOption('piano');await page.getByRole('slider',{name:'Piano phrase complexity'}).fill('1.25');await page.keyboard.press('Escape');
  await expect.poll(()=>page.evaluate(()=>window.selectedPhrases.some(value=>value.factor===1.25))).toBe(true);
  const checks=await page.evaluate(async()=>{
    const {patterns,nearestBar,transposeEvents}=await import('/src/utils/music.js');
    return window.selectedPhrases.map(value=>({...value,expected:transposeEvents(nearestBar(patterns.piano,.5,Math.min(1,.8*value.factor)).events,'C')[0]}));
  });
  for(const check of checks)expect(check.event).toEqual(check.expected);
  expect(checks.find(check=>check.factor===.35).event).not.toEqual(checks.find(check=>check.factor===1.25).event);
});