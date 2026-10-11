import {test,expect} from './fixtures.js';

async function start(page) {
  const size=page.viewportSize();if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});
  await page.goto('/');
  await page.evaluate(async()=>{
    const app=await(await fetch('/src/App.jsx')).text();
    const url=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(app)[1];
    const {AudioEngine}=await import(url);
    const source=await(await fetch(url)).text();
    window.testTone=await import(/import\s+\*\s+as\s+Tone\s+from\s+["']([^"']+)["']/.exec(source)[1]);
    const initialize=AudioEngine.prototype.initialize;
    AudioEngine.prototype.initialize=async function(){await initialize.call(this);window.audioEngine=this;};
  });
  await page.getByRole('button',{name:'Tap to play'}).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  await page.evaluate(()=>{
    const engine=window.audioEngine;
    const context=window.testTone.getContext().rawContext;
    const records=new WeakMap();
    window.cleanupSources=[];
    const prototype=Object.getPrototypeOf(context);
    const create=prototype.createBufferSource;
    prototype.createBufferSource=function(...args){
      const source=create.apply(this,args);
      const record={manual:false,endedAt:null,callbackAt:null};
      records.set(source,record);
      source.addEventListener('ended',()=>{record.endedAt=this.currentTime;});
      return source;
    };
    const noteOn=engine.manualNoteOn;
    engine.manualNoteOn=function(note,token,...args){
      const result=noteOn.call(this,note,token,...args);
      const voice=this.manualVoices.get(token);
      const record=voice&&records.get(voice.source);
      if(record&&!record.manual){
        Object.assign(record,{manual:true,note,token,name:voice.name});
        window.cleanupSources.push(record);
        const ended=voice.source.onended;
        voice.source.onended=function(event){record.callbackAt=context.currentTime;return ended.call(this,event);};
      }
      return result;
    };
    const analyser=context.createAnalyser();
    analyser.fftSize=2048;
    window.testTone.connect(engine.master,analyser);
    window.cleanupLevel=()=>{
      const samples=new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(samples);
      return {peak:Math.max(...samples.map(Math.abs)),rms:Math.sqrt(samples.reduce((sum,value)=>sum+value*value,0)/samples.length)};
    };
    window.waitAudio=seconds=>new Promise(resolve=>{
      const deadline=context.currentTime+seconds;
      function check(){if(context.currentTime>=deadline)resolve();else requestAnimationFrame(check);}
      check();
    });
  });
}

async function expectCleanup(page,deadline=.1) {
  const state=await page.evaluate(async deadline=>{
    await window.waitAudio(deadline);
    const engine=window.audioEngine;
    return {
      active:engine.manualVoices.size,pending:engine.pendingManualNotes.size,retiring:engine.retiringVoices.size,
      sources:window.cleanupSources.map(record=>({...record,elapsed:record.endedAt===null?null:record.endedAt-window.cleanupAt})),
    };
  },deadline);
  expect(state.active).toBe(0);expect(state.pending).toBe(0);expect(state.retiring).toBe(0);
  expect(state.sources.length).toBeGreaterThan(0);
  for(const source of state.sources){
    expect(source.endedAt,`${source.name} ${source.note}: native ended`).not.toBeNull();
    expect(source.callbackAt,`${source.name} ${source.note}: engine onended`).not.toBeNull();
    expect(source.elapsed).toBeLessThanOrEqual(deadline+.03);
  }
}

async function expectSilence(page) {
  const levels=await page.evaluate(async()=>{
    const remaining=window.cleanupAt+.4-window.testTone.getContext().rawContext.currentTime;
    if(remaining>0)await window.waitAudio(remaining);
    const levels=[window.cleanupLevel()];
    for(let sample=0;sample<3;sample++){await window.waitAudio(.05);levels.push(window.cleanupLevel());}
    return levels;
  });
  for(const level of levels){expect(level.rms).toBeLessThan(.001);expect(level.peak).toBeLessThan(.005);}
}

for(const name of ['panflute','melody']) {
  test(`${name}: rapid pitch and owner changes end every native loop after repeated stop`,async({page})=>{
    await start(page);
    await page.evaluate(name=>{
      const engine=window.audioEngine;
      engine.setManualInstrument(name);
      for(let index=0;index<32;index++)engine.manualNoteOn(['C5','D5','E5','G5'][index%4],`wind-${index%3}`,.8,true);
    },name);
    await expect.poll(()=>page.evaluate(()=>window.cleanupLevel().rms)).toBeGreaterThan(.001);
    expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(1);
    await page.evaluate(()=>{
      window.cleanupAt=window.testTone.getContext().rawContext.currentTime;
      for(let repeat=0;repeat<4;repeat++)window.audioEngine.stopManualVoices();
      window.audioEngine.manualNoteOff('missing-owner');
    });
    await expectCleanup(page);
    await expectSilence(page);
  });
}

test('piano: hard stop shortens an already retiring long release to 80ms',async({page})=>{
  await start(page);
  const retiring=await page.evaluate(async()=>{
    const engine=window.audioEngine;
    engine.setManualInstrument('piano');
    engine.manualNoteOn('C4','piano-tail',.9);
    await window.waitAudio(.06);
    engine.manualNoteOff('piano-tail');
    return {active:engine.manualVoices.size,retiring:engine.retiringVoices.size,ended:window.cleanupSources[0].endedAt};
  });
  expect(retiring).toEqual({active:0,retiring:1,ended:null});
  await page.evaluate(()=>{
    window.cleanupAt=window.testTone.getContext().rawContext.currentTime;
    window.audioEngine.stopManualVoices();window.audioEngine.stopManualVoices();
  });
  await expectCleanup(page,.08);
  await expectSilence(page);
});

for(const mode of ['missing','throws']) {
  test(`release fallback: ${mode} cancelAndHoldAtTime still ends native sources`,async({page})=>{
    await start(page);
    const state=await page.evaluate(async mode=>{
      const engine=window.audioEngine;
      engine.setManualInstrument('piano');
      engine.manualNoteOn('C4','fallback-tail',.8);
      engine.manualNoteOn('E4','fallback-held',.8);
      await window.waitAudio(.04);
      for(const voice of engine.manualVoices.values())Object.defineProperty(voice.envelope.gain,'cancelAndHoldAtTime',{
        configurable:true,value:mode==='missing'?undefined:()=>{throw new Error('Unsupported cancelAndHoldAtTime');},
      });
      engine.manualNoteOff('fallback-tail');
      const retiring=engine.retiringVoices.size;
      window.cleanupAt=window.testTone.getContext().rawContext.currentTime;
      engine.stopManualVoices();engine.stopManualVoices();
      return {retiring};
    },mode);
    expect(state.retiring).toBe(1);
    await expectCleanup(page);
    await expectSilence(page);
  });
}

test('same-owner piano pitch replacement preserves another touch and its native source',async({page})=>{
  await start(page);
  const result=await page.evaluate(async()=>{
    const engine=window.audioEngine;
    engine.setManualInstrument('piano');
    engine.manualNoteOn('C4','left',.8);engine.manualNoteOn('E4','right',.8);
    const right=engine.manualVoices.get('right').source;
    window.cleanupAt=window.testTone.getContext().rawContext.currentTime;
    engine.manualNoteOn('D4','left',.8);
    await window.waitAudio(.1);
    return {
      voices:[...engine.manualVoices].map(([token,voice])=>({token,note:voice.note})).sort((first,second)=>first.token.localeCompare(second.token)),
      sameRight:engine.manualVoices.get('right').source===right,
      sources:window.cleanupSources.map(record=>({...record})),retiring:engine.retiringVoices.size,
    };
  });
  expect(result.voices).toEqual([{token:'left',note:'D4'},{token:'right',note:'E4'}]);
  expect(result.sameRight).toBe(true);expect(result.retiring).toBe(0);
  expect(result.sources.find(source=>source.note==='C4').endedAt).not.toBeNull();
  for(const note of ['D4','E4'])expect(result.sources.find(source=>source.note===note).endedAt).toBeNull();
  await page.evaluate(()=>{window.cleanupAt=window.testTone.getContext().rawContext.currentTime;window.audioEngine.stopManualVoices();});
  await expectCleanup(page);
});

test('sampler note-set changes release the previous notes before replacement attacks at the supplied timestamp',async({page})=>{
  await start(page);
  const result=await page.evaluate(()=>{
    const engine=window.audioEngine;
    const sampler=engine.nodes.piano.synth;
    const calls=[];
    const release=sampler.releaseAll;const attack=sampler.triggerAttackRelease;
    sampler.releaseAll=function(time){calls.push({type:'release',time});return release.call(this,time);};
    sampler.triggerAttackRelease=function(note,duration,time,velocity){calls.push({type:'attack',note,time});return attack.call(this,note,duration,time,velocity);};
    const first=window.testTone.immediate()+.02;
    const replacement=first+.12;
    engine.playEvent('piano',{notes:['C4','E4'],dur:'1m'},first);
    calls.length=0;
    engine.playEvent('piano',{notes:['D4','F4'],dur:'1m'},replacement);
    const changed=calls.slice();calls.length=0;
    engine.playEvent('piano',{notes:['F4','D4'],dur:'8n'},replacement+.12);
    return {changed,unchanged:calls,replacement};
  });
  expect(result.changed.map(call=>call.type)).toEqual(['release','attack','attack']);
  expect(result.changed.map(call=>call.time)).toEqual([result.replacement,result.replacement,result.replacement]);
  expect(result.changed.slice(1).map(call=>call.note)).toEqual(['D4','F4']);
  expect(result.unchanged.map(call=>call.type)).toEqual(['attack','attack']);
});

test('scene-key change cancels pending events for every instrument and all old manual pitches',async({page})=>{
  await start(page);
  const result=await page.evaluate(async()=>{
    const engine=window.audioEngine;
    engine.setManualInstrument('panflute');engine.manualNoteOn('C5','old-key',.8);
    await window.waitAudio(.06);
    const releases=[];window.staleEvents=[];
    for(const [name,node] of Object.entries(engine.nodes)){
      const release=node.synth.releaseAll;
      node.synth.releaseAll=function(...args){releases.push(name);return release.apply(this,args);};
      const id=window.testTone.Transport.scheduleOnce(()=>window.staleEvents.push(name),'+0.2');
      engine.pendingEvents.set(id,name);
    }
    window.cleanupAt=window.testTone.getContext().rawContext.currentTime;
    engine.setSceneKey('G');
    return {pending:engine.pendingEvents.size,releases:[...new Set(releases)].sort(),names:Object.keys(engine.nodes).sort(),root:engine.root};
  });
  expect(result.pending).toBe(0);expect(result.releases).toEqual(result.names);expect(result.root).toBe('G');
  await expectCleanup(page);await expectSilence(page);
  expect(await page.evaluate(()=>window.staleEvents)).toEqual([]);
});

for(const cleanup of ['stop','scene-key'])test(`${cleanup} discards a queued manual wake note before deferred resume completes`,async({page})=>{
  await start(page);
  const queued=await page.evaluate(cleanup=>{
    const engine=window.audioEngine;
    engine.setManualInstrument('panflute');engine.suspendPlayback();
    const resume=engine.resumePlayback.bind(engine);
    const gate=new Promise(resolve=>window.finishCleanupResume=resolve);
    engine.resumePlayback=()=>gate.then(resume);
    engine.manualNoteOn('C5','queued-old-key',.8);
    const queued=engine.pendingManualNotes.size;
    if(cleanup==='scene-key')engine.setSceneKey('G');else {engine.stopManualVoices();engine.stopManualVoices();}
    return {queued,pending:engine.pendingManualNotes.size};
  },cleanup);
  expect(queued).toEqual({queued:1,pending:0});
  await page.evaluate(()=>window.finishCleanupResume());
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.backgrounded)).toBe(false);
  expect(await page.evaluate(()=>({active:window.audioEngine.manualVoices.size,retiring:window.audioEngine.retiringVoices.size,sources:window.cleanupSources.length}))).toEqual({active:0,retiring:0,sources:0});
});

for(const name of ['guitar','ukulele']) {
  test(`${name}: switching a held chord shape cancels previously sounding strings`,async({page})=>{
    await start(page);
    if(name==='guitar'){
      await page.getByRole('button',{name:'Open settings'}).dblclick();await page.getByRole('tab',{name:'Instruments',exact:true}).click();
      await page.getByRole('combobox',{name:'Instrument slot 3',exact:true}).selectOption('guitar');await page.getByRole('button',{name:'Close settings',exact:true}).click();
    }
    await page.locator(`#instrument-${name}`).focus();await page.keyboard.press('e');
    const chords=page.getByRole('button',{name:new RegExp(`^Hold ${name} chord `)});
    expect(await chords.count()).toBeGreaterThanOrEqual(2);
    const session=await page.context().newCDPSession(page);
    const first=await chords.nth(0).boundingBox();const second=await chords.nth(1).boundingBox();
    const firstTouch={id:1,x:first.x+first.width/2,y:first.y+first.height/2};
    const secondTouch={id:2,x:second.x+second.width/2,y:second.y+second.height/2};
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[firstTouch]});
    const strings=page.locator('.playable-string');
    await strings.nth(0).focus();await page.keyboard.press('Enter');
    await strings.nth(1).focus();await page.keyboard.press('Enter');
    expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(2);
    await page.evaluate(()=>{window.cleanupAt=window.testTone.getContext().rawContext.currentTime;});
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[firstTouch,secondTouch]});
    await expectCleanup(page);await expectSilence(page);
    await strings.nth(0).focus();await page.keyboard.press('Enter');
    const label=await strings.nth(0).getAttribute('aria-label');
    expect(await page.evaluate(()=>[...window.audioEngine.manualVoices.values()].map(voice=>voice.note))).toEqual([label.split(' ').at(-1)]);
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.evaluate(()=>window.audioEngine.stopManualVoices());
  });
}

test('input reset clears swipe ownership so old pointer motion cannot restart notes',async({page})=>{
  await start(page);await page.locator('#instrument-piano').focus();await page.keyboard.press('e');
  const first=await page.getByRole('button',{name:'Piano key C4',exact:true}).boundingBox();
  const second=await page.getByRole('button',{name:'Piano key D4',exact:true}).boundingBox();
  await page.mouse.move(first.x+first.width/2,first.y+first.height*.8);await page.mouse.down();
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(1);
  await page.evaluate(()=>{window.cleanupAt=window.testTone.getContext().rawContext.currentTime;window.dispatchEvent(new Event('farmjam-input-reset'));window.audioEngine.stopManualVoices();});
  await page.mouse.move(second.x+second.width/2,second.y+second.height*.8);
  await expectCleanup(page);await expect(page.locator('.swipe-pressed')).toHaveCount(0);await page.mouse.up();
  await page.mouse.down();expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(1);await page.mouse.up();
});

test('lost mouse button clears a held swipe without a local pointer-up event',async({page})=>{
  await start(page);await page.locator('#instrument-panflute').focus();await page.keyboard.press('e');
  const pipe=await page.getByRole('button',{name:'Pan flute pipe C4',exact:true}).boundingBox();
  await page.mouse.move(pipe.x+pipe.width/2,pipe.y+pipe.height*.8);await page.mouse.down();
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(1);
  await page.evaluate(()=>{window.cleanupAt=window.testTone.getContext().rawContext.currentTime;window.dispatchEvent(new PointerEvent('pointermove',{pointerId:1,pointerType:'mouse',buttons:0,clientX:10,clientY:10}));});
  await expectCleanup(page,.3);await expect(page.locator('.swipe-pressed')).toHaveCount(0);await page.mouse.up();
});