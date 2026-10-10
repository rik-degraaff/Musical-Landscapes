import {test,expect} from '@playwright/test';

async function start(page){const size=page.viewportSize();if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});await page.goto('/');}

test('parent guide applies age-aware setup and explains features, shared play and healthy limits',async({page},testInfo)=>{
  await start(page);
  const play=page.getByRole('button',{name:'Tap to play'});
  await expect(play).toBeVisible();await page.getByRole('button',{name:'Parent guide and setup'}).click();
  const dialog=page.getByRole('dialog',{name:'Set up FarmJam together'});await expect(dialog).toBeVisible();
  await expect(page.getByText('Your answers stay on this device.',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'Next step'}).click();
  await page.getByRole('radio',{name:'3–4'}).check();await page.getByRole('button',{name:'Next step'}).click();
  await page.getByRole('radio',{name:'Has tried a little'}).first().check();await page.getByRole('radio',{name:'Just starting'}).nth(1).check();
  await page.getByRole('button',{name:'Next step'}).click();await page.getByRole('radio',{name:'Comfortable with music'}).check();
  await page.getByRole('button',{name:'Next step'}).click();await expect(page.getByRole('heading',{name:'Simple is a good place to begin.'})).toBeVisible();
  await expect(page.getByText(/more variety/)).toBeVisible();await page.getByRole('button',{name:'Use these settings'}).click();
  await expect(page.getByRole('button',{name:'Recommended settings applied'})).toBeVisible();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('farmjam-settings-v1')));
  expect(saved.selected).toEqual(['piano','drums','ukulele','melody','marimba','panflute']);
  expect(Object.values(saved.instruments).every(value=>value.complexity===.35&&value.noteLabels&&value.playbackNotes)).toBe(true);
  const profile=await page.evaluate(()=>JSON.parse(localStorage.getItem('farmjam-parent-guide-v1')));
  expect(profile).toEqual({age:'3to4',music:'some',instrument:'new',parent:'confident'});
  await page.getByRole('button',{name:'Next step'}).click();
  for(const feature of ['Make a little landscape band.','Follow the sun and moon.','Change the setup any time.','Open the metronome.','Visit the practice room.'])await expect(page.getByText(feature,{exact:false})).toBeVisible();
  await page.screenshot({path:`test-results/${testInfo.project.name}-parent-guide-features.png`});
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
  await page.getByRole('button',{name:'Next step'}).click();await page.getByRole('radio',{name:'8+'}).check();
  await page.getByRole('button',{name:'Next step'}).click();await page.getByRole('radio',{name:'Already plays or sings'}).first().check();
  await page.getByRole('button',{name:'Next step'}).click();await page.getByRole('radio',{name:'New to music'}).check();
  await page.getByRole('button',{name:'Next step'}).click();await expect(page.getByRole('heading',{name:'Standard is a good place to begin.'})).toBeVisible();
  await page.getByRole('button',{name:'Previous step'}).click();await expect(page.getByRole('heading',{name:'How familiar are you with music?'})).toBeVisible();
});
