import {test,expect} from '@playwright/test';

async function start(page){const size=page.viewportSize();if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});await page.goto('/');}

test('parent guide applies age-aware setup and explains features, shared play and healthy limits',async({page},testInfo)=>{
  await start(page);
  const play=page.getByRole('button',{name:'Tap to play'});
  await expect(play).toBeVisible();await page.getByRole('button',{name:'Parent guide and setup'}).click();
  const dialog=page.getByRole('dialog',{name:'Set up FarmJam together'});await expect(dialog).toBeVisible();
  await expect(page.getByText('Your answers stay on this device.',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'Next step'}).click();
  await expect(page.getByRole('heading',{name:'Give FarmJam a place beside your apps.'})).toBeVisible();
  await expect(page.locator('.parent-install-steps')).not.toBeEmpty();
  await page.locator('.parent-install-steps li').last().scrollIntoViewIfNeeded();
  await page.screenshot({path:`test-results/${testInfo.project.name}-parent-guide-install.png`});
  await page.getByRole('button',{name:'Next step'}).click();
  await page.getByRole('radio',{name:'Comfortable with music'}).check();
  await page.getByRole('button',{name:'Next step'}).click();
  await page.getByRole('radio',{name:'3–4'}).check();await page.getByRole('button',{name:'Next step'}).click();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await page.getByRole('radio',{name:'Has tried a little'}).check();
  await page.getByRole('checkbox',{name:'Piano',exact:true}).check();
  await page.getByRole('checkbox',{name:'Ukulele',exact:true}).check();
  await page.getByRole('button',{name:'Next step'}).click();await expect(page.getByRole('heading',{name:'Simple is a good place to begin.'})).toBeVisible();
  await expect(page.getByText(/more variety/)).toBeVisible();await page.getByRole('button',{name:'Use these settings'}).click();
  await expect(page.getByRole('button',{name:'Simple settings applied'})).toBeVisible();
  await expect(page.getByText(/Later, double-tap the top-right Settings button/)).toBeVisible();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('farmjam-settings-v1')));
  expect(saved.selected).toEqual(['piano','drums','ukulele','melody','marimba','panflute']);
  expect(Object.values(saved.instruments).every(value=>value.complexity===.35&&value.noteLabels&&value.playbackNotes)).toBe(true);
  const profile=await page.evaluate(()=>JSON.parse(localStorage.getItem('farmjam-parent-guide-v1')));
  expect(profile).toEqual({age:'3to4',music:'some',instruments:['piano','ukulele'],parent:'confident'});
  await page.getByRole('button',{name:'Next step'}).click();
  await expect(page.getByText(/Tap a landscape instrument/)).toBeVisible();
  await expect(page.getByText(/pitch center/)).toBeVisible();
  await page.screenshot({path:`test-results/${testInfo.project.name}-parent-guide-features.png`});
  await page.getByRole('button',{name:'Next step'}).click();
  await expect(page.getByText(/Tap the sun or moon/)).toBeVisible();await expect(page.locator('.parent-feature-list strong').filter({hasText:'Settings'})).toBeVisible();await expect(page.getByText(/metronome/)).toBeVisible();
  await expect(page.getByText(/same idea in a different pitch center/)).toBeVisible();
  await page.screenshot({path:`test-results/${testInfo.project.name}-parent-guide-landscapes.png`});
  await page.getByRole('button',{name:'Next step'}).click();
  await expect(page.getByText(/Double-tap the girl/)).toBeVisible();await expect(page.getByText(/musical terms/)).toBeVisible();
  for(const name of ['Listen','Learn','Rhythm','Together'])await expect(page.locator('.parent-feature-list strong').getByText(name,{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Next step'}).click();
  await expect(page.getByText(/Keep sessions short and responsive/)).toBeVisible();
  await expect(page.getByText(/borrow one, or meet a patient music teacher/)).toBeVisible();
  await page.screenshot({path:`test-results/${testInfo.project.name}-parent-guide-together.png`});
  await page.getByRole('button',{name:'Ready to play'}).click();await expect(dialog).toHaveCount(0);
  await expect(play).toBeVisible();await play.click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
});

test('parent guide skips without changing setup, can be dismissed, and remains keyboard navigable',async({page})=>{
  await start(page);const play=page.getByRole('button',{name:'Tap to play'});
  const help=page.getByRole('button',{name:'Parent guide and setup'});await help.click();
  const dialog=page.getByRole('dialog',{name:'Set up FarmJam together'});
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(help).toBeFocused();
  expect(await page.evaluate(()=>localStorage.getItem('farmjam-parent-guide-v1'))).toBe(null);
  await help.click();await page.getByRole('button',{name:'Skip guide'}).click();
  await expect(dialog).toHaveCount(0);expect(await page.evaluate(()=>localStorage.getItem('farmjam-parent-guide-v1'))).toBe(null);
  await help.click();
  await page.getByRole('button',{name:'Next step'}).click();
  await page.getByRole('button',{name:'Next step'}).click();
  await expect(page.getByRole('heading',{name:'How familiar are you with music?'})).toBeFocused();
  await page.getByRole('button',{name:'Next step'}).focus();await page.keyboard.press('Tab');
  await expect(page.getByRole('button',{name:'Close parent guide'})).toBeFocused();
  await page.keyboard.press('Shift+Tab');await expect(page.getByRole('button',{name:'Next step'})).toBeFocused();
  await page.getByRole('radio',{name:'New to music'}).check();
  await page.getByRole('button',{name:'Next step'}).click();await page.getByRole('radio',{name:'8+'}).check();
  await page.getByRole('button',{name:'Next step'}).click();await page.getByRole('radio',{name:'Already plays or sings'}).check();
  await page.getByRole('button',{name:'Next step'}).click();await expect(page.getByRole('heading',{name:'Standard is a good place to begin.'})).toBeVisible();
  await expect(page.locator('.parent-guide-content')).toContainText('everyday language');
  await page.getByRole('button',{name:'Next step'}).click();await expect(page.getByText(/A phrase is a short musical idea that repeats/)).toBeVisible();
  await expect(page.getByText(/there is no need to read notes/)).toBeVisible();
  await page.getByRole('button',{name:'Previous step'}).click();await expect(page.getByRole('heading',{name:'Standard is a good place to begin.'})).toBeVisible();
});

test('parent guide content scrolls by touch on a short landscape screen',async({page})=>{
  await page.setViewportSize({width:780,height:284});await page.goto('/');
  await page.getByRole('button',{name:'Parent guide and setup'}).click();
  for(let step=0;step<9;step++)await page.getByRole('button',{name:'Next step'}).click();
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
  await page.addInitScript(()=>localStorage.setItem('farmjam-parent-guide-v1',JSON.stringify({age:'3to4',music:'some',instrument:'familiar',parent:'some',name:'obsolete'})));
  await start(page);await page.getByRole('button',{name:'Parent guide and setup'}).click();
  for(let step=0;step<5;step++)await page.getByRole('button',{name:'Next step'}).click();
  await expect(page.getByRole('heading',{name:'Simple is a good place to begin.'})).toBeVisible();
  await page.getByRole('radio',{name:level,exact:true}).check();
  await page.getByRole('button',{name:'Use these settings'}).click();
  await expect(page.getByRole('button',{name:`${level} settings applied`})).toBeVisible();
  expect(await page.evaluate(complexity=>Object.values(JSON.parse(localStorage.getItem('farmjam-settings-v1')).instruments).every(options=>options.complexity===complexity),complexity)).toBe(true);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('farmjam-parent-guide-v1')))).toEqual({age:'3to4',music:'some',instruments:[],parent:'some'});
  await page.reload();
  expect(await page.evaluate(complexity=>Object.values(JSON.parse(localStorage.getItem('farmjam-settings-v1')).instruments).every(options=>options.complexity===complexity),complexity)).toBe(true);
});

test('instrument checklist is conditional, multiple choice, and resets for a new musician',async({page},testInfo)=>{
  await start(page);await page.getByRole('button',{name:'Parent guide and setup'}).click();
  const original=testInfo.project.use.viewport;
  if(original)await page.setViewportSize(original);
  for(let step=0;step<4;step++)await page.getByRole('button',{name:'Next step'}).click();
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
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('farmjam-parent-guide-v1')).instruments)).toEqual([]);
});

test('installed display mode suppresses reinstallation and keeps pinning guidance',async({page})=>{
  await page.addInitScript(()=>{
    const original=window.matchMedia.bind(window);
    window.matchMedia=query=>query==='(display-mode: standalone)'?{matches:true,addEventListener(){},removeEventListener(){}}:original(query);
  });
  await start(page);await page.getByRole('button',{name:'Parent guide and setup'}).click();await page.getByRole('button',{name:'Next step'}).click();
  await expect(page.getByText(/already running as an installed app/)).toBeVisible();
  await expect(page.getByRole('button',{name:'Install FarmJam',exact:true})).toHaveCount(0);
  await expect(page.locator('.parent-install-steps')).toContainText(/Home screen|taskbar/);
});

test('optional browser install prompt handles dismissal, failure and completion',async({page})=>{
  await start(page);await page.getByRole('button',{name:'Parent guide and setup'}).click();await page.getByRole('button',{name:'Next step'}).click();
  for(const outcome of ['dismissed','failure','accepted']) {
    await page.evaluate(outcome=>{
      const event=new Event('beforeinstallprompt',{cancelable:true});
      event.prompt=async()=>{if(outcome==='failure')throw Error('unavailable');};
      event.userChoice=Promise.resolve({outcome});
      window.dispatchEvent(event);
    },outcome);
    await page.getByRole('button',{name:'Install FarmJam',exact:true}).click();
    await expect(page.getByRole('status')).toContainText(outcome==='dismissed'?'not selected':outcome==='failure'?'could not open':'Installation requested');
    await expect(page.getByRole('button',{name:'Install FarmJam',exact:true})).toHaveCount(0);
  }
  await page.evaluate(()=>window.dispatchEvent(new Event('appinstalled')));
  await expect(page.getByText(/already running as an installed app/)).toBeVisible();
});
