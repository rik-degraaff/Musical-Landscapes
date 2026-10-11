import {test,expect} from './fixtures.js';

test('note feedback coexists, floats from played controls and expires without blocking input',async({page},testInfo)=>{
  const size=page.viewportSize();if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});
  await page.goto('/');await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  await page.locator('#young-musician').focus();await page.keyboard.press('Enter');await page.getByRole('button',{name:'2. Learn',exact:true}).click();
  for(const note of ['D4','F4','A4']){
    const control=page.getByRole('button',{name:`Piano key ${note}`,exact:true});await control.focus();await page.keyboard.press('Space');
  }
  const floats=page.locator('.practice-feedback-float');await expect(floats).toHaveCount(3);
  await expect(page.locator('.practice-feedback-float[data-tone="wrong"]')).toHaveCount(2);
  await expect(page.locator('.practice-feedback-float[data-tone="correct"]')).toHaveCount(1);
  await expect(page.locator('.practice-feedback-layer')).toHaveCSS('pointer-events','none');
  await expect(page.locator('.practice-feedback-layer')).toHaveCSS('position','absolute');
  const layer=await page.locator('.practice-feedback-layer').boundingBox();expect(layer.height).toBe(page.viewportSize().height);
  const correct=page.locator('.practice-feedback-float[data-tone="correct"]');
  const initial=await correct.boundingBox();const key=await page.getByRole('button',{name:'Piano key A4',exact:true}).boundingBox();
  expect(initial.y).toBeGreaterThanOrEqual(0);expect(initial.y+initial.height).toBeLessThanOrEqual(page.viewportSize().height);
  expect(Math.abs(initial.x+initial.width/2-(key.x+key.width/2))).toBeLessThan(65);
  await expect.poll(async()=>(await correct.boundingBox())?.y??initial.y).toBeLessThan(initial.y-12);
  await page.screenshot({path:testInfo.outputPath('overlapping-feedback.png')});
  await expect(floats).toHaveCount(0,{timeout:5000});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.getByRole('button',{name:'Piano key D4',exact:true}).focus();await page.keyboard.press('Space');
  await expect(floats).toHaveCount(1);await expect(floats).toHaveCSS('animation-name','practiceFeedbackFade');
  await page.getByRole('button',{name:'Restart practice'}).click();await expect(floats).toHaveCount(0);
});