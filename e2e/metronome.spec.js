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
  await expect.poll(()=>page.evaluate(()=>window.notes.filter(value=>value.event.time==='0:0:0').length)).toBeGreaterThan(2);
  const starts=await page.evaluate(()=>window.notes.filter(value=>value.event.time==='0:0:0').map(value=>value.time));
  expect(starts.at(-1)-starts.at(-2)).toBeCloseTo(4*60/208,2);
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

test('silent metronome keeps swinging compact and enlarged and sound is a switch mounted on its base',async({page},testInfo)=>{
  await start(page);
  expect(await page.evaluate(()=>Object.values(window.audioEngine.active).some(Boolean))).toBe(false);
  expect(await page.evaluate(()=>window.audioEngine.metronomeSound)).toBe(false);
  const first=await page.evaluate(()=>window.audioEngine.beatIndex);
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.beatIndex)).toBeGreaterThan(first+1);
  const mini=page.getByRole('button',{name:'Open metronome'});
  await expect(mini).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  await mini.click();
  const menu=page.getByRole('dialog',{name:'Metronome',exact:true});
  await expect(menu).toHaveCSS('background-color','rgba(0, 0, 0, 0)');await expect(menu).toHaveCSS('border-top-width','0px');
  await expect(menu.locator('header')).toHaveCount(0);
  const before=await page.evaluate(()=>window.audioEngine.beatIndex);
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.beatIndex)).toBeGreaterThan(before+1);
  const sound=page.getByRole('switch',{name:'Metronome sound'});
  const body=await page.locator('.metronome-mechanism').boundingBox();const toggle=await sound.boundingBox();
  expect(toggle.y).toBeGreaterThan(body.y+body.height*.85);expect(toggle.y+toggle.height).toBeLessThanOrEqual(body.y+body.height+1);
  await sound.click();await sound.click();
  const offBeat=await page.evaluate(()=>window.audioEngine.beatIndex);
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.beatIndex)).toBeGreaterThan(offBeat+1);
  await page.screenshot({path:`test-results/${testInfo.project.name}-physical-metronome.png`});
  await page.keyboard.press('Escape');
  const closedBeat=await page.evaluate(()=>window.audioEngine.beatIndex);
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.beatIndex)).toBeGreaterThan(closedBeat+1);
  expect(await page.evaluate(()=>window.testTone.Transport.state)).toBe('started');
  await page.locator('#instrument-piano').click();await page.locator('#instrument-piano').click();
  expect(await page.evaluate(()=>Object.values(window.audioEngine.active).some(Boolean))).toBe(false);
  const inactiveBeat=await page.evaluate(()=>window.audioEngine.beatIndex);
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.beatIndex)).toBeGreaterThan(inactiveBeat+1);
  await mini.click();
  const weight=page.getByRole('slider',{name:'Metronome tempo weight'});
  await weight.focus();await page.keyboard.down('ArrowDown');
  expect(await page.evaluate(()=>window.testTone.Transport.state)).toBe('paused');
  await page.keyboard.up('ArrowDown');
  await expect.poll(()=>page.evaluate(()=>window.testTone.Transport.state)).toBe('started');
});

test('pendulum crosses both sides without beat UI callbacks and resumes after a tempo hold',async({page})=>{
  await start(page);
  await page.evaluate(()=>{window.audioEngine.onMetronomeBeat=null;});
  async function bothSides(selector) {
    const range=await page.locator(selector).evaluate(async element=>{
      let min=Infinity,max=-Infinity;
      const until=performance.now()+1600;
      while(performance.now()<until){const angle=parseFloat(getComputedStyle(element).rotate);min=Math.min(min,angle);max=Math.max(max,angle);await new Promise(resolve=>requestAnimationFrame(resolve));}
      return {min,max};
    });
    expect(range.min).toBeLessThan(-8);expect(range.max).toBeGreaterThan(8);
  }
  await bothSides('.mini-pendulum');
  await page.getByRole('button',{name:'Open metronome'}).click();
  await bothSides('.metronome-rail');
  const weight=page.getByRole('slider',{name:'Metronome tempo weight'});
  await weight.focus();await page.keyboard.down('ArrowDown');
  await expect(page.locator('.metronome-rail')).toHaveCSS('rotate','0deg');
  await page.keyboard.up('ArrowDown');await bothSides('.metronome-rail');
  await page.keyboard.press('Escape');await bothSides('.mini-pendulum');
});