import { test, expect } from './fixtures.js';

async function start(page) {
  await page.goto('/');
  await page.evaluate(async()=>{
    const text=await(await fetch('/src/App.jsx')).text();
    const url=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(text)[1];
    const {AudioEngine}=await import(url);
    const source=await(await fetch(url)).text();
    window.testTone=await import(/import\s+\*\s+as\s+Tone\s+from\s+["']([^"']+)["']/.exec(source)[1]);
    const initialize=AudioEngine.prototype.initialize;
    AudioEngine.prototype.initialize=async function(){await initialize.call(this);window.audioEngine=this;};
  });
  await page.getByRole('button',{name:'Tap to play'}).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
}

for(const phase of ['middle','early','lookahead'])test(`scene key ${phase} transition preserves the shared clock and owns obsolete sources`,async({page})=>{
  await start(page);
  const result=await page.evaluate(async phase=>{
    const Tone=window.testTone;
    const {patterns,transposeEvents}=await import('/src/utils/music.js');
    const {beatOffset}=await import('/src/utils/practice.js');
    const engine=window.audioEngine;
    engine.clearPendingEvents();
    engine.setSceneKey('A');engine.setTempo(120);
    engine.active.piano=true;engine.active.drums=true;
    engine.nodes.piano.gain.volume.value=engine.volumes.piano;
    engine.nodes.drums.gain.volume.value=engine.volumes.drums;
    const phrase=patterns.piano.find(value=>value.events.some(event=>beatOffset(event.time)>=2));
    const select=engine.selectPhrase;
    engine.selectPhrase=function(name,...args){return name==='piano'?phrase:select.call(this,name,...args);};
    const attacks=[];const bars=[];
    let obsolete=[];
    const attack=engine.nodes.piano.synth.triggerAttackRelease;
    engine.nodes.piano.synth.triggerAttackRelease=function(note,duration,time,...args){attacks.push({note,time});return attack.call(this,note,duration,time,...args);};
    let change;
    const schedule=engine.scheduleBar;
    const changeKey=()=>{
      const pending=[...engine.pendingEvents.keys()];
      const index=engine.barIndex;const beat=engine.beatIndex;
      const boundary=bars[1]?.time??bars[0].time+2;
      obsolete=[...engine.nodes.piano.samplerVoices.voices].filter(entry=>entry.startTime>=boundary);
      engine.setSceneKey('E');engine.setSceneKey('Fm');
      change={time:Tone.immediate(),index,beat,indexAfter:engine.barIndex,beatAfter:engine.beatIndex,barRoot:engine.barRoot,preserved:pending.every(id=>engine.pendingEvents.has(id)),pendingBefore:pending.length};
    };
    const finished=new Promise(resolve=>{
      engine.scheduleBar=function(time){
        bars.push({time,index:this.barIndex,root:this.root});
        schedule.call(this,time);
        if(bars.length===1&&phase!=='lookahead')Tone.Draw.schedule(changeKey,time+(phase==='early'?.035:.55));
        if(bars.length===2){
          if(phase==='lookahead')changeKey();
          Tone.Draw.schedule(()=>resolve(),time+.1);
        }
      };
    });
    engine.ensureTransport();await finished;
    engine.selectPhrase=select;engine.scheduleBar=schedule;
    engine.nodes.piano.synth.triggerAttackRelease=attack;
    const expected=root=>transposeEvents(phrase.events,root).flatMap(event=>(event.notes??[event.note]).map(note=>({note,offset:beatOffset(event.time)*.5})));
    return {change,bars,attacks,old:expected('A'),next:expected('Fm'),drums:engine.active.drums,transport:Tone.Transport.state,obsolete:obsolete.map(entry=>({disposed:entry.source.disposed,tracked:engine.nodes.piano.samplerVoices.voices.has(entry),stopTime:entry.stopTime}))};
  },phase);
  expect(result.change.pendingBefore).toBeGreaterThan(0);
  expect(result.change.indexAfter).toBe(result.change.index);
  expect(result.change.beatAfter).toBe(result.change.beat);
  expect(result.drums).toBe(true);expect(result.transport).toBe('started');
  expect(result.bars[1].index).toBe(result.bars[0].index+1);
  expect(result.bars[1].time-result.bars[0].time).toBeCloseTo(2,5);
  const nextDownbeat=result.attacks.filter(attack=>Math.abs(attack.time-result.bars[1].time)<.001);
  if(phase==='lookahead'){
    expect(result.change.time).toBeLessThan(result.bars[1].time);
    expect(result.change.index).toBe(result.bars[1].index+1);
    expect(result.change.barRoot).toBe('Fm');
    expect(result.obsolete.length).toBeGreaterThan(0);
    expect(result.obsolete.every(entry=>entry.disposed&&!entry.tracked)).toBe(true);
    expect(nextDownbeat.slice(-result.next.filter(event=>event.offset===0).length).map(attack=>attack.note)).toEqual(result.next.filter(event=>event.offset===0).map(event=>event.note));
    return;
  }
  expect(nextDownbeat.map(attack=>attack.note)).toEqual(result.next.filter(event=>event.offset===0).map(event=>event.note));
  {
    expect(result.change.barRoot).toBe('A');expect(result.change.preserved).toBe(true);
    const remaining=result.attacks.filter(attack=>attack.time>result.change.time&&attack.time<result.bars[1].time);
    const elapsed=result.change.time-result.bars[0].time;
    expect(remaining.map(attack=>attack.note)).toEqual(result.old.filter(event=>event.offset>elapsed).map(event=>event.note));
    for(const event of result.old.filter(event=>event.offset>elapsed))expect(remaining.some(attack=>attack.note===event.note&&Math.abs(attack.time-result.bars[0].time-event.offset)<.001)).toBe(true);
  }
});

test('a visual scene transition keeps a held piano note and its surface until the next downbeat',async({page})=>{
  await start(page);await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('#instrument-piano').focus();await page.keyboard.press('e');
  await page.evaluate(()=>{window.audioEngine.setTempo(60);});
  await page.evaluate(()=>new Promise(resolve=>{
    const engine=window.audioEngine;const schedule=engine.scheduleBar;
    engine.scheduleBar=function(time){schedule.call(this,time);this.scheduleBar=schedule;window.testTone.Draw.schedule(resolve,time+.5);};
  }));
  const session=await page.context().newCDPSession(page);
  const key=page.getByRole('button',{name:'Piano key A4',exact:true});
  const bounds=await key.boundingBox();const held={id:1,x:bounds.x+bounds.width/2,y:bounds.y+bounds.height*.75};
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[held]});
  await expect(key).toHaveClass(/swipe-pressed/);
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(1);
  await page.evaluate(()=>{window.heldSceneVoice=[...window.audioEngine.manualVoices.values()][0];window.heldSceneKey=document.querySelector('[aria-label="Piano key A4"]');});
  await expect(page.locator('.celestial-control')).toHaveAttribute('data-settled','true');
  await page.getByRole('button',{name:'Change landscape'}).click();
  await expect(page.locator('.scene-garden')).toBeVisible();
  expect(await page.evaluate(()=>({root:window.audioEngine.root,audible:window.audioEngine.playbackRoot,held:[...window.audioEngine.manualVoices.values()].includes(window.heldSceneVoice),surface:window.heldSceneKey.isConnected}))).toEqual({root:'E',audible:'A',held:true,surface:true});
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.playbackRoot)).toBe('E');
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  expect(await page.evaluate(()=>window.heldSceneKey.isConnected)).toBe(false);
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();
});

test('a pickup crossing the next downbeat uses the new key',async({page})=>{
  await start(page);
  const result=await page.evaluate(async()=>{
    const Tone=window.testTone;
    const engine=window.audioEngine;
    engine.clearPendingEvents();engine.setTempo(120);
    engine.active.piano=true;engine.setSceneKey('A');
    let pickup;
    const play=engine.playEvent;
    engine.playEvent=function(name,event,time,root){if(name==='ukulele')pickup={event,time,root};return play.call(this,name,event,time,root);};
    const schedule=engine.scheduleBar;
    let bars=0;
    const finished=new Promise(resolve=>{
      engine.scheduleBar=function(time){
        schedule.call(this,time);
        if(++bars===1){
          Tone.Draw.schedule(()=>this.setSceneKey('E'),time+.55);
          Tone.Draw.schedule(()=>{this.setInstrumentActive('ukulele',true);resolve({boundary:time+2,pickup});},time+1.86);
        }
      };
    });
    engine.ensureTransport();return await finished;
  });
  expect(result.pickup.time).toBeGreaterThan(result.boundary);
  expect(result.pickup.root).toBe('E');
  expect(result.pickup.event.chord).toMatch(/^E|^F#m|^G#m|^A|^B|^C#m|^D#/);
});