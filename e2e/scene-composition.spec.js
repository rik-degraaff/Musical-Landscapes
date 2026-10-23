import {test,expect,waitForInstrumentSettling} from './fixtures.js';

const scenes=['farm','garden','pond','dusk','night','late-night','dawn'];

async function reachable(target) {
  return target.evaluate(element=>{
    const bounds=element.getBoundingClientRect();
    for(const vertical of [.25,.5,.75])for(const horizontal of [.25,.5,.75]){
      if(element.contains(document.elementFromPoint(bounds.x+bounds.width*horizontal,bounds.y+bounds.height*vertical)))return true;
    }
    return false;
  });
}

for(const [layout,width,height] of [['desktop',1440,900],['tablet',1024,768],['phone',852,393],['compact',780,284],['small',640,360],['minimum',360,240],['maximum',1920,1080],['square',768,700],['wide',1180,250]]){
  for(const [variant,roll] of [['regular',.9],['frequent',.1],['rare',.27]])test.describe(`${layout} ${variant}`,()=>{
    test.use({sceneVisitorRoll:roll});
    test('saved scene layouts keep objects visible and controls reachable',async({page})=>{
      await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
      await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
      const failures=[];const captured=new Set();
      for(const scene of scenes){
        const host=page.locator(`.scene-${scene}`);await expect(host).toBeVisible();await expect(host.locator('.celestial-control')).toHaveAttribute('data-settled','true');
        await waitForInstrumentSettling(page);
        const checkDoorway=async()=>{
          const join=await host.evaluate(element=>{
            const door=element.querySelector('[data-doorway]'),road=element.querySelector('[data-name="Doorway path"]');
            if(!door&&!road)return null;
            if(!door||!road)return {missing:true};
            const bounds=door.getBoundingClientRect(),point=road.getPointAtLength(0).matrixTransform(road.getScreenCTM());
            return {x:Math.abs(point.x-bounds.left),y:Math.abs(point.y-bounds.bottom)};
          });
          if(join&&(join.missing||join.x>1||join.y>1))failures.push(`${scene}: road does not meet doorway`);
        };
        await checkDoorway();
        const objects=host.locator('.interactive-object');await expect(objects).toHaveCount(2);
        const checkSeparation=async()=>{
          const [one,two]=await Promise.all((await objects.all()).map(object=>object.boundingBox()));
          if(one.x+one.width>two.x+1&&two.x+two.width>one.x+1&&one.y+one.height>two.y+1&&two.y+two.height>one.y+1)failures.push(`${scene}: scene targets overlap`);
        };
        await checkSeparation();
        for(const object of await objects.all()){
          const sound=await object.getAttribute('data-sound');const bounds=await object.boundingBox();
          captured.add(sound);
          if(bounds.x<0||bounds.y<0||bounds.x+bounds.width>width+1||bounds.y+bounds.height>height+1)failures.push(`${scene} ${sound}: outside viewport`);
          if(Math.min(bounds.width,bounds.height)<43.9)failures.push(`${scene} ${sound}: target smaller than 44px`);
          if(!await reachable(object))failures.push(`${scene} ${sound}: not reachable`);
        }
        if(!await reachable(host.locator('.celestial-control')))failures.push(`${scene}: landscape control not reachable`);
        await page.locator('#instrument-piano').focus();await page.keyboard.press('e');
        await expect(page.locator('.performance-piano')).toBeVisible();
        await waitForInstrumentSettling(page);
        await checkDoorway();
        await checkSeparation();
        const world=await page.locator('.landscape-world').boundingBox();
        for(const object of await objects.all()){
          const sound=await object.getAttribute('data-sound');
          const bounds=await object.boundingBox();
          if(bounds.x<world.x||bounds.y<world.y||bounds.x+bounds.width>world.x+world.width+1||bounds.y+bounds.height>world.y+world.height+1)failures.push(`${scene} ${sound}: equipped outside world`);
          if(!await reachable(object))failures.push(`${scene} ${sound}: equipped not reachable`);
        }
        for(const name of ['Change landscape','Open settings','Open metronome','Open caregiver help']){
          if(!await reachable(page.getByRole('button',{name,exact:true})))failures.push(`${scene}: ${name} not reachable`);
        }
        await page.getByRole('button',{name:'Put instrument down'}).click();
        await page.getByRole('button',{name:'Change landscape'}).click();
      }
      expect(failures).toEqual([]);
      expect(captured.size).toBe(14);
    });
  });
}
