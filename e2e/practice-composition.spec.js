import {test,expect} from './fixtures.js';

async function start(page) {
  const size=page.viewportSize();
  if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button',{name:'Tap to play',exact:true}).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  return errors;
}

async function enter(page,name) {
  await page.locator(`#instrument-${name}`).focus();
  await page.keyboard.press('e');
  await expect(page.locator(`.performance-${name}`)).toBeVisible();
  await page.locator('#young-musician').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog',{name:'Farm practice room'})).toBeVisible();
  await expect(page.getByRole('combobox',{name:'Practice instrument'})).toHaveValue(name);
  await page.getByRole('button',{name:'2. Learn',exact:true}).click();
  await expect(page.getByRole('button',{name:'2. Learn',exact:true})).toHaveAttribute('aria-pressed','true');
}

async function loadProfile(page,name) {
  return page.evaluate(async name=>{
    const {equippedProfile}=await import('/src/utils/difficulty.js');
    const {practiceProfile}=await import('/src/utils/practiceComposition.js');
    const {compositionProfile}=await import('/src/utils/composition.js');
    const {SETTINGS_KEY,loadSettings}=await import('/src/utils/settings.js');
    const {SCENE_ROOTS}=await import('/src/utils/dayCycle.js');
    const saved=JSON.parse(localStorage.getItem(SETTINGS_KEY));
    const options={...loadSettings(localStorage).instruments[name],noteLabels:true,playbackNotes:true,fingeringCharts:true};
    const root=SCENE_ROOTS.farm;
    const legacy=equippedProfile(name,root,options);
    const profile=practiceProfile(name,root,options);
    const accompaniment=compositionProfile(name,root,{...options,role:'accompaniment'});
    return {profile,legacyCount:legacy.phrases.length,accompanimentCount:accompaniment.length,savedOptions:saved?.instruments?.[name]};
  },name);
}

async function expectLayout(page) {
  const labels=page.locator('.practice-target strong, .practice-feedback-display strong');
  await expect(labels).toHaveCount(2);
  await expect.poll(()=>labels.evaluateAll(elements=>elements.every(element=>{
    const bounds=element.getBoundingClientRect();
    const parent=element.parentElement.getBoundingClientRect();
    const row=element.closest('.practice-guide').getBoundingClientRect();
    const range=document.createRange();range.selectNodeContents(element);
    const text=range.getBoundingClientRect();
    return bounds.width>0&&bounds.height>0&&text.left>=parent.left-1&&text.right<=parent.right+1&&text.top>=row.top-1&&text.bottom<=row.bottom+1;
  })),{message:'Practice target and feedback labels fit their containers'}).toBe(true);
  await expect.poll(()=>page.locator('.practice-target, .practice-feedback-display').evaluateAll(elements=>{
    const [target,feedback]=elements.map(element=>element.getBoundingClientRect());
    return target.right<=feedback.left+1||feedback.right<=target.left+1||target.bottom<=feedback.top+1||feedback.bottom<=target.top+1;
  }),{message:'Practice target and feedback do not overlap'}).toBe(true);
  const selects=page.getByRole('combobox');
  await expect(selects).toHaveCount(2);
  await expect.poll(()=>selects.evaluateAll(elements=>{
    const bounds=elements.map(element=>element.getBoundingClientRect());
    return bounds.every(box=>box.width>0&&box.height>0&&box.left>=0&&box.top>=0&&box.right<=innerWidth+1&&box.bottom<=innerHeight+1)&&
      (bounds[0].right<=bounds[1].left+1||bounds[1].right<=bounds[0].left+1||bounds[0].bottom<=bounds[1].top+1||bounds[1].bottom<=bounds[0].top+1);
  }),{message:'Instrument and motif selectors remain separate and in the viewport'}).toBe(true);
}

async function pianoKey(page,note) {
  await page.getByRole('button',{name:`Piano key ${note}`,exact:true}).focus();
  await page.keyboard.press('Space');
}

test('Simple appended piano accompaniment learns whole events, rejects wrong notes and restarts',async({page},testInfo)=>{
  const errors=await start(page);
  await page.getByRole('button',{name:'Open settings',exact:true}).dblclick();
  await page.getByRole('tab',{name:'Instruments',exact:true}).click();
  await page.getByRole('combobox',{name:'Configure instrument'}).selectOption('piano');
  await page.getByRole('radio',{name:'Simple',exact:true}).check();
  await page.getByRole('button',{name:'Close settings',exact:true}).click();
  await enter(page,'piano');
  const {profile,legacyCount,savedOptions}=await loadProfile(page,'piano');
  expect(savedOptions.complexity).toBe(.35);
  expect(profile.level).toBe('Simple');
  const phrase=profile.phrases[legacyCount];
  expect(phrase).toMatchObject({name:'held',role:'accompaniment',degree:0});
  expect(phrase.events).toHaveLength(2);
  for(const event of phrase.events)expect(event.notes).toHaveLength(2);
  const selector=page.getByRole('combobox',{name:'Practice phrase'});
  await expect(selector.locator('option')).toHaveCount(profile.phrases.length);
  await selector.selectOption(String(legacyCount));
  await expect(selector.locator('option:checked')).toHaveText(/Held.*accompaniment.*2 actions/);
  const target=page.locator('.practice-target strong');
  const progress=page.getByRole('progressbar',{name:'Practice progress',exact:true});
  const next=page.getByRole('button',{name:'Next practice step',exact:true});
  await expect(progress).toHaveAttribute('max','2');
  await expect(progress).toHaveAttribute('value','0');
  await expect(target).toHaveText(phrase.events[0].notes.join(' + '));
  await expect(next).toBeDisabled();
  await expectLayout(page);
  await page.screenshot({path:testInfo.outputPath('piano-appended-accompaniment.png')});
  const wrong=profile.keyboardNotes.find(note=>!phrase.events[0].notes.includes(note));
  expect(wrong).toBeTruthy();
  await pianoKey(page,wrong);
  await expect(page.locator('.practice-feedback-display')).toHaveText('Try again');
  await expect(target).toHaveText(phrase.events[0].notes.join(' + '));
  await expect(progress).toHaveAttribute('value','0');
  for(const [index,event] of phrase.events.entries()){
    await expect(target).toHaveText(event.notes.join(' + '));
    await pianoKey(page,event.notes[0]);
    await expect(page.locator('.practice-feedback-display')).toHaveText('Good note, finish the chord');
    await expect(progress).toHaveAttribute('value',String(index));
    await expect(target).toHaveText(event.notes.join(' + '));
    await pianoKey(page,event.notes[1]);
    await expect(progress).toHaveAttribute('value',String(index+1));
    await expect(page.locator('.practice-feedback-display')).toHaveText(index===phrase.events.length-1?'Phrase learned!':'Correct!');
  }
  await expect(target).toHaveText('Finished');
  await expect(page.locator('.practice-phrase-track .is-complete')).toHaveCount(2);
  await expect(next).toBeEnabled();
  await page.getByRole('button',{name:'Restart practice',exact:true}).click();
  await expect(progress).toHaveAttribute('value','0');
  await expect(target).toHaveText(phrase.events[0].notes.join(' + '));
  await expect(page.locator('.practice-feedback-display')).toHaveText('Ready');
  await expect(page.locator('.practice-phrase-track .is-complete')).toHaveCount(0);
  await expect(next).toBeDisabled();
  expect(errors).toEqual([]);
});

test('appended ukulele melody keeps original note targets and canonical string fingering',async({page},testInfo)=>{
  const errors=await start(page);
  await enter(page,'ukulele');
  const {profile,legacyCount,accompanimentCount}=await loadProfile(page,'ukulele');
  const index=legacyCount+accompanimentCount;
  const phrase=profile.phrases[index];
  expect(phrase).toMatchObject({name:'answer',role:'melody',degree:0});
  const selector=page.getByRole('combobox',{name:'Practice phrase'});
  await expect(selector.locator('option')).toHaveCount(profile.phrases.length);
  await selector.selectOption(String(index));
  await expect(selector.locator('option:checked')).toHaveText(/Answer.*melody.*2 actions/);
  const target=page.locator('.practice-target strong');
  const progress=page.getByRole('progressbar',{name:'Practice progress',exact:true});
  const next=page.getByRole('button',{name:'Next practice step',exact:true});
  await expect(progress).toHaveAttribute('max',String(phrase.events.length));
  await expect(progress).toHaveAttribute('value','0');
  for(const [eventIndex,event] of phrase.events.entries()){
    expect(event.notes).toBeUndefined();
    expect(event.fingering).toHaveLength(1);
    const chord=profile.chords.find(value=>value.name===event.chord);
    expect(chord).toBeTruthy();
    await expect(target).toHaveText(event.note);
    await expect(next).toBeDisabled();
    await expect(page.locator('.neck-chord-name')).toHaveText(chord.name);
    const markers=page.locator('.phrase-note-dot:not(.manual-note-dot)');
    await expect(markers).toHaveCount(event.fingering.length);
    expect(await markers.evaluateAll(items=>items.map(item=>({string:Number(item.dataset.string)-1,fret:Number(item.dataset.fret)})))).toEqual(event.fingering.map(({string,fret})=>({string,fret})));
    expect(await page.locator('.fingering-dot').evaluateAll(items=>items.map(item=>Number(item.dataset.fret)))).toEqual(chord.frets);
    expect(await page.locator('.playable-string').evaluateAll(items=>items.map(item=>item.getAttribute('aria-label')))).toEqual(chord.notes.map((note,string)=>`Ukulele string ${string+1} ${note}`));
    await expectLayout(page);
    if(eventIndex===0)await page.screenshot({path:testInfo.outputPath('ukulele-appended-melody.png')});
    const button=page.getByRole('button',{name:`Hold ukulele chord ${chord.name}`,exact:true});
    await expect(button).toBeVisible();
    const bounds=await button.boundingBox();
    await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
    await page.mouse.down();
    try{
      await expect(target).toHaveText(event.note);
      for(const input of event.fingering){
        expect(input.note).toBe(event.note);
        expect(input.note).toBe(chord.notes[input.string]);
        expect(input.fret).toBe(chord.frets[input.string]);
        await page.locator('.playable-string').nth(input.string).focus();
        await page.keyboard.press('Space');
      }
    }finally{await page.mouse.up();}
    await expect(progress).toHaveAttribute('value',String(eventIndex+1));
  }
  await expect(target).toHaveText('Finished');
  await expect(page.locator('.practice-feedback-display')).toHaveText('Phrase learned!');
  await expect(page.locator('.practice-phrase-track .is-complete')).toHaveCount(phrase.events.length);
  await expect(next).toBeEnabled();
  const pulseIndex=profile.phrases.findIndex((value,phraseIndex)=>phraseIndex>=legacyCount&&value.name==='pulse'&&value.role==='accompaniment'&&value.degree===0);
  expect(pulseIndex).toBeGreaterThanOrEqual(legacyCount);
  await selector.selectOption(String(pulseIndex));
  await expect(progress).toHaveAttribute('max',String(profile.phrases[pulseIndex].events.length));
  await expect(progress).toHaveAttribute('value','0');
  await expect(target).toHaveText(profile.phrases[pulseIndex].events[0].notes.join(' + '));
  await expect(page.locator('.practice-feedback-display')).toHaveText('Ready');
  await expect(page.locator('.practice-phrase-track .is-complete')).toHaveCount(0);
  await expect(next).toBeDisabled();
  expect(errors).toEqual([]);
});