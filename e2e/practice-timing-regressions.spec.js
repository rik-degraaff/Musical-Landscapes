import {test,expect,waitForInstrumentSettling} from './fixtures.js';

async function startPractice(page){
  const size=page.viewportSize();
  if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});
  await page.goto('/');
  await page.evaluate(async()=>{
    const source=await(await fetch('/src/App.jsx')).text();
    const url=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(source)[1];
    const {AudioEngine}=await import(url);
    const audioSource=await(await fetch(url)).text();
    const toneUrl=/import\s+\*\s+as\s+Tone\s+from\s+["']([^"']+)["']/.exec(audioSource)[1];
    window.testTone=await import(toneUrl);
    const initialize=AudioEngine.prototype.initialize;
    AudioEngine.prototype.initialize=async function(){await initialize.call(this);window.audioEngine=this;};
  });
  await page.getByRole('button',{name:'Tap to play',exact:true}).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  await waitForInstrumentSettling(page);
  await page.locator('#young-musician').focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog',{name:'Farm practice room'})).toBeVisible();
}

test('practice tempo changes preserve a live run, its partners, and idle transport ownership',async({page})=>{
  await startPractice(page);
  await page.getByRole('button',{name:'Open metronome'}).click();
  const weight=page.getByRole('slider',{name:'Metronome tempo weight'});
  await weight.focus();await page.keyboard.press('End');
  expect(await page.evaluate(()=>window.testTone.Transport.state)).toBe('stopped');
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'4. Together',exact:true}).click();
  await page.getByRole('button',{name:'Start repeating',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.practiceTicks())).toBeGreaterThan(192*4);
  await page.evaluate(()=>{window.originalPracticeRun=window.audioEngine.practiceRun;});
  await page.getByRole('button',{name:'Open metronome'}).click();
  await weight.focus();await page.keyboard.down('ArrowUp');
  expect(await page.evaluate(()=>({held:window.audioEngine.tempoHeld,state:window.testTone.Transport.state}))).toEqual({held:true,state:'paused'});
  await page.keyboard.up('ArrowUp');
  await expect.poll(()=>page.evaluate(()=>window.testTone.Transport.state)).toBe('started');
  const resumedAt=await page.evaluate(()=>window.audioEngine.practiceTicks());
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.practiceTicks())).toBeGreaterThan(resumedAt+96);
  const state=await page.evaluate(()=>{
    const engine=window.audioEngine;
    return {sameRun:engine.practiceRun===window.originalPracticeRun,held:engine.tempoHeld,barIndex:engine.barIndex,
      partners:engine.practiceRun.partners.map(name=>({name,level:engine.nodes[name].gain.volume.value,expected:engine.volumes[name]-6}))};
  });
  expect(state.sameRun).toBe(true);expect(state.held).toBe(false);expect(state.barIndex).toBe(0);
  for(const partner of state.partners)expect(partner.level).toBeCloseTo(partner.expected,4);
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Stop practice',exact:true}).click();
  await page.getByRole('button',{name:'Open metronome'}).click();
  await weight.focus();await page.keyboard.press('ArrowDown');
  expect(await page.evaluate(()=>({state:window.testTone.Transport.state,run:window.audioEngine.practiceRun}))).toEqual({state:'stopped',run:null});
});

test('holding tempo before a scheduled practice start preserves one complete count-in',async({page})=>{
  await startPractice(page);
  const held=await page.evaluate(()=>{
    const engine=window.audioEngine,Tone=window.testTone;
    engine.setTempo(208);window.countInBeats=[];
    engine.startPracticeRun({events:[]},false,undefined,undefined,(beat,_cycle,countIn)=>{if(countIn)window.countInBeats.push(beat);});
    window.scheduledPracticeStart=engine.practiceRun.startTime;
    engine.holdTempo(true);
    return {waiting:engine.practiceRun.waitingForStart,state:Tone.Transport.state};
  });
  expect(held).toEqual({waiting:true,state:'stopped'});
  await expect.poll(()=>page.evaluate(()=>window.testTone.immediate()-window.scheduledPracticeStart)).toBeGreaterThan(.15);
  expect(await page.evaluate(()=>({ticks:window.audioEngine.practiceTicks(),beats:window.countInBeats}))).toEqual({ticks:0,beats:[]});
  await page.evaluate(()=>window.audioEngine.holdTempo(false));
  await expect.poll(()=>page.evaluate(()=>window.countInBeats)).toEqual([0,1,2,3]);
  await page.evaluate(()=>window.audioEngine.stopPracticeRun());
});

test('fast practice accepts a late note within the timing window using the current audio clock',async({page})=>{
  await startPractice(page);
  await page.getByRole('button',{name:'3. Rhythm',exact:true}).click();
  await page.evaluate(()=>{
    const engine=window.audioEngine;engine.setTempo(208);
    const start=engine.startPracticeRun;
    engine.startPracticeRun=function(phrase,...args){
      const session=start.call(this,phrase,...args);
      window.timingExercise={session,first:phrase.events[0]};return session;
    };
    const capture=engine.onPracticeInput;
    engine.onPracticeInput=input=>{window.lastPracticeInput=input;capture(input);};
  });
  await page.getByRole('button',{name:'Start repeating',exact:true}).click();
  const timing=await page.evaluate(async()=>{
    const {session,first}=window.timingExercise,engine=window.audioEngine,Tone=window.testTone;
    const target=session.startTick+session.beatTicks*.3;
    await new Promise((resolve,reject)=>{
      const deadline=performance.now()+7000;
      function wait(){
        if(performance.now()>deadline){reject(new Error('Practice did not reach its first note'));return;}
        if(engine.practiceTicks()<target){requestAnimationFrame(wait);return;}
        resolve();
      }wait();
    });
    for(const note of first.notes??[first.note]){engine.manualNoteOn(note,`late-${note}`);engine.manualNoteOff(`late-${note}`);}
    const input=window.lastPracticeInput;
    return {actualBeat:(input.ticks-session.startTick)/session.beatTicks,
      clockError:input.ticks-Tone.Transport.getTicksAtTime(input.time),lookahead:Tone.getContext().lookAhead};
  });
  expect(timing.lookahead).toBeGreaterThanOrEqual(.09);
  expect(timing.actualBeat).toBeGreaterThanOrEqual(.3);expect(timing.actualBeat).toBeLessThan(.5);
  expect(timing.clockError).toBeCloseTo(0,8);
  await expect(page.locator('.practice-feedback-display')).toHaveAttribute('data-tone','correct');
  await expect(page.locator('.practice-phrase-track span').first()).toHaveClass(/is-complete/);
});

test('restarting practice ignores previous transport ticks before the new count-in',async({page})=>{
  await startPractice(page);
  await page.getByRole('button',{name:'3. Rhythm',exact:true}).click();
  await page.evaluate(()=>{
    const engine=window.audioEngine;engine.setTempo(208);
    const start=engine.startPracticeRun;
    engine.startPracticeRun=function(...args){window.repeatExercise=args;return start.apply(this,args);};
    const capture=engine.onPracticeInput;
    engine.onPracticeInput=input=>{window.lastRestartInput=input;capture(input);};
  });
  await page.getByRole('button',{name:'Start repeating',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.practiceTicks())).toBeGreaterThan(192*8);
  const restart=await page.evaluate(()=>{
    const engine=window.audioEngine,Tone=window.testTone;
    const feedbackBefore=document.querySelector('.practice-feedback-display').textContent;
    const session=engine.startPracticeRun(...window.repeatExercise);
    const time=Tone.immediate(),oldTicks=Tone.Transport.getTicksAtTime(time);
    engine.manualNoteOn('C4','before-new-count-in');engine.manualNoteOff('before-new-count-in');
    return {beforeStart:time<engine.practiceRun.startTime,oldTicks,startTick:session.startTick,
      ticks:engine.practiceTicks(time),inputTicks:window.lastRestartInput.ticks,feedbackBefore};
  });
  expect(restart.beforeStart).toBe(true);expect(restart.oldTicks).toBeGreaterThan(restart.startTick);
  expect(restart.ticks).toBe(0);expect(restart.inputTicks).toBe(0);
  await expect(page.locator('.practice-feedback-display')).toHaveText(restart.feedbackBefore);
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.practiceTicks())).toBeGreaterThan(96);
});
