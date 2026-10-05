import { test, expect } from '@playwright/test';

async function start(page) {
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await page.evaluate(async()=>{
    const appSource=await (await fetch('/src/App.jsx')).text();
    const moduleUrl=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(appSource)?.[1]??'/src/audio/AudioEngine.js';
    const {AudioEngine}=await import(moduleUrl);
    const initialize=AudioEngine.prototype.initialize;
    AudioEngine.prototype.initialize=async function(){await initialize.call(this);window.audioEngine=this;};
  });
  await page.getByRole('button',{name:'Tap to play'}).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:20000});
  return errors;
}
async function dragTo(page,name,target) {
  const rect=await page.locator(`#instrument-${name}`).boundingBox();
  await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();
  await page.mouse.move(target.x,target.y,{steps:12});await page.mouse.up();
}
async function equip(page,name) {
  const child=await page.locator('#young-musician').boundingBox();
  await dragTo(page,name,{x:child.x+child.width/2,y:child.y+child.height/2});
  await expect(page.locator(`.performance-${name}`)).toBeVisible();
  await expect(page.locator('.instrument.equipped-instrument')).toHaveCount(1);
  await page.waitForTimeout(350);
}
test('dragging onto the child equips every play surface and dragging away ends it',async({page},testInfo)=>{
  const errors=await start(page);
  for(const name of ['piano','melody','guitar','flute','drums','marimba']) {
    await equip(page,name);
    expect(await page.evaluate(()=>window.audioEngine.manualInstrument)).toBe(name);
    const world=await page.locator('.landscape-world').boundingBox();
    for(const drawing of await page.locator('.instrument-drawing').all()){
      const bounds=await drawing.boundingBox();
      expect(bounds.y+bounds.height).toBeLessThanOrEqual(world.y+world.height+2);
      expect(bounds.x).toBeGreaterThanOrEqual(-2);
      expect(bounds.x+bounds.width).toBeLessThanOrEqual(world.width+2);
    }
    await page.screenshot({path:`test-results/${testInfo.project.name}-manual-${name}.png`});
    await page.getByRole('button',{name:'Put instrument down'}).click();
    await expect(page.locator('.performance-panel')).toHaveCount(0);
  }
  await equip(page,'piano');
  await dragTo(page,'piano',{x:page.viewportSize().width*.14,y:page.viewportSize().height*.2});
  await expect(page.locator('.performance-panel')).toHaveCount(0);
  expect(await page.evaluate(()=>window.audioEngine.manualInstrument)).toBeNull();
  expect(errors).toEqual([]);
});
test('piano chords release and wind notes sustain while the world continues',async({page})=>{
  const errors=await start(page);
  await page.locator('#instrument-drums').click();
  await equip(page,'piano');
  await expect(page.getByRole('button',{name:/Piano key/})).toHaveCount(17);
  const key=page.getByRole('button',{name:'Piano key C4',exact:true});
  await key.focus();await page.keyboard.down('Space');
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(1);
  expect(await page.evaluate(()=>window.audioEngine.active.drums)).toBe(true);
  await page.keyboard.up('Space');
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  await page.getByRole('button',{name:'Cow',exact:true}).click();
  await page.getByRole('button',{name:'Change landscape'}).click();
  await expect(page.locator('.scene-garden')).toHaveCount(1);
  await page.getByRole('button',{name:'Put instrument down'}).click();
  await equip(page,'flute');
  const note=page.getByRole('button',{name:'Flute note C4',exact:true});
  await note.focus();await page.keyboard.down('Space');await page.waitForTimeout(3400);
  expect(await page.evaluate(()=>[...window.audioEngine.manualVoices.values()][0].source.loop)).toBe(true);
  await page.keyboard.up('Space');
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  expect(errors).toEqual([]);
});

async function soundLevel(page,name,seconds=.25) {
  return page.evaluate(async({name,seconds})=>{
    let output=window.audioEngine.nodes[name].gain;
    while(output.output)output=output.output;
    const analyser=output.context.createAnalyser();analyser.fftSize=2048;output.connect(analyser);
    const values=new Float32Array(2048);let peak=0;const until=performance.now()+seconds*1000;
    while(performance.now()<until){analyser.getFloatTimeDomainData(values);peak=Math.max(peak,Math.sqrt(values.reduce((sum,value)=>sum+value*value,0)/values.length));await new Promise(resolve=>requestAnimationFrame(resolve));}
    output.disconnect(analyser);return peak;
  },{name,seconds});
}

test('outside-start swipes play crossed piano keys, marimba bars and guitar strings in both directions',async({page},testInfo)=>{
  const errors=await start(page);
  const session=await page.context().newCDPSession(page);
  await page.evaluate(()=>{
    window.swipeNotes=[];const engine=window.audioEngine;const original=engine.manualNoteOn;
    engine.manualNoteOn=function(note,...args){window.swipeNotes.push(note);return original.call(this,note,...args);};
  });
  for(const name of ['piano','marimba','guitar']){
    await equip(page,name);
    await page.evaluate(()=>{window.swipeNotes=[];});
    const area=await page.locator(name==='guitar'?'.guitar-stringboard':'.manual-keyboard').boundingBox();
    const panel=await page.locator('.performance-panel').boundingBox();
    const first=await page.locator(name==='guitar'?'.playable-string':'.natural-key').first().boundingBox();
    const startPoint=name==='guitar'?{x:area.x+area.width*.55,y:panel.y+12}:{x:area.x-5,y:first.y+first.height*.85};
    const last=await page.locator(name==='guitar'?'.playable-string':'.natural-key').last().boundingBox();
    const endPoint=name==='guitar'?{x:startPoint.x,y:last.y+last.height/2}:{x:last.x+last.width/2,y:startPoint.y};
    if(testInfo.project.use.hasTouch){
      await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:8,...startPoint}]});
      await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:8,...endPoint}]});
    }else{
      await page.mouse.move(startPoint.x,startPoint.y);await page.mouse.down();await page.mouse.move(endPoint.x,endPoint.y);
    }
    const expected=name==='guitar'?['E2','A2','D3','G3','B3','E4']:name==='piano'?['C4','D4','E4','F4','G4','A4','B4','C5','D5','E5']:['C5','D5','E5','F5','G5','A5','B5','C6'];
    expect(await page.evaluate(()=>window.swipeNotes),`${name} fast sweep`).toEqual(expected);
    if(testInfo.project.use.hasTouch){
      await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:8,...startPoint}]});
      await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
    }else{await page.mouse.move(startPoint.x,startPoint.y);await page.mouse.up();}
    expect(await page.evaluate(()=>window.swipeNotes),`${name} reverse sweep`).toEqual([...expected,...expected.slice(0,-1).reverse()]);
    await expect(page.locator('.swipe-pressed')).toHaveCount(0);
    if(name==='piano')expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
    await page.getByRole('button',{name:'Put instrument down'}).click();
  }
  expect(errors).toEqual([]);
});

test('piano swipe respects black keys and releases notes when leaving the keyboard',async({page})=>{
  const errors=await start(page);await equip(page,'piano');
  await page.evaluate(()=>{
    window.swipeNotes=[];const engine=window.audioEngine;const original=engine.manualNoteOn;
    engine.manualNoteOn=function(note,...args){window.swipeNotes.push(note);return original.call(this,note,...args);};
  });
  const area=await page.locator('.manual-keyboard').boundingBox();
  const sharp=await page.getByRole('button',{name:'Piano key C#4',exact:true}).boundingBox();
  const startPoint={x:area.x-5,y:sharp.y+sharp.height*.45};
  const endPoint={x:area.x+area.width-8,y:startPoint.y};
  await page.mouse.move(startPoint.x,startPoint.y);await page.mouse.down();await page.mouse.move(endPoint.x,endPoint.y);
  const expected=await page.evaluate(async()=> (await import('/src/utils/performance.js')).PIANO_NOTES);
  expect(await page.evaluate(()=>window.swipeNotes)).toEqual(expected);
  await page.mouse.move(endPoint.x,area.y-10);
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  await page.mouse.up();
  await expect(page.locator('.swipe-pressed')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('recorded wind loops have continuous seams and piano note-off retains a soft tail',async({page})=>{
  const errors=await start(page);
  const loops=await page.evaluate(async()=>{
    const results=[];
    for(const name of ['flute','melody']){
      for(const [note,loop] of Object.entries(window.audioEngine.nodes[name].sustainLoops)){
        const context=new OfflineAudioContext(1,48000*5,48000);
        const source=context.createBufferSource();source.buffer=loop.buffer;source.loop=true;source.loopStart=loop.loopStart;source.loopEnd=loop.loopEnd;source.connect(context.destination);source.start();
        const rendered=(await context.startRendering()).getChannelData(0);
        let worst=0;
        for(let time=loop.loopEnd;time<4.8;time+=loop.loopEnd-loop.loopStart){
          const index=Math.round(time*48000);
          const seam=Math.abs(rendered[index]-rendered[index-1]);
          let neighboring=0;
          for(let offset=-64;offset<=64;offset++)if(offset!==0)neighboring=Math.max(neighboring,Math.abs(rendered[index+offset]-rendered[index+offset-1]));
          worst=Math.max(worst,seam/(neighboring+1e-6));
        }
        results.push({name,note,worst});
      }
    }
    return results;
  });
  for(const loop of loops)expect(loop.worst,`${loop.name} ${loop.note} seam`).toBeLessThan(1.2);
  await equip(page,'piano');
  const key=page.getByRole('button',{name:'Piano key C4',exact:true});await key.focus();await page.keyboard.down('Space');await page.waitForTimeout(150);await page.keyboard.up('Space');
  await page.waitForTimeout(180);
  expect(await soundLevel(page,'piano',.15),'piano still resonates after key-up').toBeGreaterThan(.0003);
  await page.waitForTimeout(1000);
  expect(await soundLevel(page,'piano',.1),'piano tail settles').toBeLessThan(.0001);
  expect(errors).toEqual([]);
});

test('dusk cricket and airplane remain playable with an equipped instrument',async({page},testInfo)=>{
  const errors=await start(page);
  for(let index=0;index<3;index++)await page.getByRole('button',{name:'Change landscape'}).click();
  await expect(page.locator('.scene-dusk')).toBeVisible();
  await equip(page,'piano');
  for(const label of ['Cricket','Airplane']){
    const object=page.getByRole('button',{name:label,exact:true});
    if(testInfo.project.use.hasTouch)await object.tap();else await object.click();
    await expect(object.locator('.reacting')).toHaveCount(1);
    expect(await page.evaluate(type=>window.audioEngine.scenePlayers[type].some(player=>player.state==='started'),label.toLowerCase())).toBe(true);
  }
  await page.getByRole('button',{name:'Piano key C4',exact:true}).focus();
  await page.keyboard.down('Space');expect(await soundLevel(page,'piano')).toBeGreaterThan(.001);await page.keyboard.up('Space');
  await page.screenshot({path:`test-results/${testInfo.project.name}-dusk-manual.png`});
  await page.getByRole('button',{name:'Put instrument down'}).click();
  await page.getByRole('button',{name:'Change landscape'}).click();
  await expect(page.locator('.scene-night')).toBeVisible();
  await page.getByRole('button',{name:'Change landscape'}).click();
  await expect(page.locator('.scene-dawn')).toBeVisible();
  await page.getByRole('button',{name:'Change landscape'}).click();
  await expect(page.locator('.scene-farm')).toBeVisible();
  expect(errors).toEqual([]);
});

test('multitouch guitar chords and crossing all strings play their correct notes',async({page})=>{
  const errors=await start(page);await equip(page,'guitar');
  await page.evaluate(()=>{
    window.playedNotes=[];const engine=window.audioEngine;const original=engine.manualNoteOn;
    engine.manualNoteOn=function(note,...args){window.playedNotes.push(note);return original.call(this,note,...args);};
  });
  const session=await page.context().newCDPSession(page);
  const chord=await page.getByRole('button',{name:'Hold guitar chord C',exact:true}).boundingBox();
  const strings=await page.getByRole('group',{name:'Guitar strings',exact:true}).boundingBox();
  const chordTouch={id:1,x:chord.x+chord.width/2,y:chord.y+chord.height/2};
  const stringTouch={id:2,x:strings.x+strings.width*.55,y:strings.y+strings.height/12};
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[chordTouch]});
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[chordTouch,stringTouch]});
  for(let index=1;index<=5;index++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[chordTouch,{...stringTouch,y:strings.y+strings.height*(index+.5)/6}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[chordTouch]});
  const notes=await page.evaluate(()=>window.playedNotes);
  expect(notes).toEqual(expect.arrayContaining(['C3','E3','G3','C4','E4']));expect(notes).not.toContain('E2');
  expect(await soundLevel(page,'guitar')).toBeGreaterThan(.001);
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(page.locator('.guitar-chords output')).toHaveText('Open');
  await page.getByRole('button',{name:'Guitar string 1 E2',exact:true}).click();
  expect((await page.evaluate(()=>window.playedNotes)).at(-1)).toBe('E2');
  for(const value of ['G','Am','F']){
    const button=page.getByRole('button',{name:`Hold guitar chord ${value}`,exact:true});await button.focus();await page.keyboard.down('Space');await expect(page.locator('.guitar-chords output')).toHaveText(value);await page.keyboard.up('Space');await expect(page.locator('.guitar-chords output')).toHaveText('Open');
  }
  expect(errors).toEqual([]);
});

test('trumpet valves and five registers change a held breath across the playable range',async({page})=>{
  const errors=await start(page);await equip(page,'melody');
  const session=await page.context().newCDPSession(page);
  const breath=await page.getByRole('button',{name:'Blow trumpet',exact:true}).boundingBox();
  const held={id:1,x:breath.x+breath.width/2,y:breath.y+breath.height/2};
  const valveRects=await Promise.all([1,2,3].map(index=>page.getByRole('button',{name:`Trumpet valve ${index}`,exact:true}).boundingBox()));
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[held]});
  for(const register of ['C4','G4','C5','E5','G5']){
    await page.getByRole('group',{name:'Trumpet register'}).getByRole('button',{name:register,exact:true}).click();
    for(let mask=0;mask<8;mask++){
      await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      const touchPoints=[held,...valveRects.flatMap((rect,index)=>mask&(1<<index)?[{id:index+2,x:rect.x+rect.width/2,y:rect.y+rect.height*.2}]:[])];
      await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints});
      const expected=await page.evaluate(async({mask,register})=>{
        const {trumpetNote}=await import('/src/utils/performance.js');return trumpetNote([0,1,2].map(index=>Boolean(mask&(1<<index))),['C4','G4','C5','E5','G5'].indexOf(register));
      },{mask,register});
      await expect(page.locator('.trumpet-pitch')).toHaveText(expected);
      expect(await page.evaluate(()=>window.audioEngine.manualVoices.get('trumpet-breath').note)).toBe(expected);
    }
  }
  expect(await soundLevel(page,'melody')).toBeGreaterThan(.001);
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  expect(errors).toEqual([]);
});

test('piano multitouch, all drum hits and chromatic marimba produce sampled audio',async({page})=>{
  const errors=await start(page);await equip(page,'piano');
  const session=await page.context().newCDPSession(page);
  const keys=await Promise.all(['C4','E4','G4'].map(note=>page.getByRole('button',{name:`Piano key ${note}`,exact:true}).boundingBox()));
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:keys.map((rect,index)=>({id:index+1,x:rect.x+rect.width/2,y:rect.y+rect.height*.87}))});
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(3);
  expect(await soundLevel(page,'piano')).toBeGreaterThan(.001);
  await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  await page.getByRole('button',{name:'Put instrument down'}).click();await equip(page,'drums');
  for(const label of ['Hi-hat','Crash cymbal','Ride cymbal','High tom','Floor tom','Rim','Snare','Kick drum','Hand clap','Shaker']) {
    await page.getByRole('button',{name:label,exact:true}).click();expect(await soundLevel(page,'drums',.12),label).toBeGreaterThan(.0001);
  }
  await page.getByRole('button',{name:'Put instrument down'}).click();await equip(page,'marimba');
  const bars=page.getByRole('button',{name:/Marimba bar/});await expect(bars).toHaveCount(13);
  for(let index=0;index<13;index++){await bars.nth(index).focus();await page.keyboard.press('Space');expect(await soundLevel(page,'marimba',.08)).toBeGreaterThan(.0001);}
  expect(errors).toEqual([]);
});

test('dropped instruments slide away from instruments and scenery targets',async({page})=>{
  const errors=await start(page);
  for(const target of ['#instrument-drums','.cow']) {
    const rect=await page.locator(target).boundingBox();await dragTo(page,'piano',{x:rect.x+rect.width/2,y:rect.y+rect.height/2});await page.waitForTimeout(450);
    const piano=await page.locator('#instrument-piano .instrument-illustration').boundingBox();const obstacle=await page.locator(target==='#instrument-drums'?'#instrument-drums .instrument-illustration':target).boundingBox();
    expect(piano.x+piano.width<=obstacle.x || piano.x>=obstacle.x+obstacle.width || piano.y+piano.height<=obstacle.y || piano.y>=obstacle.y+obstacle.height).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('FarmJam suppresses browser gestures without blocking taps or mixer controls', async ({page}) => {
  const errors = await start(page);
  await expect(page).toHaveTitle('FarmJam');
  await expect(page.locator('.brand,.scene-name,.status-pill,.scene-turner')).toHaveCount(0);
  const result = await page.evaluate(() => {
    const element = document.querySelector('#instrument-piano');
    const types = ['contextmenu','gesturestart','gesturechange','gestureend','selectstart','dragstart','dblclick','wheel'];
    let bubbled = 0;
    document.addEventListener('contextmenu', () => bubbled++, {once:true});
    const canceled = types.map(type => {
      const event = type === 'wheel' ? new WheelEvent(type,{cancelable:true,bubbles:true,ctrlKey:true,deltaY:100}) : new Event(type,{cancelable:true,bubbles:true});
      element.dispatchEvent(event);
      return event.defaultPrevented;
    });
    const touch = new Event('touchmove',{cancelable:true,bubbles:true});
    Object.defineProperty(touch,'touches',{value:[{},{}]});
    element.dispatchEvent(touch);
    const zoom = new KeyboardEvent('keydown',{key:'+',ctrlKey:true,cancelable:true,bubbles:true});
    element.dispatchEvent(zoom);
    return {canceled,bubbled,touch:touch.defaultPrevented,zoom:zoom.defaultPrevented};
  });
  expect(result).toEqual({canceled:Array(8).fill(true),bubbled:0,touch:true,zoom:true});
  await page.mouse.wheel(0,600);
  expect(await page.evaluate(() => ({x:scrollX,y:scrollY,scale:visualViewport.scale}))).toEqual({x:0,y:0,scale:1});
  await page.locator('#instrument-piano').click();
  await expect(page.locator('#instrument-piano')).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Open mixer'}).dblclick();
  await expect(page.locator('.mixer')).toBeVisible();
  await page.getByRole('slider',{name:'Piano volume',exact:true}).fill('-18');
  await expect(page.getByRole('slider',{name:'Piano volume',exact:true})).toHaveValue('-18');
  expect(errors).toEqual([]);
});

test('sun travels along the arc before settling at midday and supports rapid scene changes', async ({page}) => {
  await start(page);
  await page.emulateMedia({reducedMotion:'no-preference'});
  const control = page.locator('.celestial-control');
  const startPoint = await control.boundingBox();
  await control.click();
  await page.waitForTimeout(250);
  const moving = await control.boundingBox();
  expect(moving.x).toBeGreaterThan(startPoint.x);
  expect(moving.y).toBeLessThan(startPoint.y);
  await page.waitForTimeout(1100);
  const settled = await control.boundingBox();
  expect(settled.x+settled.width/2).toBeCloseTo(page.viewportSize().width/2,0);
  await page.evaluate(() => {
    for (let index = 0; index < 5; index++) document.querySelector('.celestial-control').click();
  });
  await expect(page.locator('.scene-farm')).toBeVisible();
  await page.waitForTimeout(1100);
  await expect(control).toHaveClass(/is-sun/);
  const wrapped = await control.boundingBox();
  expect(wrapped.x).toBeCloseTo(startPoint.x,0);
});

test('sun and moon advance the day, remain circular, and keep controls aligned through rotation and equip', async ({page}, testInfo) => {
  const errors = await start(page);
  await page.emulateMedia({reducedMotion:'reduce'});
  const control = page.getByRole('button',{name:'Change landscape'});
  const positions = [];
  for (const scene of ['farm','garden','pond','dusk','night','dawn']) {
    await expect(page.locator(`.scene-${scene}`)).toBeVisible();
    await expect(control).toHaveClass(new RegExp(scene === 'night' ? 'is-moon' : 'is-sun'));
    const bounds = await control.boundingBox();
    expect(bounds.width).toBe(64);
    expect(bounds.height).toBe(64);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    positions.push(bounds.x);
    await control.click();
  }
  expect(positions[0]).toBeLessThan(positions[1]);
  expect(positions[1]).toBeLessThan(positions[2]);
  expect(positions[2]).toBeLessThan(positions[3]);
  expect(positions[5]).toBeLessThan(positions[0]);
  await equip(page,'piano');
  for (const viewport of [{width:393,height:851},{width:780,height:284},{width:1440,height:900}]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(400);
    const sky = await control.boundingBox();
    const mixer = await page.locator('.mixer-button').boundingBox();
    expect([sky.width,sky.height]).toEqual([64,64]);
    expect([mixer.width,mixer.height]).toEqual([48,48]);
    expect(mixer.x+mixer.width).toBe(viewport.width-12);
    expect(mixer.y).toBe(12);
    const icon = await page.locator('.mixer-button svg').boundingBox();
    expect(Math.abs(icon.x+icon.width/2-mixer.x-mixer.width/2)).toBeLessThan(1);
    expect(Math.abs(icon.y+icon.height/2-mixer.y-mixer.height/2)).toBeLessThan(1);
    const world = await page.locator('.landscape-world').boundingBox();
    const art = await page.locator('.equipped-instrument .instrument-illustration').boundingBox();
    expect(art.y+art.height).toBeLessThanOrEqual(world.height+2);
    const instruments = await page.locator('.instrument:not(.equipped-instrument) .instrument-illustration').all();
    const drawings = await Promise.all(instruments.map(instrument => instrument.boundingBox()));
    for (let first = 0; first < drawings.length; first++) {
      for (let second = first + 1; second < drawings.length; second++) {
        const one = drawings[first], two = drawings[second];
        expect(one.x+one.width<=two.x+1 || two.x+two.width<=one.x+1 || one.y+one.height<=two.y+1 || two.y+two.height<=one.y+1, `art overlaps at ${viewport.width}: ${first},${second}`).toBe(true);
      }
    }
    await page.screenshot({path:`test-results/${testInfo.project.name}-farmjam-${viewport.width}.png`});
  }
  expect(errors).toEqual([]);
});