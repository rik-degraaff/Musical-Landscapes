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