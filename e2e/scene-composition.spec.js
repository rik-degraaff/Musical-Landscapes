import {test,expect} from './fixtures.js';

const scenes=['farm','garden','pond','dusk','night','late-night','dawn'];
const habitats={moo:'ground',tractor:'ground',water:'ground',bird:'perch',frog:'ground',windmill:'ground',bell:'perch',owl:'perch',rooster:'ground',chimes:'perch',cricket:'ground',airplane:'sky',bat:'sky',hedgehog:'ground',sheep:'ground',horse:'ground',bee:'garden',woodpecker:'perch',duck:'water',otter:'water',cicada:'ground',balloon:'sky',fox:'ground',badger:'ground',moth:'sky',shootingStar:'sky',dove:'perch',deer:'ground'};
const overlaps=(first,second)=>first.x<second.x+second.width&&first.x+first.width>second.x&&first.y<second.y+second.height&&first.y+first.height>second.y;

for(const [layout,width,height] of [['desktop',1440,900],['tablet',1024,768],['phone',852,393],['compact',780,284],['small',640,360]]){
  for(const [variant,roll] of [['regular',.9],['frequent',.1],['rare',.27]])test.describe(`${layout} ${variant}`,()=>{
    test.use({sceneVisitorRoll:roll});
    test('all seven scenes place every object in a sensible visible habitat',async({page},testInfo)=>{
      await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
      await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
      const failures=[];const captured=new Set();
      for(const scene of scenes){
        const host=page.locator(`.scene-${scene}`);await expect(host).toBeVisible();await expect(host.locator('.celestial-control')).toHaveAttribute('data-settled','true');
        await page.waitForTimeout(350);
        const objects=host.locator('.interactive-object');await expect(objects).toHaveCount(2);
        const plainCelestial=await host.locator('.celestial-control').boundingBox();
        for(const instrument of await page.locator('.instrument .instrument-illustration').all())if(overlaps(await instrument.boundingBox(),plainCelestial))failures.push(`${scene}: plain instrument overlaps settled sun/moon`);
        const rectangles=[];
        for(const object of await objects.all()){
          const sound=await object.getAttribute('data-sound');const bounds=await object.boundingBox();
          captured.add(sound);rectangles.push({sound,...bounds});
          if(bounds.x<0||bounds.y<0||bounds.x+bounds.width>width+1||bounds.y+bounds.height>height+1)failures.push(`${scene} ${sound}: outside viewport`);
          if(Math.min(bounds.width,bounds.height)<52||Math.max(bounds.width,bounds.height)>180)failures.push(`${scene} ${sound}: inappropriate size`);
          if(habitats[sound]==='ground'&&(bounds.y+bounds.height)/height<.66)failures.push(`${scene} ${sound}: floating above ground`);
          if(habitats[sound]==='water'&&(bounds.y+bounds.height)/height<.74)failures.push(`${scene} ${sound}: outside pond water`);
          if(habitats[sound]==='sky'&&(bounds.y+bounds.height*.5)/height>.47)failures.push(`${scene} ${sound}: below sky`);
          if(!await object.evaluate(element=>{const bounds=element.getBoundingClientRect();return element.contains(document.elementFromPoint(bounds.x+bounds.width/2,bounds.y+bounds.height/2));}))failures.push(`${scene} ${sound}: center not hittable`);
          await object.screenshot({path:testInfo.outputPath(`${scene}-${sound}-detail.png`)});
        }
        const [first,second]=rectangles;
        if(first.x<second.x+second.width&&first.x+first.width>second.x&&first.y<second.y+second.height&&first.y+first.height>second.y)failures.push(`${scene}: scenery objects overlap`);
        await page.screenshot({path:testInfo.outputPath(`${scene}-scene.png`)});
        await page.locator('#instrument-piano').focus();await page.keyboard.press('e');
        await page.waitForTimeout(350);
        const equipped=await page.locator('.equipped-instrument .instrument-illustration').boundingBox();
        const settings=await page.getByRole('button',{name:'Open settings'}).boundingBox();
        for(const object of await objects.all()){
          const sound=await object.getAttribute('data-sound');
          const bounds=await object.boundingBox();
          if(overlaps(bounds,equipped))failures.push(`${scene} ${sound}: overlaps held instrument`);
          if(overlaps(bounds,settings))failures.push(`${scene} ${sound}: overlaps settings`);
          if(!await object.evaluate(element=>{const bounds=element.getBoundingClientRect();return element.contains(document.elementFromPoint(bounds.x+bounds.width/2,bounds.y+bounds.height/2));}))failures.push(`${scene} ${sound}: equipped center not hittable`);
        }
        const celestial=await host.locator('.celestial-control').boundingBox();
        for(const instrument of await page.locator('.instrument:not(.equipped-instrument) .instrument-illustration').all())if(overlaps(await instrument.boundingBox(),celestial))failures.push(`${scene}: instrument overlaps settled sun/moon`);
        await page.screenshot({path:testInfo.outputPath(`${scene}-equipped.png`)});
        await page.getByRole('button',{name:'Put instrument down'}).click();
        await page.getByRole('button',{name:'Change landscape'}).click({force:true});
      }
      expect(failures).toEqual([]);
      expect(captured.size).toBe(14);
    });
  });
}