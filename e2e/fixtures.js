import {test as base,expect} from '@playwright/test';

export const test=base.extend({
  sceneVisitorRoll:[.9,{option:true}],
  savedChild:[async({page,sceneVisitorRoll},use)=>{
    await page.addInitScript(roll=>{window.__testVisitorRoll=roll;},sceneVisitorRoll);
    await page.route('**/src/utils/sceneVisitors.js*',async route=>{
      const response=await route.fetch();const source=await response.text();
      const body=source.replace(/(function visitorRoll\(\)\s*\{\s*)return Math.random\(\);/,'$1return window.__testVisitorRoll;');
      if(body===source)throw new Error('Scenery random source mock did not match');
      await route.fulfill({response,body});
    });
    await page.addInitScript(()=>{
      if(localStorage.getItem('farmjam-children-v1')!==null)return;
      localStorage.setItem('farmjam-children-v1',JSON.stringify({
        children:[{id:'player',name:'Player',age:'5to7',profile:{age:'5to7',music:'new',instruments:[],parent:'some'}}],
        selectedId:'player'
      }));
    });
    await use();
  },{auto:true}]
});

export {expect};

export async function doubleActivate(locator, testInfo) {
  if (!testInfo.project.use.hasTouch) {
    await locator.dblclick();
    return;
  }
  // Resolve actionability once, then send both native taps without another
  // locator wait or assertion consuming the application's double-tap interval.
  await locator.tap({trial:true});
  const bounds=await locator.boundingBox();
  const page=locator.page();
  const x=bounds.x+bounds.width/2,y=bounds.y+bounds.height/2;
  await page.touchscreen.tap(x,y);
  await page.touchscreen.tap(x,y);
}

export async function waitForInstrumentSettling(page) {
  await page.locator('.landscape-world .instrument').evaluateAll(async elements=>{
    // Let React's layout RAF enqueue its transitions before waiting for them.
    await new Promise(resolve=>requestAnimationFrame(resolve));
    await new Promise(resolve=>requestAnimationFrame(resolve));
    const finite=elements.flatMap(element=>element.getAnimations()).filter(animation=>animation.effect?.getTiming().iterations!==Infinity);
    await Promise.allSettled(finite.map(animation=>animation.finished));
  });
}
