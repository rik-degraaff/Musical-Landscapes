import {test,expect} from '@playwright/test';

test('expanded hair and clothing options share palettes and matching colors persist',async({page},testInfo)=>{
  const size=page.viewportSize();if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});
  await page.goto('/');await page.getByRole('button',{name:'Add child',exact:true}).click();
  if(size.height>size.width)await page.setViewportSize(size);
  await page.getByRole('button',{name:'Next step',exact:true}).click();
  await page.getByRole('textbox',{name:'Child name'}).fill('Robin');await page.getByRole('button',{name:'Next step',exact:true}).click();
  const preview=page.locator('.avatar-live-preview svg');
  for(const [label,id] of [['Long curls','longCurls'],['Long straight','longStraight']]){
    await page.getByRole('radio',{name:label,exact:true}).check();await expect(preview).toHaveAttribute('data-avatar-hair',id);
    expect(await preview.locator('path').count()).toBeGreaterThan(15);
  }
  for(const top of ['Hoodie','Cardigan'])for(const bottom of ['Joggers','Leggings']){
    await page.getByRole('radio',{name:top,exact:true}).check();await page.getByRole('radio',{name:bottom,exact:true}).check();
    await expect(preview).toHaveAttribute('data-avatar-top',top.toLowerCase());await expect(preview).toHaveAttribute('data-avatar-bottom',bottom.toLowerCase());
  }
  for(const label of ['Light golden','Golden beige','Warm brown','Rich brown'])await page.getByRole('radio',{name:`Skin tone: ${label}`,exact:true}).check();
  await page.getByRole('radio',{name:'Hair color: Copper',exact:true}).check();await page.getByRole('radio',{name:'Eye color: Hazel',exact:true}).check();
  const fields=['Top primary color','Top secondary color','Bottom primary color','Bottom secondary color'];
  const palettes=[];for(const field of fields)palettes.push(await page.getByRole('group',{name:field,exact:true}).locator('input').evaluateAll(items=>items.map(item=>item.value)));
  for(const palette of palettes)expect(palette).toEqual(palettes[0]);expect(palettes[0].length).toBe(20);
  await page.getByRole('radio',{name:'Top primary color: Berry',exact:true}).check();await page.getByRole('radio',{name:'Top secondary color: Ivory',exact:true}).check();
  await page.getByRole('button',{name:'Match top colors',exact:true}).click();
  await expect(preview).toHaveAttribute('data-avatar-bottom-primary','#b34b58');await expect(preview).toHaveAttribute('data-avatar-bottom-secondary','#f5f1e8');
  await page.screenshot({path:testInfo.outputPath('coordinated-avatar.png')});
  const metrics=await page.locator('.parent-guide-content').evaluate(element=>({width:element.clientWidth,scroll:element.scrollWidth}));expect(metrics.scroll).toBeLessThanOrEqual(metrics.width);
  const originalViewport=page.viewportSize();
  const previewSizes=originalViewport.width>originalViewport.height?[originalViewport]:[];
  if(testInfo.project.name==='desktop')previewSizes.push({width:360,height:240});
  for(const viewport of previewSizes){
    await page.setViewportSize(viewport);
    await page.getByRole('radio',{name:'Joggers',exact:true}).check();
    await expect(async()=>{
      const bounds=await page.locator('.avatar-live-preview').evaluate(element=>{
        const content=element.closest('.parent-guide-content');
        const footer=element.closest('[role="dialog"]').querySelector('.parent-guide-footer');
        return {avatar:element.querySelector('svg').getBoundingClientRect().toJSON(),name:element.querySelector('strong').getBoundingClientRect().toJSON(),content:content.getBoundingClientRect().toJSON(),footer:footer.getBoundingClientRect().toJSON(),width:content.clientWidth,scroll:content.scrollWidth};
      });
      expect(bounds.scroll).toBeLessThanOrEqual(bounds.width);
      expect(bounds.avatar.top).toBeGreaterThanOrEqual(bounds.content.top);
      expect(bounds.avatar.bottom).toBeLessThanOrEqual(bounds.name.top);
      expect(bounds.name.bottom).toBeLessThanOrEqual(bounds.footer.top);
    }).toPass();
  }
  await page.setViewportSize(originalViewport);
  await page.getByRole('radio',{name:'Leggings',exact:true}).check();
  for(let step=0;step<2;step++)await page.getByRole('button',{name:'Next step',exact:true}).click();
  await page.getByRole('dialog',{name:'Add a child',exact:true}).getByRole('button',{name:'Add child',exact:true}).click();
  if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});
  await page.reload();const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('farmjam-children-v1')).children[0].avatar);
  expect(saved).toMatchObject({hair:'longStraight',top:'cardigan',bottom:'leggings',skin:'#8c593b',hairColor:'#a44832',eyes:'#a88a4c',topPrimary:'#b34b58',bottomPrimary:'#b34b58',topSecondary:'#f5f1e8',bottomSecondary:'#f5f1e8'});
  await expect(page.getByRole('radio',{name:'Select Robin',exact:true}).locator('svg.child-avatar')).toHaveAttribute('data-avatar-hair','longStraight');
});
