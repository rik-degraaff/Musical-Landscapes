import {test,expect} from './fixtures.js';

test.beforeEach(async({page})=>{
  const viewport=page.viewportSize();
  if(viewport.height>viewport.width)await page.setViewportSize({width:viewport.height,height:viewport.width});
});

async function blockWrites(page,key) {
  await page.evaluate(key=>{
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(name,value){if(name===key)throw new DOMException('Test quota','QuotaExceededError');return original.call(this,name,value);};
    window.restoreStorage=()=>{Storage.prototype.setItem=original;};
  },key);
}

async function captureSaveWarning(page,testInfo,label) {
  const warning=page.locator('.save-status');
  const bounds=await warning.boundingBox();
  const viewport=page.viewportSize();
  expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x+bounds.width).toBeLessThanOrEqual(viewport.width);
  expect(bounds.y+bounds.height).toBeLessThanOrEqual(viewport.height);
  const retry=page.getByRole('button',{name:'Retry saving'});
  expect(await retry.evaluate(element=>{
    const rect=element.getBoundingClientRect();
    return element.contains(document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2));
  })).toBe(true);
  await page.screenshot({path:testInfo.outputPath(`${label}-save-warning.png`)});
}

for(const key of ['farmjam-children-v1','farmjam-settings-v1']) {
  test(`${key} failures retain live settings, report unsaved changes and recover`,async({page},testInfo)=>{
    await page.goto('/');
    await page.getByRole('button',{name:'Tap to play'}).click();
    await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
    await page.getByRole('button',{name:'Open settings'}).dblclick();
    await page.getByRole('tab',{name:'Instruments',exact:true}).click();
    await page.getByRole('combobox',{name:'Configure instrument'}).selectOption('piano');
    await blockWrites(page,key);
    await page.getByRole('radio',{name:'Simple',exact:true}).check();
    await expect(page.locator('.save-status')).toContainText('could not save');
    await captureSaveWarning(page,testInfo,'settings');
    await expect(page.getByRole('radio',{name:'Simple',exact:true})).toBeChecked();
    await page.keyboard.press('Escape');
    await page.locator('#instrument-piano').focus();await page.keyboard.press('e');
    const keyCount=await page.evaluate(async()=>{
      const {equippedProfile}=await import('/src/utils/difficulty.js');
      return equippedProfile('piano','A',{complexity:.35}).keyboardNotes.length;
    });
    await expect(page.locator('.performance-piano .note-key')).toHaveCount(keyCount);
    await page.getByRole('button',{name:'Open settings'}).dblclick();
    await page.getByRole('button',{name:'Retry saving'}).click();
    await expect(page.locator('.save-status')).toContainText('could not save');
    await page.evaluate(()=>window.restoreStorage());
    await page.getByRole('button',{name:'Retry saving'}).click();
    await expect(page.locator('.save-status')).toHaveCount(0);
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('farmjam-settings-v1')).instruments.piano.complexity)).toBe(.35);
    await page.reload();await page.getByRole('button',{name:'Tap to play'}).click();
    await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
    await page.getByRole('button',{name:'Open settings'}).dblclick();
    await page.getByRole('tab',{name:'Instruments',exact:true}).click();
    await page.getByRole('combobox',{name:'Configure instrument'}).selectOption('piano');
    await expect(page.getByRole('radio',{name:'Simple',exact:true})).toBeChecked();
  });
}

test('selection failures retain the selected child and defer updates until a successful save',async({page},testInfo)=>{
  await page.goto('/');
  await page.evaluate(()=>{
    const family=JSON.parse(localStorage.getItem('farmjam-children-v1'));
    const sibling=structuredClone(family.children[0]);sibling.id='sibling';sibling.name='Sibling';
    sibling.settings={instruments:{piano:{complexity:.35}}};
    family.children.push(sibling);localStorage.setItem('farmjam-children-v1',JSON.stringify(family));
  });
  await page.reload();await blockWrites(page,'farmjam-children-v1');
  await page.getByRole('radio',{name:'Select Sibling'}).click();
  await expect(page.getByRole('radio',{name:'Select Sibling'})).toBeChecked();
  await expect(page.getByRole('status')).toContainText('could not save');
  await captureSaveWarning(page,testInfo,'menu');
  await page.evaluate(async()=>{
    window.appliedUpdates=0;
    const {appUpdates}=await import('/src/utils/updatePolicy.js');
    appUpdates.setApplyUpdate(()=>{window.appliedUpdates++;});appUpdates.requestUpdate();
  });
  await page.getByRole('button',{name:'Retry saving'}).click();
  expect(await page.evaluate(()=>window.appliedUpdates)).toBe(0);
  await page.evaluate(()=>window.restoreStorage());
  await page.getByRole('button',{name:'Retry saving'}).click();
  await expect.poll(()=>page.evaluate(()=>window.appliedUpdates)).toBe(1);
  await expect(page.locator('.save-status')).toHaveCount(0);
  await page.reload();await expect(page.getByRole('radio',{name:'Select Sibling'})).toBeChecked();
});

test('denied storage getter does not crash the menu or discard a caregiver draft',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Denied','SecurityError');}}));
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('button',{name:'Tap to play'})).toBeDisabled();
  await expect(page.getByRole('status')).toContainText('could not save');
  await page.getByRole('button',{name:'Add child',exact:true}).click();
  for(let step=0;step<3;step++)await page.getByRole('button',{name:'Next step',exact:true}).click();
  await page.getByRole('textbox',{name:'Child name'}).fill('Draft');
  for(let step=3;step<10;step++)await page.getByRole('button',{name:'Next step',exact:true}).click();
  await page.getByRole('dialog',{name:'Add a child',exact:true}).getByRole('button',{name:'Add child',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Add a child',exact:true})).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('save');
  for(let step=10;step>3;step--)await page.getByRole('button',{name:'Previous step',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Child name'})).toHaveValue('Draft');
  expect(errors).toEqual([]);
});

for(const deniedKey of ['getter','farmjam-children-v1','farmjam-settings-v1']) {
  test(`retry after transient ${deniedKey} read failure preserves recovered profiles`,async({page})=>{
    await page.goto('/');
    const original=await page.evaluate(()=>{
      const family=JSON.parse(localStorage.getItem('farmjam-children-v1'));
      family.children.push({...family.children[0],id:'saved-sibling',name:'Saved sibling',settings:{instruments:{piano:{complexity:.35}}}});
      localStorage.setItem('farmjam-children-v1',JSON.stringify(family));return family;
    });
    await page.addInitScript(key=>{
      const getter=Object.getOwnPropertyDescriptor(window,'localStorage');
      const read=Storage.prototype.getItem;
      let denied=true;
      if(key==='getter')Object.defineProperty(window,'localStorage',{configurable:true,get(){if(denied)throw new DOMException('Denied','SecurityError');return getter.get.call(window);}});
      else Storage.prototype.getItem=function(name){if(denied&&name===key)throw new DOMException('Denied','SecurityError');return read.call(this,name);};
      window.restoreReads=()=>{denied=false;};
    },deniedKey);
    await page.reload();await expect(page.locator('.save-status')).toBeVisible();
    await page.getByRole('button',{name:'Retry saving'}).click();
    await expect(page.locator('.save-status')).toBeVisible();
    if(deniedKey==='farmjam-settings-v1'){
      await page.getByRole('button',{name:'Tap to play'}).click();
      await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
      await page.locator('#instrument-drums').click();
      await page.getByRole('button',{name:'Open settings'}).dblclick();
      await page.getByRole('tab',{name:'Instruments',exact:true}).click();
      await page.getByRole('combobox',{name:'Configure instrument'}).selectOption('piano');
      await page.getByRole('radio',{name:'Simple',exact:true}).check();
    }
    await page.evaluate(()=>window.restoreReads());
    await page.getByRole('button',{name:'Retry saving'}).click();
    await expect(page.locator('.save-status')).toHaveCount(0);
    if(deniedKey==='farmjam-settings-v1'){
      await expect(page.getByRole('radio',{name:'Simple',exact:true})).toBeChecked();
      await page.keyboard.press('Escape');
      await expect(page.locator('#instrument-drums')).toHaveAttribute('aria-pressed','true');
      await page.getByRole('button',{name:'Open settings'}).dblclick();
      await page.getByRole('button',{name:'Return to main menu'}).click();
    }
    await expect(page.getByRole('radio',{name:'Select Saved sibling'})).toBeVisible();
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('farmjam-children-v1')).children.map(child=>({id:child.id,name:child.name})))).toEqual(original.children.map(child=>({id:child.id,name:child.name})));
    await page.getByRole('radio',{name:'Select Saved sibling'}).click();
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('farmjam-settings-v1')).instruments.piano.complexity)).toBe(.35);
  });
}