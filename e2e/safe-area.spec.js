import {test,expect} from './fixtures.js';

test('corner controls remain hittable inside changing full-screen safe areas',async({page},testInfo)=>{
  await page.setViewportSize({width:852,height:393});await page.goto('/');
  await page.getByRole('button',{name:'Tap to play'}).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  async function insets(top,side,bottom){
    await page.evaluate(({top,side,bottom})=>{
      const style=document.documentElement.style;
      style.setProperty('--safe-top',`${top}px`);style.setProperty('--safe-left',`${side}px`);style.setProperty('--safe-right',`${side}px`);style.setProperty('--safe-bottom',`${bottom}px`);
    },{top,side,bottom});
  }
  async function safeControl(control,top,side,bottom=0,hittable=true){
    const bounds=await control.boundingBox();
    expect(bounds.y).toBeGreaterThanOrEqual(top);expect(bounds.x).toBeGreaterThanOrEqual(side);
    expect(bounds.x+bounds.width).toBeLessThanOrEqual(page.viewportSize().width-side);
    expect(bounds.y+bounds.height).toBeLessThanOrEqual(page.viewportSize().height-bottom);
    if(hittable)expect(await control.evaluate(element=>{const box=element.getBoundingClientRect();return element.contains(document.elementFromPoint(box.left+box.width/2,box.top+box.height/2));})).toBe(true);
  }
  for(const [top,side,bottom] of [[0,0,0],[24,44,21],[32,0,0]]){
    await insets(top,side,bottom);
    const mini=page.getByRole('button',{name:'Open metronome',exact:true});await safeControl(mini,top,side,bottom);
    await mini.click();await safeControl(page.getByRole('dialog',{name:'Metronome',exact:true}),top,side,bottom,false);
    await safeControl(page.getByRole('switch',{name:'Metronome sound',exact:true}),top,side,bottom);
    await page.keyboard.press('Escape');
    const settings=page.getByRole('button',{name:'Open settings'});await safeControl(settings,top,side);
    await settings.dblclick();
    const close=page.getByRole('button',{name:'Close settings',exact:true});await safeControl(close,top,side);await close.click();
    await page.locator('#young-musician').focus();await page.keyboard.press('Enter');
    const exit=page.getByRole('button',{name:'Leave practice through the open door'});await safeControl(exit,top,side);
    await page.getByRole('button',{name:'Open metronome',exact:true}).click();
    await safeControl(page.getByRole('dialog',{name:'Metronome',exact:true}),top,side,bottom,false);
    await safeControl(page.getByRole('switch',{name:'Metronome sound',exact:true}),top,side,bottom);await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog',{name:'Metronome',exact:true})).toHaveCount(0);
    await expect(page.getByRole('dialog',{name:'Farm practice room',exact:true})).toBeVisible();
    await page.screenshot({path:testInfo.outputPath(`safe-area-${top}-${side}.png`)});await exit.click();
  }
  await page.getByRole('button',{name:'Open settings'}).dblclick();await page.getByRole('button',{name:'Return to main menu'}).click();
  await insets(24,44,21);await page.getByRole('button',{name:'Add child',exact:true}).click();
  const cancel=page.getByRole('button',{name:'Cancel child setup'});await safeControl(cancel,24,44);await cancel.click();
});
