import {test,expect} from '@playwright/test';

async function start(page){const size=page.viewportSize();if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/');await page.evaluate(async()=>{const text=await(await fetch('/src/App.jsx')).text();const url=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(text)[1];const {AudioEngine}=await import(url);const init=AudioEngine.prototype.initialize;AudioEngine.prototype.initialize=async function(){await init.call(this);window.audioEngine=this;};});await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});return errors;}
async function enter(page){const box=await page.locator('#young-musician').boundingBox();if(await page.evaluate(()=>navigator.maxTouchPoints>0)){const client=await page.context().newCDPSession(page);for(let tap=0;tap<2;tap++){await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+20,y:box.y+8}]});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}await client.detach();}else await page.mouse.dblclick(box.x+20,box.y+8);await expect(page.getByRole('dialog',{name:'Farm practice room'})).toBeVisible();}
async function key(page,note){const button=page.getByRole('button',{name:`Piano key ${note}`,exact:true});await button.focus();await page.keyboard.press('Space');}

test('double-tapping the girl opens the farm room with equipped instrument and restores farm on exit',async({page},testInfo)=>{
  const errors=await start(page);await page.locator('#instrument-drums').click();await page.locator('#instrument-ukulele').focus();await page.keyboard.press('e');
  await page.getByRole('button',{name:'Next phrase',exact:true}).click();const pinned=await page.evaluate(()=>({phrase:window.audioEngine.equippedPhrase,identity:window.audioEngine.phraseIdentity}));
  await enter(page);await expect(page.getByRole('combobox',{name:'Practice instrument'})).toHaveValue('ukulele');await expect(page.locator('.practice-room-art')).toBeVisible();
  expect(await page.evaluate(()=>window.audioEngine.practiceSession.active.drums)).toBe(true);expect(await page.evaluate(()=>Object.values(window.audioEngine.active).some(Boolean))).toBe(false);
  await page.getByRole('combobox',{name:'Practice instrument'}).selectOption('panflute');await expect(page.locator('.panflute-pipes')).toBeVisible();
  await page.screenshot({path:`test-results/${testInfo.project.name}-farm-practice-room.png`});
  await page.getByRole('button',{name:'Leave practice'}).click();await expect(page.locator('.practice-room')).toHaveCount(0);
  expect(await page.evaluate(()=>({active:window.audioEngine.active.drums,manual:window.audioEngine.manualInstrument,practice:window.audioEngine.practiceSession}))).toEqual({active:true,manual:'ukulele',practice:null});
  expect(await page.evaluate(()=>({phrase:window.audioEngine.equippedPhrase,identity:window.audioEngine.phraseIdentity}))).toEqual(pinned);expect(await page.evaluate(()=>window.audioEngine.phrasePinned)).toBe(true);
  await expect(page.locator('.performance-ukulele')).toBeVisible();expect(errors).toEqual([]);
});

test('learn waits for each right note and feedback leads into rhythm and accompanied attempts',async({page},testInfo)=>{
  const errors=await start(page);await enter(page);await expect(page.getByRole('combobox',{name:'Practice instrument'})).toHaveValue('piano');
  await expect(page.locator('.practice-target strong')).toHaveText('C4');await key(page,'D4');await expect(page.getByRole('status')).toHaveText('Try again');await expect(page.locator('.practice-target strong')).toHaveText('C4');
  for(const note of ['C4','E4','G4'])await key(page,note);
  await expect(page.getByRole('status')).toHaveText('Phrase learned!');await page.getByRole('button',{name:'Next practice stage'}).click();await expect(page.getByRole('button',{name:'2. Rhythm'})).toHaveAttribute('aria-pressed','true');
  await page.evaluate(()=>{
    const engine=window.audioEngine;engine.setTempo(208);window.accompaniment=[];window.practiceClock=null;
    const run=engine.startPracticeRun;engine.startPracticeRun=function(...args){const result=run.apply(this,args);window.practiceClock=result;return result;};
    const play=engine.playEvent;engine.playEvent=function(name,event,time){window.accompaniment.push(name);return play.call(this,name,event,time);};
  });
  async function playTimed(){
    await page.getByRole('button',{name:'Start practice',exact:true}).click();
    await page.evaluate(()=>new Promise(resolve=>{
      const engine=window.audioEngine;const delay=Math.max(0,(window.practiceClock.startTime-engine.practiceTime())*1000);
      setTimeout(()=>{for(const [index,note] of ['C4','E4','G4'].entries()){engine.manualNoteOn(note,`test-${index}`);setTimeout(()=>engine.manualNoteOff(`test-${index}`),120);}resolve();},delay);
    }));
    await expect(page.locator('.practice-phrase-track .is-current')).toHaveCount(1);
    await expect(page.locator('.practice-score')).toHaveText('3/3 · 100%',{timeout:8000});
  }
  await playTimed();expect(await page.evaluate(()=>window.accompaniment.length)).toBe(0);await page.getByRole('button',{name:'Next practice stage'}).click();await expect(page.getByRole('button',{name:'3. Together'})).toHaveAttribute('aria-pressed','true');
  await playTimed();expect(await page.evaluate(()=>window.accompaniment.includes('drums'))).toBe(true);expect(await page.evaluate(()=>window.accompaniment.includes('ukulele'))).toBe(true);expect(await page.evaluate(()=>window.accompaniment.includes('piano'))).toBe(false);
  await page.screenshot({path:`test-results/${testInfo.project.name}-practice-together-complete.png`});await page.getByRole('button',{name:'Leave practice'}).click();expect(errors).toEqual([]);
});

test('switching instrument or phrase and leaving cancels timed guidance and background interruption pauses practice',async({page})=>{
  await start(page);await enter(page);await page.getByRole('button',{name:'2. Rhythm'}).click();await page.getByRole('button',{name:'Start practice',exact:true}).click();
  await page.getByRole('combobox',{name:'Practice instrument'}).selectOption('marimba');expect(await page.evaluate(()=>window.audioEngine.practiceRun)).toBe(null);expect(await page.evaluate(()=>window.audioEngine.manualInstrument)).toBe('marimba');
  await page.getByRole('combobox',{name:'Practice phrase'}).selectOption('1');await page.getByRole('button',{name:'Start practice',exact:true}).click();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await expect(page.getByRole('status')).toHaveText('Paused — restart when ready');expect(await page.evaluate(()=>window.audioEngine.practiceRun)).toBe(null);
  await page.getByRole('button',{name:'Leave practice'}).click();expect(await page.evaluate(()=>window.audioEngine.practiceSession)).toBe(null);
  expect(await page.evaluate(()=>Object.values(window.audioEngine.nodes).every(node=>node.gain.volume.value<=-59))).toBe(true);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
});

test('all eight instruments guide playable notes and fit the practice surface',async({page},testInfo)=>{
  const errors=await start(page);await enter(page);
  for(const name of ['piano','marimba','drums','guitar','ukulele','panflute','flute','melody']){
    await page.getByRole('combobox',{name:'Practice instrument'}).selectOption(name);
    await expect.poll(()=>page.evaluate(()=>window.audioEngine.manualInstrument)).toBe(name);
    await expect(page.locator('.practice-feedback')).toHaveText('Ready');
    const surface=await page.locator('.practice-surface-host').boundingBox();expect(surface.height).toBeGreaterThan(90);
    if(['piano','marimba','drums','guitar','ukulele','panflute'].includes(name)){
      const guided=page.locator('.practice-surface-host .note-key[aria-pressed="true"],.practice-surface-host .drum-pad[aria-pressed="true"],.practice-surface-host .playable-string[aria-pressed="true"],.practice-surface-host .panflute-pipe[aria-pressed="true"]').first();
      await expect(guided).toBeVisible();await guided.focus();await page.keyboard.press('Space');
      await expect(page.locator('.practice-feedback')).toHaveText(/Correct!|Phrase learned!/);
      if(['guitar','ukulele'].includes(name)){
        await page.getByRole('button',{name:'Restart practice',exact:true}).click();
        const chord=page.locator('.chord-control.playing-chord');const bounds=await chord.boundingBox();
        await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down();
        const frets=await page.locator('.fingering-dot').evaluateAll(items=>items.map(item=>item.getAttribute('data-fret')));
        const string=page.locator('.playable-string[aria-pressed="true"]');await string.focus();await page.keyboard.press('Space');
        await expect(page.locator('.practice-feedback')).toHaveText(/Correct!|Phrase learned!/);
        expect(await page.locator('.fingering-dot').evaluateAll(items=>items.map(item=>item.getAttribute('data-fret')))).toEqual(frets);
        await page.mouse.up();
      }
    }else if(name==='flute'){
      const fingers=await page.locator('.flute-physical-key[aria-pressed="true"]').all();expect(fingers.length).toBeGreaterThan(0);
      const client=await page.context().newCDPSession(page);const points=[];
      for(const [index,finger] of fingers.entries()){const box=await finger.boundingBox();points.push({id:index+1,x:box.x+box.width/2,y:box.y+box.height/2});}
      await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});await expect(page.locator('.practice-feedback')).toHaveText(/Correct!|Phrase learned!/);await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await client.detach();
    }else{
      const client=await page.context().newCDPSession(page);const points=[];
      for(const [index,valve] of (await page.locator('.valve-control[aria-pressed="true"]').all()).entries()){const box=await valve.boundingBox();points.push({id:index+2,x:box.x+box.width/2,y:box.y+box.height/2});}
      const marker=await page.locator('.lip-indicator.is-demo').boundingBox();const lips=await page.getByRole('slider',{name:'Trumpet embouchure'}).boundingBox();points.push({id:1,x:marker.x+marker.width/2,y:lips.y+lips.height/2});
      await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});await expect(page.locator('.practice-feedback')).toHaveText(/Correct!|Phrase learned!/);await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await client.detach();
    }
    await page.screenshot({path:`test-results/${testInfo.project.name}-practice-${name}.png`});
    expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBeLessThanOrEqual(1);
  }
  await page.getByRole('button',{name:'Leave practice'}).click();expect(errors).toEqual([]);
});

test('outside taps interrupt the entry gesture and keyboard entry contains focus until Escape',async({page})=>{
  await start(page);const box=await page.locator('#young-musician').boundingBox();const point={x:box.x+box.width/2,y:box.y+box.height*.2};
  await page.mouse.click(point.x,point.y);await page.mouse.click(40,40);await page.mouse.click(point.x,point.y);
  await expect(page.locator('.practice-room')).toHaveCount(0);
  await page.locator('#young-musician').focus();await page.keyboard.press('Enter');await expect(page.locator('.practice-room')).toBeVisible();
  await expect(page.getByRole('combobox',{name:'Practice instrument'})).toBeFocused();await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(()=>document.activeElement.closest('.practice-room')!==null)).toBe(true);
  await page.keyboard.press('Escape');await expect(page.locator('.practice-room')).toHaveCount(0);await expect(page.locator('#young-musician')).toBeFocused();
});