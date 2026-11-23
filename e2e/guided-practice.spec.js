import {test,expect,waitForInstrumentSettling} from './fixtures.js';

async function enter(page,age='5to7',equipped) {
  await page.addInitScript(age=>{
    const key='farmjam-children-v1';
    if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({
      children:[{id:'test-child',age,name:'River',profile:{age,parent:'some'}}],selectedId:'test-child',
    }));
    const saved=JSON.parse(localStorage.getItem(key));
    saved.children[0].age=age;saved.children[0].profile.age=age;
    localStorage.setItem(key,JSON.stringify(saved));
  },age);
  await page.goto('/');
  await page.getByRole('button',{name:'Tap to play',exact:true}).click();
  await expect(page.locator('#young-musician')).toBeVisible({timeout:30000});
  await waitForInstrumentSettling(page);
  if(equipped){await page.locator(`#instrument-${equipped}`).focus();await page.keyboard.press('e');}
  await page.locator('#young-musician').focus();
  await page.keyboard.press('Enter');
  return page.getByRole('dialog',{name:'Farm practice room'});
}

test('guided practice uses one large real target, ends the example and offers untimed copying',async({page},testInfo)=>{
  const room=await enter(page,'3to4');
  const hear=room.getByRole('button',{name:'Hear it',exact:true});
  expect((await hear.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await hear.click();
  await expect(room).toHaveAttribute('data-practice-phase','example');
  await room.getByRole('button',{name:'My turn',exact:true}).click();
  const target=room.locator('[data-practice-cue="true"]');
  await expect(target).toHaveCount(1);
  await expect(room.getByRole('status')).toContainText('Play ');
  const bounds=await target.boundingBox();
  expect(bounds.width).toBeGreaterThanOrEqual(44);
  expect(bounds.height).toBeGreaterThanOrEqual(44);
  if(testInfo.project.use.hasTouch)await target.tap();
  else await target.click();
  await expect(room).toHaveAttribute('data-practice-phase','done');
  await room.getByRole('button',{name:'Try two sounds'}).click();
  await expect(room.getByRole('button',{name:/Piano key/})).toHaveCount(2);
  await room.getByRole('button',{name:'Choose an activity'}).click();
  await room.getByRole('button',{name:'Full practice'}).click();
  await expect(room.getByRole('combobox',{name:'Practice phrase'})).toBeVisible();
  await room.getByRole('button',{name:'Guided practice'}).click();
  await expect(room).toHaveAttribute('data-activity','hear');
  await page.keyboard.press('Escape');
  await expect(page.locator('#young-musician')).toBeFocused();
});

test('rhythm echo ends after one response and band play is free to stop',async({page})=>{
  const room=await enter(page,'8plus');
  await room.getByRole('combobox',{name:'Practice phrase'}).selectOption('0');
  await expect(room.getByRole('button',{name:'1. Listen'})).toHaveAttribute('aria-pressed','true');
  await room.getByRole('button',{name:'Guided practice'}).click();
  await room.getByRole('button',{name:'Choose an activity'}).click();
  await room.getByRole('button',{name:'Tap the rhythm',exact:true}).click();
  await room.getByRole('button',{name:'Hear the rhythm'}).click();
  await expect(room).toHaveAttribute('data-practice-phase','count',{timeout:10000});
  await expect(room).toHaveAttribute('data-practice-phase','response');
  await room.getByRole('button',{name:'Rhythm pad'}).click();
  await expect(room).toHaveAttribute('data-practice-phase','retry');
  await room.getByRole('button',{name:'Play with the band',exact:true}).click();
  await room.getByRole('button',{name:'Start the band'}).click();
  await expect(room).toHaveAttribute('data-practice-phase','playing');
  await room.getByRole('button',{name:'Open caregiver help'}).click();
  await page.getByRole('button',{name:'Back to practice'}).click();
  await expect(room).toHaveAttribute('data-practice-phase','paused');
  await room.getByRole('button',{name:'Start the band'}).click();
  await room.getByRole('button',{name:'Stop',exact:true}).click();
  await room.getByRole('button',{name:'Phrase challenge'}).click();
  await expect(room.getByRole('button',{name:'4. Together'})).toHaveAttribute('aria-pressed','true');
  await room.getByRole('button',{name:'Start phrase challenge',exact:true}).click();
  await expect(room.getByRole('button',{name:'Stop practice'})).toBeVisible();
  const details=room.locator('.practice-attempt-details');
  await expect(details).toBeVisible({timeout:12000});
  await expect(room.getByRole('button',{name:'Stop practice'})).toHaveCount(0);
  await details.locator('summary').click();
  await expect(details).toContainText(/0 of \d+ actions/);
});

test('the next launch shows an optional visit note until the caregiver confirms the tip',async({page})=>{
  const room=await enter(page,'under3');
  await expect(room.getByRole('combobox',{name:'Practice phrase'})).toHaveCount(0);
  await room.getByRole('button',{name:'Open caregiver help'}).click();
  await expect(page.getByRole('button',{name:'I understand'})).toBeDisabled();
  await page.getByRole('button',{name:'Back to practice'}).click();
  await page.reload();
  const notice=page.getByRole('button',{name:/visited practice/i});
  await notice.click();
  const dialog=page.getByRole('dialog',{name:'A visit to Farm Practice'});
  await dialog.getByRole('combobox').selectOption('speed');
  await expect(dialog.getByRole('button',{name:'I understand'})).toBeDisabled();
  await dialog.getByRole('combobox').selectOption('turns');
  await dialog.getByRole('button',{name:'I understand'}).click();
  await page.reload();
  await expect(notice).toHaveCount(0);
});


test('under-three trumpet uses a labeled pad with reachable targets at tablet and minimum sizes',async({page},testInfo)=>{
  const room=await enter(page,'under3','melody');
  const pad=room.getByRole('button',{name:'Practice pad'});
  const exit=room.getByRole('button',{name:'Leave practice through the open door'});
  const hear=room.getByRole('button',{name:'Hear it',exact:true});
  await expect(pad).toBeVisible();
  for(const size of [{width:1024,height:768},{width:360,height:240}]){
    await page.setViewportSize(size);
    await page.evaluate(()=>{
      const style=document.documentElement.style;
      style.setProperty('--safe-left','9px');style.setProperty('--safe-right','9px');
      style.setProperty('--safe-top','8px');style.setProperty('--safe-bottom','6px');
    });
    for(const control of [pad,exit,hear]){
      const geometry=await control.evaluate(element=>{
        const box=element.getBoundingClientRect();
        return {width:box.width,height:box.height,within:box.x>=9&&box.y>=8&&box.right<=innerWidth-9&&box.bottom<=innerHeight-6,
          reachable:element.contains(document.elementFromPoint(box.x+box.width/2,box.y+box.height/2))};
      });
      expect(geometry.width).toBeGreaterThanOrEqual(44);
      expect(geometry.height).toBeGreaterThanOrEqual(44);
      expect(geometry.within&&geometry.reachable).toBe(true);
    }
    await page.screenshot({path:testInfo.outputPath(`practice-${size.width}.png`)});
  }
  await room.getByRole('button',{name:'Choose an activity'}).click();
  await room.getByRole('button',{name:'Copy it',exact:true}).click();
  if(testInfo.project.use.hasTouch)await pad.tap();
  else await pad.click();
  await expect(room).toHaveAttribute('data-practice-phase','done');
});
