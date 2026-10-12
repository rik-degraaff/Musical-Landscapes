import {test,expect} from './fixtures.js';
async function start(page){const size=page.viewportSize();if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});await page.goto('/');await page.evaluate(async()=>{const text=await(await fetch('/src/App.jsx')).text();const url=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(text)[1];const {AudioEngine}=await import(url);const init=AudioEngine.prototype.initialize;AudioEngine.prototype.initialize=async function(){await init.call(this);window.audioEngine=this;};});await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});}
async function equip(page,name){await page.locator(`#instrument-${name}`).focus();await page.keyboard.press('e');await expect(page.locator(`.performance-${name}`)).toBeVisible();}
async function difficulty(page,name,level){await page.getByRole('button',{name:'Open settings'}).dblclick();await page.getByRole('tab',{name:'Instruments',exact:true}).click();await page.getByRole('combobox',{name:'Configure instrument'}).selectOption(name);await page.getByRole('radio',{name:level,exact:true}).check();await page.keyboard.press('Escape');}

test('instrument difficulty reduces equipped controls and only plays available chords',async({page},testInfo)=>{
  await start(page);await equip(page,'ukulele');await difficulty(page,'ukulele','Simple');await expect(page.locator('.chord-control')).toHaveCount(3);
  await page.locator('#instrument-ukulele').click();
  await page.evaluate(()=>{window.chordEvents=[];const engine=window.audioEngine;const original=engine.playEvent;engine.playEvent=function(name,event,time){if(name==='ukulele')window.chordEvents.push(event.chord);return original.call(this,name,event,time);};});
  await expect.poll(()=>page.evaluate(()=>window.chordEvents.length)).toBeGreaterThan(1);
  const available=await page.locator('.chord-name').allTextContents();for(const chord of await page.evaluate(()=>window.chordEvents))expect(available).toContain(chord);
  await page.screenshot({path:`test-results/${testInfo.project.name}-simple-ukulele.png`});
  await difficulty(page,'ukulele','Standard');await expect(page.locator('.chord-control')).toHaveCount(6);
  await difficulty(page,'ukulele','Advanced');await expect(page.locator('.chord-control')).toHaveCount(14);
  await page.getByRole('button',{name:'Put instrument down'}).click();await equip(page,'drums');await difficulty(page,'drums','Simple');await expect(page.locator('.drum-pad')).toHaveCount(3);
  await page.getByRole('button',{name:'Put instrument down'}).click();await equip(page,'melody');await difficulty(page,'melody','Simple');await expect(page.locator('.lip-segment')).toHaveCount(2);
  await page.getByRole('button',{name:'Put instrument down'}).click();await equip(page,'panflute');await difficulty(page,'panflute','Simple');expect(await page.locator('.panflute-pipe').count()).toBeLessThan(22);
});

test('unequipped parts use Advanced Markov motifs and Next phrase pins a playable equipped motif',async({page})=>{
  await start(page);await difficulty(page,'ukulele','Simple');
  expect(await page.evaluate(()=>window.audioEngine.root)).toBe('A');
  const unequipped=await page.evaluate(async()=>{
    const engine=window.audioEngine;
    const {Composition,phraseMotifs}=await import('/src/utils/composition.js');
    const composer=new Composition({random:()=>.9});
    const reference=new Composition({random:()=>.9});
    const phrases=Array.from({length:6},(_,bar)=>composer.planBar(bar,engine.root,engine.compositionOptions('ukulele')).phrases.ukulele);
    const expected=Array.from({length:6},(_,bar)=>reference.planBar(bar,engine.root,{active:{ukulele:true}}).phrases.ukulele);
    return {phrases,expected,motifs:phraseMotifs('ukulele',engine.root,{complexity:1.5}).map(motif=>motif.name)};
  });
  expect(unequipped.phrases).toEqual(unequipped.expected);
  expect(unequipped.phrases.some(phrase=>phrase.tier===2)).toBe(true);
  for(const phrase of unequipped.phrases)expect(unequipped.motifs).toContain(phrase.name);
  await equip(page,'ukulele');await page.locator('#instrument-ukulele').click();await expect.poll(()=>page.evaluate(()=>Boolean(window.audioEngine.equippedPhrase))).toBe(true);
  const before=await page.evaluate(()=>window.audioEngine.equippedPhrase.name);await page.getByRole('button',{name:'Next phrase'}).click();
  const selected=await page.evaluate(()=>window.audioEngine.equippedPhrase.name);
  expect(selected).not.toBe(before);
  expect(await page.evaluate(()=>window.audioEngine.phrasePinned)).toBe(true);
  expect(await page.evaluate(()=>window.audioEngine.active.ukulele)).toBe(true);
  const bar=await page.evaluate(()=>window.audioEngine.harmonyPlan?.bar??-1);
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.harmonyPlan?.bar??-1)).toBeGreaterThan(bar+1);
  const revoiced=await page.evaluate(async()=>{
    const engine=window.audioEngine;const plan=engine.harmonyPlan;
    const {noteMidi}=await import('/src/utils/autoplay.js');
    const {equippedProfile}=await import('/src/utils/difficulty.js');
    const profile=equippedProfile('ukulele',plan.root,engine.performanceSettings.ukulele);
    const phrase=plan.phrases.ukulele;
    return {name:phrase.name,tier:phrase.tier,events:phrase.events,playable:phrase.events.every(event=>profile.chords.some(chord=>chord.name===event.chord)&&(event.notes??[event.note]).every(note=>plan.currentChord.tones.includes(noteMidi(note)%12)))};
  });
  expect(revoiced.name).toBe(selected);expect(revoiced.tier).toBe(0);expect(revoiced.playable).toBe(true);
  expect(revoiced.events.length).toBeLessThanOrEqual(4);
  expect(revoiced.events.every(event=>event.time.endsWith(':0'))).toBe(true);
  await page.getByRole('button',{name:'Put instrument down'}).click();expect(await page.evaluate(()=>window.audioEngine.active.ukulele)).toBe(true);
});

test('equipping and changing difficulty remove incompatible queued events without changing accompaniment',async({page})=>{
  await start(page);await difficulty(page,'ukulele','Simple');await page.locator('#instrument-ukulele').click();await page.locator('#instrument-drums').click();
  await expect.poll(()=>page.evaluate(()=>[...window.audioEngine.pendingEvents.values()].includes('ukulele'))).toBe(true);
  await page.evaluate(async()=>{
    const source=await(await fetch('/src/App.jsx')).text();
    const url=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(source)[1];
    const audioSource=await(await fetch(url)).text();
    const Tone=await import(/import\s+\*\s+as\s+Tone\s+from\s+["']([^"']+)["']/.exec(audioSource)[1]);
    const engine=window.audioEngine;const original=engine.setManualInstrument;
    engine.setManualInstrument=function(name){
      const currentBar=Math.max(0,Math.floor(Tone.Transport.getTicksAtTime(Tone.immediate())/(Tone.Transport.PPQ*4)));
      for(const [instrument,bar] of [['ukulele',currentBar],['ukulele',currentBar+1],['drums',currentBar]]){
        const id=Tone.Transport.scheduleOnce(()=>{},`${(bar+1)*Tone.Transport.PPQ*4-1}i`);
        this.pendingEvents.set(id,instrument);this.pendingEventBars.set(id,bar);
      }
      const pending=[...this.pendingEvents].filter(([,instrument])=>instrument==='ukulele');
      const current=pending.filter(([id])=>this.pendingEventBars.get(id)<=currentBar);
      const future=pending.filter(([id])=>this.pendingEventBars.get(id)>currentBar);
      const drums=[...this.pendingEvents].filter(([id,instrument])=>instrument==='drums'&&this.pendingEventBars.get(id)<=currentBar);
      const result=original.call(this,name);
      window.equipQueue={currentCount:current.length,futureCount:future.length,drumCount:drums.length,currentRemoved:current.every(([id])=>!this.pendingEvents.has(id)&&!this.pendingEventBars.has(id)),futureRemoved:future.every(([id])=>!this.pendingEvents.has(id)&&!this.pendingEventBars.has(id)),drumsRetained:drums.every(([id])=>this.pendingEvents.get(id)==='drums'&&this.pendingEventBars.has(id))};
      this.setManualInstrument=original;return result;
    };
  });
  await equip(page,'ukulele');
  const queue=await page.evaluate(()=>window.equipQueue);
  expect(queue.currentCount).toBeGreaterThan(0);expect(queue.futureCount).toBeGreaterThan(0);expect(queue.drumCount).toBeGreaterThan(0);
  expect(queue.currentRemoved).toBe(true);expect(queue.futureRemoved).toBe(true);expect(queue.drumsRetained).toBe(true);
  await difficulty(page,'ukulele','Advanced');await page.getByRole('button',{name:'Next phrase'}).click();
  await difficulty(page,'ukulele','Simple');
  const available=await page.locator('.chord-name').allTextContents();
  const choice=await page.evaluate(()=>window.audioEngine.selectPhrase('ukulele',Math.max(0,window.audioEngine.barIndex-1)));
  expect(choice.events.every(event=>available.includes(event.chord))).toBe(true);
  expect(await page.evaluate(()=>window.audioEngine.active.drums)).toBe(true);
  await expect(page.locator('.celestial-control')).toHaveAttribute('data-settled','true');
  await page.getByRole('button',{name:'Change landscape'}).focus();await page.keyboard.press('Enter');
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.playbackRoot===window.audioEngine.root)).toBe(true);
  const newChords=await page.locator('.chord-name').allTextContents();
  const next=await page.evaluate(()=>window.audioEngine.selectPhrase('ukulele',Math.max(0,window.audioEngine.barIndex-1)));
  expect(next.events.every(event=>newChords.includes(event.chord))).toBe(true);
});