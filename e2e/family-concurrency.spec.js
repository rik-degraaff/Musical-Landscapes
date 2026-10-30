import {test,expect} from '@playwright/test';

const FAMILY_KEY='farmjam-children-v1';
const SETTINGS_KEY='farmjam-settings-v1';

async function readFamily(page) {
  return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),FAMILY_KEY);
}

async function seed(page,{sibling=false}={}) {
  const size=page.viewportSize();
  if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});
  await page.goto('/');
  await page.evaluate(async({familyKey,settingsKey,sibling})=>{
    const {defaultSettings}=await import('/src/utils/settings.js');
    const settings=defaultSettings();
    const children=[{id:'player',name:'Player',age:'5to7',settings}];
    if(sibling)children.push({id:'sibling',name:'Sibling',age:'8plus',settings:defaultSettings()});
    localStorage.setItem(familyKey,JSON.stringify({children,selectedId:'player'}));
    localStorage.setItem(settingsKey,JSON.stringify(settings));
  },{familyKey:FAMILY_KEY,settingsKey:SETTINGS_KEY,sibling});
  await page.reload();
}

async function openSibling(context,page) {
  const newer=await context.newPage();
  await newer.setViewportSize(page.viewportSize());
  await newer.goto('/');
  return newer;
}

async function prepareChild(page,name) {
  await page.getByRole('button',{name:'Add child',exact:true}).click();
  if(await page.getByRole('heading',{name:'How familiar are you with music?',exact:true}).isVisible())await page.getByRole('button',{name:'Next step',exact:true}).click();
  await page.getByRole('textbox',{name:'Child name'}).fill(name);
  for(let step=0;step<3;step++)await page.getByRole('button',{name:'Next step',exact:true}).click();
  return page.getByRole('dialog',{name:'Add a child',exact:true}).getByRole('button',{name:'Add child',exact:true});
}

async function removeChild(page,name) {
  await page.getByRole('button',{name:`Edit ${name}`,exact:true}).click();
  await page.getByRole('button',{name:'Delete child',exact:true}).click();
  await page.getByRole('button',{name:'Delete child permanently',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

test('a stale menu selection preserves the child added in another tab',async({page,context})=>{
  await seed(page);
  const newer=await openSibling(context,page);
  await (await prepareChild(newer,'New sibling')).click();
  await expect(newer.getByRole('dialog',{name:'Add a child',exact:true})).toHaveCount(0);
  await page.getByRole('radio',{name:'Select Player',exact:true}).click();
  expect((await readFamily(page)).children.map(child=>child.name)).toEqual(['Player','New sibling']);
  await expect(page.getByRole('radio',{name:'Select New sibling',exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('radio',{name:'Select New sibling',exact:true})).toBeVisible();
});

test('stale settings preserve remote profile edits and sibling settings',async({page,context})=>{
  await seed(page,{sibling:true});
  const newer=await openSibling(context,page);
  await page.locator('.start-settings').click();
  await page.getByRole('tab',{name:'Instruments',exact:true}).click();
  await page.getByRole('combobox',{name:'Configure instrument'}).selectOption('piano');
  await newer.getByRole('button',{name:'Edit Player',exact:true}).click();
  await newer.getByRole('textbox',{name:'Child name'}).fill('Renamed');
  await newer.getByRole('button',{name:'Save changes',exact:true}).click();
  await newer.getByRole('radio',{name:'Select Sibling',exact:true}).click();
  await newer.locator('.start-settings').click();
  await newer.getByRole('tab',{name:'Instruments',exact:true}).click();
  await newer.getByRole('combobox',{name:'Configure instrument'}).selectOption('piano');
  await newer.getByRole('radio',{name:'Standard',exact:true}).check();
  await page.getByRole('radio',{name:'Simple',exact:true}).check();
  const family=await readFamily(page);
  expect(family.children[0].name).toBe('Renamed');
  expect(family.children[0].settings.instruments.piano.complexity).toBe(.35);
  expect(family.children[1].settings.instruments.piano.complexity).toBe(1);
  await expect(page.locator('.save-status')).toHaveCount(0);
});

test('a stale tab cannot resurrect its selected child after another tab deletes it',async({page,context})=>{
  await seed(page,{sibling:true});
  const newer=await openSibling(context,page);
  await removeChild(newer,'Player');
  await page.getByRole('radio',{name:'Select Player',exact:true}).click();
  expect((await readFamily(page)).children.map(child=>child.id)).toEqual(['sibling']);
  await expect(page.getByRole('radio',{name:'Select Player',exact:true})).toHaveCount(0);
  await expect(page.getByRole('radio',{name:'Select Sibling',exact:true})).toBeChecked();
  await removeChild(newer,'Sibling');
  await page.getByRole('radio',{name:'Select Sibling',exact:true}).click();
  expect((await readFamily(page)).children).toEqual([]);
  await expect(page.getByRole('button',{name:'Tap to play',exact:true})).toBeDisabled();
});

test('retrying a partially saved child creation keeps its ID and avoids duplicates',async({page})=>{
  await seed(page);
  const add=await prepareChild(page,'New sibling');
  await page.evaluate(key=>{
    const write=Storage.prototype.setItem;
    Storage.prototype.setItem=function(name,value){if(name===key)throw new DOMException('Test quota','QuotaExceededError');return write.call(this,name,value);};
    window.restoreFamilyWrites=()=>{Storage.prototype.setItem=write;};
  },SETTINGS_KEY);
  await add.click();
  await expect(page.getByRole('alert')).toContainText('save');
  const first=await readFamily(page),id=first.children.find(child=>child.name==='New sibling').id;
  await page.evaluate(()=>window.restoreFamilyWrites());
  await add.click();
  await expect(page.getByRole('dialog',{name:'Add a child',exact:true})).toHaveCount(0);
  const saved=await readFamily(page);
  expect(saved.children.filter(child=>child.name==='New sibling').map(child=>child.id)).toEqual([id]);
  await expect(page.locator('.save-status')).toHaveCount(0);
});

test('a mirror-only retry preserves edits saved by another tab after the family write',async({page,context})=>{
  await seed(page);
  const newer=await openSibling(context,page);
  await page.locator('.start-settings').click();
  await page.getByRole('tab',{name:'Instruments',exact:true}).click();
  await page.getByRole('combobox',{name:'Configure instrument'}).selectOption('piano');
  await page.evaluate(key=>{
    const write=Storage.prototype.setItem;
    Storage.prototype.setItem=function(name,value){if(name===key)throw new DOMException('Test quota','QuotaExceededError');return write.call(this,name,value);};
    window.restoreFamilyWrites=()=>{Storage.prototype.setItem=write;};
  },SETTINGS_KEY);
  await page.getByRole('radio',{name:'Simple',exact:true}).check();
  await expect(page.locator('.save-status')).toBeVisible();
  await newer.reload();
  await newer.locator('.start-settings').click();
  await newer.getByRole('tab',{name:'Instruments',exact:true}).click();
  await newer.getByRole('combobox',{name:'Configure instrument'}).selectOption('piano');
  await newer.getByRole('radio',{name:'Standard',exact:true}).check();
  await page.evaluate(()=>window.restoreFamilyWrites());
  await page.getByRole('button',{name:'Retry saving',exact:true}).click();
  await expect(page.locator('.save-status')).toHaveCount(0);
  await expect(page.getByRole('radio',{name:'Standard',exact:true})).toBeChecked();
  expect((await readFamily(page)).children[0].settings.instruments.piano.complexity).toBe(1);
});
