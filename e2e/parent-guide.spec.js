import {test,expect} from '@playwright/test';

async function start(page){const size=page.viewportSize();if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});await page.goto('/');}

async function advance(page,from,to,name='Player') {
  for(let step=from;step<to;step++){
    if(step===3)await page.getByRole('textbox',{name:'Child name'}).fill(name);
    await page.getByRole('button',{name:'Next step',exact:true}).click();
  }
}
async function savedChildren(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('farmjam-children-v1')??'{"children":[],"selectedId":null}'));}
async function expectNoChild(page){expect((await savedChildren(page)).children).toEqual([]);expect(await page.evaluate(()=>localStorage.getItem('farmjam-parent-guide-v1'))).toBe(null);}

test('parent guide applies age-aware setup and explains features, shared play and healthy limits',async({page},testInfo)=>{
  await start(page);
  const play=page.getByRole('button',{name:'Tap to play'});
  await expect(play).toBeDisabled();await page.getByRole('button',{name:'Add child',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Add a child',exact:true});await expect(dialog).toBeVisible();
  await expect(page.getByText(/stored only in this browser on this device when you finish/)).toBeVisible();
  await page.getByRole('button',{name:'Next step'}).click();
  await expect(page.getByRole('heading',{name:'Give FarmJam a place beside your apps.'})).toBeVisible();
  await expect(page.locator('.parent-install-steps').first()).not.toBeEmpty();
  await page.locator('.parent-install-steps li').last().scrollIntoViewIfNeeded();
  await page.screenshot({path:`test-results/${testInfo.project.name}-parent-guide-install.png`});
  await page.getByRole('button',{name:'Next step'}).click();
  await page.getByRole('radio',{name:'Comfortable with music'}).check();
  await page.getByRole('button',{name:'Next step'}).click();
  await page.getByRole('radio',{name:'3–4'}).check();await advance(page,3,5);
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await page.getByRole('radio',{name:'Has tried a little'}).check();
  await page.getByRole('checkbox',{name:'Piano',exact:true}).check();
  await page.getByRole('checkbox',{name:'Ukulele',exact:true}).check();
  await page.getByRole('button',{name:'Next step'}).click();await expect(page.getByRole('heading',{name:'Simple is a good place to begin.'})).toBeVisible();
  await expect(page.getByText(/more variety/)).toBeVisible();await page.getByRole('button',{name:'Use these settings'}).click();
  await expect(page.getByRole('button',{name:'Simple settings selected'})).toBeVisible();
  await expect(page.getByText(/Later, double-tap the top-right Settings button/)).toBeVisible();
  await expectNoChild(page);
  await page.getByRole('button',{name:'Next step'}).click();
  await expect(page.getByText(/Tap a landscape instrument/)).toBeVisible();
  await expect(page.getByText(/pitch center/)).toBeVisible();
  await page.screenshot({path:`test-results/${testInfo.project.name}-parent-guide-features.png`});
  await page.getByRole('button',{name:'Next step'}).click();
  await expect(page.getByText(/Tap the sun or moon/)).toBeVisible();await expect(page.locator('.parent-feature-list strong').filter({hasText:'Settings'})).toBeVisible();await expect(page.getByText(/metronome/)).toBeVisible();
  await expect(page.getByText(/same idea in a different pitch center/)).toBeVisible();
  await page.screenshot({path:`test-results/${testInfo.project.name}-parent-guide-landscapes.png`});
  await page.getByRole('button',{name:'Next step'}).click();
  await expect(page.getByText(/Double-tap (the girl|your child|the child)/)).toBeVisible();await expect(page.getByText(/musical terms/)).toBeVisible();
  for(const name of ['Listen','Learn','Rhythm','Together'])await expect(page.locator('.parent-feature-list strong').getByText(name,{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Next step'}).click();
  await expect(page.getByText(/Keep sessions short and responsive/)).toBeVisible();
  await expect(page.getByText(/borrow one, or meet a patient music teacher/)).toBeVisible();
  await page.screenshot({path:`test-results/${testInfo.project.name}-parent-guide-together.png`});
  await expectNoChild(page);
  await dialog.getByRole('button',{name:'Add child',exact:true}).click();await expect(dialog).toHaveCount(0);
  const saved=await savedChildren(page);expect(saved.children).toHaveLength(1);
  const child=saved.children[0];expect(saved.selectedId).toBe(child.id);expect(child.name).toBe('Player');expect(child.age).toBe('3to4');
  expect(child.profile).toEqual({age:'3to4',music:'some',instruments:['piano','ukulele'],parent:'confident'});
  expect(child.settings.selected).toEqual(['piano','drums','ukulele','melody','marimba','panflute']);
  expect(Object.values(child.settings.instruments).every(value=>value.complexity===.35&&value.noteLabels&&value.playbackNotes)).toBe(true);
  await expect(page.getByRole('radio',{name:'Select Player',exact:true})).toBeChecked();
  await expect(play).toBeEnabled();await expect(page.locator('.start-overlay')).toBeVisible();
  await play.click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
});

test('child setup cancels without saving and remains keyboard navigable',async({page})=>{
  await start(page);const play=page.getByRole('button',{name:'Tap to play'});
  const help=page.getByRole('button',{name:'Add child',exact:true});await help.click();
  const dialog=page.getByRole('dialog',{name:'Add a child',exact:true});
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(help).toBeFocused();
  await expectNoChild(page);await expect(play).toBeDisabled();
  await help.click();await page.getByRole('button',{name:'Cancel setup',exact:true}).click();
  await expect(dialog).toHaveCount(0);await expectNoChild(page);await expect(play).toBeDisabled();
  await help.click();
  await page.getByRole('button',{name:'Next step'}).click();
  await page.getByRole('button',{name:'Next step'}).click();
  await expect(page.getByRole('heading',{name:'How familiar are you with music?'})).toBeFocused();
  await page.getByRole('button',{name:'Next step'}).focus();await page.keyboard.press('Tab');
  await expect(page.getByRole('button',{name:'Cancel child setup'})).toBeFocused();
  await page.keyboard.press('Shift+Tab');await expect(page.getByRole('button',{name:'Next step'})).toBeFocused();
  await page.getByRole('radio',{name:'New to music'}).check();
  await page.getByRole('button',{name:'Next step'}).click();await page.getByRole('radio',{name:'8+'}).check();
  await advance(page,3,5);await page.getByRole('radio',{name:'Already plays or sings'}).check();
  await page.getByRole('button',{name:'Next step'}).click();await expect(page.getByRole('heading',{name:'Standard is a good place to begin.'})).toBeVisible();
  await expect(page.locator('.parent-guide-content')).toContainText('everyday language');
  await page.getByRole('button',{name:'Next step'}).click();await expect(page.getByText(/A phrase is a short musical idea that repeats/)).toBeVisible();
  await expect(page.getByText(/there is no need to read notes/)).toBeVisible();
  await page.getByRole('button',{name:'Previous step'}).click();await expect(page.getByRole('heading',{name:'Standard is a good place to begin.'})).toBeVisible();
  await page.getByRole('button',{name:'Cancel child setup'}).click();await expectNoChild(page);await expect(play).toBeDisabled();
});

test('parent guide content scrolls by touch on a short landscape screen',async({page})=>{
  await page.setViewportSize({width:780,height:284});await page.goto('/');
  await page.getByRole('button',{name:'Add child',exact:true}).click();
  await advance(page,0,10);
  const content=page.locator('.parent-guide-content');
  const metrics=await content.evaluate(element=>({scrollHeight:element.scrollHeight,clientHeight:element.clientHeight,rect:element.getBoundingClientRect().toJSON()}));
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
  const client=await page.context().newCDPSession(page);
  const point={id:4,x:metrics.rect.left+metrics.rect.width*.7,y:metrics.rect.bottom-18};
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
  await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...point,y:metrics.rect.top+15}]});
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(()=>content.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);
  await client.detach();
});

for(const [level,complexity] of [['Standard',1],['Advanced',1.5]])test(`parent can apply ${level} instead of Simple and it persists after reload`,async({page})=>{
  await start(page);await page.getByRole('button',{name:'Add child',exact:true}).click();
  await advance(page,0,3);await page.getByRole('radio',{name:'3–4'}).check();await advance(page,3,6);
  await expect(page.getByRole('heading',{name:'Simple is a good place to begin.'})).toBeVisible();
  await page.getByRole('radio',{name:level,exact:true}).check();
  await page.getByRole('button',{name:'Use these settings'}).click();
  await expect(page.getByRole('button',{name:`${level} settings selected`})).toBeVisible();
  await expectNoChild(page);await advance(page,6,10);
  await page.getByRole('dialog',{name:'Add a child',exact:true}).getByRole('button',{name:'Add child',exact:true}).click();
  const saved=await savedChildren(page);expect(saved.children).toHaveLength(1);
  expect(Object.values(saved.children[0].settings.instruments).every(options=>options.complexity===complexity)).toBe(true);
  expect(saved.children[0].profile).toEqual({age:'3to4',music:'new',instruments:[],parent:'some'});
  await page.reload();
  expect(await savedChildren(page)).toEqual(saved);await expect(page.getByRole('radio',{name:'Select Player',exact:true})).toBeChecked();
  expect(await page.evaluate(complexity=>Object.values(JSON.parse(localStorage.getItem('farmjam-settings-v1')).instruments).every(options=>options.complexity===complexity),complexity)).toBe(true);
});

test('instrument checklist is conditional, multiple choice, and resets for a new musician',async({page},testInfo)=>{
  await start(page);await page.getByRole('button',{name:'Add child',exact:true}).click();
  const original=testInfo.project.use.viewport;
  if(original)await page.setViewportSize(original);
  await advance(page,0,5);
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  for(const experience of ['Has tried a little','Already plays or sings']) {
    await page.getByRole('radio',{name:experience}).check();
    await expect(page.getByRole('checkbox')).toHaveCount(8);
    await page.getByRole('checkbox',{name:'Piano',exact:true}).check();
    await page.getByRole('checkbox',{name:'Flute',exact:true}).check();
  }
  await page.screenshot({path:`test-results/${testInfo.project.name}-parent-guide-checklist.png`});
  const layout=await page.locator('.parent-guide').evaluate(element=>({width:element.getBoundingClientRect().width,viewport:innerWidth,content:element.querySelector('.parent-guide-content').clientWidth,scroll:element.querySelector('.parent-guide-content').scrollWidth}));
  expect(layout.width).toBeLessThanOrEqual(layout.viewport);expect(layout.scroll).toBeLessThanOrEqual(layout.content);
  await page.getByRole('radio',{name:'Just starting'}).check();await expect(page.getByRole('checkbox')).toHaveCount(0);
  await page.getByRole('radio',{name:'Has tried a little'}).check();
  await expect(page.getByRole('checkbox',{name:'Piano',exact:true})).not.toBeChecked();
  await page.getByRole('button',{name:'Next step'}).click();await page.getByRole('button',{name:'Use these settings'}).click();
  await expectNoChild(page);await advance(page,6,10);
  await page.getByRole('dialog',{name:'Add a child',exact:true}).getByRole('button',{name:'Add child',exact:true}).click();
  expect((await savedChildren(page)).children[0].profile.instruments).toEqual([]);
});

test('installed display mode suppresses reinstallation and keeps restriction guidance',async({page})=>{
  await page.addInitScript(()=>{
    const original=window.matchMedia.bind(window);
    window.matchMedia=query=>query==='(display-mode: standalone)'?{matches:true,addEventListener(){},removeEventListener(){}}:original(query);
  });
  await start(page);await page.getByRole('button',{name:'Add child',exact:true}).click();await page.getByRole('button',{name:'Next step'}).click();
  await expect(page.getByText(/already running as an installed app/)).toBeVisible();
  await expect(page.getByRole('button',{name:'Install FarmJam',exact:true})).toHaveCount(0);
  await expect(page.locator('.parent-restriction-steps')).not.toBeEmpty();
  await expect(page.getByRole('heading',{name:'Keep your child in the app',exact:true})).toBeVisible();
  await expect(page.getByText(/FarmJam cannot enable these restrictions/)).toBeVisible();
});

test('optional browser install prompt handles dismissal, failure and completion',async({page})=>{
  await start(page);await page.getByRole('button',{name:'Add child',exact:true}).click();await page.getByRole('button',{name:'Next step'}).click();
  for(const outcome of ['dismissed','failure','accepted']) {
    await page.evaluate(outcome=>{
      const event=new Event('beforeinstallprompt',{cancelable:true});
      event.prompt=async()=>{if(outcome==='failure')throw Error('unavailable');};
      event.userChoice=Promise.resolve({outcome});
      window.dispatchEvent(event);
    },outcome);
    await page.getByRole('button',{name:'Install FarmJam',exact:true}).click();
    await expect(page.getByRole('status')).toContainText(outcome==='dismissed'?'not selected':outcome==='failure'?'could not open':'Installation requested');
    if(outcome==='accepted')await expect(page.getByRole('status')).toContainText('Installation does not prevent exiting');
    await expect(page.getByRole('button',{name:'Install FarmJam',exact:true})).toHaveCount(0);
  }
  await page.evaluate(()=>window.dispatchEvent(new Event('appinstalled')));
  await expect(page.getByText(/already running as an installed app/)).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Installation does not prevent exiting');
  await expect(page.getByRole('status')).not.toContainText('pin its icon');
  await expect(page.locator('.parent-restriction-steps')).not.toBeEmpty();
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
  await start(page);await page.getByRole('button',{name:'Add child',exact:true}).click();
  if(testInfo.project.use.viewport)await page.setViewportSize(testInfo.project.use.viewport);
  await advance(page,0,1);
  const content=page.locator('.parent-guide-content');
  await expect(page.getByRole('heading',{name:'Install FarmJam',exact:true})).toBeVisible();
  await expect(content).toContainText('Installation does not prevent your child from leaving');
  await expect(page.locator('.parent-restriction-steps')).toContainText(expected);
  await expect(page.getByRole('heading',{name:'Keep your child in the app',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:`Official installation help for ${label}`,exact:true})).toHaveAttribute('href',/^https:\/\/(support\.|learn\.)/);
  const links=content.getByRole('link');
  expect(await links.count()).toBe(['macOS','Linux','Your device'].includes(label)?3:4);
  for(const link of await links.all()){
    await expect(link).toHaveAttribute('target','_blank');
    await expect(link).toHaveAttribute('rel','noopener noreferrer');
  }
  const search=page.getByRole('link',{name:`Search Google for ${title}`,exact:true});
  await expect(search).toHaveAttribute('href',/^https:\/\/www.google.com\/search\?q=/);
  await search.focus();await expect(search).toBeFocused();await page.keyboard.press('Tab');
  await expect(page.getByRole('button',{name:'Cancel setup',exact:true})).toBeFocused();
  await search.scrollIntoViewIfNeeded();
  const layout=await content.evaluate(element=>({width:element.clientWidth,scroll:element.scrollWidth}));
  expect(layout.scroll).toBeLessThanOrEqual(layout.width);
  await page.screenshot({path:`test-results/${testInfo.project.name}-parent-guide-install-${label.replaceAll(' ','-')}.png`});
  await expectNoChild(page);
});
