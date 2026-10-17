import {test,expect} from '@playwright/test';

const key='farmjam-learning-v1';
async function seed(page,{age='5to7',progress={enabled:true,seconds:0,hints:{}},guides={}}={}) {
  await page.addInitScript(({age,progress,guides,key})=>{
    if(localStorage.getItem('farmjam-children-v1')!==null)return;
    localStorage.setItem('farmjam-children-v1',JSON.stringify({children:[{id:'a',name:'Alex',age},{id:'b',name:'Sam',age:'8plus'}],selectedId:'a'}));
    localStorage.setItem(key,JSON.stringify({guides,children:{a:progress}}));
  },{age,progress,guides,key});
}
async function visit(page) {
  const size=page.viewportSize();if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});
  await page.goto('/');
}
async function play(page) {
  await page.getByRole('button',{name:'Tap to play',exact:true}).click();
  await expect(page.locator('#young-musician')).toBeVisible({timeout:30000});
}
async function state(page) {return page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'null'),key);}
async function settings(page) {await page.getByRole('button',{name:/^Settings/}).click();}
async function savedHint(page,id) {return (await state(page)).children.a.hints[id];}
async function lastGuidePage(page) {
  const jump=page.getByRole('combobox',{name:'Choose a guide page',exact:true});
  await jump.selectOption(await jump.locator('option').last().getAttribute('value'));
}

test('main-menu Settings works before setup and keeps familiarity outside sound controls',async({page})=>{
  await visit(page);
  await expect(page.getByRole('button',{name:'Tap to play'})).toBeDisabled();
  await settings(page);
  await expect(page.getByRole('tab',{name:'Caregiver',exact:true})).toBeVisible();
  await expect(page.getByRole('tab',{name:'Sound',exact:true})).toHaveCount(0);
  await page.getByRole('radio',{name:'New to music',exact:true}).check();
  await page.getByRole('button',{name:'Done with settings'}).click();
  await page.getByRole('button',{name:'Add child',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Child name'})).toBeVisible();
  await expect(page.getByText('How familiar are you with music?',{exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Cancel setup',exact:true}).click();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('farmjam-caregiver-settings-v1')).familiarity)).toBe('new');
});

test('guide opening is not completion and explicit read status survives reload',async({page},testInfo)=>{
  await visit(page);await settings(page);await page.getByRole('tab',{name:/^Guides/}).click();
  const card=page.locator('.guide-card').filter({has:page.getByRole('heading',{name:/Play an instrument/})});
  await expect(card).toContainText('Unread');
  await card.getByRole('button').click();
  await expect(page.getByRole('dialog',{name:'Play an instrument',exact:true})).toBeVisible();
  await page.screenshot({path:`test-results/learning-${testInfo.project.name}-guide.png`});
  expect(await state(page)).toBeNull();
  await expect(page.getByRole('button',{name:'Mark as read',exact:true})).toHaveCount(0);
  await lastGuidePage(page);await page.getByRole('button',{name:'Mark as read',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Play an instrument',exact:true})).toBeVisible();
  await expect.poll(async()=>((await state(page))?.guides.instruments)).toBe(2);
  await page.reload();await settings(page);await page.getByRole('tab',{name:/^Guides/}).click();
  await expect(card).toContainText('Read');await expect(card).not.toContainText('Unread');
});

test('updated guide revisions show New without changing other read guides',async({page})=>{
  await seed(page,{guides:{instruments:2,landscape:2}});
  await page.route('**/src/utils/learning.js*',async route=>{
    const response=await route.fetch();const source=await response.text();
    const body=source.replace(/(id:\s*["']instruments["'],\s*version:\s*)2/,(_match,prefix)=>`${prefix}3`);
    expect(body===source,'guide revision should be changed by the test fixture').toBe(false);await route.fulfill({response,body});
  });
  await visit(page);await settings(page);await page.getByRole('tab',{name:/^Guides/}).click();
  await expect(page.locator('.guide-card').filter({hasText:'Play an instrument'})).toContainText('New');
  await expect(page.locator('.guide-card').filter({hasText:'Explore the landscape'})).toContainText('Read');
});

test('suggestions wait for a click, persist across starts, and distinguish viewing from doing',async({page})=>{
  await seed(page);await visit(page);await play(page);
  const beacon=page.getByRole('button',{name:'Learn something new: Start a little band',exact:true});
  await expect(beacon).toBeVisible();await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(async()=>(await savedHint(page,'tap'))?.suggested).toBe(true);
  await page.reload();await play(page);await expect(beacon).toBeVisible();await beacon.click();
  const coach=page.locator('.live-coach');await expect(coach).toHaveAttribute('data-hint','tap');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button',{name:'Replay gesture',exact:true}).click();
  expect(await savedHint(page,'tap')).toMatchObject({suggested:true,seen:true,completed:false});
  await page.reload();await play(page);await expect(beacon).toBeVisible();await beacon.click();
  await expect(page.locator('.live-coach')).toHaveAttribute('data-hint','tap');
  await page.getByRole('button',{name:'Stop hint',exact:true}).click();await expect(beacon).toHaveCount(0);
  expect(await savedHint(page,'tap')).toMatchObject({suggested:true,seen:true,completed:false});
  await page.locator('#instrument-piano').press('Enter');
  await expect.poll(async()=>(await savedHint(page,'tap')).completed).toBe(true);
});

test('age rules suppress complex suggestions while a parent can resuggest and disable them',async({page})=>{
  await seed(page,{age:'under3',progress:{enabled:true,seconds:600,hints:{tap:{completed:true},landscape:{completed:true}}}});
  await visit(page);await play(page);await expect(page.locator('.learning-beacon')).toHaveCount(0);
  await page.getByRole('button',{name:'Open settings',exact:true}).dblclick();await page.getByRole('tab',{name:'Caregiver',exact:true}).click();
  await page.getByRole('button',{name:'Suggest play it yourself again',exact:true}).click();
  await page.getByRole('checkbox',{name:'Offer learning hints',exact:true}).uncheck();
  await page.getByRole('button',{name:'Close settings',exact:true}).click();await expect(page.locator('.learning-beacon')).toHaveCount(0);
  await page.getByRole('button',{name:'Open settings',exact:true}).dblclick();await page.getByRole('tab',{name:'Caregiver',exact:true}).click();
  await page.getByRole('checkbox',{name:'Offer learning hints',exact:true}).check();await page.getByRole('button',{name:'Close settings',exact:true}).click();
  await page.getByRole('button',{name:'Learn something new: Play it yourself',exact:true}).click();
  await expect(page.locator('.live-coach')).toHaveAttribute('data-hint','equip');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('#instrument-piano').focus();await page.keyboard.press('e');
  await expect(page.locator('.performance-panel')).toBeVisible();
  expect((await savedHint(page,'equip')).completed).toBe(false);
  await page.getByRole('button',{name:'Piano key C4',exact:true}).press('Space');
  await expect.poll(async()=>(await savedHint(page,'equip')).completed).toBe(true);
});

test('learning progress and hint enable switches are independent for siblings',async({page})=>{
  await seed(page,{progress:{enabled:false,seconds:650,hints:{equip:{completed:true}}}});await visit(page);
  await settings(page);await expect(page.getByRole('checkbox',{name:'Offer learning hints'})).not.toBeChecked();
  await page.getByRole('button',{name:'Done with settings'}).click();await page.getByRole('radio',{name:'Select Sam',exact:true}).click();
  await settings(page);await expect(page.getByRole('checkbox',{name:'Offer learning hints'})).toBeChecked();
  await page.getByRole('button',{name:'Suggest try a musical conversation again',exact:true}).click();
  const saved=await state(page);expect(saved.children.a.enabled).toBe(false);expect(saved.children.a.hints.equip.completed).toBe(true);
  expect(saved.children.b.hints.practice.suggested).toBe(true);expect(saved.children.b.seconds).toBe(0);
});

test('context help offers pointer alternatives and reduced-motion demonstrations stay still',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await seed(page);await visit(page);await play(page);
  await page.getByRole('button',{name:'Open caregiver help',exact:true}).click();
  await page.getByRole('button',{name:'Play it yourself',exact:true}).click();await expect(page.locator('.performance-panel')).toBeVisible();
  await page.getByRole('button',{name:'Open caregiver help',exact:true}).click();
  const help=page.getByRole('dialog',{name:'Caregiver help',exact:true});await help.getByRole('button',{name:'Show me',exact:true}).click();
  expect(await help.locator('.guide-pointer').evaluate(element=>getComputedStyle(element).animationName)).toBe('none');
  for(const instrument of ['ukulele','panflute']) {
    await page.keyboard.press('Escape');await page.getByRole('button',{name:'Put instrument down',exact:true}).click();
    await page.getByRole('button',{name:'Open caregiver help',exact:true}).click();
    await help.getByRole('combobox',{name:'Instrument to play yourself',exact:true}).selectOption(instrument);
    await help.getByRole('button',{name:'Play it yourself',exact:true}).click();
    await page.getByRole('button',{name:'Open caregiver help',exact:true}).click();
    await expect(help.locator('.guide-surface')).toHaveCount(1);
    await expect(help.locator(`.performance-${instrument}`)).toHaveCount(1);
    await expect(help.locator('figcaption')).toContainText(instrument==='panflute'?'pipes':'strings');
  }
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'Put instrument down',exact:true}).click();
  await page.getByRole('button',{name:'Open caregiver help',exact:true}).click();
  await page.getByRole('button',{name:'Open practice',exact:true}).click();await expect(page.getByRole('dialog',{name:'Farm practice room',exact:true})).toBeVisible();
});

test('active play time pauses in Settings, persists, and does not grant time between visits',async({page})=>{
  await seed(page);await page.clock.install();await visit(page);await play(page);
  await page.getByRole('button',{name:'Learn something new: Start a little band',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.clock.runFor(5100);await expect.poll(async()=>(await state(page)).children.a.seconds).toBeGreaterThanOrEqual(5);
  await page.getByRole('button',{name:'Open settings',exact:true}).dblclick();
  const paused=(await state(page)).children.a.seconds;await page.clock.runFor(20000);
  expect((await state(page)).children.a.seconds).toBe(paused);
  await page.getByRole('button',{name:'Close settings',exact:true}).click();
  await page.getByRole('button',{name:'Open metronome',exact:true}).click();
  await page.clock.runFor(100);const metronomePaused=(await state(page)).children.a.seconds;
  await page.clock.runFor(20000);expect((await state(page)).children.a.seconds).toBe(metronomePaused);
  await page.keyboard.press('Escape');
  const size=page.viewportSize();await page.setViewportSize({width:393,height:851});
  await expect(page.getByRole('dialog',{name:'Landscape orientation required',exact:true})).toBeVisible();
  await page.clock.runFor(100);const portraitPaused=(await state(page)).children.a.seconds;
  await page.clock.runFor(20000);expect((await state(page)).children.a.seconds).toBe(portraitPaused);
  await page.setViewportSize(size);
  await page.getByRole('button',{name:'Open settings',exact:true}).dblclick();
  const finalPause=(await state(page)).children.a.seconds;
  await page.getByRole('button',{name:'Return to main menu'}).click();await page.clock.runFor(60000);
  expect((await state(page)).children.a.seconds).toBe(finalPause);
});

test('an installation offer received on the menu remains available when its guide is opened later',async({page})=>{
  await visit(page);await expect(page.getByRole('button',{name:/^Settings/})).toBeVisible();
  const captured=await page.evaluate(()=>{
    window.earlyInstallCalls=0;const event=new Event('beforeinstallprompt',{cancelable:true});
    event.prompt=async()=>{window.earlyInstallCalls++;};event.userChoice=Promise.resolve({outcome:'dismissed'});
    window.dispatchEvent(event);return event.defaultPrevented;
  });
  expect(captured).toBe(true);await settings(page);await page.getByRole('tab',{name:/^Guides/}).click();
  await page.getByRole('button',{name:'Read install and prepare your device',exact:true}).click();
  await page.getByRole('button',{name:'Install FarmJam',exact:true}).click();
  await expect(page.getByText('You can keep playing in the browser.',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>window.earlyInstallCalls)).toBe(1);
});

test('failed learning reads preserve sibling progress until retry and save failures retain live choices',async({page})=>{
  await seed(page,{guides:{landscape:1}});
  await page.addInitScript(()=>{
    const get=Storage.prototype.getItem,set=Storage.prototype.setItem;
    window.learningReadBlocked=true;window.learningWriteBlocked=false;
    Storage.prototype.getItem=function(key){if(key==='farmjam-learning-v1'&&window.learningReadBlocked)throw Error('blocked read');return get.call(this,key);};
    Storage.prototype.setItem=function(key,value){if(key==='farmjam-learning-v1'&&window.learningWriteBlocked)throw Error('full');return set.call(this,key,value);};
  });
  await visit(page);await settings(page);await page.getByRole('tab',{name:/^Guides/}).click();
  await page.getByRole('button',{name:'Read play an instrument',exact:true}).click();await lastGuidePage(page);await page.getByRole('button',{name:'Mark as read'}).click();
  await page.getByRole('button',{name:'Close caregiver dialog',exact:true}).click();
  await page.evaluate(()=>{window.learningReadBlocked=false;window.learningWriteBlocked=true;});
  await page.getByRole('button',{name:'Retry saving',exact:true}).click();
  await expect(page.locator('.save-status')).toBeVisible();
  await page.evaluate(()=>{window.learningWriteBlocked=false;});await page.getByRole('button',{name:'Retry saving',exact:true}).click();
  await expect(page.locator('.save-status')).toHaveCount(0);
  const saved=await state(page);expect(saved.guides).toMatchObject({instruments:2,landscape:1});
});
