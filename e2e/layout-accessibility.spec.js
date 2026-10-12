import {test,expect} from './fixtures.js';

const scenes=['farm','garden','pond','dusk','night','late-night','dawn'];

test('saved scene layouts keep the landscape control reachable with and without equipment',async({page})=>{
  const viewport=page.viewportSize();
  if(viewport.height>viewport.width)await page.setViewportSize({width:viewport.height,height:viewport.width});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await page.getByRole('button',{name:'Tap to play',exact:true}).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  for(const equipped of [false,true]){
    if(equipped){await page.locator('#instrument-piano').focus();await page.keyboard.press('e');}
    for(const scene of scenes){
      await expect(page.locator(`.scene-${scene}`)).toBeVisible();
      const control=page.getByRole('button',{name:'Change landscape',exact:true});
      await expect(control).toHaveAttribute('data-settled','true');
      await expect.poll(()=>control.evaluate(element=>{
        const bounds=element.getBoundingClientRect();
        return element.contains(document.elementFromPoint(bounds.x+bounds.width/2,bounds.y+bounds.height/2));
      })).toBe(true);
      await control.click();
    }
  }
});

test('metronome transparent margins do not block scenery and its controls remain reachable',async({page})=>{
  const viewport=page.viewportSize();
  if(viewport.height>viewport.width)await page.setViewportSize({width:viewport.height,height:viewport.width});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await page.getByRole('button',{name:'Tap to play',exact:true}).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  await page.locator('#instrument-piano').focus();await page.keyboard.press('e');
  const mini=page.getByRole('button',{name:'Open metronome',exact:true});
  await mini.click();
  for(const control of [page.getByRole('slider',{name:'Metronome tempo weight'}),page.getByRole('switch',{name:'Metronome sound'})]){
    await expect.poll(()=>control.evaluate(element=>{
      const bounds=element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(bounds.x+bounds.width/2,bounds.y+bounds.height/2));
    })).toBe(true);
  }
  const object=page.locator('.scene .interactive-object').first();
  await object.click();
  await expect(page.getByRole('dialog',{name:'Metronome',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Change landscape',exact:true}).click();
  await expect(page.locator('.scene-garden')).toBeVisible();
  const bird=page.getByRole('button',{name:'Bird',exact:true});
  await expect.poll(()=>bird.evaluate(element=>{
    const bounds=element.getBoundingClientRect();
    return element.contains(document.elementFromPoint(bounds.x+bounds.width/2,bounds.y+bounds.height/2));
  })).toBe(true);
  await mini.click();
  await page.keyboard.press('Escape');
  await expect(mini).toBeVisible();
});

test('rotation and equipment retain circular reachable controls and zoomable caregiver layout',async({page},testInfo)=>{
  const viewport=page.viewportSize();
  if(viewport.height>viewport.width)await page.setViewportSize({width:viewport.height,height:viewport.width});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await page.getByRole('button',{name:'Tap to play',exact:true}).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  await page.locator('#instrument-piano').focus();await page.keyboard.press('e');
  for(const size of [{width:1440,height:900},{width:852,height:393},{width:780,height:284}]){
    await page.setViewportSize(size);
    for(const [name,diameter] of [['Change landscape',64],['Open settings',48]]){
      const control=page.getByRole('button',{name,exact:true});
      await expect.poll(()=>control.evaluate((element,diameter)=>{
        const bounds=element.getBoundingClientRect();
        return Math.abs(bounds.width-diameter)<1&&Math.abs(bounds.height-diameter)<1&&bounds.left>=0&&bounds.top>=0&&bounds.right<=innerWidth&&bounds.bottom<=innerHeight&&element.contains(document.elementFromPoint(bounds.x+bounds.width/2,bounds.y+bounds.height/2));
      },diameter)).toBe(true);
    }
    await page.getByRole('button',{name:'Open settings',exact:true}).dblclick();
    const close=page.getByRole('button',{name:'Close settings',exact:true});
    await expect(close).toBeVisible();
    const ancestry=await close.evaluate(element=>{
      const actions=[];
      for(let ancestor=element;ancestor;ancestor=ancestor.parentElement)actions.push(getComputedStyle(ancestor).touchAction);
      return actions;
    });
    expect(ancestry.every(action=>action==='auto'||action.includes('pinch-zoom'))).toBe(true);
    const dialog=page.getByRole('dialog',{name:'Settings',exact:true});
    const bounds=await dialog.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x+bounds.width).toBeLessThanOrEqual(size.width);expect(bounds.y+bounds.height).toBeLessThanOrEqual(size.height);
    await page.screenshot({path:testInfo.outputPath(`caregiver-layout-${size.width}.png`)});
    await close.click();
  }
});