import {test,expect} from '@playwright/test';

async function openGuide(page,name) {
  await page.addInitScript(()=>{
    localStorage.setItem('farmjam-children-v1',JSON.stringify({children:[{id:'alex',name:'Alex',age:'under3',settings:{instruments:{guitar:{complexity:1.5,fingeringCharts:true}}}}],selectedId:'alex'}));
    window.guideAudioStarts=0;
    for(const node of [window.AudioBufferSourceNode,window.OscillatorNode])if(node){const start=node.prototype.start;node.prototype.start=function(...args){window.guideAudioStarts++;return start.apply(this,args);};}
  });
  await page.goto('/');
  await page.getByRole('button',{name:/^Settings/}).click();
  await page.getByRole('tab',{name:/^Guides/}).click();
  await page.getByRole('button',{name:`Read ${name}`,exact:true}).click();
  await page.evaluate(()=>{window.guideAudioBaseline=window.guideAudioStarts;});
  await page.clock.install({time:new Date('2026-10-17T12:00:00Z')});
  await page.clock.pauseAt(new Date('2026-10-17T12:00:01Z'));
}
async function jump(page,index) {await page.getByRole('combobox',{name:'Choose a guide page',exact:true}).selectOption(String(index));}
async function show(page) {await page.getByRole('button',{name:/^(Show|Replay) gesture$/,exact:true}).click();await page.clock.runFor(100);}

test('string guides teach chord ownership before strumming, default to simple, and stay silent',async({page},testInfo)=>{
  await openGuide(page,'play an instrument');await jump(page,2);
  const art=page.locator('.guide-art-surface');
  await page.getByRole('combobox',{name:'Guide instrument',exact:true}).selectOption('guitar');
  await expect(art.locator('.chord-control')).toHaveCount(3);
  await expect(art.locator('.chord-diagram')).toHaveCount(0);
  await show(page);await page.clock.runFor(1900);
  await expect(art.locator('.guide-pointer').first()).toHaveAttribute('data-pressed','true');
  await expect(art.locator('.chord-control.playing-chord')).toHaveCount(1);
  expect(await art.locator('.guide-pointer').nth(1).evaluate(node=>getComputedStyle(node).opacity)).toBe('0');
  await page.clock.runFor(2200);
  for(const hand of await art.locator('.guide-pointer').all())await expect(hand).toHaveAttribute('data-pressed','true');
  await art.screenshot({path:`artifacts.local/guide-demonstrations/guitar-${testInfo.project.name}.png`});
  await page.clock.runFor(3000);
  await expect(art.locator('.chord-control.playing-chord')).toHaveCount(0);
  await page.getByRole('combobox',{name:'Demonstration controls',exact:true}).selectOption('child');
  expect(await art.locator('.chord-control').count()).toBeGreaterThan(3);
  expect(await art.locator('.chord-diagram').count()).toBeGreaterThan(0);
  expect(await page.evaluate(()=>window.guideAudioStarts-window.guideAudioBaseline)).toBe(0);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('farmjam-children-v1')).children[0].settings.instruments.guitar.complexity)).toBe(1.5);
});

test('practice guides animate each stage with shared controls and changing authored cues',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await openGuide(page,'use the practice room');
  for(const [index,stage] of [[2,'Listen'],[3,'Learn'],[4,'Rhythm'],[5,'Together']]) {
    await jump(page,index);const room=page.locator('.guide-room-detail');
    await expect(room).toHaveAttribute('data-demo-stage',stage);
    await expect(room.locator('.practice-run-button')).toHaveCount(stage==='Learn'?0:1);
    await show(page);await page.clock.runFor(3400);
    const first=await room.getAttribute('data-demo-event');
    if(stage==='Listen')await expect(room.locator('.gesture-pointer')).toHaveCount(0);
    else expect(await room.locator('.gesture-pointer').count()).toBeGreaterThan(0);
    if(stage==='Learn') {
      const bounds=await room.boundingBox();
      for(const hand of await room.locator('.gesture-pointer').all()) {const box=await hand.boundingBox();expect(box.y+box.height).toBeLessThanOrEqual(bounds.y+bounds.height+3);}
    }
    if(stage==='Together')await expect(room.locator('.is-accompanying')).toHaveCount(2);
    await room.screenshot({path:`artifacts.local/guide-demonstrations/${stage}-${testInfo.project.name}.png`});
    await page.clock.runFor(2700);expect(await room.getAttribute('data-demo-event')).not.toBe(first);
    await page.clock.runFor(1600);await expect(room.locator('.practice-feedback-display')).toContainText('Phrase complete');
    await expect(room.locator('.practice-next-button')).toBeEnabled();
  }
  await jump(page,6);await show(page);const room=page.locator('.guide-room-detail');
  for(const [time,label] of [[0,'Stop'],[2000,'Repeat'],[2000,'Restart'],[2000,'Leave']]) {
    await page.clock.runFor(time);await expect(room.locator('.guide-detail-heading')).toContainText(label);
  }
  expect(errors).toEqual([]);expect(await page.evaluate(()=>window.guideAudioStarts-window.guideAudioBaseline)).toBe(0);
});

test('settings guide uses the game menu button and live settings components',async({page},testInfo)=>{
  await openGuide(page,'choose instruments and settings');
  const art=page.locator('.guide-art-settings');
  await expect(art.locator('.game-settings-button')).toHaveCount(1);
  const style=await art.locator('.game-settings-button').evaluate(node=>{const s=getComputedStyle(node);return{width:s.width,height:s.height,radius:s.borderRadius};});
  expect(style).toEqual({width:'48px',height:'48px',radius:'50%'});
  await art.screenshot({path:`artifacts.local/guide-demonstrations/menu-${testInfo.project.name}.png`});
  await jump(page,1);await expect(art.locator('.instrument-slots select')).toHaveCount(6);
  await jump(page,2);await expect(art.locator('.complexity-segments input')).toHaveCount(3);
  await show(page);await page.clock.runFor(1400);await expect(art.locator('.complexity-simple input')).toBeChecked();
  await jump(page,3);await expect(art.locator('.settings-check input')).toHaveCount(2);
  await show(page);await page.clock.runFor(1400);await expect(art.locator('.settings-check input').first()).toBeChecked();
  await jump(page,4);await expect(art.locator('.settings-volume input')).toHaveCount(2);
  await show(page);await page.clock.runFor(3000);expect(Number(await art.locator('.settings-volume input').first().inputValue())).toBeLessThan(-4);
});
