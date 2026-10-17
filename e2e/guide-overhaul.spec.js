import {test,expect} from '@playwright/test';

const learningKey='farmjam-learning-v1';
async function start(page,{hints={},age='5to7'}={}) {
  const size=page.viewportSize();if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});
  await page.addInitScript(({hints,age,learningKey})=>{
    if(localStorage.getItem('farmjam-children-v1')!==null)return;
    localStorage.setItem('farmjam-children-v1',JSON.stringify({children:[{id:'alex',name:'Alex',age}],selectedId:'alex'}));
    localStorage.setItem(learningKey,JSON.stringify({guides:{},children:{alex:{enabled:true,seconds:0,hints}}}));
  },{hints,age,learningKey});
  await page.goto('/');
}
async function guides(page) {await page.getByRole('button',{name:/^Settings/}).click();await page.getByRole('tab',{name:/^Guides/}).click();}
async function jump(page,index) {await page.getByRole('combobox',{name:'Choose a guide page',exact:true}).selectOption(String(index));}
async function play(page) {await page.getByRole('button',{name:'Tap to play',exact:true}).click();await expect(page.locator('#young-musician')).toBeVisible({timeout:30000});}
async function hintState(page,id) {return page.evaluate(({learningKey,id})=>JSON.parse(localStorage.getItem(learningKey)).children.alex.hints[id],{learningKey,id});}
async function reachablePoint(locator) {
  return locator.evaluate(element=>{
    const rect=element.getBoundingClientRect();
    for(const row of [16,8,24,4,28])for(const column of [16,8,24,4,28]){
      const x=rect.left+rect.width*column/32,y=rect.top+rect.height*row/32;
      if(element.contains(document.elementFromPoint(x,y)))return{x,y};
    }
    throw Error('No reachable native pointer target');
  });
}
async function dragToAvatar(page,instrument='piano') {
  const from=await reachablePoint(page.locator(`#instrument-${instrument}`)),to=await reachablePoint(page.locator('#young-musician'));
  if(await page.evaluate(()=>matchMedia('(pointer: coarse)').matches)) {
    const client=await page.context().newCDPSession(page);
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...from}]});
    for(let step=1;step<=12;step++)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:from.x+(to.x-from.x)*step/12,y:from.y+(to.y-from.y)*step/12}]});
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await client.detach();
  } else {
    await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:12});await page.mouse.up();
  }
}
async function doubleTapAvatar(page) {
  const point=await reachablePoint(page.locator('#young-musician'));
  if(await page.evaluate(()=>matchMedia('(pointer: coarse)').matches)) {
    const client=await page.context().newCDPSession(page);
    for(let tap=0;tap<2;tap++){
      await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...point}]});
      await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }
    await client.detach();
  } else await page.mouse.dblclick(point.x,point.y);
}

test('every guide has task pages, working navigation, and an explicit last-page read action',async({page})=>{
  await start(page);await guides(page);
  const settings=page.getByRole('dialog',{name:'Settings',exact:true});
  for(const [title,count] of [['Play an instrument',5],['Explore the landscape',3],['Use the practice room',7],['Choose instruments and settings',6],['Install and prepare your device',3],['Play together',1],['Manage child profiles',3]]) {
    const trigger=page.getByRole('button',{name:`Read ${title.toLowerCase()}`,exact:true});await trigger.click();
    const reader=page.getByRole('dialog',{name:title,exact:true});
    await expect(reader.locator('.guide-page-picker')).toContainText(`1 of ${count}`);
    await expect(reader.getByRole('button',{name:'Back',exact:true})).toBeDisabled();
    await expect(reader.locator('[data-guide-page]')).toHaveCount(1);
    if(count>1) {
      await expect(reader.getByRole('button',{name:'Mark as read',exact:true})).toHaveCount(0);
      await reader.getByRole('button',{name:'Next',exact:true}).click();await expect(reader.locator('.guide-page-picker')).toContainText(`2 of ${count}`);
      await expect(reader.locator('[data-guide-page] h3')).toBeFocused();
      await reader.getByRole('button',{name:'Back',exact:true}).click();await expect(reader.locator('.guide-page-picker')).toContainText(`1 of ${count}`);
    }
    await jump(page,count-1);await reader.getByRole('button',{name:'Mark as read',exact:true}).click();
    await expect(reader).toBeVisible();await expect(reader.getByRole('button',{name:'Read',exact:true})).toBeDisabled();
    await reader.getByRole('button',{name:'All guides',exact:true}).click();
    await expect(page.getByRole('dialog',{name:'Guides',exact:true}).locator('.guide-card').filter({has:page.getByRole('heading',{name:new RegExp(`^${title}`)})})).toContainText('Read');
    await page.keyboard.press('Escape');await expect(settings).toBeVisible();await expect(trigger).toBeFocused();
  }
});

test('practice pages explain the actual room controls and show inert shared artwork',async({page},testInfo)=>{
  await start(page);await guides(page);await page.getByRole('button',{name:'Read use the practice room',exact:true}).click();
  const reader=page.getByRole('dialog',{name:'Use the practice room',exact:true});
  await jump(page,1);await expect(reader).toContainText('instrument and phrase selectors');await expect(reader).toContainText('stage row');
  const preview=reader.locator('.guide-room-canvas');await expect(preview).toHaveAttribute('inert','');
  await page.screenshot({path:`artifacts.local/guide-overhaul/practice-guide-${testInfo.project.name}.png`});
  await expect(preview.locator('.practice-select select')).toHaveCount(2);await expect(preview.locator('.practice-stages button')).toHaveCount(4);
  await expect(preview.locator('.practice-progress progress')).toHaveCount(1);await expect(preview.locator('.guide-metronome-art')).toHaveCount(1);await expect(preview.locator('.practice-exit')).toHaveCount(1);
  for(const [index,phrases] of [[2,['Ready','count-in','Stop','Next']],[3,['no Ready button','waits for you','every highlighted note']],[4,['Rhythm','hold duration is not scored']],[5,['Together','Two quieter partner instruments','Finish']],[6,['Stop','Repeat','Restart','progress display','open door or Escape']]]) {
    await jump(page,index);for(const phrase of phrases)await expect(reader.locator('.guide-task-copy')).toContainText(phrase);
  }
  await expect(reader.locator('.guide-room-detail')).toHaveAttribute('inert','');await expect(reader.locator('.practice-control-dock')).toContainText('Repeat');await expect(reader.locator('.practice-restart-button')).toContainText('Restart');await expect(reader.locator('.practice-exit')).toHaveCount(1);
  const bounds=await reader.evaluate(element=>({rect:element.getBoundingClientRect().toJSON(),width:innerWidth,height:innerHeight,scroll:element.scrollWidth,client:element.clientWidth}));
  expect(bounds.rect.x).toBeGreaterThanOrEqual(0);expect(bounds.rect.bottom).toBeLessThanOrEqual(bounds.height+1);expect(bounds.rect.right).toBeLessThanOrEqual(bounds.width+1);expect(bounds.scroll).toBeLessThanOrEqual(bounds.client+1);
});

test('instrument guide previews use real controls, stay silent, and support keyboard page changes',async({page})=>{
  await page.addInitScript(()=>{
    window.guideAudioStarts=0;
    for(const node of [window.AudioBufferSourceNode,window.OscillatorNode])if(node){const start=node.prototype.start;node.prototype.start=function(...args){window.guideAudioStarts++;return start.apply(this,args);};}
  });
  await page.emulateMedia({reducedMotion:'reduce'});await start(page);const before=await page.evaluate(()=>window.guideAudioStarts);
  await guides(page);await page.getByRole('button',{name:'Read play an instrument',exact:true}).click();
  const jumpSelect=page.getByRole('combobox',{name:'Choose a guide page',exact:true});await jumpSelect.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
  await expect(page.locator('[data-guide-page="equip"]')).toBeVisible();
  await expect(page.locator('.guide-art-equip .instrument-illustration')).toHaveCount(1);await expect(page.locator('.guide-art-equip .child-avatar')).toHaveCount(1);
  await jump(page,2);
  await page.getByRole('button',{name:'Show gesture',exact:true}).click();await expect(page.locator('.guide-art-surface')).toHaveClass(/is-demonstrating/);
  const poses=await page.locator('.guide-art-surface').evaluate(element=>[element.querySelector('.hand-point path').getAttribute('d'),element.querySelector('.hand-pressed path').getAttribute('d')]);expect(poses[0]).not.toBe(poses[1]);
  expect(await page.locator('.guide-pointer').evaluate(element=>getComputedStyle(element).animationName)).toBe('none');await page.getByRole('button',{name:'Replay gesture',exact:true}).click();
  for(const [instrument,selector] of [['piano','.manual-keyboard'],['drums','.manual-drums'],['ukulele','.manual-guitar'],['panflute','.panflute-pipes'],['melody','.performance-surface'],['flute','.performance-surface']]) {
    await page.getByRole('combobox',{name:'Guide instrument',exact:true}).selectOption(instrument);
    await expect(page.locator('.guide-surface')).toHaveAttribute('inert','');await expect(page.locator('.guide-surface')).toHaveAttribute('aria-hidden','true');
    await expect(page.locator(`.guide-surface ${selector}`)).toHaveCount(1);
    await expect(page.getByRole('dialog',{name:'Play an instrument',exact:true}).getByRole('button',{name:/Piano key|Drum|Pan flute/})).toHaveCount(0);
  }
  expect(await page.evaluate(()=>window.guideAudioStarts)).toBe(before);
});

test('reduced-motion coaching stays on the real target and dismissal can be reset',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await start(page);await play(page);
  const beacon=page.getByRole('button',{name:'Learn something new: Start a little band',exact:true});await beacon.click();
  const coach=page.locator('.live-coach');await expect(coach).toHaveAttribute('data-step','tap');
  await expect(coach.locator('.hand-pressed')).toBeVisible();
  const target=await page.locator('#instrument-piano').boundingBox();
  await expect.poll(async()=>coach.locator('.coach-hand').evaluate((element,target)=>Math.hypot(parseFloat(element.style.left)-target.x-target.width/2,parseFloat(element.style.top)-target.y-target.height/2),target)).toBeLessThan(.5);
  const before=await coach.locator('.coach-hand').getAttribute('style');await page.getByRole('button',{name:'Replay gesture',exact:true}).click();await expect(coach.locator('.coach-hand')).toHaveAttribute('style',before);
  expect(await hintState(page,'tap')).toMatchObject({seen:true,dismissed:false,completed:false});
  await page.getByRole('button',{name:'Stop hint',exact:true}).click();expect(await hintState(page,'tap')).toMatchObject({seen:true,dismissed:true,completed:false});
  await page.reload();await play(page);await expect(beacon).toHaveCount(0);
  await page.getByRole('button',{name:'Open settings',exact:true}).dblclick();await page.getByRole('tab',{name:'Caregiver',exact:true}).click();
  await page.getByRole('button',{name:'Suggest start a little band again',exact:true}).click();
  expect(await hintState(page,'tap')).toMatchObject({seen:false,dismissed:false,completed:false});
  await page.getByRole('button',{name:'Close settings',exact:true}).click();await expect(beacon).toBeVisible();
});

test('equip coach follows a native drag and waits for a real manual note',async({page})=>{
  await start(page,{hints:{tap:{completed:true},equip:{suggested:true}}});await play(page);
  await page.getByRole('button',{name:'Learn something new: Play it yourself',exact:true}).click();
  const coach=page.locator('.live-coach');await expect(coach).toHaveAttribute('data-hint','equip');await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(coach.locator('select')).toHaveCount(0);await expect(page.getByRole('button',{name:'Play it yourself',exact:true})).toHaveCount(0);expect(await coach.evaluate(element=>getComputedStyle(element).pointerEvents)).toBe('none');
  await expect(coach.locator('.coach-hand')).toBeVisible();
  expect((await hintState(page,'equip')).completed).toBe(false);
  await dragToAvatar(page);await expect(page.locator('.performance-piano')).toBeVisible();
  expect((await hintState(page,'equip')).completed).toBe(false);
  const key=page.getByRole('button',{name:'Piano key C4',exact:true});await key.press('ArrowRight');
  expect((await hintState(page,'equip')).completed).toBe(false);await key.click({button:'right'});await page.keyboard.press('Escape');
  expect((await hintState(page,'equip')).completed).toBe(false);await key.press('Space');
  await expect.poll(async()=>(await hintState(page,'equip')).completed).toBe(true);await expect(coach).toHaveCount(0);
});

test('practice coach follows a native double tap and waits for the actual Ready action',async({page},testInfo)=>{
  await start(page,{hints:{tap:{completed:true},equip:{completed:true},practice:{suggested:true}}});await play(page);
  await page.getByRole('button',{name:'Learn something new: Try a musical conversation',exact:true}).click();
  const coach=page.locator('.live-coach');await expect(coach).toHaveAttribute('data-hint','practice');
  await doubleTapAvatar(page);await expect(page.getByRole('dialog',{name:'Farm practice room',exact:true})).toBeVisible();
  expect((await hintState(page,'practice')).completed).toBe(false);await expect(coach.locator('.coach-hand')).toBeVisible();
  await expect(coach).toHaveAttribute('data-step','ready');
  const ready=page.getByRole('button',{name:'Start repeating',exact:true});
  await expect.poll(async()=>{
    const caption=await coach.locator('.coach-caption').boundingBox(),button=await ready.boundingBox();
    return caption.x+caption.width<=button.x||button.x+button.width<=caption.x||caption.y+caption.height<=button.y||button.y+button.height<=caption.y;
  },{message:'The hint controls must leave the real Ready button reachable'}).toBe(true);
  expect(await coach.evaluate(element=>Number(getComputedStyle(element).zIndex))).toBeGreaterThan(await page.locator('.practice-room').evaluate(element=>Number(getComputedStyle(element).zIndex)));
  await page.screenshot({path:`artifacts.local/guide-overhaul/practice-coach-${testInfo.project.name}.png`});
  await page.getByRole('button',{name:'Start repeating',exact:true}).click();
  await expect(page.getByRole('button',{name:'Stop practice',exact:true})).toBeVisible();
  await expect.poll(async()=>(await hintState(page,'practice')).completed).toBe(true);await expect(coach).toHaveCount(0);
});

test('string coaching teaches holding a chord before a real string gesture',async({page})=>{
  await start(page,{hints:{tap:{completed:true},equip:{suggested:true}}});await play(page);
  await page.getByRole('button',{name:'Learn something new: Play it yourself',exact:true}).click();await dragToAvatar(page,'ukulele');
  const coach=page.locator('.live-coach');await expect(coach).toHaveAttribute('data-step','chord');
  expect((await hintState(page,'equip')).completed).toBe(false);
  const chord=page.locator('.performance-panel .chord-control').first(),string=page.locator('.performance-panel .playable-string').first();
  const held=await reachablePoint(chord),box=await string.boundingBox(),second=await page.locator('.performance-panel .playable-string').nth(1).boundingBox(),strum={x:box.x+box.width*.86,y:box.y+box.height/2};
  const client=await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...held}]});
  await expect(coach).toHaveAttribute('data-step','play');expect((await hintState(page,'equip')).completed).toBe(false);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...held},{id:2,...strum}]});
  expect((await hintState(page,'equip')).completed).toBe(false);
  await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,...held},{id:2,x:strum.x,y:second.y+second.height/2}]});
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await client.detach();
  await expect.poll(async()=>(await hintState(page,'equip')).completed).toBe(true);await expect(coach).toHaveCount(0);
});

test('help suspends coaching and keyboard users can stop a hint inside practice',async({page})=>{
  await start(page,{hints:{tap:{completed:true},equip:{completed:true},practice:{suggested:true}}});await play(page);
  await page.getByRole('button',{name:'Learn something new: Try a musical conversation',exact:true}).click();
  const coach=page.locator('.live-coach');await expect(coach).toBeVisible();
  await page.getByRole('button',{name:'Open caregiver help',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Caregiver help',exact:true})).toBeVisible();await expect(coach).toHaveCount(0);
  await page.keyboard.press('Escape');await expect(coach).toBeVisible();await expect(page.getByRole('dialog')).toHaveCount(0);
  await doubleTapAvatar(page);await expect(coach).toHaveAttribute('data-step','ready');
  const stop=page.getByRole('button',{name:'Stop hint',exact:true});await page.getByRole('button',{name:'Start repeating',exact:true}).focus();
  const controls=await page.locator('.practice-room button:not(:disabled),.practice-room select,.live-coach button').count();
  for(let tab=0;tab<controls+2&&!await stop.evaluate(element=>element===document.activeElement);tab++)await page.keyboard.press('Tab');
  await expect(stop).toBeFocused();await page.keyboard.press('Enter');
  await expect(coach).toHaveCount(0);await expect(page.getByRole('dialog',{name:'Farm practice room',exact:true})).toBeVisible();
  expect(await hintState(page,'practice')).toMatchObject({seen:true,dismissed:true,completed:false});
});

for(const [id,title,selector] of [
  ['weather','Change the musical weather','.scenery-cloud-shape:visible'],
  ['landscape','Follow the sun','.celestial-control[data-settled="true"]']
])test(`${id} sky coaching leaves the real target clear after resizing`,async({page},testInfo)=>{
  await start(page,{hints:{tap:{completed:true},[id]:{suggested:true}}});await play(page);
  await page.getByRole('button',{name:`Learn something new: ${title}`,exact:true}).click();
  const coach=page.locator('.live-coach'),target=page.locator(selector).first(),caption=coach.locator('.coach-caption');
  await expect(coach).toHaveAttribute('data-hint',id);await expect(target).toBeVisible();await expect(coach.locator('.coach-hand')).toBeVisible();
  async function checkGeometry() {
    await expect.poll(async()=>{
      const control=await target.boundingBox(),controls=await caption.boundingBox();
      return control.x+control.width<=controls.x||controls.x+controls.width<=control.x||control.y+control.height<=controls.y||controls.y+controls.height<=control.y;
    },{message:'Hint controls must leave the actual sky target clear'}).toBe(true);
    await expect.poll(async()=>{
      const box=await target.boundingBox();
      return coach.locator('.coach-hand').evaluate((element,box)=>Math.hypot(parseFloat(element.style.left)-box.x-box.width/2,parseFloat(element.style.top)-box.y-box.height/2),box);
    },{message:'The hand must follow the actual sky target'}).toBeLessThan(.5);
  }
  await checkGeometry();expect((await hintState(page,id)).completed).toBe(false);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize(testInfo.project.name==='desktop'?{width:1280,height:720}:{width:844,height:390});
  await expect(coach.locator('.hand-pressed')).toBeVisible();await checkGeometry();
  await page.getByRole('button',{name:'Replay gesture',exact:true}).click();expect((await hintState(page,id)).completed).toBe(false);
  await page.screenshot({path:`artifacts.local/guide-overhaul/${id}-coach-${testInfo.project.name}.png`});
  const point=await reachablePoint(target);
  if(await page.evaluate(()=>matchMedia('(pointer: coarse)').matches)) {
    const client=await page.context().newCDPSession(page);
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...point}]});
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await client.detach();
  } else await page.mouse.click(point.x,point.y);
  await expect.poll(async()=>(await hintState(page,id)).completed).toBe(true);await expect(coach).toHaveCount(0);
});
