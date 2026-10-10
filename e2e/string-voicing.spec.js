import {test,expect} from './fixtures.js';

async function start(page,complexity) {
  const size=page.viewportSize();
  if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});
  await page.addInitScript(value=>{
    localStorage.setItem('farmjam-settings-v1',JSON.stringify({
      selected:['piano','drums','guitar','ukulele','marimba','flute'],
      instruments:Object.fromEntries(['guitar','ukulele'].map(name=>[name,{complexity:value,fingeringCharts:true,playbackNotes:true}])),
    }));
  },complexity);
  await page.goto('/');
  await page.evaluate(async()=>{
    const text=await(await fetch('/src/App.jsx')).text();
    const url=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(text)[1];
    const {AudioEngine}=await import(url);
    const initialize=AudioEngine.prototype.initialize;
    AudioEngine.prototype.initialize=async function(){await initialize.call(this);window.audioEngine=this;};
  });
  await page.getByRole('button',{name:'Tap to play'}).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
}

async function observeAudio(page,name,complexity) {
  return page.evaluate(async({name,complexity})=>{
    const {equippedProfile}=await import('/src/utils/difficulty.js');
    const {noteMidi}=await import('/src/utils/autoplay.js');
    const engine=window.audioEngine;
    const profile=equippedProfile(name,engine.root,{complexity});
    window.stringAudio=[];window.stringManual=[];window.stringCues=[];
    let current=null;
    const play=engine.playEvent;
    engine.playEvent=function(instrument,event,time){
      if(instrument!==name)return play.call(this,instrument,event,time);
      const record={event,pitches:[]};window.stringAudio.push(record);current=record;
      try{return play.call(this,instrument,event,time);}finally{current=null;}
    };
    const sampler=engine.nodes[name].synth;
    const trigger=sampler.triggerAttackRelease;
    sampler.triggerAttackRelease=function(note,...args){if(current)current.pitches.push(note);return trigger.call(this,note,...args);};
    const strike=engine.manualStrike;
    engine.manualStrike=function(note,token,...args){
      const result=strike.call(this,note,token,...args);
      const voice=this.manualVoices.get(token);
      const sample=voice&&Object.entries(this.nodes[name].buffers).find(([,buffer])=>buffer.get()===voice.source.buffer)?.[0];
      window.stringManual.push({note,voice:voice?.note,pitch:sample?noteMidi(sample)+12*Math.log2(voice.source.playbackRate.value):null});
      return result;
    };
    const cue=engine.onManualAutoplayEvent;
    window.showStringCue=cue;window.freezeStringCue=false;
    engine.onManualAutoplayEvent=event=>{
      if(event)window.stringCues.push(event);
      if(!event||!window.freezeStringCue)return cue?.(event);
    };
    return profile;
  },{name,complexity});
}

async function expectShape(page,name,chord,event) {
  const label=name==='guitar'?'Guitar':'Ukulele';
  await expect(page.locator('.fingering-dot')).toHaveCount(chord.notes.length);
  expect(await page.locator('.fingering-dot').evaluateAll(items=>items.map(item=>Number(item.dataset.fret)))).toEqual(chord.frets);
  expect(await page.locator('.playable-string').evaluateAll(items=>items.map(item=>item.getAttribute('aria-label')))).toEqual(chord.notes.map((note,string)=>`${label} string ${string+1} ${note}`));
  const diagram=page.getByRole('img',{name:`${chord.name} fingering`,exact:true});
  expect(await diagram.locator('circle[data-string]').evaluateAll(items=>items.map(item=>Number(item.dataset.fret)))).toEqual(chord.frets);
  if(event){
    const dots=page.locator('.phrase-note-dot:not(.manual-note-dot)');
    expect(await dots.evaluateAll(items=>items.map(item=>({string:Number(item.dataset.string)-1,fret:Number(item.dataset.fret)})))).toEqual(event.fingering.map(({string,fret})=>({string,fret})));
    const aligned=await dots.evaluateAll(items=>items.every(item=>{
      const held=item.parentElement.querySelector(`.fingering-dot[data-string="${item.dataset.string}"]`);
      return held?.dataset.fret===item.dataset.fret&&held.style.left===item.style.left&&held.style.top===item.style.top;
    }));
    expect(aligned).toBe(true);
  }
}

async function hold(page,name,chord) {
  const bounds=await page.getByRole('button',{name:`Hold ${name} chord ${chord.name}`,exact:true}).boundingBox();
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
  await page.mouse.down();
}

async function pluck(page,string,note) {
  await page.locator('.playable-string').nth(string).focus();
  await page.keyboard.press('Space');
  const actual=await page.evaluate(()=>window.stringManual.at(-1));
  expect(actual.note).toBe(note);expect(actual.voice).toBe(note);
  const pitch=await page.evaluate(async note=>{const {noteMidi}=await import('/src/utils/autoplay.js');return noteMidi(note);},note);
  expect(actual.pitch).toBeCloseTo(pitch,5);
}

for(const name of ['guitar','ukulele'])for(const [level,complexity] of [['Simple',.35],['Standard',1],['Advanced',1.5]]) {
  test(`${name} ${level}: autoplay, chord controls and Learn use exactly the same string voicing`,async({page},testInfo)=>{
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await start(page,complexity);
    await page.locator(`#instrument-${name}`).focus();await page.keyboard.press('e');
    await expect(page.locator(`.performance-${name}`)).toBeVisible();
    const profile=await observeAudio(page,name,complexity);
    await page.locator(`#instrument-${name}`).click();
    await expect.poll(()=>page.evaluate(()=>window.stringCues.length)).toBeGreaterThanOrEqual(2);
    const event=await page.evaluate(()=>{
      window.freezeStringCue=true;
      const event=window.stringCues.at(-1);
      window.showStringCue({...event,duration:60});
      return event;
    });
    await expect.poll(()=>page.evaluate(()=>{
      const event=window.stringCues.at(-1);
      const shown=document.querySelector('.neck-chord-name')?.textContent;
      const dots=[...document.querySelectorAll('.phrase-note-dot:not(.manual-note-dot)')];
      return shown===event?.chord&&dots.length===event.fingering.length&&dots.every((dot,index)=>Number(dot.dataset.fret)===event.fingering[index].fret);
    })).toBe(true);
    await expectShape(page,name,profile.chords.find(chord=>chord.name===event.chord),event);
    const records=await page.evaluate(()=>window.stringAudio);
    expect(records.length).toBeGreaterThanOrEqual(2);
    for(const record of records){
      const chord=profile.chords.find(value=>value.name===record.event.chord);
      expect(chord).toBeTruthy();
      expect(record.pitches).toEqual(record.event.notes??[record.event.note]);
      expect(new Set(record.event.fingering.map(input=>input.string)).size).toBe(record.pitches.length);
      record.event.fingering.forEach((input,index)=>{
        expect(input.fret).toBe(chord.frets[input.string]);
        expect(input.note).toBe(chord.notes[input.string]);
        expect(record.pitches[index]).toBe(input.note);
      });
    }
    for(const chord of profile.chords){
      await hold(page,name,chord);await expectShape(page,name,chord);
      for(const [string,note] of chord.notes.entries())await pluck(page,string,note);
      await page.mouse.up();
    }
    await page.getByRole('button',{name:'Put instrument down'}).click();
    await page.locator('#young-musician').focus();await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog',{name:'Farm practice room'})).toBeVisible();
    await page.getByRole('combobox',{name:'Practice instrument'}).selectOption(name);
    await page.getByRole('button',{name:/Learn/}).click();
    await page.getByRole('combobox',{name:'Practice phrase'}).selectOption('0');
    await expectShape(page,name,profile.chords.find(chord=>chord.name===profile.phrases[0].events[0].chord),profile.phrases[0].events[0]);
    await page.screenshot({path:testInfo.outputPath('guided-voicing.png')});
    const alternate=profile.chords.find(chord=>chord.name!==profile.phrases[0].events[0].chord);
    await hold(page,name,alternate);await expectShape(page,name,alternate);
    for(const [string,note] of alternate.notes.entries())await pluck(page,string,note);
    await page.mouse.up();
    await page.getByRole('button',{name:'Restart practice',exact:true}).click();
    for(const event of profile.phrases[0].events){
      const chord=profile.chords.find(value=>value.name===event.chord);
      await expect(page.locator('.practice-target strong')).toHaveText((event.notes??[event.note]).join(' + '));
      await expectShape(page,name,chord,event);
      await hold(page,name,chord);
      for(const input of event.fingering)await pluck(page,input.string,input.note);
      await page.mouse.up();
    }
    await expect(page.locator('.practice-feedback-display')).toHaveText('Phrase learned!');
    await page.screenshot({path:testInfo.outputPath('learned-voicing.png')});
    await page.getByRole('button',{name:'Leave practice through the open door'}).click();
    expect(errors).toEqual([]);
  });
}