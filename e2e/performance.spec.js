import { test, expect } from '@playwright/test';

test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    const key='farmjam-settings-v1';
    const saved=JSON.parse(localStorage.getItem(key)??'{}');
    localStorage.setItem(key,JSON.stringify({...saved,selected:['piano','drums','guitar','melody','marimba','flute']}));
  });
});

async function start(page) {
  const viewport=page.viewportSize();
  if(viewport.height>viewport.width)await page.setViewportSize({width:viewport.height,height:viewport.width});
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
  await expect(page.getByRole('button',{name:/Piano key/})).toHaveCount(19);
  const key=page.getByRole('button',{name:'Piano key C4',exact:true});
  await key.focus();await page.keyboard.down('Space');
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(1);
  expect(await page.evaluate(()=>window.audioEngine.active.drums)).toBe(true);
  await page.keyboard.up('Space');
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  await page.getByRole('button',{name:'Cow',exact:true}).click();
  await page.getByRole('button',{name:'Change landscape'}).click({force:true});
  await expect(page.locator('.scene-garden')).toHaveCount(1);
  await page.getByRole('button',{name:'Put instrument down'}).click();
  await equip(page,'flute');
  const note=page.getByRole('button',{name:'Flute key D-sharp pinky',exact:true});
  await note.focus();await page.keyboard.down('Space');await page.waitForTimeout(3400);
  expect(await page.evaluate(()=>({note:window.audioEngine.manualVoices.get('flute-keys')?.note,loop:window.audioEngine.manualVoices.get('flute-keys')?.source.loop}))).toEqual({note:'C#5',loop:true});
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
    const first=await page.locator(name==='guitar'?'.playable-string':'.natural-key').first().boundingBox();
    const startPoint=name==='guitar'?{x:area.x+area.width*.82,y:area.y-5}:{x:area.x-5,y:first.y+first.height*.85};
    const last=await page.locator(name==='guitar'?'.playable-string':'.natural-key').last().boundingBox();
    const endPoint=name==='guitar'?{x:startPoint.x,y:last.y+last.height/2}:{x:last.x+last.width/2,y:startPoint.y};
    if(testInfo.project.use.hasTouch){
      await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:8,...startPoint}]});
      await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:8,...endPoint}]});
    }else{
      await page.mouse.move(startPoint.x,startPoint.y);await page.mouse.down();await page.mouse.move(endPoint.x,endPoint.y);
    }
    const expected=name==='guitar'?['E2','A2','D3','G3','B3','E4']:await page.evaluate(async name=>{const music=await import('/src/utils/performance.js');return (name==='piano'?music.PIANO_NOTES:music.MARIMBA_NOTES).filter(note=>!note.includes('#'));},name);
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
  for(let index=0;index<3;index++)await page.getByRole('button',{name:'Change landscape'}).click({force:true});
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
  await expect(page.locator('.celestial-control')).toHaveAttribute('data-settled','true');
  await page.getByRole('button',{name:'Change landscape'}).click({force:true});
  await expect(page.locator('.scene-night')).toBeVisible();
  await expect(page.locator('.celestial-control')).toHaveAttribute('data-settled','true');
  await page.getByRole('button',{name:'Change landscape'}).click({force:true});
  await expect(page.locator('.scene-dawn')).toBeVisible();
  await expect(page.locator('.celestial-control')).toHaveAttribute('data-settled','true');
  await page.getByRole('button',{name:'Change landscape'}).click({force:true});
  await expect(page.locator('.scene-farm')).toBeVisible();
  expect(errors).toEqual([]);
});

test('multitouch guitar chords and crossing all strings play their correct notes',async({page})=>{
  const errors=await start(page);await equip(page,'guitar');
  const shapes=await page.evaluate(async()=>{
    const {GUITAR_LIBRARY,OPEN_STRINGS}=await import('/src/utils/guitar.js');
    return {chords:GUITAR_LIBRARY.C.chords,open:OPEN_STRINGS};
  });
  const expectStrings=async notes=>{
    for(const [index,note] of notes.entries())await expect(page.locator('.playable-string').nth(index)).toHaveAttribute('aria-label',`Guitar string ${index+1}${note?` ${note}`:' muted'}`);
  };
  await page.evaluate(()=>{
    window.playedNotes=[];const engine=window.audioEngine;const original=engine.manualNoteOn;
    engine.manualNoteOn=function(note,...args){window.playedNotes.push(note);return original.call(this,note,...args);};
  });
  const session=await page.context().newCDPSession(page);
  const chord=await page.getByRole('button',{name:'Hold guitar chord C',exact:true}).boundingBox();
  const strings=await page.locator('.guitar-stringboard').boundingBox();
  const chordTouch={id:1,x:chord.x+chord.width/2,y:chord.y+chord.height/2};
  const stringTouch={id:2,x:strings.x+strings.width*.82,y:strings.y+strings.height/12};
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[chordTouch]});
  const expected=shapes.chords.find(value=>value.name==='C').notes;
  await expectStrings(expected);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[chordTouch,stringTouch]});
  for(let index=1;index<=5;index++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[chordTouch,{...stringTouch,y:strings.y+strings.height*(index+.5)/6}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[chordTouch]});
  const notes=await page.evaluate(()=>window.playedNotes);
  expect(notes).toEqual(expected.filter(note=>note!==null));
  if(!expected.includes('E2'))expect(notes).not.toContain('E2');
  expect(await soundLevel(page,'guitar')).toBeGreaterThan(.001);
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expectStrings(shapes.open);
  await expect(page.locator('.neck-chord-name')).toHaveCount(0);
  const openString=page.getByRole('button',{name:'Guitar string 1 E2',exact:true});
  const openStringBounds=await openString.boundingBox();
  await openString.click({position:{x:openStringBounds.width*.82,y:openStringBounds.height/2}});
  expect((await page.evaluate(()=>window.playedNotes)).at(-1)).toBe('E2');
  for(const value of ['G','Am','F']){
    const button=page.getByRole('button',{name:`Hold guitar chord ${value}`,exact:true});await button.focus();await page.keyboard.down('Space');
    await expect(page.locator('.neck-chord-name')).toHaveText(value);
    await expectStrings(shapes.chords.find(chord=>chord.name===value).notes);
    await page.keyboard.up('Space');await expectStrings(shapes.open);
    await expect(page.locator('.neck-chord-name')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test('trumpet six harmonic columns and valves change held lips across the playable range',async({page},testInfo)=>{
  const errors=await start(page);await equip(page,'melody');
  await page.getByRole('button',{name:'Open settings'}).dblclick();
  await page.getByRole('tab',{name:'Display',exact:true}).click();
  await page.getByRole('combobox',{name:'Configure instrument'}).selectOption('melody');
  await page.getByLabel('Show note and control labels').check();
  await page.locator('.mixer-head').getByRole('button',{name:'Close settings'}).click();
  const session=await page.context().newCDPSession(page);
  const slider=page.getByRole('slider',{name:'Trumpet embouchure',exact:true});
  const bounds=await slider.boundingBox();
  const registers=['C4','G4','C5','E5','G5','C6'];
  await expect(slider.locator('.lip-segment')).toHaveText(registers);
  let held={id:1,x:bounds.x+bounds.width*.5/6,y:bounds.y+bounds.height/2};
  const valveRects=await Promise.all([1,2,3].map(index=>page.getByRole('button',{name:`Trumpet valve ${index}`,exact:true}).boundingBox()));
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[held]});
  for(const [partial,register] of registers.entries()){
    held={...held,x:bounds.x+bounds.width*(partial+.5)/6};
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[held]});
    await expect(slider).toHaveAttribute('aria-valuetext',register);
    expect(await page.evaluate(()=>window.audioEngine.manualVoices.get('trumpet-lips')?.note)).toBe(register);
    for(let mask=0;mask<8;mask++){
      const fingers=valveRects.flatMap((rect,index)=>mask&(1<<index)?[{id:index+2,x:rect.x+rect.width/2,y:rect.y+rect.height/2}]:[]);
      if(fingers.length)await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[held,...fingers]});
      const expected=await page.evaluate(async({mask,partial})=>{
        const {trumpetNote}=await import('/src/utils/performance.js');return trumpetNote([0,1,2].map(index=>Boolean(mask&(1<<index))),partial);
      },{mask,partial});
      await expect(page.locator('.trumpet-pitch')).toHaveText(expected);
      expect(await page.evaluate(()=>({size:window.audioEngine.manualVoices.size,note:window.audioEngine.manualVoices.get('trumpet-lips')?.note}))).toEqual({size:1,note:expected});
      if(fingers.length)await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:fingers});
      expect(await page.evaluate(()=>window.audioEngine.manualVoices.get('trumpet-lips')?.note)).toBe(register);
    }
  }
  expect(await soundLevel(page,'melody')).toBeGreaterThan(.001);
  await page.screenshot({path:`test-results/${testInfo.project.name}-trumpet-harmonic-columns.png`});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  await expect(page.locator('.lip-indicator')).toHaveCount(0);
  for(let index=0;index<registers.length;index++){
    const column=await slider.locator('.lip-segment').nth(index).boundingBox();
    expect(Math.abs(column.x+column.width/2-(bounds.x+bounds.width*(index+.5)/6))).toBeLessThan(2);
    expect(Math.abs(column.width-bounds.width/6)).toBeLessThan(2);
  }
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
  const bars=page.getByRole('button',{name:/Marimba bar/});await expect(bars).toHaveCount(22);
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
  await page.getByRole('button',{name:'Open settings'}).dblclick();
  await expect(page.locator('.mixer')).toBeVisible();
  await page.getByRole('slider',{name:'Piano volume',exact:true}).fill('-18');
  await expect(page.getByRole('slider',{name:'Piano volume',exact:true})).toHaveValue('-18');
  expect(errors).toEqual([]);
});

test('sun travels along the arc before settling at midday and supports rapid scene changes', async ({page}) => {
  await start(page);
  await page.emulateMedia({reducedMotion:'no-preference'});
  const control = page.locator('.celestial-control');
  const tapCelestial = async () => { const bounds=await control.boundingBox();await page.mouse.click(bounds.x+bounds.width/2,bounds.y+bounds.height/2); };
  const startPoint = await control.boundingBox();
  await tapCelestial();
  await page.waitForTimeout(250);
  const moving = await control.boundingBox();
  expect(moving.x).toBeGreaterThan(startPoint.x);
  expect(moving.y).toBeLessThan(startPoint.y);
  await page.waitForTimeout(1100);
  const settled = await control.boundingBox();
  expect(settled.x+settled.width/2).toBeCloseTo(page.viewportSize().width/2,0);
  for(let index=0;index<5;index++) await tapCelestial();
  await expect(page.locator('.scene-farm')).toBeVisible();
  await page.waitForTimeout(1100);
  await expect(control).toHaveClass(/is-sun/);
  const wrapped = await control.boundingBox();
  expect(wrapped.x).toBeCloseTo(startPoint.x,0);
});

test('tapping the sun over an instrument advances the scene without activating the instrument', async ({page}) => {
  await start(page);
  await page.emulateMedia({reducedMotion:'reduce'});
  const bounds = await page.locator('.celestial-control').boundingBox();
  const piano = page.locator('#instrument-piano');
  await piano.evaluate((element, point) => { element.style.left = `${point.x / innerWidth * 100}%`; element.style.top = `${point.y / innerHeight * 100}%`; }, {x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2});
  await page.mouse.click(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
  await expect(page.locator('.scene-garden')).toBeVisible();
  await expect(piano).toHaveAttribute('aria-pressed','false');
});

test('sun and moon advance the day, remain circular, and keep controls aligned through rotation and equip', async ({page}, testInfo) => {
  const errors = await start(page);
  const control = page.getByRole('button',{name:'Change landscape'});
  await expect(page.locator('.celestial-control')).toHaveCSS('z-index','1');
  await expect(page.locator('.instrument-layer')).toHaveCSS('z-index','40');
  await expect(page.locator('.scene .interactive-object').first()).toHaveCSS('z-index','45');
  const skyLayers = await page.locator('.landscape-art').evaluate(svg => {
    const sun = svg.querySelector('.celestial-art');
    const terrain = [...svg.querySelectorAll('path')].find(path => path.getAttribute('d')?.startsWith('M0 403'));
    return {sunBeforeTerrain:Boolean(sun && terrain && (sun.compareDocumentPosition(terrain) & Node.DOCUMENT_POSITION_FOLLOWING)),pulse:getComputedStyle(svg.querySelector('.celestial-pulse')).animationName};
  });
  expect(skyLayers).toEqual({sunBeforeTerrain:true,pulse:'celestialPulse'});
  await page.emulateMedia({reducedMotion:'reduce'});
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
    await page.mouse.click(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
  }
  expect(positions[0]).toBeLessThan(positions[1]);
  expect(positions[1]).toBeLessThan(positions[2]);
  expect(positions[2]).toBeLessThan(positions[3]);
  expect(positions[5]).toBeLessThan(positions[0]);
  await equip(page,'piano');
  for (const viewport of [{width:851,height:393},{width:780,height:284},{width:1440,height:900}]) {
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

test('equipped autoplay uses normal selected phrases and manual input takes over for every instrument', async ({page},testInfo) => {
  const errors=await start(page);
  await page.evaluate(async()=>{
    const {patterns,nearestBar,transposeEvents}=await import('/src/utils/music.js');
    const engine=window.audioEngine;
    window.autoEvents=[];
    const original=engine.playEvent;
    engine.playEvent=function(name,event,time){
      if(this.manualAutoplay&&name===this.manualInstrument){
        const bar=this.barIndex-1;
        const expected=transposeEvents(nearestBar(patterns[name],this.noise[name].energyAt(bar),this.noise[name].complexityAt(bar)).events,this.root);
        window.autoEvents.push({name,event,expected});
      }
      return original.call(this,name,event,time);
    };
  });
  const targets={piano:'Piano key C4',flute:'Flute key D-sharp pinky',marimba:'Marimba bar C5',melody:'Trumpet embouchure',guitar:null,drums:'Snare'};
  for(const name of Object.keys(targets)){
    await equip(page,name);
    await page.evaluate(()=>window.autoEvents=[]);
    const toggle=page.locator(`#instrument-${name}`);
    await expect(toggle).toHaveAttribute('aria-pressed','false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed','true');
    await expect.poll(()=>page.evaluate(()=>window.autoEvents.length)).toBeGreaterThan(0);
    await expect(page.locator('.autoplay-notes')).not.toBeEmpty();
    const events=await page.evaluate(()=>window.autoEvents);
    for(const played of events){
      if(played.name==='guitar'){
        const {chord,fingering,...event}=played.event;
        expect(played.expected).toContainEqual(event);
      }else expect(played.expected).toContainEqual(played.event);
    }
    expect(await page.evaluate(()=>window.audioEngine.manualAutoplay)).toBe(true);
    if(name==='melody'){
      const positions=new Set();
      await expect.poll(async()=>{
        const position=await page.locator('.lip-indicator.is-demo').evaluateAll(indicators=>indicators[0]?.style.left);
        if(position)positions.add(position);
        return positions.size;
      },{timeout:15000}).toBeGreaterThan(1);
      await expect.poll(()=>page.locator('.valve-control.pressed').count(),{timeout:15000}).toBeGreaterThan(0);
      expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
    }
    await page.screenshot({path:`test-results/${testInfo.project.name}-autoplay-${name}.png`});
    const target=name==='guitar'?page.locator('.playable-string').first():page.getByRole(name==='melody'?'slider':'button',{name:targets[name],exact:true});
    await target.focus();await page.keyboard.down('Space');
    await expect(toggle).toHaveAttribute('aria-pressed','false');
    expect(await page.evaluate(()=>window.audioEngine.manualAutoplay)).toBe(false);
    if(['piano','flute','melody'].includes(name))expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBeGreaterThan(0);
    if(name==='melody')await expect(page.locator('.lip-indicator.is-demo')).toHaveCount(0);
    await page.keyboard.up('Space');
    await toggle.click();await expect(toggle).toHaveAttribute('aria-pressed','true');
    await toggle.click();await expect(toggle).toHaveAttribute('aria-pressed','false');
    await page.getByRole('button',{name:'Put instrument down'}).click();
    expect(await page.evaluate(()=>window.audioEngine.manualAutoplay)).toBe(false);
  }
  expect(errors).toEqual([]);
});

test('brief marimba strikes and fast swipes retain a fading visible hit indicator',async({page})=>{
  await start(page);await equip(page,'marimba');
  const bar=page.getByRole('button',{name:'Marimba bar C5',exact:true});
  await bar.focus();await page.keyboard.press('Space');
  expect(await bar.evaluate(element=>element.getAnimations().some(animation=>animation.id==='input-hit'))).toBe(true);
  await page.waitForTimeout(100);
  expect(await bar.evaluate(element=>Number(/brightness\(([^)]+)\)/.exec(getComputedStyle(element).filter)?.[1]??1))).toBeGreaterThan(1);
  await page.waitForTimeout(500);
  expect(await bar.evaluate(element=>element.getAnimations().some(animation=>animation.id==='input-hit'))).toBe(false);
  const keyboard=await page.locator('.manual-keyboard').boundingBox();
  const first=await page.locator('.natural-key').first().boundingBox();
  const swipeY=first.y+first.height*.85;
  await page.mouse.move(keyboard.x-2,swipeY);await page.mouse.down();
  await page.mouse.move(keyboard.x+keyboard.width-8,swipeY);await page.mouse.up();
  expect(await page.locator('.manual-keyboard').evaluate(element=>[...element.querySelectorAll('button')].filter(button=>button.getAnimations().some(animation=>animation.id==='input-hit')).length)).toBeGreaterThan(1);
});

test('active instruments autoplay automatically on equip and stay manual after takeover',async({page})=>{
  await start(page);
  await page.locator('#instrument-marimba').click();
  await expect(page.locator('#instrument-marimba')).toHaveAttribute('aria-pressed','true');
  await equip(page,'marimba');
  const toggle=page.locator('#instrument-marimba');
  await expect(toggle).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(()=>window.audioEngine.manualAutoplay)).toBe(true);
  await expect(page.locator('.autoplay-notes')).not.toBeEmpty();
  await page.getByRole('button',{name:'Marimba bar C5',exact:true}).click();
  await expect(toggle).toHaveAttribute('aria-pressed','false');
  await page.waitForTimeout(3000);
  expect(await page.evaluate(()=>window.audioEngine.manualAutoplay)).toBe(false);
  await toggle.click();await expect(toggle).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Put instrument down'}).click();
  expect(await page.evaluate(()=>window.audioEngine.active.marimba)).toBe(true);
  expect(await page.evaluate(()=>window.audioEngine.manualAutoplay)).toBe(false);
});

test('equipped autoplay shares the transport with other instruments and follows scene keys',async({page})=>{
  await start(page);
  await page.locator('#instrument-drums').click();
  await equip(page,'piano');
  await page.evaluate(async()=>{
    const {patterns,nearestBar,transposeEvents}=await import('/src/utils/music.js');
    const engine=window.audioEngine;
    window.phraseChecks=[];
    const roots=new Map();
    const schedule=engine.scheduleBar;
    engine.scheduleBar=function(time){roots.set(this.barIndex,this.root);return schedule.call(this,time);};
    const original=engine.playEvent;
    engine.playEvent=function(name,event,time){
      if(name==='piano'&&this.manualAutoplay){
        const bar=this.barIndex-1;
        const root=roots.get(bar)??this.root;
        const expected=transposeEvents(nearestBar(patterns[name],this.noise[name].energyAt(bar),this.noise[name].complexityAt(bar)).events,root);
        window.phraseChecks.push({event,expected,root});
      }
      return original.call(this,name,event,time);
    };
  });
  const toggle=page.locator('#instrument-piano');
  await toggle.click();
  await expect.poll(()=>page.evaluate(()=>window.phraseChecks.length)).toBeGreaterThan(0);
  expect(await soundLevel(page,'piano')).toBeGreaterThan(.0001);
  expect(await soundLevel(page,'drums',1.4)).toBeGreaterThan(.0001);
  await page.getByRole('button',{name:'Change landscape'}).click({force:true});
  await expect(page.locator('.scene-garden')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>window.phraseChecks.some(check=>check.root==='G'))).toBe(true);
  const checks=await page.evaluate(()=>window.phraseChecks);
  for(const check of checks)expect(check.expected).toContainEqual(check.event);
  await page.getByRole('button',{name:'Piano key C4',exact:true}).click();
  await expect(toggle).toHaveAttribute('aria-pressed','false');
  expect(await page.evaluate(()=>window.audioEngine.active.drums)).toBe(true);
  expect(await soundLevel(page,'drums',1.4)).toBeGreaterThan(.0001);
});