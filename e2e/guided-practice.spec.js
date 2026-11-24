import {test,expect,waitForInstrumentSettling,doubleActivate} from './fixtures.js';

async function enter(page,age='5to7',equipped) {
  await page.addInitScript(age=>{
    const key='farmjam-children-v1';
    if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({
      children:[{id:'test-child',age,name:'River',profile:{age,parent:'some'}}],selectedId:'test-child',
    }));
    const saved=JSON.parse(localStorage.getItem(key));
    if(!saved.children.some(child=>child.id==='sibling'))saved.children.push({id:'sibling',name:'Sky',age:'8plus'});
    saved.children[0].name='Player';
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

test('guided practice highlights one action among three real controls and offers untimed copying',async({page},testInfo)=>{
  const room=await enter(page,'3to4');
  const hear=room.getByRole('button',{name:'Hear it',exact:true});
  await expect(room.getByRole('button',{name:/Piano key/})).toHaveCount(3);
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
  await expect(room.getByRole('button',{name:/Piano key/})).toHaveCount(3);
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
  const keys=room.getByRole('button',{name:/Piano key/});
  await expect(keys).toHaveCount(3);
  await room.getByRole('button',{name:'Hear the rhythm'}).click();
  await expect(room).toHaveAttribute('data-practice-phase','count',{timeout:10000});
  await expect(room).toHaveAttribute('data-practice-phase','response');
  await expect(room.locator('[data-practice-cue="true"]')).toHaveCount(1);
  // Echo the first onset with a different pitch from the demonstrated one.
  await keys.last().focus();await page.keyboard.press('Space');
  await expect(room.locator('.guided-steps [data-state="complete"]')).toHaveCount(1);
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

test('the in-room book takes two taps and the top menu notice takes one',async({page},testInfo)=>{
  const room=await enter(page,'under3');
  const book=room.getByRole('button',{name:/Double tap me/});
  const dialog=page.getByRole('dialog',{name:'Farm Practice for caregivers'});
  await page.clock.install();
  if(testInfo.project.use.hasTouch)await book.tap();
  else await book.click();
  await expect(dialog).toHaveCount(0);
  // Let the first tap's activation window expire before trying a pair.
  await page.clock.fastForward(451);
  await doubleActivate(book,testInfo);
  await expect(dialog).toContainText('Sit together');
  await expect(dialog).toContainText('Allow practice room');
  await dialog.getByRole('button',{name:'Later'}).click();
  await expect(book).toHaveCount(0);
  await page.reload();
  const notice=page.getByRole('button',{name:/found the practice room/i});
  const bounds=await notice.boundingBox();
  expect(bounds.y).toBeLessThan(56);
  await expect(notice).toContainText('Tap to learn more');
  const profiles=page.getByRole('radiogroup',{name:'Choose a child'});
  await expect.poll(()=>profiles.evaluate(menu=>{
    const visible=menu.getBoundingClientRect();
    return [...menu.querySelectorAll('.child-choice')].every(profile=>{
      const box=profile.getBoundingClientRect();
      return box.top>=visible.top&&box.bottom<=Math.min(visible.bottom,innerHeight);
    });
  })).toBe(true);
  await page.screenshot({path:testInfo.outputPath('top-practice-notice.png')});
  await notice.click();
  const confirm=dialog.getByRole('button',{name:'I’ve read the guide'});
  await dialog.getByRole('combobox').selectOption('speed');
  await expect(confirm).toBeDisabled();
  await dialog.getByRole('combobox').selectOption('turns');
  await confirm.click();
  await page.reload();
  await expect(notice).toHaveCount(0);
  await page.getByRole('button',{name:'Tap to play',exact:true}).click();
  await page.locator('#young-musician').focus();
  await page.keyboard.press('Enter');
  await expect(room).toBeVisible();
  await expect(book).toHaveCount(0);
});

test('turning off practice from its guide closes the room and persists only for this child',async({page})=>{
  const room=await enter(page);
  await room.getByRole('button',{name:/Double tap me/}).press('Enter');
  const dialog=page.getByRole('dialog',{name:'Farm Practice for caregivers'});
  await dialog.getByRole('button',{name:/Turn off practice for/}).click();
  await expect(room).toHaveCount(0);
  await expect(page.locator('#young-musician')).not.toHaveAttribute('role','button');
  await page.getByRole('button',{name:'Open caregiver help'}).click();
  await expect(page.getByRole('button',{name:'Open practice',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Play it yourself',exact:true})).toBeVisible();
  await page.reload();
  await page.getByRole('button',{name:/^Settings/}).click();
  const allowed=page.getByRole('checkbox',{name:'Allow practice room'});
  await expect(allowed).not.toBeChecked();
  await page.getByRole('button',{name:'Done with settings'}).click();
  await page.getByRole('radio',{name:'Select Sky'}).click();
  await page.getByRole('button',{name:/^Settings/}).click();
  await expect(allowed).toBeChecked();
  await page.getByRole('button',{name:'Done with settings'}).click();
  await page.getByRole('radio',{name:'Select Player'}).click();
  await page.getByRole('button',{name:/^Settings/}).click();
  await allowed.check();
  await page.getByRole('button',{name:'Done with settings'}).click();
  await page.getByRole('button',{name:'Tap to play',exact:true}).click();
  await page.locator('#young-musician').focus();
  await page.keyboard.press('Enter');
  await expect(room).toBeVisible();
});

test('under-three guided trumpet has three reachable real notes at tablet and minimum sizes',async({page},testInfo)=>{
  const room=await enter(page,'under3','melody');
  const targets=room.getByRole('button',{name:/Trumpet embouchure /});
  await expect(targets).toHaveCount(3);
  const exit=room.getByRole('button',{name:'Leave practice through the open door'});
  const hear=room.getByRole('button',{name:'Hear it',exact:true});
  for(const size of [{width:1024,height:768},{width:360,height:240}]){
    await page.setViewportSize(size);
    await page.evaluate(()=>{
      const style=document.documentElement.style;
      style.setProperty('--safe-left','9px');style.setProperty('--safe-right','9px');
      style.setProperty('--safe-top','8px');style.setProperty('--safe-bottom','6px');
    });
    for(const control of [...await targets.all(),exit,hear]){
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
  const cue=room.locator('.focused-embouchure [data-practice-cue="true"]');
  if(testInfo.project.use.hasTouch)await cue.tap();
  else await cue.click();
  await expect(room).toHaveAttribute('data-practice-phase','done');
});
