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
async function stored(page) {return page.evaluate(()=>JSON.parse(localStorage.getItem('farmjam-settings-v1')));}
async function configure(page,name) {await page.getByRole('combobox',{name:'Configure instrument'}).selectOption(name);}
async function chordCount(page,name,complexity) {
  return page.evaluate(async({name,complexity})=>{
    const {equippedProfile}=await import('/src/utils/difficulty.js');
    return equippedProfile(name,'C',{complexity}).chords.length;
  },{name,complexity});
}

test('guitar buttons overlay the neck with diagrams off by default and display options persist',async({page},testInfo)=>{
  await start(page);await equip(page,'guitar');
  await expect(page.locator('.chord-diagram')).toHaveCount(0);
  await expect(page.locator('.chord-control')).toHaveCount(await chordCount(page,'guitar',1.5));
  const neck=await page.locator('.guitar-neck').boundingBox();
  for(const button of await page.locator('.chord-control').all()){
    const bounds=await button.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(neck.x);expect(bounds.y).toBeGreaterThanOrEqual(neck.y);
    expect(bounds.x+bounds.width).toBeLessThanOrEqual(neck.x+neck.width+1);expect(bounds.y+bounds.height).toBeLessThanOrEqual(neck.y+neck.height+1);
  }
  await page.screenshot({path:`test-results/${testInfo.project.name}-guitar-default-settings.png`});
  await settings(page,'Instruments');await configure(page,'guitar');
  await expect(page.getByLabel('Show chord fingering charts')).toBeHidden();
  await page.locator('.settings-display-details summary').click();
  await page.getByLabel('Show chord fingering charts').check();
  await page.keyboard.press('Escape');
  await expect(page.locator('.chord-diagram')).toHaveCount(await chordCount(page,'guitar',1.5));
  const chord=page.getByRole('button',{name:'Hold guitar chord C',exact:true});
  await chord.focus();await page.keyboard.down('Space');await expect(page.locator('.fingering-dot').first()).toBeVisible();
  await page.screenshot({path:`test-results/${testInfo.project.name}-guitar-advanced-settings.png`});await page.keyboard.up('Space');
  await start(page);await equip(page,'guitar');
  await expect(page.locator('.chord-diagram')).toHaveCount(await chordCount(page,'guitar',1.5));
  expect((await stored(page)).instruments.guitar.fingeringCharts).toBe(true);
});

test('per-instrument Simple Standard and Advanced configuration stays independent in storage and the engine',async({page},testInfo)=>{
  await start(page);await settings(page,'Instruments');
  await expect(page.getByRole('tab')).toHaveText(['Sound','Instruments']);
  await expect(page.getByRole('slider')).toHaveCount(0);
  const initial=await stored(page);
  expect(initial.selected).toEqual(['piano','drums','guitar','melody','marimba','flute']);
  expect(Object.values(initial.instruments).every(value=>value.complexity===1.5)).toBe(true);
  expect(initial).not.toHaveProperty('preset');
  await configure(page,'piano');await page.getByRole('radio',{name:'Simple',exact:true}).check();
  const expected=structuredClone(initial);expected.instruments.piano.complexity=.35;
  await expect.poll(()=>stored(page)).toEqual(expected);
  await configure(page,'guitar');
  for(const [label,complexity] of [['Simple',.35],['Standard',1],['Advanced',1.5]]){
    await page.getByRole('radio',{name:label,exact:true}).check();
    await expect(page.getByRole('radio',{name:label,exact:true})).toBeChecked();
    expected.instruments.guitar.complexity=complexity;
    await expect.poll(()=>stored(page)).toEqual(expected);
    await expect.poll(()=>page.evaluate(()=>structuredClone(window.audioEngine.performanceSettings))).toEqual(expected.instruments);
  }
  await page.screenshot({path:testInfo.outputPath('settings-instruments.png')});
  await configure(page,'piano');
  await expect(page.getByRole('radio',{name:'Simple',exact:true})).toBeChecked();
  await expect(page.getByLabel('Show note and control labels')).toBeHidden();
  await page.locator('.settings-display-details summary').click();
  await page.getByLabel('Show note and control labels').check();await page.getByLabel('Show playback note names').check();
  expected.instruments.piano.noteLabels=true;expected.instruments.piano.playbackNotes=true;
  await expect.poll(()=>stored(page)).toEqual(expected);
  await configure(page,'guitar');await expect(page.getByLabel('Show note and control labels')).toBeHidden();
  await page.getByRole('button',{name:'Close settings',exact:true}).click();await equip(page,'piano');
  await expect(page.locator('.note-key span').first()).toBeVisible();
  await start(page);await settings(page,'Instruments');await configure(page,'piano');
  await expect(page.getByRole('radio',{name:'Simple',exact:true})).toBeChecked();
  await page.locator('.settings-display-details summary').click();
  await expect(page.getByLabel('Show note and control labels')).toBeChecked();
  await expect(page.getByLabel('Show playback note names')).toBeChecked();
  await expect.poll(()=>stored(page)).toEqual(expected);
  await expect.poll(()=>page.evaluate(()=>structuredClone(window.audioEngine.performanceSettings))).toEqual(expected.instruments);
});

test('settings modal keeps sound controls, traps focus, and hides advanced information per instrument by default',async({page},testInfo)=>{
  await start(page);await equip(page,'piano');await expect(page.locator('.note-key span').first()).toBeHidden();await expect(page.locator('.autoplay-notes')).toBeHidden();
  await settings(page,'Sound');
  await expect(page.getByRole('tab')).toHaveText(['Sound','Instruments']);
  await expect(page.getByRole('slider',{name:'Scenery sounds volume',exact:true})).toBeVisible();
  await page.getByRole('slider',{name:'Piano volume',exact:true}).fill('-18');await expect(page.getByRole('slider',{name:'Piano volume',exact:true})).toHaveValue('-18');
  await page.getByRole('button',{name:'Close settings',exact:true}).focus();await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('slider',{name:'Scenery sounds volume',exact:true})).toBeFocused();
  await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Close settings',exact:true})).toBeFocused();
  await page.screenshot({path:testInfo.outputPath('settings-sound.png')});
  await page.keyboard.press('Escape');await expect(page.locator('.settings-dialog')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Open settings'})).toBeFocused();
  await settings(page,'Sound');await expect(page.getByRole('slider',{name:'Piano volume',exact:true})).toHaveValue('-18');
});

test('legacy settings migrate to per-instrument radios and preserve six slots and display options',async({page})=>{
  await page.goto('/');
  await page.evaluate(()=>{
    localStorage.setItem('farmjam-settings-v1',JSON.stringify({preset:'Custom',selected:['piano','drums','guitar','melody','marimba','flute'],instruments:{guitar:{complexity:.45,fingeringCharts:true},piano:{complexity:.8,noteLabels:true},flute:{complexity:1.25}}}));
  });
  await start(page);await settings(page,'Instruments');
  const migrated=await stored(page);
  expect(migrated.selected).toEqual(['piano','drums','guitar','melody','marimba','flute']);
  expect(migrated).not.toHaveProperty('preset');
  for(const [name,label] of [['guitar','Simple'],['piano','Standard'],['flute','Advanced']]){
    await configure(page,name);await expect(page.getByRole('radio',{name:label,exact:true})).toBeChecked();
  }
  await configure(page,'guitar');await page.locator('.settings-display-details summary').click();
  await expect(page.getByLabel('Show chord fingering charts')).toBeChecked();
  await page.keyboard.press('Escape');await equip(page,'guitar');
  const simpleChords=await chordCount(page,'guitar',.35);
  await expect(page.locator('.chord-control')).toHaveCount(simpleChords);
  await expect(page.locator('.chord-diagram')).toHaveCount(simpleChords);
  await start(page);await expect.poll(()=>stored(page)).toEqual(migrated);
  await expect.poll(()=>page.evaluate(()=>structuredClone(window.audioEngine.performanceSettings))).toEqual(migrated.instruments);
});