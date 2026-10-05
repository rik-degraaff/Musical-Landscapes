import {test,expect} from '@playwright/test';

async function start(page) {
  const viewport=page.viewportSize();if(viewport.height>viewport.width)await page.setViewportSize({width:viewport.height,height:viewport.width});
  await page.goto('/');await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:20000});
}
async function equip(page,name){await page.locator(`#instrument-${name}`).focus();await page.keyboard.press('e');await expect(page.locator(`.performance-${name}`)).toBeVisible();}

test('flute groups physical keys along the tube with offset thumb levers and footjoint controls',async({page},testInfo)=>{
  await start(page);await equip(page,'flute');
  await expect(page.getByRole('button',{name:'Blow flute'})).toHaveCount(0);await expect(page.getByRole('slider',{name:/Flute breath/})).toHaveCount(0);
  const labels=['Left index','Left middle','Left ring','Right index','Right middle','Right ring'];
  const keys=await Promise.all(labels.map(label=>page.getByRole('button',{name:`Flute key ${label}`,exact:true}).boundingBox()));
  for(let index=1;index<keys.length;index++){expect(keys[index].x).toBeGreaterThan(keys[index-1].x);expect(keys[index].y).toBeCloseTo(keys[0].y,0);}
  const thumb=await page.getByRole('button',{name:'Flute key B thumb',exact:true}).boundingBox();expect(thumb.y).toBeGreaterThan(keys[0].y+keys[0].height);
  const trill=await page.getByRole('button',{name:'Flute key D trill',exact:true}).boundingBox();expect(trill.y+trill.height).toBeLessThan(keys[3].y);
  const foot=await page.getByRole('button',{name:'Flute key Low C roller',exact:true}).boundingBox();expect(foot.x).toBeGreaterThan(keys.at(-1).x+keys.at(-1).width);
  const buttons=await page.locator('.flute-physical-key').all();const bounds=await page.locator('.flute-mechanism').boundingBox();
  for(const button of buttons){const rect=await button.boundingBox();expect(rect.x).toBeGreaterThanOrEqual(bounds.x);expect(rect.y).toBeGreaterThanOrEqual(bounds.y);expect(rect.x+rect.width).toBeLessThanOrEqual(bounds.x+bounds.width+1);expect(rect.y+rect.height).toBeLessThanOrEqual(bounds.y+bounds.height+1);}
  await page.screenshot({path:`test-results/${testInfo.project.name}-flute-physical-layout.png`});
});

test('trumpet has a wider lip surface and wider valve targets beside a shortened illustration',async({page},testInfo)=>{
  await start(page);await equip(page,'melody');
  const area=await page.locator('.manual-trumpet').boundingBox();const lips=await page.locator('.trumpet-embouchure').boundingBox();const art=await page.locator('.trumpet-body-art').boundingBox();const valves=await page.locator('.trumpet-valve-controls').boundingBox();
  expect(lips.width/area.width).toBeCloseTo(.4,2);expect(art.width/area.width).toBeCloseTo(.57,2);expect(valves.width/area.width).toBeCloseTo(.46,2);
  expect(valves.x).toBeGreaterThan(lips.x+lips.width);expect(art.x).toBeGreaterThan(lips.x+lips.width);
  for(const cap of await page.locator('.valve-control span').all()){const rect=await cap.boundingBox();expect(rect.width).toBeGreaterThan(65);}
  await page.screenshot({path:`test-results/${testInfo.project.name}-trumpet-wider-controls.png`});
});

test('flute register is integrated into the headjoint and changes repeated fingerings without a breath gate',async({page})=>{
  await start(page);await equip(page,'flute');
  const register=page.getByRole('slider',{name:'Flute pitch register'});
  await expect(register).toHaveAttribute('aria-valuenow','0');
  await expect(page.getByRole('button',{name:'Low',exact:true})).toHaveCount(0);
  const mechanism=await page.locator('.flute-mechanism').boundingBox();const head=await register.boundingBox();const index=await page.getByRole('button',{name:'Flute key Left index',exact:true}).boundingBox();
  expect(head.x).toBeGreaterThan(mechanism.x);expect(head.x+head.width).toBeLessThan(index.x);
  await register.focus();await page.keyboard.press('ArrowUp');await expect(register).toHaveAttribute('aria-valuetext','Middle');
  await page.keyboard.press('End');await expect(register).toHaveAttribute('aria-valuetext','High');
  await page.mouse.click(head.x+head.width/2,head.y+head.height*.85);await expect(register).toHaveAttribute('aria-valuetext','Low');
  await page.mouse.move(head.x+head.width/2,head.y+head.height*.85);await page.mouse.down();await page.mouse.move(head.x+head.width/2,head.y+head.height*.12);await page.mouse.up();await expect(register).toHaveAttribute('aria-valuetext','High');
});