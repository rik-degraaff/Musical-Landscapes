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
    const piano=await page.locator('#instrument-piano').boundingBox();const obstacle=await page.locator(target).boundingBox();
    expect(piano.x+piano.width<=obstacle.x || piano.x>=obstacle.x+obstacle.width || piano.y+piano.height<=obstacle.y || piano.y>=obstacle.y+obstacle.height).toBe(true);
  }
  expect(errors).toEqual([]);
});