import {test,expect} from '@playwright/test';

async function start(page) {
  const viewport=page.viewportSize();if(viewport.height>viewport.width)await page.setViewportSize({width:viewport.height,height:viewport.width});
  await page.goto('/');
  await page.evaluate(async()=>{
    const source=await (await fetch('/src/App.jsx')).text();
    const url=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(source)[1];
    const {AudioEngine}=await import(url);
    const audioSource=await (await fetch(url)).text();
    const toneUrl=/import\s+\*\s+as\s+Tone\s+from\s+["']([^"']+)["']/.exec(audioSource)[1];
    window.testTone=await import(toneUrl);
    const original=AudioEngine.prototype.initialize;
    AudioEngine.prototype.initialize=async function(){await original.call(this);window.audioEngine=this;};
  });
  await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:20000});
}

test('metronome remains compact above the panel and both menus dismiss on outside taps',async({page},testInfo)=>{
  await start(page);
  const mini=page.getByRole('button',{name:'Open metronome'});
  const before=await mini.boundingBox();expect(before.width).toBe(46);expect(before.x).toBe(12);
  await page.locator('#instrument-piano').focus();await page.keyboard.press('e');
  const panel=await page.locator('.performance-panel').boundingBox();const small=await mini.boundingBox();expect(small.y+small.height).toBeLessThan(panel.y);
  await mini.click();await expect(page.getByRole('dialog',{name:'Metronome',exact:true})).toBeVisible();
  await page.screenshot({path:`test-results/${testInfo.project.name}-metronome-expanded.png`});
  await page.mouse.click(page.viewportSize().width-80,70);
  await expect(page.getByRole('dialog',{name:'Metronome',exact:true})).toHaveCount(0);await expect(mini).toBeVisible();
  await page.getByRole('button',{name:'Open settings'}).dblclick();await expect(page.getByRole('dialog',{name:'Settings'})).toBeVisible();
  await page.mouse.click(5,5);await expect(page.getByRole('dialog',{name:'Settings'})).toHaveCount(0);
  await mini.click();await page.keyboard.press('Escape');await expect(mini).toBeVisible();
  await page.evaluate(()=>{window.sceneTaps=0;const original=window.audioEngine.playSceneSound;window.audioEngine.playSceneSound=function(...args){window.sceneTaps++;return original.apply(this,args);};});
  await mini.click();await page.getByRole('button',{name:'Cow',exact:true}).click();
  await expect(mini).toBeVisible();expect(await page.evaluate(()=>window.sceneTaps)).toBe(0);
  await mini.click();
  await page.getByRole('button',{name:'Piano key C5',exact:true}).click();
  await expect(mini).toBeVisible();expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
});

test('holding the weight pauses music and vertical dragging changes global tempo before resuming',async({page})=>{
  await start(page);await page.locator('#instrument-piano').click();
  await expect.poll(()=>page.evaluate(()=>window.testTone.Transport.state)).toBe('started');
  await page.getByRole('button',{name:'Open metronome'}).click();
  const weight=page.getByRole('slider',{name:'Metronome tempo weight'});
  const bounds=await weight.boundingBox();const rail=await page.locator('.metronome-rail').boundingBox();
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down();
  expect(await page.evaluate(()=>({held:window.audioEngine.tempoHeld,state:window.testTone.Transport.state,active:window.audioEngine.active.piano}))).toEqual({held:true,state:'paused',active:true});
  const ticks=await page.evaluate(()=>window.testTone.Transport.ticks);await page.waitForTimeout(150);expect(await page.evaluate(()=>window.testTone.Transport.ticks)).toBeCloseTo(ticks,0);
  await page.mouse.move(rail.x+rail.width/2,rail.y+rail.height*.85);
  const fast=Number(await weight.getAttribute('aria-valuenow'));expect(fast).toBeGreaterThan(150);
  expect(await page.evaluate(()=>window.testTone.Transport.bpm.value)).toBeCloseTo(fast,6);
  await page.mouse.move(rail.x+rail.width/2,rail.y+rail.height*.1);expect(Number(await weight.getAttribute('aria-valuenow'))).toBeLessThan(70);
  await page.mouse.up();expect(await page.evaluate(()=>window.audioEngine.tempoHeld)).toBe(false);
  await expect.poll(()=>page.evaluate(()=>window.testTone.Transport.state)).toBe('started');
  await weight.focus();await page.keyboard.down('ArrowDown');expect(await page.evaluate(()=>window.audioEngine.tempoHeld)).toBe(true);await page.keyboard.up('ArrowDown');expect(await page.evaluate(()=>window.audioEngine.tempoHeld)).toBe(false);
  await page.keyboard.press('Home');await expect(weight).toHaveAttribute('aria-valuenow','40');await page.keyboard.press('End');await expect(weight).toHaveAttribute('aria-valuenow','208');
});

test('tick sound toggles independently and notes stay beat-aligned after changing tempo',async({page})=>{
  await start(page);
  await page.evaluate(()=>{
    window.ticks=[];const synth=window.audioEngine.metronomeSynth;const original=synth.triggerAttackRelease;
    synth.triggerAttackRelease=function(...args){window.ticks.push(args[2]);return original.apply(this,args);};
    window.notes=[];const engine=window.audioEngine;const play=engine.playEvent;
    engine.noise.piano.energyAt=()=>.31;engine.noise.piano.complexityAt=()=>.18;
    engine.playEvent=function(name,event,time){if(name==='piano')window.notes.push({time,event});return play.call(this,name,event,time);};
  });
  await page.getByRole('button',{name:'Open metronome'}).click();const sound=page.getByRole('switch',{name:'Metronome sound'});
  await expect(sound).toHaveAttribute('aria-checked','false');await sound.click();await expect(sound).toHaveAttribute('aria-checked','true');
  await expect.poll(()=>page.evaluate(()=>window.ticks.length)).toBeGreaterThan(1);
  await sound.click();expect(await page.evaluate(()=>window.audioEngine.metronomeSound)).toBe(false);
  const count=await page.evaluate(()=>window.ticks.length);await page.waitForTimeout(750);expect(await page.evaluate(()=>window.ticks.length)).toBe(count);
  await page.getByRole('slider',{name:'Metronome tempo weight'}).focus();await page.keyboard.press('End');await page.keyboard.press('Escape');
  await page.locator('#instrument-piano').click();await expect.poll(()=>page.evaluate(()=>window.notes.length)).toBeGreaterThan(2);
  const times=await page.evaluate(()=>window.notes.map(value=>value.time));
  expect(times[1]-times[0]).toBeCloseTo(2*60/208,2);expect(times[2]-times[1]).toBeCloseTo(2*60/208,2);
});

test('touch cancel releases the tempo hold without disabling active instruments',async({page})=>{
  await start(page);await page.locator('#instrument-drums').click();await page.getByRole('button',{name:'Open metronome'}).click();
  const session=await page.context().newCDPSession(page);
  const bounds=await page.getByRole('slider',{name:'Metronome tempo weight'}).boundingBox();
  const held={id:1,x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2};
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[held]});
  expect(await page.evaluate(()=>window.audioEngine.tempoHeld)).toBe(true);
  await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...held,y:held.y+25}]});
  expect(await page.evaluate(()=>window.audioEngine.tempo)).toBeGreaterThan(92);
  await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  expect(await page.evaluate(()=>({held:window.audioEngine.tempoHeld,active:window.audioEngine.active.drums}))).toEqual({held:false,active:true});
  await expect.poll(()=>page.evaluate(()=>window.testTone.Transport.state)).toBe('started');
});