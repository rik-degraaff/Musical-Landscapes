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

test('manual bar buffers the bottom edge and keyboards use longer playable surfaces',async({page},testInfo)=>{
  await start(page);
  const lengths={};
  for(const name of ['piano','marimba','guitar','flute','melody','drums']) {
    await equipByKey(page,name);
    const panel=await page.locator('.performance-panel').boundingBox();
    const bar=await page.locator('.performance-panel header').boundingBox();
    const surface=await page.locator('.performance-surface').boundingBox();
    expect(bar.y+bar.height).toBeCloseTo(panel.y+panel.height,0);
    expect(bar.height).toBeGreaterThanOrEqual(32);
    expect(surface.y+surface.height).toBeLessThanOrEqual(bar.y+1);
    if(name==='piano'||name==='marimba') {
      const key=await page.locator('.natural-key').first().boundingBox();
      lengths[name]=key.height;
      expect(key.y+key.height).toBeLessThan(bar.y);
      expect(key.height/surface.height).toBeGreaterThan(.8);
    }
    if(name==='guitar') {
      const guitar=await page.locator('.guitar-stringboard').boundingBox();
      expect(guitar.y-surface.y).toBeLessThanOrEqual(4);
      expect(bar.y-guitar.y-guitar.height).toBeGreaterThanOrEqual(12);
    }
    await page.screenshot({path:`test-results/${testInfo.project.name}-bottom-bar-${name}.png`});
    await page.getByRole('button',{name:'Put instrument down'}).click();
  }
  expect(lengths.marimba).toBeGreaterThanOrEqual(lengths.piano);
});

test('physical flute keys sound standard G4 and middle D5 without a breath control',async({page},testInfo)=>{
  await start(page);await equipByKey(page,'flute');
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  const session=await page.context().newCDPSession(page);
  const touches=async labels=>Promise.all(labels.map(async(label,index)=>{
    const bounds=await page.getByRole('button',{name:`Flute key ${label}`,exact:true}).boundingBox();
    return {id:index+1,x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2};
  }));
  const g4=await touches(['B thumb','Left index','Left middle','Left ring','D-sharp pinky']);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:g4});
  expect(await page.evaluate(()=>({size:window.audioEngine.manualVoices.size,note:window.audioEngine.manualVoices.get('flute-keys')?.note}))).toEqual({size:1,note:'G4'});
  await expect(page.locator('.flute-physical-key.pressed')).toHaveCount(5);
  await expect(page.getByLabel('Flute pitch',{exact:true})).toHaveText('G4');
  await page.screenshot({path:`test-results/${testInfo.project.name}-physical-flute.png`});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  await page.getByRole('group',{name:'Flute air register'}).getByRole('button',{name:'Middle',exact:true}).click();
  const d5=await touches(['B thumb','Left middle','Left ring','Right index','Right middle','Right ring']);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:d5});
  expect(await page.evaluate(()=>({size:window.audioEngine.manualVoices.size,note:window.audioEngine.manualVoices.get('flute-keys')?.note}))).toEqual({size:1,note:'D5'});
  await expect(page.locator('.flute-physical-key.pressed')).toHaveCount(6);
  await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  await expect(page.locator('.flute-physical-key.pressed')).toHaveCount(0);
});

test('trumpet lip slurs G4 to C5 on one held pointer and valves retune before cancel',async({page},testInfo)=>{
  await start(page);await equipByKey(page,'melody');
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  const session=await page.context().newCDPSession(page);
  const bounds=await page.getByRole('slider',{name:'Trumpet embouchure',exact:true}).boundingBox();
  const held={id:1,x:bounds.x+bounds.width*1.5/6,y:bounds.y+bounds.height/2};
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[held]});
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.get('trumpet-lips')?.note)).toBe('G4');
  await page.evaluate(()=>{
    window.windSource=window.audioEngine.manualVoices.get('trumpet-lips').source;
    window.slurCalls=[];
    const original=window.audioEngine.manualNoteOn;
    window.audioEngine.manualNoteOn=function(...args){window.slurCalls.push(args);return original.apply(this,args);};
  });
  await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...held,x:held.x+bounds.width*.015}]});
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.get('trumpet-lips').source===window.windSource)).toBe(true);
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.get('trumpet-lips').source.playbackRate.value)).toBeGreaterThan(0);
  const slurred={...held,x:bounds.x+bounds.width*2.5/6};
  await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[slurred]});
  expect(await page.evaluate(()=>({size:window.audioEngine.manualVoices.size,note:window.audioEngine.manualVoices.get('trumpet-lips')?.note}))).toEqual({size:1,note:'C5'});
  expect(await page.evaluate(()=>window.slurCalls.at(-1)[3])).toBe(true);
  const valve=await page.getByRole('button',{name:'Trumpet valve 1',exact:true}).boundingBox();
  const finger={id:2,x:valve.x+valve.width/2,y:valve.y+valve.height/2};
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[slurred,finger]});
  expect(await page.evaluate(()=>({size:window.audioEngine.manualVoices.size,note:window.audioEngine.manualVoices.get('trumpet-lips')?.note}))).toEqual({size:1,note:'A#4'});
  await expect(page.locator('.valve-control.pressed')).toHaveCount(1);
  await page.screenshot({path:`test-results/${testInfo.project.name}-lip-slur-trumpet.png`});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[finger]});
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.get('trumpet-lips')?.note)).toBe('C5');
  await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  await expect(page.locator('.lip-indicator')).toHaveCount(0);
  await expect(page.locator('.valve-control.pressed')).toHaveCount(0);
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
  for(const [name,count,label] of [['piano',34,'Piano key'],['marimba',22,'Marimba bar'],['flute',17,'Flute key']]){
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

test('instruments avoid the sun only after its arc settles',async({page})=>{
  await start(page);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect(page.locator('.celestial-control')).toHaveAttribute('data-settled','true');
  const world=await page.locator('.landscape-world').boundingBox();
  const piano=await page.locator('#instrument-piano').boundingBox();
  await page.mouse.move(piano.x+piano.width/2,piano.y+piano.height/2);await page.mouse.down();
  await page.mouse.move(world.width*.5,Math.max(36,world.height*.11),{steps:12});await page.mouse.up();
  await page.getByRole('button',{name:'Change landscape'}).click({force:true});
  await expect(page.locator('.celestial-control')).toHaveAttribute('data-settled','false');
  await expect(page.locator('.celestial-control')).toHaveAttribute('data-settled','true');
  await page.waitForTimeout(400);
  const sun=await page.locator('.celestial-control').boundingBox();
  for(const instrument of await page.locator('.instrument:not(.equipped-instrument) .instrument-illustration').all()){
    const art=await instrument.boundingBox();
    expect(art.x+art.width<=sun.x+1||art.x>=sun.x+sun.width-1||art.y+art.height<=sun.y+1||art.y>=sun.y+sun.height-1).toBe(true);
  }
});

test('wind autoplay depresses physical keys and shows a vibrating lip-position indicator until release',async({page},testInfo)=>{
  await start(page);await equipByKey(page,'melody');
  await page.evaluate(()=>window.audioEngine.onManualAutoplayEvent({note:'A#4',duration:2}));
  const valve=page.getByRole('button',{name:'Trumpet valve 1',exact:true});
  await expect(valve).toHaveAttribute('aria-pressed','true');
  await expect(valve).toHaveClass(/pressed/);
  await expect(page.getByRole('button',{name:'Trumpet valve 2',exact:true})).toHaveAttribute('aria-pressed','false');
  const marker=page.locator('.lip-indicator.is-demo');
  await expect(marker).toBeVisible();
  await expect(marker).toHaveCSS('animation-name','lipQuiver');
  const segments=await page.locator('.lip-segment').count();
  expect(segments).toBe(6);
  expect(await marker.evaluate(element=>parseFloat(element.style.left))).toBeCloseTo(2.5/6*100);
  await page.screenshot({path:`test-results/${testInfo.project.name}-autoplay-lips.png`});
  await page.evaluate(()=>window.audioEngine.onManualAutoplayEvent(null));
  await expect(marker).toHaveCount(0);await expect(valve).toHaveAttribute('aria-pressed','false');
  await page.getByRole('button',{name:'Put instrument down'}).click();await equipByKey(page,'flute');
  await page.evaluate(()=>window.audioEngine.onManualAutoplayEvent({note:'G4',duration:2}));
  await expect(page.locator('.flute-physical-key.pressed')).toHaveCount(5);
  for(const label of ['B thumb','Left index','Left middle','Left ring','D-sharp pinky'])await expect(page.getByRole('button',{name:`Flute key ${label}`,exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('button',{name:'Blow flute'})).toHaveCount(0);
  await expect(page.getByRole('slider',{name:'Flute breath strength'})).toHaveCount(0);
  await page.screenshot({path:`test-results/${testInfo.project.name}-autoplay-flute-keys.png`});
  await page.evaluate(()=>window.audioEngine.onManualAutoplayEvent({note:'D5',duration:.1}));
  await expect(page.locator('.flute-physical-key.pressed')).toHaveCount(6);
  await expect(page.locator('.flute-physical-key.pressed')).toHaveCount(0);
  await page.getByRole('button',{name:'Put instrument down'}).click();await equipByKey(page,'melody');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>window.audioEngine.onManualAutoplayEvent({note:'G4',duration:1}));
  await expect(page.locator('.lip-indicator.is-demo')).toHaveCSS('animation-name','none');
});