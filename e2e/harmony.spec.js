import {test,expect} from './fixtures.js';

async function start(page) {
  const viewport=page.viewportSize();
  if(viewport.height>viewport.width)await page.setViewportSize({width:viewport.height,height:viewport.width});
  await page.goto('/');
  await page.evaluate(async()=>{
    const source=await (await fetch('/src/App.jsx')).text();
    const url=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(source)[1];
    const {AudioEngine}=await import(url);
    const initialize=AudioEngine.prototype.initialize;
    AudioEngine.prototype.initialize=async function(){await initialize.call(this);window.audioEngine=this;};
  });
  await page.getByRole('button',{name:'Tap to play'}).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:20000});
  await page.evaluate(()=>{window.publishHarmony=window.audioEngine.onHarmonyChange;window.audioEngine.onHarmonyChange=()=>{};});
}

async function equip(page,name) {
  await page.locator(`#instrument-${name}`).focus();await page.keyboard.press('e');
  await expect(page.locator(`.performance-${name}`)).toBeVisible();
}

async function settings(page,name,level) {
  await page.getByRole('button',{name:'Open settings',exact:true}).dblclick();
  await page.getByRole('tab',{name:'Instruments',exact:true}).click();
  await page.getByRole('combobox',{name:'Configure instrument'}).selectOption(name);
  if(level)await page.getByRole('radio',{name:level,exact:true}).check();
  await page.locator('.settings-display-details summary').click();
}

async function publish(page,name,{unavailable=false,root}={}) {
  return page.evaluate(async({name,unavailable,root})=>{
    const {equippedProfile}=await import('/src/utils/difficulty.js');
    const {noteMidi}=await import('/src/utils/autoplay.js');
    const options=JSON.parse(localStorage.getItem('farmjam-settings-v1')).instruments[name];
    const profile=equippedProfile(name,root??window.audioEngine.playbackRoot,options);
    const chord=profile.chords[0]??{name:'Next harmony',degree:0,tones:[...new Set(profile.notes.slice(0,3).map(note=>noteMidi(note)%12))]};
    const nextChord=unavailable?{name:'Unavailable',degree:99,tones:chord.tones}:chord;
    const plan={bar:7,root:root??window.audioEngine.playbackRoot,currentChord:chord,nextChord,roles:{},phrases:{}};
    window.publishHarmony(plan);
    return plan;
  },{name,unavailable,root});
}

test('harmony preferences default to subtle notes, persist per instrument, and gate Advanced text',async({page},testInfo)=>{
  await start(page);await equip(page,'piano');await publish(page,'piano');
  await expect(page.locator('[data-harmony-hint]').first()).toBeVisible();
  await expect(page.getByLabel('Next chord',{exact:true})).toHaveCount(0);
  await settings(page,'piano');
  await expect(page.getByLabel('Highlight upcoming harmony')).toBeChecked();
  await expect(page.getByLabel('Show next chord name')).not.toBeChecked();
  await page.getByLabel('Show next chord name').check();
  await page.getByRole('button',{name:'Close settings',exact:true}).click();
  await expect(page.getByLabel('Next chord',{exact:true})).toHaveText('Next: Next harmony');
  const text=await page.getByLabel('Next chord',{exact:true}).boundingBox();
  const heading=await page.locator('.performance-panel h2').boundingBox();
  const next=await page.getByRole('button',{name:'Next phrase',exact:true}).boundingBox();
  expect(text.x).toBeGreaterThanOrEqual(heading.x+heading.width);
  expect(text.x+text.width).toBeLessThanOrEqual(next.x);
  await page.screenshot({path:testInfo.outputPath('harmony-name.png')});
  await settings(page,'piano','Standard');
  await expect(page.getByLabel('Show next chord name')).toHaveCount(0);
  await page.getByRole('button',{name:'Close settings',exact:true}).click();await publish(page,'piano');
  await expect(page.locator('[data-harmony-hint]').first()).toBeVisible();
  await expect(page.getByLabel('Next chord',{exact:true})).toHaveCount(0);
  await settings(page,'piano','Simple');
  await expect(page.getByLabel('Highlight upcoming harmony')).toHaveCount(0);
  await page.getByRole('button',{name:'Close settings',exact:true}).click();await publish(page,'piano');
  await expect(page.locator('[data-harmony-hint]')).toHaveCount(0);
  await settings(page,'piano','Advanced');await page.getByLabel('Highlight upcoming harmony').uncheck();
  await expect(page.getByLabel('Show next chord name')).toHaveCount(0);
  await page.getByRole('button',{name:'Close settings',exact:true}).click();await publish(page,'piano');
  await expect(page.locator('[data-harmony-hint]')).toHaveCount(0);
  await page.reload();await page.getByRole('button',{name:'Tap to play'}).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:20000});
  await settings(page,'piano');await expect(page.getByLabel('Highlight upcoming harmony')).not.toBeChecked();
  await page.getByRole('combobox',{name:'Configure instrument'}).selectOption('guitar');
  await page.locator('.settings-display-details summary').click();
  await expect(page.getByLabel('Highlight upcoming harmony')).toBeChecked();
});

test('harmony marks actual available controls without pressing them across instrument surfaces',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await start(page);
  const selected=['piano','guitar','ukulele','marimba','panflute','flute'];
  await page.getByRole('button',{name:'Open settings',exact:true}).dblclick();
  await page.getByRole('tab',{name:'Instruments',exact:true}).click();
  for(const [index,name] of selected.entries())await page.getByRole('combobox',{name:`Instrument slot ${index+1}`,exact:true}).selectOption(name);
  await page.getByRole('button',{name:'Close settings',exact:true}).click();
  for(const name of selected){
    await equip(page,name);const plan=await publish(page,name);
    const marked=page.locator('.performance-surface [data-harmony-hint]');
    await expect(marked.first()).toBeVisible();
    await expect(page.locator('.performance-surface [aria-pressed="true"]')).toHaveCount(0);
    const notes=await marked.evaluateAll(controls=>controls.map(control=>control.getAttribute('data-harmony-note')).filter(Boolean));
    const pitchClasses=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    for(const note of notes)expect(plan.nextChord.tones).toContain(pitchClasses.indexOf(note.replace(/\d+$/,'')));
    if(['guitar','ukulele'].includes(name)){
      await expect(page.locator('.chord-control[data-harmony-hint]')).toHaveAttribute('aria-label',`Hold ${name} chord ${plan.nextChord.name}`);
      await publish(page,name,{unavailable:true});await expect(marked).toHaveCount(0);
    }
    await page.screenshot({path:testInfo.outputPath(`harmony-${name}.png`)});
    await page.getByRole('button',{name:'Put instrument down'}).click();
  }
  await page.getByRole('button',{name:'Open settings',exact:true}).dblclick();await page.getByRole('tab',{name:'Instruments',exact:true}).click();
  await page.getByRole('combobox',{name:'Instrument slot 1',exact:true}).selectOption('melody');
  await page.getByRole('button',{name:'Close settings',exact:true}).click();await equip(page,'melody');await publish(page,'melody');
  await expect(page.locator('.lip-segment[data-harmony-hint]').first()).toBeVisible();
  await expect(page.locator('.valve-control[aria-pressed="true"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('audible-key mismatch and practice or menu boundaries remove harmony hints',async({page})=>{
  await start(page);await equip(page,'piano');const initial=await publish(page,'piano');
  await expect(page.locator('[data-harmony-hint]').first()).toBeVisible();
  await publish(page,'piano',{root:'E'});await expect(page.locator('[data-harmony-hint]')).toHaveCount(0);
  await page.evaluate(()=>window.audioEngine.onSceneKeyChange('E'));
  await expect(page.locator('[data-harmony-hint]').first()).toBeVisible();
  await page.evaluate(root=>window.audioEngine.onSceneKeyChange(root),initial.root);
  await expect(page.locator('[data-harmony-hint]')).toHaveCount(0);
  await publish(page,'piano');await expect(page.locator('[data-harmony-hint]').first()).toBeVisible();
  await page.locator('#young-musician').focus();await page.keyboard.press('Enter');
  await expect(page.locator('.practice-room')).toBeVisible();await publish(page,'piano');
  await expect(page.locator('[data-harmony-hint]')).toHaveCount(0);
  await page.getByRole('button',{name:'Leave practice through the open door'}).click();
  await expect(page.locator('.performance-panel')).toBeVisible();await expect(page.locator('[data-harmony-hint]')).toHaveCount(0);
  await publish(page,'piano');await expect(page.locator('[data-harmony-hint]').first()).toBeVisible();
  await page.getByRole('button',{name:'Open settings',exact:true}).dblclick();
  await page.getByRole('button',{name:'Return to main menu'}).click();
  await expect(page.locator('.start-overlay')).toBeVisible();await publish(page,'piano');
  await expect(page.locator('[data-harmony-hint],.harmony-next-name')).toHaveCount(0);
});

test('Sound restore defaults resets every gain and scenery without saving or changing preferences',async({page})=>{
  await start(page);await settings(page,'piano','Standard');await page.getByLabel('Show note and control labels').check();
  const before=await page.evaluate(()=>({settings:localStorage.getItem('farmjam-settings-v1'),family:localStorage.getItem('farmjam-children-v1')}));
  await page.getByRole('tab',{name:'Sound',exact:true}).click();
  for(const slider of await page.getByRole('slider').all())await slider.fill('-18');
  await page.getByRole('button',{name:'Restore defaults',exact:true}).click();
  const defaults=await page.evaluate(async()=>{const {defaultSoundMix}=await import('/src/utils/settings.js');return defaultSoundMix();});
  await expect(page.getByRole('slider',{name:'Scenery sounds volume',exact:true})).toHaveValue(String(defaults.sceneVolume));
  expect(await page.evaluate(()=>window.audioEngine.volumes)).toEqual(defaults.volumes);
  expect(await page.evaluate(()=>window.audioEngine.sceneVolume)).toBe(defaults.sceneVolume);
  expect(await page.evaluate(()=>({settings:localStorage.getItem('farmjam-settings-v1'),family:localStorage.getItem('farmjam-children-v1')}))).toEqual(before);
  await page.getByRole('tab',{name:'Instruments',exact:true}).click();
  await expect(page.getByRole('radio',{name:'Standard',exact:true})).toBeChecked();
  await expect(page.getByLabel('Show note and control labels')).toBeChecked();
});