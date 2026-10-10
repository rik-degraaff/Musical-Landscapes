import {test as base,expect} from '@playwright/test';

export const test=base.extend({
  savedChild:[async({page},use)=>{
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