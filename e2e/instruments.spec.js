import { test, expect } from '@playwright/test';

async function start(page) {
  const viewport=page.viewportSize();
  if(viewport.height>viewport.width)await page.setViewportSize({width:viewport.height,height:viewport.width});
  await page.goto('/');
  await page.evaluate(async()=>{
    const source=await (await fetch('/src/App.jsx')).text();
    const url=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(source)[1];
    const {AudioEngine}=await import(url);
    const original=AudioEngine.prototype.initialize;
    AudioEngine.prototype.initialize=async function(){await original.call(this);window.audioEngine=this;};
  });
  await page.getByRole('button',{name:'Tap to play'}).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:20000});
}

test('active playback survives equip and unequip without releasing or clearing its scheduled phrase',async({page})=>{
  await start(page);
  await page.locator('#instrument-piano').click();
  await page.evaluate(()=>{
    window.releases=0;
    const engine=window.audioEngine;
    const original=engine.nodes.piano.synth.releaseAll;
    engine.nodes.piano.synth.releaseAll=function(...args){window.releases++;return original.apply(this,args);};
    window.clears=0;
    const clear=engine.clearPendingEvents;
    engine.clearPendingEvents=function(...args){window.clears++;return clear.apply(this,args);};
  });
  await page.locator('#instrument-piano').focus();await page.keyboard.press('e');
  await expect(page.locator('.performance-piano')).toBeVisible();
  await expect(page.getByRole('switch',{name:'Autoplay equipped instrument'})).toHaveCount(0);
  expect(await page.evaluate(()=>({releases:window.releases,clears:window.clears,active:window.audioEngine.active.piano}))).toEqual({releases:0,clears:0,active:true});
  await page.getByRole('button',{name:'Put instrument down'}).click();
  expect(await page.evaluate(()=>({releases:window.releases,clears:window.clears,active:window.audioEngine.active.piano}))).toEqual({releases:0,clears:0,active:true});
  await page.locator('#instrument-piano').focus();await page.keyboard.press('e');
  await page.getByRole('button',{name:'Piano key C4',exact:true}).focus();await page.keyboard.press('Space');
  expect(await page.evaluate(()=>window.audioEngine.active.piano)).toBe(false);
  await page.locator('#instrument-piano').click();
  expect(await page.evaluate(()=>window.audioEngine.active.piano)).toBe(true);
});

async function equipByKey(page,name) {
  await page.locator(`#instrument-${name}`).focus();await page.keyboard.press('e');
  await expect(page.locator(`.performance-${name}`)).toBeVisible();
}

test('flute needs breath, retunes a single held voice, and releases when breath ends',async({page},testInfo)=>{
  await start(page);await equipByKey(page,'flute');
  await page.getByRole('button',{name:'Flute fingering G4',exact:true}).click();
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  const session=await page.context().newCDPSession(page);
  const bounds=await page.getByRole('button',{name:'Blow flute',exact:true}).boundingBox();
  const held={id:1,x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2};
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[held]});
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.get('flute-breath').note)).toBe('G4');
  await page.evaluate(()=>window.originalWind=window.audioEngine.manualVoices.get('flute-breath').source);
  await page.getByRole('slider',{name:'Flute breath strength'}).fill('0.8');
  expect(await page.evaluate(()=>window.originalWind===window.audioEngine.manualVoices.get('flute-breath').source)).toBe(true);
  const fingering=await page.getByRole('button',{name:'Flute fingering C5',exact:true}).boundingBox();
  const finger={id:2,x:fingering.x+fingering.width/2,y:fingering.y+fingering.height/2};
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[held,finger]});
  expect(await page.evaluate(()=>({size:window.audioEngine.manualVoices.size,note:window.audioEngine.manualVoices.get('flute-breath').note}))).toEqual({size:1,note:'C5'});
  await page.screenshot({path:`test-results/${testInfo.project.name}-realistic-flute.png`});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
});

test('trumpet uses sampled concert pitches, pressure changes preserve attack and valves retune held breath',async({page},testInfo)=>{
  await start(page);await equipByKey(page,'melody');
  await page.getByRole('group',{name:'Trumpet register'}).getByRole('button',{name:'G4',exact:true}).click();
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  const session=await page.context().newCDPSession(page);
  const bounds=await page.getByRole('button',{name:'Blow trumpet',exact:true}).boundingBox();
  const held={id:1,x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2};
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[held]});
  await page.evaluate(()=>window.originalWind=window.audioEngine.manualVoices.get('trumpet-breath').source);
  await page.getByRole('slider',{name:'Trumpet breath strength'}).fill('0.8');
  expect(await page.evaluate(()=>window.originalWind===window.audioEngine.manualVoices.get('trumpet-breath').source)).toBe(true);
  const valve=await page.getByRole('button',{name:'Trumpet valve 1',exact:true}).boundingBox();
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[held,{id:2,x:valve.x+valve.width/2,y:valve.y+10}]});
  expect(await page.evaluate(()=>({size:window.audioEngine.manualVoices.size,note:window.audioEngine.manualVoices.get('trumpet-breath').note}))).toEqual({size:1,note:'F4'});
  await page.screenshot({path:`test-results/${testInfo.project.name}-realistic-trumpet.png`});
  await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
});

test('guitar labels and sounding chords follow key changes without enabling playback',async({page},testInfo)=>{
  await start(page);await equipByKey(page,'guitar');
  await page.getByRole('button',{name:'Change landscape'}).click({force:true});
  for(const chord of ['G','D','Em','C'])await expect(page.getByRole('button',{name:`Hold guitar chord ${chord}`,exact:true})).toBeVisible();
  const chord=page.getByRole('button',{name:'Hold guitar chord G',exact:true});
  await chord.focus();await page.keyboard.down('Space');
  await expect(page.getByRole('button',{name:'Guitar string 2 G3',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Guitar string 3 B3',exact:true})).toBeVisible();
  await page.screenshot({path:`test-results/${testInfo.project.name}-transposed-guitar.png`});
  await page.keyboard.up('Space');
  await page.getByRole('button',{name:'Change landscape'}).click({force:true});
  for(const chord of ['F','C','Dm','A#'])await expect(page.getByRole('button',{name:`Hold guitar chord ${chord}`,exact:true})).toBeVisible();
  expect(await page.evaluate(()=>window.audioEngine.active.guitar)).toBe(false);
});

test('all phrase notes are visible before activation and ranges do not resize with playback',async({page})=>{
  await start(page);
  for(const [name,count,label] of [['piano',34,'Piano key'],['marimba',22,'Marimba bar'],['flute',26,'Flute fingering']]){
    await equipByKey(page,name);
    await expect(page.getByRole('button',{name:new RegExp(`^${label} `)})).toHaveCount(count);
    await page.locator(`#instrument-${name}`).click();
    await expect(page.getByRole('button',{name:new RegExp(`^${label} `)})).toHaveCount(count);
    await page.getByRole('button',{name:'Put instrument down'}).click();
    expect(await page.evaluate(name=>window.audioEngine.active[name],name)).toBe(true);
  }
});

test('portrait gameplay is blocked and landscape removes the orientation guard',async({page})=>{
  await page.setViewportSize({width:393,height:851});await page.goto('/');
  await expect(page.getByRole('dialog',{name:'Landscape orientation required'})).toBeVisible();
  await page.setViewportSize({width:851,height:393});
  await expect(page.getByRole('dialog',{name:'Landscape orientation required'})).toBeHidden();
  await expect(page.getByRole('button',{name:'Tap to play'})).toBeVisible();
});