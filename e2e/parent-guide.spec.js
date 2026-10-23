import {test,expect} from '@playwright/test';

async function start(page){const size=page.viewportSize();if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});await page.goto('/');}
async function next(page){await page.getByRole('button',{name:'Next step',exact:true}).click();}
async function savedChildren(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('farmjam-children-v1')??'{"children":[],"selectedId":null}'));}
async function expectNoChild(page){expect((await savedChildren(page)).children).toEqual([]);expect(await page.evaluate(()=>localStorage.getItem('farmjam-parent-guide-v1'))).toBe(null);}
async function nameStep(page){await page.getByRole('button',{name:'Add child',exact:true}).click();await next(page);}
async function openInstallation(page){await page.getByRole('button',{name:/^Settings/}).click();await page.getByRole('tab',{name:/^Guides/}).click();await page.getByRole('button',{name:'Read install and prepare your device',exact:true}).click();await expect(page.getByRole('dialog',{name:'Install and prepare your device',exact:true})).toBeVisible();}
async function guidePage(page,index){await page.getByRole('combobox',{name:'Choose a guide page',exact:true}).selectOption(String(index));}

test('short setup saves age-aware settings only when the child is added',async({page})=>{
  await start(page);const play=page.getByRole('button',{name:'Tap to play'});await expect(play).toBeDisabled();
  await page.getByRole('button',{name:'Add child',exact:true}).click();
  await expect(page.getByRole('heading',{name:'How familiar are you with music?',exact:true})).toBeVisible();
  await page.getByRole('radio',{name:'Comfortable with music',exact:true}).check();await next(page);
  await page.getByRole('textbox',{name:'Child name'}).fill('Player');await page.getByRole('radio',{name:'3\u20134',exact:true}).check();await next(page);
  await expect(page.getByRole('heading',{name:'A look of their own',exact:true})).toBeVisible();await next(page);
  await expect(page.getByRole('heading',{name:'Simple is a good place to begin.',exact:true})).toBeVisible();await expect(page.getByRole('radio',{name:'Simple',exact:true})).toBeChecked();
  await expectNoChild(page);await next(page);await expect(page.getByRole('heading',{name:'Ready to explore',exact:true})).toBeVisible();
  await expectNoChild(page);await page.getByRole('dialog',{name:'Add a child',exact:true}).getByRole('button',{name:'Add child',exact:true}).click();
  const saved=await savedChildren(page);expect(saved.children).toHaveLength(1);const child=saved.children[0];expect(saved.selectedId).toBe(child.id);expect(child.name).toBe('Player');expect(child.age).toBe('3to4');
  expect(child.profile).toEqual({age:'3to4',music:'new',instruments:[],parent:'confident'});
  expect(child.settings.selected).toEqual(['piano','drums','ukulele','melody','marimba','panflute']);expect(Object.values(child.settings.instruments).every(value=>value.complexity===.35&&value.noteLabels&&value.playbackNotes)).toBe(true);
  await expect(page.getByRole('radio',{name:'Select Player',exact:true})).toBeChecked();await expect(play).toBeEnabled();
  await play.click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
});

test('child setup cancels without saving, restores focus and traps keyboard navigation',async({page})=>{
  await start(page);const add=page.getByRole('button',{name:'Add child',exact:true});const dialog=page.getByRole('dialog',{name:'Add a child',exact:true});
  for(const cancel of ['Escape','Cancel child setup','Cancel setup']){
    await add.click();await expect(page.getByRole('heading',{name:'How familiar are you with music?',exact:true})).toBeFocused();
    await page.getByRole('radio',{name:'New to music',exact:true}).check();
    await page.getByRole('button',{name:'Next step',exact:true}).focus();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Open caregiver help',exact:true})).toBeFocused();
    await page.keyboard.press('Shift+Tab');await expect(page.getByRole('button',{name:'Next step',exact:true})).toBeFocused();
    await next(page);await page.getByRole('textbox',{name:'Child name'}).fill('Draft');
    if(cancel==='Escape')await page.keyboard.press('Escape');else await page.getByRole('button',{name:cancel,exact:true}).click();
    await expect(dialog).toHaveCount(0);await expect(add).toBeFocused();await expectNoChild(page);await expect(page.getByRole('button',{name:'Tap to play'})).toBeDisabled();
  }
});

test('optional guides scroll by touch on a short landscape screen and return to the draft',async({page})=>{
  await page.setViewportSize({width:780,height:284});await page.goto('/');await nameStep(page);await page.getByRole('textbox',{name:'Child name'}).fill('Draft');
  await next(page);await next(page);await next(page);await page.getByRole('button',{name:'Read install and prepare your device',exact:true}).click();
  const reader=page.getByRole('dialog',{name:'Install and prepare your device',exact:true});const content=reader.locator('.parent-guide-content');
  const metrics=await content.evaluate(element=>({scrollHeight:element.scrollHeight,clientHeight:element.clientHeight,rect:element.getBoundingClientRect().toJSON()}));expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
  const client=await page.context().newCDPSession(page);const point={id:4,x:metrics.rect.left+metrics.rect.width*.7,y:metrics.rect.bottom-18};
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...point,y:metrics.rect.top+15}]});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(()=>content.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);await client.detach();await page.keyboard.press('Escape');
  await expect(page.getByRole('heading',{name:'Ready to explore',exact:true})).toBeVisible();await page.getByRole('button',{name:'Previous step',exact:true}).click();await page.getByRole('button',{name:'Previous step',exact:true}).click();await page.getByRole('button',{name:'Previous step',exact:true}).click();await expect(page.getByRole('textbox',{name:'Child name'})).toHaveValue('Draft');await expectNoChild(page);
});

for(const [level,complexity] of [['Standard',1],['Advanced',1.5]])test(`parent selects ${level} directly and it persists after reload`,async({page})=>{
  await start(page);await nameStep(page);await page.getByRole('textbox',{name:'Child name'}).fill('Player');await page.getByRole('radio',{name:'3\u20134',exact:true}).check();await next(page);await next(page);
  await page.getByRole('radio',{name:level,exact:true}).check();await expectNoChild(page);await next(page);await page.getByRole('dialog',{name:'Add a child',exact:true}).getByRole('button',{name:'Add child',exact:true}).click();
  const saved=await savedChildren(page);expect(Object.values(saved.children[0].settings.instruments).every(options=>options.complexity===complexity)).toBe(true);await page.reload();expect(await savedChildren(page)).toEqual(saved);await expect(page.getByRole('radio',{name:'Select Player',exact:true})).toBeChecked();
});

test('optional guides preserve feature, practice and shared-play explanations without saving a child',async({page})=>{
  await start(page);await nameStep(page);await page.getByRole('textbox',{name:'Child name'}).fill('Draft');await next(page);await next(page);await next(page);
  for(const [title,pages] of [
    ['Play an instrument',[[0,['Tap an instrument in the landscape']],[1,['Drag an instrument']],[3,['Choose another phrase']]]],
    ['Explore the landscape',[[0,['Tap the sun or moon','current bar']],[2,['metronome','weight up to slow']]]],
    ['Use the practice room',[[1,['instrument and phrase selectors','Listen, Learn, Rhythm or Together']],[4,['hold duration is not scored']]]],
    ['Play together',[[0,['take turns leading','Pause when attention or enjoyment fades','off screen']]]]
  ]){
    await page.getByRole('button',{name:`Read ${title.toLowerCase()}`,exact:true}).click();const reader=page.getByRole('dialog',{name:title,exact:true});await expect(reader).toBeVisible();for(const [index,phrases] of pages){await guidePage(page,index);for(const phrase of phrases)await expect(reader).toContainText(phrase);}await page.keyboard.press('Escape');await expect(page.getByRole('heading',{name:'Ready to explore',exact:true})).toBeVisible();await expectNoChild(page);
  }
});

test('installed display mode suppresses reinstallation and keeps restriction guidance',async({page})=>{
  await page.addInitScript(()=>{
    const original=window.matchMedia.bind(window);
    window.matchMedia=query=>query==='(display-mode: standalone)'?{matches:true,addEventListener(){},removeEventListener(){}}:original(query);
  });
  await start(page);await openInstallation(page);
  await expect(page.getByText(/already running as an installed app/)).toBeVisible();
  await expect(page.getByRole('button',{name:'Install FarmJam',exact:true})).toHaveCount(0);
  await guidePage(page,2);
  await expect(page.locator('.parent-restriction-steps')).not.toBeEmpty();
  await expect(page.getByRole('heading',{name:'Set up device restrictions',exact:true})).toBeFocused();
  await expect(page.getByText(/caregiver must set up device restrictions/)).toBeVisible();
});

test('optional browser install prompt handles dismissal, failure and completion',async({page})=>{
  await start(page);await openInstallation(page);
  for(const outcome of ['dismissed','failure','accepted']) {
    await page.evaluate(outcome=>{
      const event=new Event('beforeinstallprompt',{cancelable:true});
      event.prompt=async()=>{if(outcome==='failure')throw Error('unavailable');};
      event.userChoice=Promise.resolve({outcome});
      window.dispatchEvent(event);
    },outcome);
    await page.getByRole('button',{name:'Install FarmJam',exact:true}).click();
    await expect(page.locator('.guide-device-instructions').getByRole('status')).toContainText(outcome==='dismissed'?'keep playing in the browser':outcome==='failure'?'Use the browser menu':'Installation requested');
    await guidePage(page,2);await expect(page.getByRole('dialog',{name:'Install and prepare your device',exact:true})).toContainText('Installation and fullscreen do not prevent leaving');await guidePage(page,0);
    await expect(page.getByRole('button',{name:'Install FarmJam',exact:true})).toHaveCount(0);
  }
  await page.evaluate(()=>window.dispatchEvent(new Event('appinstalled')));
  await expect(page.getByText(/already running as an installed app/)).toBeVisible();
  await expect(page.locator('.guide-device-instructions').getByRole('status')).toContainText('FarmJam is installed.');
  await expect(page.locator('.guide-device-instructions').getByRole('status')).not.toContainText('pin its icon');
  await guidePage(page,2);await expect(page.locator('.parent-restriction-steps')).not.toBeEmpty();
});

for(const [label,userAgent,title,expected] of [
  ['iPhone or iPad','Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) Version/26.0 Mobile Safari/604.1','Guided Access on iPhone or iPad','parent-only passcode privately'],
  ['Android','Mozilla/5.0 (Linux; Android 14) Chrome/130.0 Mobile Safari/537.36','App pinning on Android','require your PIN'],
  ['Windows','Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36 Edg/130.0','Restricted play on Windows','not an arbitrary Chrome-installed web app'],
  ['macOS','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Version/17.0 Safari/605.1.15','Restricted play on macOS','does not have iPhone/iPad Guided Access'],
  ['Linux','Mozilla/5.0 (X11; Linux x86_64) Chrome/130.0 Safari/537.36','Restricted play on Linux','varies by distribution'],
  ['Your device','Unrecognized device','Restricted play on your device','FarmJam cannot turn on a device lock']
])test(`installation separates restricted play on ${label} with accessible help links`,async({page},testInfo)=>{
  await page.addInitScript(userAgent=>{
    Object.defineProperty(navigator,'userAgent',{get:()=>userAgent});
    Object.defineProperty(navigator,'platform',{get:()=>''});
  },userAgent);
  await start(page);await openInstallation(page);
  if(testInfo.project.use.viewport)await page.setViewportSize(testInfo.project.use.viewport);
  const content=page.getByRole('dialog',{name:'Install and prepare your device',exact:true}).locator('.parent-guide-content');
  await expect(page.getByRole('heading',{name:'Add FarmJam to your device',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:`Official installation help for ${label}`,exact:true})).toHaveAttribute('href',/^https:\/\/(support\.|learn\.)/);
  const installLink=page.getByRole('link',{name:`Official installation help for ${label}`,exact:true});
  await expect(installLink).toHaveAttribute('target','_blank');await expect(installLink).toHaveAttribute('rel','noopener noreferrer');
  await guidePage(page,1);await expect(content).toContainText('check offline readiness');await expect(content).toContainText('not a backup');await expect(content.getByRole('link')).toHaveCount(0);
  await guidePage(page,2);await expect(content).toContainText('Installation and fullscreen do not prevent leaving FarmJam');
  await expect(page.locator('.parent-restriction-steps')).toContainText(expected);
  await expect(page.getByRole('heading',{name:'Set up device restrictions',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
  const links=content.getByRole('link');expect(await links.count()).toBe(['macOS','Linux','Your device'].includes(label)?1:2);
  for(const link of await links.all()){
    await expect(link).toHaveAttribute('target','_blank');
    await expect(link).toHaveAttribute('rel','noopener noreferrer');
  }
  const search=page.getByRole('link',{name:`Find instructions for ${title.toLowerCase()}`,exact:true});
  await expect(search).toHaveAttribute('href',/^https:\/\/www.google.com\/search\?q=/);
  await search.focus();await expect(search).toBeFocused();await page.keyboard.press('Tab');
  await expect(page.getByRole('button',{name:'All guides',exact:true})).toBeFocused();
  await search.scrollIntoViewIfNeeded();
  const layout=await content.evaluate(element=>({width:element.clientWidth,scroll:element.scrollWidth}));
  expect(layout.scroll).toBeLessThanOrEqual(layout.width);
  await page.screenshot({path:`test-results/${testInfo.project.name}-parent-guide-install-${label.replaceAll(' ','-')}.png`});
  await expectNoChild(page);
});
