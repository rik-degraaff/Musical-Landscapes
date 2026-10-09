import {test,expect} from '@playwright/test';

async function start(page) {
  const viewport=page.viewportSize();if(viewport.height>viewport.width)await page.setViewportSize({width:viewport.height,height:viewport.width});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await page.evaluate(async()=>{
    const source=await(await fetch('/src/App.jsx')).text();const url=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(source)[1];
    const {AudioEngine}=await import(url);const original=AudioEngine.prototype.initialize;
    AudioEngine.prototype.initialize=async function(){await original.call(this);window.audioEngine=this;};
  });
  await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});return errors;
}
async function equip(page,name){await page.locator(`#instrument-${name}`).focus();await page.keyboard.press('e');await expect(page.locator(`.performance-${name}`)).toBeVisible();}
async function slots(page){await page.getByRole('button',{name:'Open settings'}).dblclick();await page.getByRole('tab',{name:'Instruments',exact:true}).click();}
async function level(page,name) {
  return page.evaluate(async name=>{
    let output=window.audioEngine.nodes[name].gain;while(output.output)output=output.output;
    const analyser=output.context.createAnalyser();analyser.fftSize=2048;output.connect(analyser);
    const values=new Float32Array(2048);let peak=0;const until=performance.now()+450;
    while(performance.now()<until){analyser.getFloatTimeDomainData(values);peak=Math.max(peak,Math.sqrt(values.reduce((sum,value)=>sum+value*value,0)/values.length));await new Promise(resolve=>requestAnimationFrame(resolve));}
    output.disconnect(analyser);analyser.disconnect();return peak;
  },name);
}

test('defaults include ukulele and pan flute and six selectable slots persist with safe active replacement',async({page},testInfo)=>{
  const errors=await start(page);await expect(page.locator('.instrument')).toHaveCount(6);
  await expect(page.locator('#instrument-ukulele')).toBeVisible();await expect(page.locator('#instrument-panflute')).toBeVisible();
  await expect(page.locator('#instrument-guitar,#instrument-flute')).toHaveCount(0);
  await page.locator('#instrument-ukulele').click();await equip(page,'ukulele');
  expect(await page.evaluate(()=>window.audioEngine.active.ukulele)).toBe(true);
  await slots(page);await page.getByRole('combobox',{name:'Instrument slot 3',exact:true}).selectOption('guitar');
  expect(await page.evaluate(()=>({active:window.audioEngine.active.ukulele,manual:window.audioEngine.manualInstrument}))).toEqual({active:false,manual:null});
  await page.getByRole('combobox',{name:'Instrument slot 6',exact:true}).selectOption('flute');
  await page.getByRole('combobox',{name:'Instrument slot 1',exact:true}).selectOption('drums');
  await expect(page.getByRole('combobox',{name:'Instrument slot 2',exact:true})).toHaveValue('piano');
  await page.screenshot({path:`test-results/${testInfo.project.name}-instrument-selection.png`});await page.keyboard.press('Escape');
  await expect(page.locator('.instrument')).toHaveCount(6);await expect(page.locator('#instrument-guitar')).toBeVisible();await expect(page.locator('#instrument-flute')).toBeVisible();
  await page.reload();await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  await expect(page.locator('#instrument-guitar')).toBeVisible();await expect(page.locator('#instrument-flute')).toBeVisible();await expect(page.locator('.instrument')).toHaveCount(6);expect(errors).toEqual([]);
});

test('ukulele plays every string of every chord with visible orange fret positions',async({page},testInfo)=>{
  const errors=await start(page);await equip(page,'ukulele');
  await expect(page.locator('.playable-string')).toHaveCount(4);await expect(page.locator('.fret-line')).toHaveCount(19);await expect(page.locator('.fingering-dot')).toHaveCount(4);
  const chords=await page.evaluate(async()=> (await import('/src/utils/guitar.js')).UKULELE_LIBRARY.C.chords);
  for(const chord of chords){
    const hold=page.getByRole('button',{name:`Hold ukulele chord ${chord.name}`,exact:true});await hold.focus();await page.keyboard.down('Space');
    for(let string=0;string<4;string++){
      await expect(page.locator('.playable-string').nth(string)).toHaveAttribute('aria-label',`Ukulele string ${string+1} ${chord.notes[string]}`);
      await page.locator('.playable-string').nth(string).dispatchEvent('keydown',{key:'Enter'});await page.locator('.playable-string').nth(string).dispatchEvent('keyup',{key:'Enter'});
    }
    await page.keyboard.up('Space');
  }
  const button=page.getByRole('button',{name:'Hold ukulele chord C',exact:true});await button.focus();await page.keyboard.down('Space');
  await expect(page.locator('.fingering-dot:not(.open-string-dot)').first()).toHaveCSS('background-color','rgb(255, 121, 0)');
  expect(await level(page,'ukulele')).toBeGreaterThan(.0001);
  await page.screenshot({path:`test-results/${testInfo.project.name}-ukulele-performance.png`});await page.keyboard.up('Space');
  await page.locator('#instrument-ukulele').click();await expect.poll(()=>page.locator('.neck-chord-name').textContent()).not.toBeNull();
  await page.getByRole('button',{name:'Put instrument down'}).click();expect(await page.evaluate(()=>window.audioEngine.active.ukulele)).toBe(true);expect(errors).toEqual([]);
});

test('pan flute uses real pan-pipe samples and sustains and swipes without stuck voices',async({page},testInfo)=>{
  const errors=await start(page);await equip(page,'panflute');await expect(page.locator('.panflute-pipe')).toHaveCount(22);
  const pipe=page.getByRole('button',{name:'Pan flute pipe E4',exact:true});await pipe.focus();await page.keyboard.down('Space');
  expect(await page.evaluate(()=>({note:[...window.audioEngine.manualVoices.values()][0].note,loop:[...window.audioEngine.manualVoices.values()][0].source.loop}))).toEqual({note:'E4',loop:true});
  expect(await level(page,'panflute')).toBeGreaterThan(.0001);await page.screenshot({path:`test-results/${testInfo.project.name}-panflute-performance.png`});await page.keyboard.up('Space');
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  const first=await page.locator('.panflute-pipe').first().boundingBox();const last=await page.locator('.panflute-pipe').last().boundingBox();
  await page.mouse.move(first.x+first.width/2,first.y+15);await page.mouse.down();await page.mouse.move(last.x+last.width/2,last.y+15,{steps:5});await page.mouse.up();
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  await page.locator('#instrument-panflute').click();await expect.poll(()=>page.locator('.panflute-pipe.pressed').count()).toBeGreaterThan(0);expect(errors).toEqual([]);
});

test('guitar remains optional and every chord sounds all six strings; piano uses wider orange keys',async({page},testInfo)=>{
  const errors=await start(page);await slots(page);await page.getByRole('combobox',{name:'Instrument slot 3',exact:true}).selectOption('guitar');await page.keyboard.press('Escape');await equip(page,'guitar');
  const chords=await page.evaluate(async()=> (await import('/src/utils/guitar.js')).GUITAR_LIBRARY.C.chords);
  for(const chord of chords){
    const hold=page.getByRole('button',{name:`Hold guitar chord ${chord.name}`,exact:true});await hold.focus();await page.keyboard.down('Space');
    for(let string=0;string<6;string++)await expect(page.locator('.playable-string').nth(string)).toHaveAttribute('aria-label',`Guitar string ${string+1} ${chord.notes[string]}`);
    await page.keyboard.up('Space');
  }
  await page.getByRole('button',{name:'Put instrument down'}).click();await equip(page,'piano');await expect(page.locator('.note-key')).toHaveCount(19);
  const key=page.getByRole('button',{name:'Piano key C4',exact:true});await key.focus();await page.keyboard.down('Space');
  expect(await key.evaluate(element=>getComputedStyle(element).boxShadow.includes('255, 121, 0'))).toBe(true);
  const bounds=await key.boundingBox();expect(bounds.width).toBeGreaterThan(45);
  const keyboard=await page.locator('.manual-keyboard').boundingBox();
  const finalSharp=await page.getByRole('button',{name:'Piano key F#5',exact:true}).boundingBox();expect(finalSharp.x+finalSharp.width).toBeLessThanOrEqual(keyboard.x+keyboard.width+1);
  await page.screenshot({path:`test-results/${testInfo.project.name}-compact-orange-piano.png`});await page.keyboard.up('Space');expect(errors).toEqual([]);
});