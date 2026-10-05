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
      const bank=await page.locator('.guitar-stringboard .guitar-chords').boundingBox();
      expect(bank.x).toBeGreaterThanOrEqual(guitar.x);
      expect(bank.y).toBeGreaterThanOrEqual(guitar.y);
      expect(bank.x+bank.width).toBeLessThanOrEqual(guitar.x+guitar.width+1);
      expect(bank.y+bank.height).toBeLessThanOrEqual(guitar.y+guitar.height+1);
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
  const library=await page.evaluate(async()=>{
    const {GUITAR_LIBRARY,OPEN_STRINGS}=await import('/src/utils/guitar.js');
    return {G:GUITAR_LIBRARY.G,F:GUITAR_LIBRARY.F,open:OPEN_STRINGS};
  });
  const expectStrings=async notes=>{
    for(const [index,note] of notes.entries())await expect(page.locator('.playable-string').nth(index)).toHaveAttribute('aria-label',`Guitar string ${index+1}${note?` ${note}`:' muted'}`);
  };
  await expect(page.locator('.chord-name')).toHaveText(library.G.chords.map(chord=>chord.name));
  for(const chord of library.G.chords)await expect(page.getByRole('button',{name:`Hold guitar chord ${chord.name}`,exact:true})).toBeVisible();
  await page.evaluate(()=>{
    window.playedNotes=[];const engine=window.audioEngine;const original=engine.manualStrike;
    engine.manualStrike=function(note,...args){window.playedNotes.push(note);return original.call(this,note,...args);};
  });
  const chord=page.getByRole('button',{name:'Hold guitar chord G',exact:true});
  const session=await page.context().newCDPSession(page);
  const bounds=await chord.boundingBox();
  const held={id:1,x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2};
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[held]});
  const notes=library.G.chords.find(chord=>chord.name==='G').notes;
  await expectStrings(notes);
  const board=await page.locator('.guitar-stringboard').boundingBox();
  const pluck={id:2,x:board.x+board.width*.82,y:board.y+board.height/12};
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[held,pluck]});
  for(let string=1;string<6;string++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[held,{...pluck,y:board.y+board.height*(string+.5)/6}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[held]});
  expect(await page.evaluate(()=>window.playedNotes)).toEqual(notes.filter(note=>note!==null));
  await page.screenshot({path:`test-results/${testInfo.project.name}-transposed-guitar.png`});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expectStrings(library.open);
  await page.getByRole('button',{name:'Change landscape'}).click({force:true});
  await expect(page.locator('.chord-name')).toHaveText(library.F.chords.map(chord=>chord.name));
  for(const chord of library.F.chords)await expect(page.getByRole('button',{name:`Hold guitar chord ${chord.name}`,exact:true})).toBeVisible();
  expect(await page.evaluate(()=>window.audioEngine.active.guitar)).toBe(false);
});

test('guitar fretboard diagrams, full neck and chord and autoplay dots fit compact and desktop surfaces',async({page},testInfo)=>{
  await start(page);await equipByKey(page,'guitar');
  await expect(page.locator('.chord-diagram')).toHaveCount(0);
  await page.getByRole('button',{name:'Open settings'}).dblclick();
  await page.getByRole('tab',{name:'Display',exact:true}).click();
  await page.getByRole('combobox',{name:'Configure instrument'}).selectOption('guitar');
  await page.getByLabel('Show chord fingering charts').check();
  await page.getByLabel('Show detailed fret positions').check();
  await page.locator('.mixer-head').getByRole('button',{name:'Close settings'}).click();
  await expect(page.locator('.guitar-stringboard .guitar-chords')).toHaveClass(/with-charts/);
  const library=await page.evaluate(async()=>{
    const {GUITAR_LIBRARY,OPEN_STRINGS}=await import('/src/utils/guitar.js');
    return {chords:GUITAR_LIBRARY.C.chords,event:GUITAR_LIBRARY.C.phrases[0].events[0],open:OPEN_STRINGS};
  });
  const position=fret=>(1-2**(-fret/12))/(1-2**(-24/12));
  const expectDot=async(dot,string,fret)=>{
    await expect(dot).toBeVisible();
    const overlay=await page.locator('.guitar-fingering-overlay').boundingBox();
    const bounds=await dot.boundingBox();
    const horizontal=fret===0?0:(position(fret-1)+position(fret))/2;
    expect(bounds.x+bounds.width/2).toBeCloseTo(overlay.x+overlay.width*horizontal,0);
    expect(bounds.y+bounds.height/2).toBeCloseTo(overlay.y+overlay.height*(string+.5)/6,0);
  };
  for(const viewport of [{width:780,height:284},{width:1440,height:900}]){
    await page.setViewportSize(viewport);
    const bank=page.locator('.guitar-stringboard .guitar-chords.with-charts');
    await expect(bank.getByRole('button')).toHaveCount(14);
    await expect(bank.locator('.chord-name')).toHaveText(library.chords.map(chord=>chord.name));
    await expect(bank.getByRole('img')).toHaveCount(14);
    for(const chord of library.chords)await expect(bank.getByRole('img',{name:`${chord.name} fingering`,exact:true})).toBeVisible();
    await expect(page.locator('.guitar-stringboard .fret-line')).toHaveCount(25);
    await expect(page.locator('.manual-guitar input[type="number"]')).toHaveCount(0);
    for(const [index,note] of library.open.entries())await expect(page.locator('.playable-string').nth(index)).toHaveAttribute('aria-label',`Guitar string ${index+1} ${note}`);
    await expect(page.locator('.fingering-dot,.phrase-note-dot,.neck-chord-name')).toHaveCount(0);
    const board=await page.locator('.guitar-stringboard').boundingBox();
    const neck=await page.locator('.guitar-stringboard .guitar-neck').boundingBox();
    const hole=await page.locator('.guitar-soundhole').boundingBox();
    const diagrams=await bank.boundingBox();
    const footer=await page.locator('.performance-panel header').boundingBox();
    expect(neck.width/board.width).toBeGreaterThan(.6);
    expect(neck.width/board.width).toBeLessThan(.7);
    expect(hole.x).toBeGreaterThan(neck.x+neck.width);
    expect(hole.x).toBeGreaterThan(board.x+board.width*.7);
    expect(hole.x+hole.width).toBeLessThanOrEqual(board.x+board.width);
    expect(diagrams.x).toBeGreaterThanOrEqual(neck.x);
    expect(diagrams.y).toBeGreaterThanOrEqual(neck.y);
    expect(diagrams.x+diagrams.width).toBeLessThanOrEqual(neck.x+neck.width+1);
    expect(diagrams.y+diagrams.height).toBeLessThanOrEqual(neck.y+neck.height+1);
    expect(footer.y-board.y-board.height).toBeGreaterThanOrEqual(12);
    const chord=library.chords.find(value=>value.name==='C');
    const button=page.getByRole('button',{name:'Hold guitar chord C',exact:true});
    await button.focus();await page.keyboard.down('Space');
    await expect(page.locator('.neck-chord-name')).toHaveText('C');
    await expect(page.locator('.fingering-dot')).toHaveCount(chord.frets.filter(fret=>fret!==null).length);
    for(const [string,fret] of chord.frets.entries()){
      if(fret!==null)await expectDot(page.locator(`.fingering-dot[data-string="${string+1}"][data-fret="${fret}"]`),string,fret);
    }
    await page.screenshot({path:`test-results/${testInfo.project.name}-guitar-held-${viewport.width}.png`});
    await page.keyboard.up('Space');
    await expect(page.locator('.fingering-dot,.neck-chord-name')).toHaveCount(0);
    await page.evaluate(event=>window.audioEngine.onManualAutoplayEvent({...event,duration:60}),library.event);
    await expect(page.locator('.neck-chord-name')).toHaveText(library.event.chord);
    await expect(page.getByRole('button',{name:`Hold guitar chord ${library.event.chord}`,exact:true})).toHaveClass(/playing-chord/);
    await expect(page.locator('.phrase-note-dot')).toHaveCount(library.event.fingering.length);
    for(const [index,input] of library.event.fingering.entries())await expectDot(page.locator('.phrase-note-dot').nth(index),input.string,input.fret);
    await page.screenshot({path:`test-results/${testInfo.project.name}-guitar-autoplay-cue-${viewport.width}.png`});
    await page.evaluate(()=>window.audioEngine.onManualAutoplayEvent(null));
    await expect(page.locator('.phrase-note-dot')).toHaveCount(0);
    const demoChord=page.getByRole('button',{name:`Hold guitar chord ${library.event.chord}`,exact:true});
    await demoChord.focus();await page.keyboard.press('Space');
    await expect(page.locator('.fingering-dot,.neck-chord-name')).toHaveCount(0);
  }
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