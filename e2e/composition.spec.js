import {test,expect} from './fixtures.js';
import {noteMidi} from '../src/utils/autoplay.js';

async function start(page) {
  const viewport=page.viewportSize();
  if(viewport.height>viewport.width)await page.setViewportSize({width:viewport.height,height:viewport.width});
  await page.goto('/');
  await page.evaluate(async()=>{
    const source=await(await fetch('/src/App.jsx')).text();
    const url=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(source)[1];
    const {AudioEngine}=await import(url);
    const audioSource=await(await fetch(url)).text();
    window.testTone=await import(/import\s+\*\s+as\s+Tone\s+from\s+["']([^"']+)["']/.exec(audioSource)[1]);
    const initialize=AudioEngine.prototype.initialize;
    AudioEngine.prototype.initialize=async function(){await initialize.call(this);window.audioEngine=this;};
  });
  await page.getByRole('button',{name:'Tap to play'}).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  await page.evaluate(()=>{
    const engine=window.audioEngine;
    const publish=engine.onHarmonyChange;
    const play=engine.playEvent;
    window.compositionBars=[];window.compositionEvents=[];
    engine.onHarmonyChange=function(plan){
      if(plan===null)return publish?.call(this,plan);
      const scheduled=this.scheduledBars.get(plan.bar);
      window.compositionBars.push({plan,audibleRoot:this.playbackRoot,time:window.testTone.immediate(),scheduledTime:scheduled?.time,ownsPlan:scheduled?.plan===plan,active:Object.keys(this.active).filter(name=>this.active[name]),manual:this.manualInstrument});
      return publish?.call(this,plan);
    };
    engine.playEvent=function(name,event,time,root,scheduled){
      if(scheduled)window.compositionEvents.push({name,event,time,root,bar:scheduled.bar,ownsEvent:scheduled.plan.phrases[name]?.events.includes(event),chord:scheduled.plan.currentChord});
      return play.call(this,name,event,time,root,scheduled);
    };
    engine.setTempo(208);
  });
}

async function equip(page,name) {
  await page.locator(`#instrument-${name}`).focus();await page.keyboard.press('e');
  await expect(page.locator(`.performance-${name}`)).toBeVisible();
}

test('genre tone reaches the shared live graph and sampled brass stays gently bounded',async({page})=>{
  await start(page);
  await page.evaluate(()=>{
    const engine=window.audioEngine;
    for(const name of ['melody','piano','drums'])engine.setInstrumentActive(name,true);
    engine.setGenre('jazz');
  });
  await expect.poll(()=>page.evaluate(()=>{
    const plan=window.audioEngine.harmonyPlan;
    return plan?.genre==='jazz'&&plan.genreBlend===1;
  }),{timeout:20000}).toBe(true);
  await expect.poll(()=>page.evaluate(()=>{
    const engine=window.audioEngine;
    return Math.abs(engine.nodes.melody.tone.frequency.value-engine.harmonyPlan.movement.performance.melody.cutoff);
  })).toBeLessThan(1);
  const result=await page.evaluate(async()=>{
    const engine=window.audioEngine;
    const {COMPOSITION_STYLES}=await import('/src/data/compositionStyles.js');
    const buffer=engine.nodes.melody.buffers.C4.get();
    const measurements={};
    for(const genre of ['folk','jazz','rock']){
      const context=new OfflineAudioContext(1,buffer.sampleRate,buffer.sampleRate);
      const source=context.createBufferSource();source.buffer=buffer;
      const tone=context.createBiquadFilter();tone.type=engine.nodes.melody.tone.type;
      tone.Q.value=engine.nodes.melody.tone.Q.value;
      tone.gain.value=engine.nodes.melody.tone.gain.value;
      tone.frequency.value=COMPOSITION_STYLES[genre].performance.melody.cutoff;
      source.connect(tone);tone.connect(context.destination);source.start();
      const samples=(await context.startRendering()).getChannelData(0);
      let energy=0,edge=0,peak=0;
      for(let index=1;index<samples.length;index++){
        energy+=samples[index]**2;edge+=(samples[index]-samples[index-1])**2;peak=Math.max(peak,Math.abs(samples[index]));
      }
      measurements[genre]={rms:Math.sqrt(energy/samples.length),edge:edge/energy,peak};
    }
    return {measurements,gate:engine.harmonyPlan.movement.performance.melody.gate,drumsDry:engine.nodes.drums.tone===null};
  });
  const {folk,jazz,rock}=result.measurements;
  expect(folk.rms).toBeGreaterThan(.001);expect(jazz.rms).toBeGreaterThan(.001);
  expect(jazz.edge).toBeGreaterThan(folk.edge);
  expect(jazz.rms/folk.rms).toBeLessThan(1.35);
  expect(jazz.peak).toBeLessThan(.8);
  expect(rock.rms).toBeGreaterThan(.001);expect(rock.rms/folk.rms).toBeLessThan(1.35);
  expect(rock.peak).toBeLessThan(.8);
  expect(rock.edge).toBeGreaterThan(folk.edge);expect(rock.edge).toBeLessThan(jazz.edge);
  expect(result.gate).toBeGreaterThan(.68);expect(result.gate).toBeLessThan(.72);
  expect(result.drumsDry).toBe(true);
});

test('clouds cycle into gentle Rock, keep it across landscapes, and return to Folk',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.emulateMedia({reducedMotion:'reduce'});
  await start(page);
  await page.evaluate(()=>{for(const name of ['piano','ukulele','drums','melody'])window.audioEngine.setInstrumentActive(name,true);});
  const clouds=page.getByRole('button',{name:'Change music weather',exact:true});
  await clouds.focus();await page.keyboard.press('Enter');
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.genre)).toBe('jazz');
  await page.keyboard.press('Space');
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.genre)).toBe('rock');
  await expect.poll(()=>page.evaluate(()=>{
    const plan=window.audioEngine.harmonyPlan;
    return plan?.genre==='rock'&&plan.genreBlend===1;
  }),{timeout:20000}).toBe(true);
  await expect.poll(()=>page.evaluate(()=>{
    const engine=window.audioEngine;
    return Math.abs(engine.nodes.ukulele.tone.frequency.value-engine.harmonyPlan.movement.performance.ukulele.cutoff);
  })).toBeLessThan(1);
  await expect(clouds).toHaveAttribute('fill','rgb(248 204 166)');
  await page.screenshot({path:testInfo.outputPath('rock-landscape.png')});
  await page.locator('#young-musician').focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog',{name:'Farm practice room'})).toBeVisible();
  await page.getByRole('combobox',{name:'Practice instrument'}).selectOption('drums');
  const phrases=page.getByRole('combobox',{name:'Practice phrase'});
  const rockIndex=await phrases.locator('option').evaluateAll(options=>options.find(option=>option.textContent.startsWith('RockBackbeat'))?.value);
  expect(rockIndex).toBeDefined();await phrases.selectOption(rockIndex);
  await page.getByRole('button',{name:'Start repeating',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.practiceRun!==null)).toBe(true);
  await page.getByRole('button',{name:'Leave practice through the open door',exact:true}).click();
  await expect(page.locator('.practice-room')).toHaveCount(0);
  for(const scene of ['garden','pond','dusk','night','late-night','dawn','farm']){
    await page.getByRole('button',{name:'Change landscape',exact:true}).click();
    await expect(page.locator(`.scene-${scene}`)).toBeVisible();
    await expect(clouds).toHaveAttribute('fill','rgb(248 204 166)');
    expect(await page.evaluate(()=>window.audioEngine.genre)).toBe('rock');
  }
  await clouds.focus();await page.keyboard.press('Enter');
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.genre)).toBe('folk');
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.harmonyPlan?.genre),{timeout:10000}).toBe('folk');
  expect(errors).toEqual([]);
});

async function simple(page,name) {
  await page.getByRole('button',{name:'Open settings',exact:true}).dblclick();
  await page.getByRole('tab',{name:'Instruments',exact:true}).click();
  await page.getByRole('combobox',{name:'Configure instrument'}).selectOption(name);
  await page.getByRole('radio',{name:'Simple',exact:true}).check();
  await page.getByRole('button',{name:'Close settings',exact:true}).click();
}

function assertBars(records) {
  expect(records.length).toBeGreaterThan(1);
  for(const record of records){
    const {plan}=record;
    expect(record.ownsPlan).toBe(true);
    expect(record.audibleRoot).toBe(plan.root);
    expect(record.time).toBeGreaterThanOrEqual(record.scheduledTime);
    expect(Object.values(plan.roles).filter(role=>role==='accompaniment').length).toBeLessThanOrEqual(2);
    for(const name of record.active){
      const phrase=plan.phrases[name];
      expect(phrase).toBeDefined();expect(phrase.events.length).toBeGreaterThan(0);
      expect(phrase.role).toBe(plan.roles[name]);
      if(name==='drums')continue;
      expect(phrase.degree).toBe(plan.currentChord.degree);
      for(const event of phrase.events)for(const note of event.notes??[event.note])expect(plan.currentChord.tones).toContain(noteMidi(note)%12);
    }
  }
  for(let index=1;index<records.length;index++){
    const previous=records[index-1],current=records[index];
    if(current.plan.root!==previous.plan.root||current.manual!==previous.manual||JSON.stringify(current.active)!==JSON.stringify(previous.active))continue;
    expect(current.plan.bar).toBe(previous.plan.bar+1);
    expect(current.plan.currentChord).toEqual(previous.plan.nextChord);
  }
}

test('live all-instrument plans own audible events, cap accompaniment and carry next harmony across bars and keys',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await start(page);await equip(page,'piano');
  await page.evaluate(()=>{
    const engine=window.audioEngine;
    for(const name of Object.keys(engine.active))engine.setInstrumentActive(name,true);
    window.compositionBars=[];window.compositionEvents=[];
  });
  await expect.poll(()=>page.evaluate(()=>window.compositionBars.filter(record=>record.active.length===8&&Object.keys(record.plan.phrases).length===8).length),{timeout:20000}).toBeGreaterThanOrEqual(10);
  const initial=await page.evaluate(()=>({bars:window.compositionBars.filter(record=>record.active.length===8&&Object.keys(record.plan.phrases).length===8),events:window.compositionEvents}));
  assertBars(initial.bars);
  expect(initial.bars.every(record=>Object.values(record.plan.roles).filter(role=>role==='accompaniment').length===2)).toBe(true);
  expect(new Set(initial.events.map(event=>event.name)).size).toBe(8);
  for(const actual of initial.events){
    expect(actual.ownsEvent).toBe(true);
    if(actual.name!=='drums')for(const note of actual.event.notes??[actual.event.note])expect(actual.chord.tones).toContain(noteMidi(note)%12);
  }
  await expect(page.locator('.performance-surface [data-harmony-hint]').first()).toBeVisible();
  for(const root of ['E','Fm']){
    await page.evaluate(()=>{window.compositionBars=[];});
    for(let attempt=0;attempt<7&&await page.evaluate(()=>window.audioEngine.root)!==root;attempt++){
      await expect(page.locator('.celestial-control')).toHaveAttribute('data-settled','true');
      await page.getByRole('button',{name:'Change landscape',exact:true}).focus();
      await page.keyboard.press('Enter');
    }
    expect(await page.evaluate(()=>window.audioEngine.root)).toBe(root);
    await expect.poll(()=>page.evaluate(root=>window.compositionBars.filter(record=>record.plan.root===root).length,root),{timeout:10000}).toBeGreaterThanOrEqual(3);
    assertBars(await page.evaluate(root=>window.compositionBars.filter(record=>record.plan.root===root),root));
  }
  expect(errors).toEqual([]);
});

test('existing sky clouds indicate and change music weather without changing scenes',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await start(page);
  await page.evaluate(()=>window.audioEngine.setTempo(208));
  const cloud=page.locator('.scene-farm .cloud-1');
  const artwork=page.locator('.scene-farm .scenery-cloud');
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.harmonyPlan?.bar??-1)).toBeGreaterThanOrEqual(0);
  expect(await artwork.evaluate(element=>element.textContent)).toBe('');
  const before=await page.evaluate(()=>({bar:window.audioEngine.harmonyPlan.bar,genre:window.audioEngine.harmonyPlan.genre}));
  const cloudPosition=await page.locator('.scene-farm .cloud-1').getAttribute('transform');
  await cloud.click();
  await expect(page.locator('.scene-farm')).toBeVisible();
  expect(await page.evaluate(()=>({bar:window.audioEngine.harmonyPlan.bar,genre:window.audioEngine.harmonyPlan.genre}))).toEqual(before);
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.harmonyPlan?.bar??-1),{timeout:10000}).toBeGreaterThan(before.bar);
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.harmonyPlan?.genreBlend),{timeout:10000}).toBe(0);
  await expect.poll(()=>page.evaluate(()=>Number(getComputedStyle(document.querySelector('.scene-farm .cloud-3')).opacity)),{timeout:12000}).toBeGreaterThan(.25);
  await page.getByRole('button',{name:'Change landscape',exact:true}).click();
  await expect(page.locator('.scene-garden')).toBeVisible();
  const nextCloudPosition=await page.locator('.scene-garden .cloud-1').getAttribute('transform');
  // The sky row stays fixed; short worlds move clouds sideways around the sun.
  const row=transform=>Number(transform.match(/^translate\([^ ]+ ([^)]+)\)/)?.[1]);
  expect(row(nextCloudPosition)).toBe(row(cloudPosition));
  expect(await page.getByRole('button',{name:'Change music weather',exact:true}).count()).toBeGreaterThan(0);
});

for(const name of ['piano','ukulele'])test(`live Simple ${name} stays playable and pins a skipped motif while harmony revoices it`,async({page})=>{
  await start(page);await simple(page,name);await equip(page,name);
  await page.locator(`#instrument-${name}`).click();
  await expect.poll(()=>page.evaluate(name=>window.audioEngine.harmonyPlan?.phrases[name]?.tier,name)).toBe(0);
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.equippedPhrase?.tier)).toBe(0);
  await page.evaluate(()=>{
    const engine=window.audioEngine;const skip=engine.skipEquippedPhrase;
    engine.skipEquippedPhrase=function(){
      const before=this.equippedPhrase?.name;
      const bar=this.harmonyPlan?.bar??-1;
      const result=skip.call(this);
      window.skipResult={before,bar,name:this.equippedPhrase?.name,pinned:this.phrasePinned};
      return result;
    };
  });
  await page.getByRole('button',{name:'Next phrase',exact:true}).click();
  const selected=await page.evaluate(()=>window.skipResult);
  const previousBar=selected.bar;
  expect(selected.before).toBeTruthy();expect(selected.name).not.toBe(selected.before);expect(selected.pinned).toBe(true);
  await expect.poll(()=>page.evaluate(({name,motif,bar})=>{
    const plan=window.audioEngine.harmonyPlan;
    return plan?.bar>bar&&plan.phrases[name]?.name===motif;
  },{name,motif:selected.name,bar:previousBar})).toBe(true);
  await page.evaluate(()=>{window.compositionBars=[];});
  await expect.poll(()=>page.evaluate(()=>window.compositionBars.length),{timeout:15000}).toBeGreaterThanOrEqual(6);
  const records=await page.evaluate(()=>window.compositionBars);
  assertBars(records);
  expect(new Set(records.map(record=>record.plan.currentChord.name)).size).toBeGreaterThan(1);
  const available=name==='ukulele'?await page.locator('.chord-name').allTextContents():await page.locator('.performance-piano .note-key').evaluateAll(keys=>keys.map(key=>key.getAttribute('aria-label').replace('Piano key ','')));
  for(const {plan} of records){
    const phrase=plan.phrases[name];
    expect(phrase.name).toBe(selected.name);expect(phrase.tier).toBe(0);
    expect([0,3,4]).toContain(plan.currentChord.degree);
    expect(phrase.events.length).toBeLessThanOrEqual(4);
    for(const event of phrase.events){
      expect(event.time.endsWith(':0')).toBe(true);
      expect((event.notes??[event.note]).length).toBeLessThanOrEqual(name==='piano'?2:4);
      if(name==='ukulele')expect(available).toContain(event.chord);
      else for(const note of event.notes??[event.note])expect(available).toContain(note);
    }
  }
  expect(new Set(records.map(record=>JSON.stringify(record.plan.phrases[name].events))).size).toBeGreaterThan(1);
  await expect(page.locator('[data-harmony-hint]')).toHaveCount(0);
});

test('native double-tapping the equipped avatar preserves a pinned motif through practice and resumed bars',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.emulateMedia({reducedMotion:'reduce'});
  await start(page);await simple(page,'ukulele');await equip(page,'ukulele');
  await page.locator('#instrument-ukulele').click();
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.harmonyPlan?.phrases.ukulele?.tier)).toBe(0);
  await page.getByRole('button',{name:'Next phrase',exact:true}).click();
  const selected=await page.evaluate(()=>({name:window.audioEngine.equippedPhrase.name,identity:window.audioEngine.phraseIdentity,pinned:window.audioEngine.phrasePinned,active:{...window.audioEngine.active}}));
  expect(selected.pinned).toBe(true);expect(selected.active.ukulele).toBe(true);
  await page.evaluate(()=>{
    const engine=window.audioEngine;const original=engine.setInstrumentActive;
    window.practiceEntryToggles=[];
    engine.setInstrumentActive=function(name,active){
      const result=original.call(this,name,active);
      if(name==='ukulele')window.practiceEntryToggles.push({active:this.active[name],pinned:this.phrasePinned});
      return result;
    };
  });
  const musician=page.locator('#young-musician');
  let point;
  await expect.poll(async()=>{
    point=await musician.evaluate(element=>{
      const bounds=element.getBoundingClientRect();
      const candidates=[];
      for(let row=1;row<32;row++)for(let column=1;column<32;column++){
        const x=bounds.left+bounds.width*column/32,y=bounds.top+bounds.height*row/32;
        if(document.elementFromPoint(x,y)?.closest('.equipped-instrument')?.id==='instrument-ukulele')candidates.push({x,y,distance:Math.hypot(x-bounds.left-bounds.width/2,y-bounds.top-bounds.height/2)});
      }
      candidates.sort((first,second)=>first.distance-second.distance);
      return candidates[0]?{x:candidates[0].x,y:candidates[0].y}:null;
    });
    return Boolean(point);
  },{message:'The equipped avatar must expose a native ukulele pointer target'}).toBe(true);
  if(testInfo.project.use.hasTouch){
    const client=await page.context().newCDPSession(page);
    try{
      for(let tap=0;tap<2;tap++){
        await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...point}]});
        await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        if(tap===0)await page.waitForTimeout(80);
      }
    }finally{await client.detach();}
  }else await page.mouse.dblclick(point.x,point.y);
  await expect(page.getByRole('dialog',{name:'Farm practice room'})).toBeVisible();
  await expect(page.getByRole('combobox',{name:'Practice instrument'})).toHaveValue('ukulele');
  expect(await page.evaluate(()=>window.practiceEntryToggles.slice(0,2))).toEqual([{active:false,pinned:true},{active:true,pinned:true}]);
  expect(await page.evaluate(()=>{
    const saved=window.audioEngine.practiceSession;
    return {name:saved.equippedPhrase?.name,identity:saved.phraseIdentity,pinned:saved.phrasePinned,active:saved.active};
  })).toEqual(selected);
  await page.getByRole('combobox',{name:'Practice instrument'}).selectOption('panflute');
  await page.getByRole('button',{name:'Leave practice through the open door',exact:true}).click();
  await expect(page.locator('.practice-room')).toHaveCount(0);
  await expect(page.locator('.performance-ukulele')).toBeVisible();
  expect(await page.evaluate(()=>{
    const engine=window.audioEngine;
    return {name:engine.equippedPhrase?.name,identity:engine.phraseIdentity,pinned:engine.phrasePinned,active:engine.active};
  })).toEqual(selected);
  await page.evaluate(()=>{window.compositionBars=[];});
  await expect.poll(()=>page.evaluate(()=>window.compositionBars.length),{timeout:10000}).toBeGreaterThanOrEqual(3);
  const records=await page.evaluate(()=>window.compositionBars);
  assertBars(records);
  for(const {plan} of records){expect(plan.phrases.ukulele.name).toBe(selected.name);expect(plan.phrases.ukulele.tier).toBe(0);}
  expect(errors).toEqual([]);
});

async function gains(page,expected) {
  await expect.poll(()=>page.evaluate(expected=>{
    const engine=window.audioEngine;
    return Object.entries(expected).every(([name,value])=>Math.abs(engine.nodes[name].gain.volume.value-value)<.05&&engine.effectiveVolume(name)===value);
  },expected)).toBe(true);
}

test('equipped gain adds 3 dB capped at zero, preserves mute and base volumes through switching, holds, resume and defaults',async({page})=>{
  await start(page);
  await page.locator('#instrument-piano').click();await page.locator('#instrument-ukulele').click();await page.locator('#instrument-drums').click();
  await page.evaluate(()=>window.audioEngine.setVolumes({piano:-8,ukulele:-1,drums:-60}));
  const saved=await page.evaluate(()=>({volumes:{...window.audioEngine.volumes},settings:localStorage.getItem('farmjam-settings-v1')}));
  await equip(page,'piano');await gains(page,{piano:-5,ukulele:-1,drums:-60});
  await equip(page,'ukulele');await gains(page,{piano:-8,ukulele:0,drums:-60});
  await equip(page,'drums');await gains(page,{piano:-8,ukulele:-1,drums:-60});
  await equip(page,'piano');
  await page.evaluate(()=>window.audioEngine.holdTempo(true));
  await expect.poll(()=>page.evaluate(()=>['piano','ukulele','drums'].every(name=>window.audioEngine.nodes[name].gain.volume.value<=-59.95))).toBe(true);
  await page.evaluate(()=>window.audioEngine.holdTempo(false));await gains(page,{piano:-5,ukulele:-1,drums:-60});
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  const suspended=await page.evaluate(()=>({backgrounded:window.audioEngine.backgrounded,gains:['piano','ukulele','drums'].map(name=>window.audioEngine.nodes[name].gain.volume.value)}));
  expect(suspended.backgrounded).toBe(true);
  for(const gain of suspended.gains)expect(gain).toBeCloseTo(-60,5);
  await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.backgrounded)).toBe(false);
  await gains(page,{piano:-5,ukulele:-1,drums:-60});
  expect(await page.evaluate(()=>({volumes:{...window.audioEngine.volumes},settings:localStorage.getItem('farmjam-settings-v1')}))).toEqual(saved);
  await page.getByRole('button',{name:'Put instrument down',exact:true}).click();
  await gains(page,{piano:-8,ukulele:-1,drums:-60});
  await equip(page,'piano');await page.getByRole('button',{name:'Open settings',exact:true}).dblclick();
  await page.getByRole('button',{name:'Restore defaults',exact:true}).click();
  const defaults=await page.evaluate(async()=>{const {defaultSoundMix}=await import('/src/utils/settings.js');return defaultSoundMix();});
  expect(await page.evaluate(()=>window.audioEngine.volumes)).toEqual(defaults.volumes);
  await gains(page,{piano:Math.min(0,defaults.volumes.piano+3),ukulele:defaults.volumes.ukulele,drums:defaults.volumes.drums});
  expect(await page.evaluate(()=>localStorage.getItem('farmjam-settings-v1'))).toBe(saved.settings);
});
