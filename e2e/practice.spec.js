import {test,expect} from './fixtures.js';

async function start(page){const size=page.viewportSize();if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/');await page.evaluate(async()=>{const text=await(await fetch('/src/App.jsx')).text();const url=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(text)[1];const {AudioEngine}=await import(url);const init=AudioEngine.prototype.initialize;AudioEngine.prototype.initialize=async function(){await init.call(this);window.audioEngine=this;};});await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});return errors;}
async function enter(page){const point=await page.locator('#young-musician').evaluate(element=>{const box=element.getBoundingClientRect();for(let row=1;row<8;row++)for(let column=1;column<8;column++){const x=box.left+box.width*column/8,y=box.top+box.height*row/8;if(document.elementFromPoint(x,y)?.closest('#young-musician'))return{x,y};}return{x:box.left+box.width/2,y:box.top+box.height/2};});await page.mouse.dblclick(point.x,point.y);await expect(page.getByRole('dialog',{name:'Farm practice room'})).toBeVisible();}
async function key(page,note){const button=page.getByRole('button',{name:`Piano key ${note}`,exact:true});await button.focus();await page.keyboard.press('Space');}

test('double-tapping the girl opens the farm room with equipped instrument and restores farm on exit',async({page},testInfo)=>{
  const errors=await start(page);await page.locator('#instrument-drums').click();await page.locator('#instrument-ukulele').focus();await page.keyboard.press('e');
  await page.getByRole('button',{name:'Next phrase',exact:true}).click();const pinned=await page.evaluate(()=>({phrase:window.audioEngine.equippedPhrase,identity:window.audioEngine.phraseIdentity}));
  await enter(page);await expect(page.getByRole('combobox',{name:'Practice instrument'})).toHaveValue('ukulele');await expect(page.locator('.practice-room-art')).toBeVisible();
  await expect(page.locator('.practice-musician')).toBeVisible();await expect(page.locator('.practice-musician .instrument-illustration')).toHaveClass(/illustration-ukulele/);await expect(page.locator('.practice-neighbors button')).toHaveCount(5);
  await expect(page.getByRole('button',{name:'Leave practice through the open door'})).toBeVisible();await expect(page.locator('.practice-room .metronome-widget')).toBeVisible();
  const metronome=await page.getByRole('button',{name:'Open metronome'}).boundingBox();const header=await page.locator('.practice-topbar').boundingBox();expect(metronome.y).toBeGreaterThanOrEqual(header.y-1);expect(metronome.y+metronome.height).toBeLessThanOrEqual(header.y+header.height+1);
  await page.getByRole('button',{name:'Open metronome'}).click();await expect(page.getByRole('dialog',{name:'Metronome'})).toBeVisible();await page.mouse.click(page.viewportSize().width-8,page.viewportSize().height/2);await expect(page.getByRole('button',{name:'Open metronome'})).toBeVisible();
  expect(await page.evaluate(()=>window.audioEngine.practiceSession.active.drums)).toBe(true);expect(await page.evaluate(()=>Object.values(window.audioEngine.active).some(Boolean))).toBe(false);
  await page.getByRole('combobox',{name:'Practice instrument'}).selectOption('panflute');await expect(page.locator('.panflute-pipes')).toBeVisible();
  await page.screenshot({path:`test-results/${testInfo.project.name}-farm-practice-room.png`});
  await page.getByRole('button',{name:'Leave practice through the open door'}).click();await expect(page.locator('.practice-room')).toHaveCount(0);
  expect(await page.evaluate(()=>({active:window.audioEngine.active.drums,manual:window.audioEngine.manualInstrument,practice:window.audioEngine.practiceSession}))).toEqual({active:true,manual:'ukulele',practice:null});
  expect(await page.evaluate(()=>({phrase:window.audioEngine.equippedPhrase,identity:window.audioEngine.phraseIdentity}))).toEqual(pinned);expect(await page.evaluate(()=>window.audioEngine.phrasePinned)).toBe(true);
  await expect(page.locator('.performance-ukulele')).toBeVisible();expect(errors).toEqual([]);
});

test('learn waits for each right note and feedback leads into rhythm and accompanied attempts',async({page},testInfo)=>{
  const errors=await start(page);await enter(page);await expect(page.getByRole('combobox',{name:'Practice instrument'})).toHaveValue('piano');
  await page.getByRole('button',{name:'2. Learn',exact:true}).click();
  expect(await page.evaluate(()=>window.audioEngine.root)).toBe('A');
  await expect(page.locator('.practice-target strong')).toHaveText('A4 + C#5 + E5');
  await expect(page.locator('.practice-surface-host .note-key[aria-pressed="true"]')).toHaveCount(3);
  await key(page,'D4');await expect(page.locator('.practice-feedback-display')).toHaveText('Try again');await expect(page.locator('.practice-target strong')).toHaveText('A4 + C#5 + E5');
  await key(page,'A4');await expect(page.locator('.practice-feedback-display')).toHaveText('Good note, finish the chord');await expect(page.locator('.practice-target strong')).toHaveText('A4 + C#5 + E5');
  for(const note of ['A4','C#5','E5'])await key(page,note);
  await expect(page.locator('.practice-feedback-display')).toHaveText('Phrase learned!');await expect(page.getByRole('button',{name:'Next practice step'})).toBeEnabled();await page.getByRole('button',{name:'Next practice step'}).click();await expect(page.getByRole('button',{name:'3. Rhythm'})).toHaveAttribute('aria-pressed','true');
  await page.evaluate(()=>{
    const engine=window.audioEngine;engine.setTempo(208);window.accompaniment=[];window.accompanimentCycles=[];window.practiceHints=[];window.loopCycles=[];window.practiceInputs=[];window.practiceClock=null;
    const input=engine.onPracticeInput;engine.onPracticeInput=value=>{window.practiceInputs.push({note:value.note,ticks:value.ticks});return input(value);};
    const run=engine.startPracticeRun;engine.startPracticeRun=function(...args){
      const step=args[2],cycle=args[3],accompaniment=args[5];
      args[2]=(...values)=>{window.practiceHints.push({cycle:values[0].cycle,eventIndex:values[0].eventIndex,notes:values[0].notes});return step(...values);};
      args[3]=(...values)=>{window.loopCycles.push(values[0]);return cycle(...values);};
      args[5]=(...values)=>{window.accompanimentCycles.push({instrument:values[0],phrase:values[1]});return accompaniment(...values);};
      const result=run.apply(this,args);window.practiceClock=result;return result;
    };
    const play=engine.playEvent;engine.playEvent=function(name,event,time){window.accompaniment.push({name,time});return play.call(this,name,event,time);};
  });
  async function playTimed(){
    await page.getByRole('button',{name:'Start repeating',exact:true}).click();
    await page.evaluate(()=>new Promise(resolve=>{
      const engine=window.audioEngine;const delay=Math.max(0,(window.practiceClock.startTime-engine.practiceTime())*1000);
      setTimeout(()=>{for(const [index,note] of ['A4','C#5','E5'].entries()){engine.manualNoteOn(note,`test-${index}`);setTimeout(()=>engine.manualNoteOff(`test-${index}`),120);}resolve();},delay);
    }));
    await expect(page.locator('.practice-phrase-track .is-current')).toHaveCount(1);
    await expect(page.locator('.practice-score')).toHaveText('3/3 · 100%',{timeout:8000});
  }
  await playTimed();expect(await page.evaluate(()=>window.accompaniment.length)).toBe(0);
  await expect.poll(()=>page.evaluate(()=>window.loopCycles.length)).toBeGreaterThan(1);
  await expect.poll(()=>page.evaluate(()=>window.practiceHints.some(value=>value.cycle>=1))).toBe(true);
  await expect(page.getByRole('button',{name:'Next practice step'})).toBeEnabled();await page.getByRole('button',{name:'Next practice step'}).click();await expect(page.getByRole('button',{name:'4. Together'})).toHaveAttribute('aria-pressed','true');
  await playTimed();
  await expect.poll(()=>page.evaluate(()=>window.accompanimentCycles.filter(value=>value.instrument==='drums').length)).toBeGreaterThan(1);
  await expect.poll(()=>page.evaluate(()=>window.accompanimentCycles.filter(value=>value.instrument==='ukulele').length)).toBeGreaterThan(1);
  expect(await page.evaluate(()=>['drums','ukulele'].every(name=>new Set(window.accompanimentCycles.filter(value=>value.instrument===name).map(value=>value.phrase)).size>1))).toBe(true);
  expect(await page.evaluate(()=>new Set(window.practiceHints.map(value=>JSON.stringify(value.notes))).size)).toBe(1);
  await page.screenshot({path:`test-results/${testInfo.project.name}-practice-together-loop.png`});
  await page.getByRole('button',{name:'Stop practice'}).click();expect(await page.evaluate(()=>window.audioEngine.practiceRun)).toBe(null);
  const hints=await page.evaluate(()=>window.practiceHints.length);await page.waitForTimeout(180);expect(await page.evaluate(()=>window.practiceHints.length)).toBe(hints);
  await page.getByRole('button',{name:'Leave practice through the open door'}).click();expect(errors).toEqual([]);
});

test('switching instrument or phrase and leaving cancels timed guidance and background interruption pauses practice',async({page})=>{
  await start(page);await enter(page);await page.getByRole('button',{name:'3. Rhythm'}).click();await page.getByRole('button',{name:'Start repeating',exact:true}).click();
  await page.getByRole('combobox',{name:'Practice instrument'}).selectOption('marimba');expect(await page.evaluate(()=>window.audioEngine.practiceRun)).toBe(null);expect(await page.evaluate(()=>window.audioEngine.manualInstrument)).toBe('marimba');
  await page.getByRole('combobox',{name:'Practice phrase'}).selectOption('1');await page.getByRole('button',{name:'Start repeating',exact:true}).click();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await expect(page.getByRole('status')).toHaveText('Paused — restart when ready');expect(await page.evaluate(()=>window.audioEngine.practiceRun)).toBe(null);
  await page.getByRole('button',{name:'Leave practice through the open door'}).click();expect(await page.evaluate(()=>window.audioEngine.practiceSession)).toBe(null);
  expect(await page.evaluate(()=>Object.values(window.audioEngine.nodes).every(node=>node.gain.volume.value<=-59))).toBe(true);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
});

test('all eight instruments guide playable notes and fit the practice surface',async({page},testInfo)=>{
  const errors=await start(page);await enter(page);
  await page.getByRole('button',{name:'2. Learn',exact:true}).click();
  for(const name of ['piano','marimba','drums','guitar','ukulele','panflute','flute','melody']){
    await page.getByRole('combobox',{name:'Practice instrument'}).selectOption(name);
    await expect.poll(()=>page.evaluate(()=>window.audioEngine.manualInstrument)).toBe(name);
    await expect(page.locator('.practice-feedback-display')).toHaveText('Ready');
    const surface=await page.locator('.practice-surface-host').boundingBox();expect(surface.height).toBeGreaterThan(90);expect(surface.height/page.viewportSize().height).toBeLessThanOrEqual(.72);
    await expect(page.locator('.practice-control-dock')).toBeVisible();
    const surfaceTop=surface.y;
    for(const button of await page.locator('.practice-control-dock button').all()){
      const bounds=await button.boundingBox();expect(bounds.y+bounds.height).toBeLessThanOrEqual(surfaceTop+1);
      expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(page.viewportSize().width);
    }
    if(['piano','marimba','drums','guitar','ukulele','panflute'].includes(name)){
      const guided=page.locator('.practice-surface-host .note-key[aria-pressed="true"],.practice-surface-host .drum-pad[aria-pressed="true"],.practice-surface-host .playable-string[aria-pressed="true"],.practice-surface-host .panflute-pipe[aria-pressed="true"]');
      await expect(guided.first()).toBeVisible();expect(await guided.count()).toBeGreaterThanOrEqual(1);
      const targets=await guided.evaluateAll(items=>items.map(item=>item.getAttribute('aria-label')));
      for(const target of targets){await page.getByRole('button',{name:target,exact:true}).focus();await page.keyboard.press('Space');if(/Correct!|Phrase learned!/.test(await page.locator('.practice-feedback-display').innerText()))break;}
      await expect(page.locator('.practice-feedback-display')).toHaveText(/Correct!|Phrase learned!/);
      if(['guitar','ukulele'].includes(name)){
        await page.getByRole('button',{name:'Restart practice',exact:true}).click();
        const chord=page.locator('.chord-control.playing-chord');const bounds=await chord.boundingBox();
        await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down();
        const frets=await page.locator('.fingering-dot').evaluateAll(items=>items.map(item=>item.getAttribute('data-fret')));
        const string=page.locator('.playable-string[aria-pressed="true"]').first();await string.focus();await page.keyboard.press('Space');
        expect(await page.locator('.fingering-dot').evaluateAll(items=>items.map(item=>item.getAttribute('data-fret')))).toEqual(frets);
        await page.mouse.up();
      }
    }else if(name==='flute'){
      const fingers=await page.locator('.flute-physical-key[aria-pressed="true"]').all();expect(fingers.length).toBeGreaterThan(0);
      const client=await page.context().newCDPSession(page);const points=[];
      for(const [index,finger] of fingers.entries()){const box=await finger.boundingBox();points.push({id:index+1,x:box.x+box.width/2,y:box.y+box.height/2});}
      await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});await expect(page.locator('.practice-feedback-display')).toHaveText(/Correct!|Phrase learned!/);await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await client.detach();
    }else{
      const client=await page.context().newCDPSession(page);const points=[];
      for(const [index,valve] of (await page.locator('.valve-control[aria-pressed="true"]').all()).entries()){const box=await valve.boundingBox();points.push({id:index+2,x:box.x+box.width/2,y:box.y+box.height/2});}
      const marker=await page.locator('.lip-indicator.is-demo').boundingBox();const lips=await page.getByRole('slider',{name:'Trumpet embouchure'}).boundingBox();points.push({id:1,x:marker.x+marker.width/2,y:lips.y+lips.height/2});
      await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});await expect(page.locator('.practice-feedback-display')).toHaveText(/Correct!|Phrase learned!/);await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await client.detach();
    }
    await page.screenshot({path:`test-results/${testInfo.project.name}-practice-${name}.png`});
    expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBeLessThanOrEqual(1);
  }
  await page.getByRole('button',{name:'3. Rhythm'}).click();await expect(page.getByRole('button',{name:'Start repeating'})).toBeVisible();
  const ready=await page.getByRole('button',{name:'Start repeating'}).boundingBox();const board=await page.locator('.practice-surface-host').boundingBox();expect(ready.y+ready.height).toBeLessThanOrEqual(board.y+1);
  await page.getByRole('button',{name:'Leave practice through the open door'}).click();expect(errors).toEqual([]);
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

test('Listen repeats the phrase with receding orange duration and unlocks Next after a full loop',async({page},testInfo)=>{
  const errors=await start(page);await enter(page);
  await expect(page.getByRole('button',{name:'1. Listen',exact:true})).toHaveAttribute('aria-pressed','true');
  const next=page.getByRole('button',{name:'Next practice step'});await expect(next).toBeDisabled();
  await page.evaluate(()=>{
    const engine=window.audioEngine;engine.setTempo(160);window.demoEvents=[];
    const play=engine.playEvent;engine.playEvent=function(name,event,time){window.demoEvents.push({name,notes:event.notes??[event.note],time});return play.call(this,name,event,time);};
  });
  await page.getByRole('button',{name:'Start repeating'}).click();
  await expect(page.locator('.practice-surface-host[data-timed-cue="true"]')).toBeVisible();
  const meter=page.getByRole('progressbar',{name:'Note hold duration'});
  await expect.poll(()=>meter.getAttribute('aria-valuenow')).not.toBe('100');
  const first=Number(await meter.getAttribute('aria-valuenow'));
  await expect.poll(async()=>Number(await meter.getAttribute('aria-valuenow'))).toBeLessThan(first);
  await page.screenshot({path:testInfo.outputPath('listen-duration.png')});
  await expect(next).toBeEnabled({timeout:10000});
  await expect.poll(()=>page.evaluate(()=>window.demoEvents.length)).toBeGreaterThan(1);
  expect(await page.evaluate(()=>window.demoEvents.every(event=>event.name==='piano'))).toBe(true);
  await next.click();await expect(page.getByRole('button',{name:'2. Learn',exact:true})).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(()=>window.audioEngine.practiceRun)).toBe(null);await expect(next).toBeDisabled();expect(errors).toEqual([]);
});

test('Learn accepts every action after the first and reinitializes on restart and phrase changes',async({page})=>{
  const errors=await start(page);await enter(page);await page.getByRole('button',{name:'2. Learn',exact:true}).click();
  const index=await page.evaluate(async()=>{
    const {equippedProfile}=await import('/src/utils/difficulty.js');
    return equippedProfile('piano',window.audioEngine.root,{complexity:1.5}).phrases.findIndex(phrase=>phrase.events.length>=3);
  });
  expect(index).toBeGreaterThanOrEqual(0);await page.getByRole('combobox',{name:'Practice phrase'}).selectOption(String(index));
  const next=page.getByRole('button',{name:'Next practice step'});await expect(next).toBeDisabled();
  for(let action=0;action<16;action++){
    const target=await page.locator('.practice-target strong').innerText();if(target==='Finished')break;
    for(const note of target.split(' + '))await key(page,note);
    await expect(page.locator('.practice-feedback-display')).toHaveText(/Correct!|Phrase learned!/);
  }
  await expect(page.locator('.practice-target strong')).toHaveText('Finished');await expect(next).toBeEnabled();
  await page.getByRole('button',{name:'Restart practice'}).click();await expect(next).toBeDisabled();
  const first=(await page.locator('.practice-target strong').innerText()).split(' + ');for(const note of first)await key(page,note);
  await expect(page.locator('.practice-feedback-display')).toHaveText('Correct!');
  await page.getByRole('combobox',{name:'Practice phrase'}).selectOption('0');await expect(page.locator('.practice-feedback-display')).toHaveText('Ready');expect(errors).toEqual([]);
});

test('double-tapping the held instrument enters practice and preserves its pre-tap playback state',async({page},testInfo)=>{
  const errors=await start(page);
  const instrument=page.locator('#instrument-ukulele');await instrument.focus();await page.keyboard.press('e');
  await expect(instrument).toHaveClass(/equipped-instrument/);
  await instrument.click();await expect(page.locator('.practice-room')).toHaveCount(0);
  await expect(instrument).toHaveAttribute('aria-pressed','true');
  await page.waitForTimeout(500);
  const bounds=await instrument.boundingBox();const point={x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2};
  if(testInfo.project.use.hasTouch){
    const client=await page.context().newCDPSession(page);
    for(let tap=0;tap<2;tap++){
      await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,id:1}]});
      await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});if(tap===0)await page.waitForTimeout(120);
    }
    await client.detach();
  }else await page.mouse.dblclick(point.x,point.y);
  await expect(page.getByRole('dialog',{name:'Farm practice room'})).toBeVisible();
  await expect(page.getByRole('combobox',{name:'Practice instrument'})).toHaveValue('ukulele');
  expect(await page.evaluate(()=>window.audioEngine.practiceSession.active.ukulele)).toBe(true);
  await page.getByRole('button',{name:'Leave practice through the open door'}).click();
  await expect(instrument).toHaveAttribute('aria-pressed','true');expect(errors).toEqual([]);
});