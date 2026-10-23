import {test,expect,doubleActivate} from './fixtures.js';

async function start(page) {
  const viewport=page.viewportSize();if(viewport.height>viewport.width)await page.setViewportSize({width:viewport.height,height:viewport.width});
  await page.goto('/');
  await page.evaluate(async()=>{
    const source=await(await fetch('/src/App.jsx')).text();const url=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(source)[1];
    const {AudioEngine}=await import(url);const audioSource=await(await fetch(url)).text();
    window.testTone=await import(/import\s+\*\s+as\s+Tone\s+from\s+["']([^"']+)["']/.exec(audioSource)[1]);
    const original=AudioEngine.prototype.initialize;
    AudioEngine.prototype.initialize=async function(){await original.call(this);window.audioEngine=this;};
  });
  await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
}
async function visibility(page,hidden) {
  await page.evaluate(hidden=>{Object.defineProperty(document,'hidden',{configurable:true,value:hidden});document.dispatchEvent(new Event('visibilitychange'));},hidden);
}

test('background cycles clear stale notes and restart active parts on a shared downbeat',async({page})=>{
  await start(page);
  await page.locator('#instrument-piano').click();await page.locator('#instrument-ukulele').click();await page.locator('#instrument-drums').click();
  await page.evaluate(()=>{window.audioEngine.setTempo(130);window.audioEngine.setMetronomeSound(true);});
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.pendingEvents.size)).toBeGreaterThan(0);
  for(let cycle=0;cycle<3;cycle++){
    await visibility(page,true);
    expect(await page.evaluate(()=>({background:window.audioEngine.backgrounded,pending:window.audioEngine.pendingEvents.size,state:window.testTone.Transport.state,bar:window.audioEngine.barIndex}))).toEqual({background:true,pending:0,state:'stopped',bar:0});
    await page.evaluate(()=>{
      window.downbeats=[];const engine=window.audioEngine;
      if(!window.originalPlay)window.originalPlay=engine.playEvent;
      engine.playEvent=function(name,event,time){if(event.time==='0:0:0')window.downbeats.push({name,time,bar:this.barIndex});return window.originalPlay.call(this,name,event,time);};
    });
    await visibility(page,false);
    await expect.poll(()=>page.evaluate(()=>window.downbeats.length)).toBeGreaterThanOrEqual(3);
    const beats=await page.evaluate(()=>window.downbeats.slice(0,3));
    expect(new Set(beats.map(value=>value.name)).size).toBe(3);expect(new Set(beats.map(value=>value.time)).size).toBe(1);expect(beats.every(value=>value.bar===1)).toBe(true);
    expect(await page.evaluate(()=>({tempo:window.audioEngine.tempo,sound:window.audioEngine.metronomeSound,active:['piano','ukulele','drums'].every(name=>window.audioEngine.active[name])}))).toEqual({tempo:130,sound:true,active:true});
  }
});

test('audio-context suspension and pagehide recover without duplicate schedules',async({page})=>{
  await start(page);await page.locator('#instrument-drums').click();
  const id=await page.evaluate(()=>window.audioEngine.transportEvent);
  await page.evaluate(()=>window.testTone.getContext().rawContext.suspend());
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.backgrounded)).toBe(true);
  await page.evaluate(()=>window.testTone.getContext().rawContext.resume());
  await expect.poll(()=>page.evaluate(()=>window.testTone.Transport.state)).toBe('started');
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  expect(await page.evaluate(()=>window.audioEngine.backgrounded)).toBe(true);
  await page.evaluate(()=>{window.dispatchEvent(new Event('pageshow'));window.dispatchEvent(new Event('focus'));});
  await expect.poll(()=>page.evaluate(()=>window.testTone.Transport.state)).toBe('started');
  expect(await page.evaluate(()=>window.audioEngine.transportEvent)).toBe(id);
});

test('trumpet loses all held owners on blur and background so stale motion and valves cannot restart it',async({page})=>{
  await start(page);await page.locator('#instrument-melody').focus();await page.keyboard.press('e');
  const session=await page.context().newCDPSession(page);
  const area=await page.getByRole('slider',{name:'Trumpet embouchure'}).boundingBox();
  const lip={id:1,x:area.x+area.width*.25,y:area.y+area.height/2};
  const valve=await page.getByRole('button',{name:'Trumpet valve 1',exact:true}).boundingBox();
  const finger={id:2,x:valve.x+valve.width/2,y:valve.y+valve.height/2};
  for(const interruption of ['blur','hidden','context']) {
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[lip,finger]});
    expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(1);
    if(interruption==='blur')await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    if(interruption==='hidden')await visibility(page,true);
    if(interruption==='context')await page.evaluate(()=>window.testTone.getContext().rawContext.suspend());
    await expect.poll(()=>page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
    await expect(page.locator('.valve-control.pressed')).toHaveCount(0);await expect(page.locator('.lip-indicator')).toHaveCount(0);
    if(interruption==='hidden')await visibility(page,false);
    if(interruption==='context')await page.evaluate(()=>window.testTone.getContext().rawContext.resume());
    await expect.poll(()=>page.evaluate(()=>window.testTone.Transport.state)).toBe('started');
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...lip,x:lip.x+10},finger]});
    expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
    await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
    await page.getByRole('button',{name:'Trumpet valve 2',exact:true}).focus();await page.keyboard.press('Space');
    expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  }
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[lip]});
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(1);
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
});

test('trumpet window-level pointer release and lost mouse button stop a missed local release',async({page})=>{
  await start(page);await page.locator('#instrument-melody').focus();await page.keyboard.press('e');
  const area=await page.getByRole('slider',{name:'Trumpet embouchure'}).boundingBox();
  for(const event of ['pointerup','pointermove']) {
    await page.mouse.move(area.x+area.width/4,area.y+area.height/2);await page.mouse.down();
    expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(1);
    await page.evaluate(event=>window.dispatchEvent(new PointerEvent(event,{pointerId:1,pointerType:'mouse',buttons:0})),event);
    expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
    await page.mouse.up();
  }
});

test('a manual wake gesture is retained while held but canceled if released before recovery',async({page})=>{
  await start(page);await page.locator('#instrument-piano').focus();await page.keyboard.press('e');
  async function delayResume() {
    await page.evaluate(()=>{
      const engine=window.audioEngine;
      engine.suspendPlayback();
      const original=engine.resumePlayback.bind(engine);
      const gate=new Promise(resolve=>window.finishResume=resolve);
      engine.resumePlayback=()=>gate.then(()=>original());
      window.restoreResume=()=>{engine.resumePlayback=original;};
    });
  }
  const key=page.getByRole('button',{name:'Piano key C4',exact:true});
  await delayResume();await key.focus();await page.keyboard.down('Space');
  expect(await page.evaluate(()=>window.audioEngine.pendingManualNotes.size)).toBe(1);
  await page.keyboard.up('Space');expect(await page.evaluate(()=>window.audioEngine.pendingManualNotes.size)).toBe(0);
  await page.evaluate(()=>window.finishResume());await expect.poll(()=>page.evaluate(()=>window.audioEngine.backgrounded)).toBe(false);
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  await page.evaluate(()=>window.restoreResume());
  await delayResume();await key.focus();await page.keyboard.down('Space');await page.evaluate(()=>window.finishResume());
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(1);
  await page.keyboard.up('Space');expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  await page.evaluate(()=>window.restoreResume());
});

test('sound help stays available with running audio and retries blocked audio through the real output',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await start(page);
  const button=page.locator('.sound-help-corner');
  await expect(button).toHaveAttribute('data-attention','false');
  await button.click();
  const help=page.getByRole('dialog',{name:'Sound help',exact:true});
  await expect(help).toContainText('cannot check your phone');
  await expect(help).toContainText('Silent mode');
  await page.keyboard.press('Escape');await expect(button).toBeFocused();
  await page.evaluate(async()=>{
    const context=window.testTone.getContext().rawContext;
    window.nativeResume=context.resume.bind(context);
    await context.suspend();
    context.resume=()=>Promise.reject(new Error('Gesture required'));
  });
  await expect(button).toHaveAttribute('data-attention','true');
  await button.click();await expect(help).toContainText('browser has paused or blocked audio');
  await help.getByRole('button',{name:'Retry and test sound',exact:true}).click();
  await expect(help).toContainText('Sound is still blocked');
  await page.evaluate(()=>{
    const context=window.testTone.getContext().rawContext;
    context.resume=window.nativeResume;
    const analyser=context.createAnalyser();analyser.fftSize=1024;
    window.audioEngine.limiter.connect(analyser);
    const samples=new Float32Array(analyser.fftSize);window.testNotePeak=0;
    window.observeTestNote=new Promise(resolve=>{
      const end=performance.now()+1500;
      function sample(){analyser.getFloatTimeDomainData(samples);for(const value of samples)window.testNotePeak=Math.max(window.testNotePeak,Math.abs(value));if(performance.now()<end)requestAnimationFrame(sample);else{window.audioEngine.limiter.disconnect(analyser);analyser.disconnect();resolve();}}
      sample();
    });
  });
  await help.getByRole('button',{name:'Retry and test sound',exact:true}).click();
  await expect(help).toContainText('A quiet test note was sent');
  await page.evaluate(()=>window.observeTestNote);
  expect(await page.evaluate(()=>window.testNotePeak)).toBeGreaterThan(.0001);
  await expect(button).toHaveAttribute('data-attention','false');
  await page.screenshot({path:testInfo.outputPath('sound-help.png')});
  await help.getByRole('button',{name:'Back',exact:true}).click();
  await doubleActivate(page.getByRole('button',{name:'Open settings',exact:true}),testInfo);
  await page.getByRole('slider',{name:'Piano volume',exact:true}).fill('-18');
  await page.getByRole('slider',{name:'Scenery sounds volume',exact:true}).fill('-60');
  await page.getByRole('button',{name:'Close settings',exact:true}).click();
  await button.click();await help.getByRole('button',{name:'Restore sound levels',exact:true}).click();
  expect(await page.evaluate(()=>({piano:window.audioEngine.volumes.piano,scenery:window.audioEngine.sceneVolume}))).toEqual({piano:-9,scenery:-4});
  await help.getByRole('button',{name:'Open Sound settings',exact:true}).click();
  await expect(page.getByRole('tab',{name:'Sound',exact:true})).toHaveAttribute('aria-selected','true');
  await expect(page.getByRole('slider',{name:'Scenery sounds volume',exact:true})).toHaveValue('-4');
  await page.getByRole('slider',{name:'Scenery sounds volume',exact:true}).fill('-60');
  await page.getByRole('button',{name:'Return to main menu',exact:true}).click();
  await page.getByRole('button',{name:'Tap to play',exact:true}).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  await doubleActivate(page.getByRole('button',{name:'Open settings',exact:true}),testInfo);
  await expect(page.getByRole('slider',{name:'Scenery sounds volume',exact:true})).toHaveValue('-4');
  expect(await page.evaluate(()=>window.audioEngine.sceneVolume)).toBe(-4);
  expect(errors).toEqual([]);
});

test('playback session is requested before unlock and interruption help is reachable from practice',async({page},testInfo)=>{
  await page.addInitScript(()=>{
    const session=Object.assign(new EventTarget(),{type:'auto',state:'active'});
    Object.defineProperty(navigator,'audioSession',{configurable:true,value:session});
    window.testAudioSession=session;
    window.resumeSessionTypes=[];
    const resume=AudioContext.prototype.resume;
    AudioContext.prototype.resume=function(...args){window.resumeSessionTypes.push(session.type);return resume.apply(this,args);};
  });
  await start(page);
  const sessionTypes=await page.evaluate(()=>window.resumeSessionTypes);
  expect(sessionTypes.length).toBeGreaterThan(0);
  expect(sessionTypes.every(type=>type==='playback')).toBe(true);
  await page.locator('#young-musician').focus();await page.keyboard.press('Enter');
  const practice=page.getByRole('dialog',{name:'Farm practice room',exact:true});
  await expect(practice).toBeVisible();
  await page.evaluate(()=>{window.testAudioSession.state='interrupted';window.testAudioSession.dispatchEvent(new Event('statechange'));});
  const button=practice.getByRole('button',{name:/Sound needs attention/});
  await expect(button).toBeVisible();await button.click();
  const help=page.getByRole('dialog',{name:'Sound help',exact:true});
  await expect(help).toContainText('phone call has interrupted audio');
  await page.screenshot({path:testInfo.outputPath('practice-sound-help.png')});
  await page.evaluate(()=>{window.testAudioSession.state='active';window.testAudioSession.dispatchEvent(new Event('statechange'));});
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.audioStatus)).toBe('running');
  await page.keyboard.press('Escape');await expect(practice).toBeVisible();
  await expect(practice.locator('.sound-help-button')).toBeFocused();
});

test('a browser unlock that never settles returns to a retryable menu with sound help',async({page})=>{
  const size=page.viewportSize();if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});
  await page.goto('/');
  await page.evaluate(()=>{
    const resume=AudioContext.prototype.resume;
    window.restoreNativeResume=()=>{AudioContext.prototype.resume=resume;};
    AudioContext.prototype.resume=()=>new Promise(()=>{});
  });
  await page.getByRole('button',{name:'Tap to play',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('speaker symbol',{timeout:10000});
  await expect(page.getByRole('button',{name:'Tap to play',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:/Sound needs attention/}).click();
  const help=page.getByRole('dialog',{name:'Sound help',exact:true});
  await expect(help).toContainText('Silent mode');
  await help.getByRole('button',{name:'Back',exact:true}).click();
  await page.evaluate(()=>window.restoreNativeResume());
  await page.getByRole('button',{name:'Tap to play',exact:true}).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  await expect(page.locator('.sound-help-corner')).toHaveAttribute('data-attention','false');
});
