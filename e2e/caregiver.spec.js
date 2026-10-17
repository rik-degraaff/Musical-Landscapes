import {test,expect} from '@playwright/test';

async function family(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('farmjam-children-v1')));}
async function start(page,parent='new') {
  const size=page.viewportSize();if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});
  await page.goto('/');
  await page.evaluate(async parent=>{
    const {defaultSettings}=await import('/src/utils/settings.js');
    const {normalizeChildren}=await import('/src/utils/children.js');
    const settings=defaultSettings();settings.instruments.piano.complexity=.35;
    localStorage.setItem('farmjam-children-v1',JSON.stringify(normalizeChildren({children:[{id:'alex',name:'Alex',age:'5to7',profile:{parent,music:'some',instruments:['piano']},settings},{id:'sam',name:'Sam',age:'8plus',profile:{parent:'confident'},settings:defaultSettings()}],selectedId:'alex'})));
  },parent);
  await page.reload();
  await expect(page.getByRole('button',{name:'Edit Alex',exact:true})).toBeVisible();
}
async function openHelp(page) {
  const button=page.getByRole('button',{name:'Open caregiver help',exact:true});
  await button.click();
  await expect(page.getByRole('dialog',{name:'Caregiver help',exact:true})).toBeVisible();
}
async function fits(page,selector) {
  const bounds=await page.locator(selector).evaluate(element=>({rect:element.getBoundingClientRect().toJSON(),width:innerWidth,height:innerHeight,scroll:element.scrollWidth,client:element.clientWidth}));
  expect(bounds.rect.x).toBeGreaterThanOrEqual(0);expect(bounds.rect.y).toBeGreaterThanOrEqual(0);
  expect(bounds.rect.right).toBeLessThanOrEqual(bounds.width+1);expect(bounds.rect.bottom).toBeLessThanOrEqual(bounds.height+1);
  expect(bounds.scroll).toBeLessThanOrEqual(bounds.client+1);
}

test('editing name, age and appearance is a draft; save preserves sibling settings and persists into play',async({page},testInfo)=>{
  await start(page);const original=await family(page);
  await page.getByRole('button',{name:'Edit Alex',exact:true}).click();
  const editor=page.getByRole('dialog',{name:'Edit Alex',exact:true});
  await expect(page.getByRole('textbox',{name:'Child name'})).toBeFocused();
  await page.getByRole('textbox',{name:'Child name'}).fill('Draft');await page.getByRole('radio',{name:'8+',exact:true}).check();
  await page.getByRole('button',{name:'Cancel',exact:true}).click();expect(await family(page)).toEqual(original);
  await expect(page.getByRole('button',{name:'Edit Alex',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Edit Alex',exact:true}).click();
  await page.getByRole('textbox',{name:'Child name'}).fill(' ');await expect(page.getByRole('button',{name:'Save changes'})).toBeDisabled();
  await page.getByRole('textbox',{name:'Child name'}).fill(' Ally ');await page.getByRole('radio',{name:'8+',exact:true}).check();
  await page.getByRole('radio',{name:'Bob',exact:true}).check();await page.getByRole('radio',{name:'Top primary color: Teal',exact:true}).check();
  await expect(page.getByRole('radio',{name:'Comfortable with music',exact:true})).toHaveCount(0);
  await fits(page,'.caregiver-dialog');await page.screenshot({path:`test-results/caregiver-${testInfo.project.name}-editor.png`});
  await page.getByRole('button',{name:'Save changes'}).click();await expect(editor).toHaveCount(0);
  const saved=await family(page);const edited=saved.children[0];expect(edited.name).toBe('Ally');expect(edited.age).toBe('8plus');expect(edited.avatar.hair).toBe('bob');expect(edited.profile.parent).toBe(original.children[0].profile.parent);
  expect(edited.settings).toEqual(original.children[0].settings);expect(edited.profile.music).toBe('some');expect(saved.children[1]).toEqual(original.children[1]);
  await page.reload();expect(await family(page)).toEqual(saved);await expect(page.getByRole('radio',{name:'Select Ally',exact:true})).toBeChecked();
  await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('#young-musician')).toHaveAttribute('data-child-name','Ally',{timeout:30000});
  await expect(page.locator('#young-musician .child-avatar')).toHaveAttribute('data-age','8plus');await expect(page.locator('#young-musician .child-avatar')).toHaveAttribute('data-avatar-hair','bob');
});

test('deletion requires a named explicit confirmation, preserves siblings, and disables play for an empty family',async({page})=>{
  await start(page);const original=await family(page);
  await page.getByRole('button',{name:'Edit Sam',exact:true}).click();await page.getByRole('button',{name:'Delete child',exact:true}).click();
  await expect(page.getByRole('alertdialog',{name:'Delete Sam?',exact:true})).toBeVisible();await expect(page.getByText('This cannot be undone.',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Keep child',exact:true})).toBeFocused();expect(await family(page)).toEqual(original);
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'Edit Sam',exact:true})).toBeVisible();expect(await family(page)).toEqual(original);
  await page.getByRole('button',{name:'Delete child',exact:true}).click();await page.getByRole('button',{name:'Keep child',exact:true}).click();expect(await family(page)).toEqual(original);
  await page.getByRole('button',{name:'Delete child',exact:true}).click();await page.getByRole('button',{name:'Delete child permanently',exact:true}).click();
  let saved=await family(page);expect(saved.children).toEqual([original.children[0]]);expect(saved.selectedId).toBe('alex');
  await page.getByRole('button',{name:'Edit Alex',exact:true}).click();await page.getByRole('button',{name:'Delete child',exact:true}).click();await page.getByRole('button',{name:'Delete child permanently',exact:true}).click();
  saved=await family(page);expect(saved).toEqual({children:[],selectedId:null});await expect(page.getByRole('button',{name:'Tap to play'})).toBeDisabled();
  await page.reload();expect(await family(page)).toEqual(saved);await expect(page.getByRole('button',{name:'Tap to play'})).toBeDisabled();
});

test('context help opens with one activation, uses saved familiarity, and closes without leaving Settings or practice',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await start(page);
  const help=page.getByRole('button',{name:'Open caregiver help',exact:true});await help.click();await expect(page.getByRole('dialog',{name:'Caregiver help',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Choose a child to play',exact:true})).toBeVisible();await fits(page,'.caregiver-dialog');await page.keyboard.press('Escape');await expect(help).toBeFocused();
  await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  await openHelp(page);await expect(page.locator('.caregiver-dialog')).toContainText('Tap the sun or moon');await expect(page.locator('.discovery-help')).toHaveCount(0);await expect(page.getByRole('button',{name:'Play it yourself',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Open practice',exact:true})).toBeVisible();await page.keyboard.press('Escape');
  await page.locator('#instrument-piano').focus();await page.keyboard.press('e');await openHelp(page);await expect(page.locator('.caregiver-dialog h3').first()).toHaveText('Play the piano');await expect(page.locator('.discovery-help')).toHaveCount(0);await expect(page.locator('.instrument-help')).toContainText('Each key makes one note');await expect(page.locator('.caregiver-dialog')).toContainText('Press or hold the piano keys');await expect(page.getByRole('button',{name:'Read: Play an instrument',exact:true})).toBeVisible();await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Open settings',exact:true}).dblclick();const settings=page.getByRole('dialog',{name:'Settings',exact:true});
  await expect(settings).toContainText('quieter sound');await page.getByRole('tab',{name:'Instruments',exact:true}).click();await expect(settings).toContainText('A note is one musical sound');
  await openHelp(page);await expect(page.locator('.caregiver-dialog')).toContainText('Caregiver contains shared music familiarity');await page.getByRole('button',{name:'Back to Settings',exact:true}).click();await expect(settings).toBeVisible();
  await openHelp(page);await page.keyboard.press('Escape');await expect(settings).toBeVisible();await page.keyboard.press('Escape');await expect(settings).toHaveCount(0);
  await page.locator('#young-musician').focus();await page.keyboard.press('Enter');const practice=page.getByRole('dialog',{name:'Farm practice room',exact:true});await expect(practice).toBeVisible();
  await openHelp(page);await expect(page.locator('.caregiver-dialog')).toContainText('Press Ready and wait for the count-in');await fits(page,'.caregiver-dialog');
  await page.screenshot({path:`test-results/caregiver-${testInfo.project.name}-help.png`});await page.keyboard.press('Escape');await expect(practice).toBeVisible();
  await fits(page,'.practice-topbar');await page.getByRole('button',{name:'Leave practice through the open door'}).click();await openHelp(page);await expect(page.locator('.discovery-help')).toHaveCount(0);await page.keyboard.press('Escape');expect(errors).toEqual([]);
});

test('global familiarity changes help immediately, survives child selection and reload, and established setup skips the question',async({page},testInfo)=>{
  await start(page,'new');await page.getByRole('radio',{name:'Select Sam',exact:true}).check();await page.reload();
  await page.getByRole('button',{name:'Add child',exact:true}).click();await expect(page.getByRole('textbox',{name:'Child name'})).toBeVisible();await expect(page.getByRole('radio',{name:'New to music',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Cancel child setup'}).click();
  await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});await page.locator('#instrument-piano').focus();await page.keyboard.press('e');await page.getByRole('button',{name:'Open settings',exact:true}).dblclick();
  const settings=page.getByRole('dialog',{name:'Settings',exact:true});await page.getByRole('tab',{name:'Caregiver',exact:true}).click();await expect(settings.getByRole('radio',{name:'New to music',exact:true})).toBeChecked();await settings.getByRole('radio',{name:'Comfortable with music',exact:true}).check();
  await fits(page,'.settings-dialog');await page.screenshot({path:`test-results/caregiver-${testInfo.project.name}-global-settings.png`});await page.getByRole('tab',{name:'Sound',exact:true}).click();await expect(settings).toContainText('relative gain');
  await page.getByRole('button',{name:'Close settings',exact:true}).click();await openHelp(page);await expect(page.locator('.caregiver-dialog h3').first()).toHaveText('Play the piano');await expect(page.locator('.instrument-help')).toContainText('all twelve notes');await expect(page.locator('.instrument-help')).not.toContainText('Each key makes one note');await page.keyboard.press('Escape');await page.getByRole('button',{name:'Open settings',exact:true}).dblclick();
  await page.getByRole('button',{name:'Return to main menu',exact:true}).click();await page.getByRole('radio',{name:'Select Alex',exact:true}).check();await page.reload();
  await page.getByRole('button',{name:/^Settings/}).click();await page.getByRole('tab',{name:'Caregiver',exact:true}).click();await expect(page.getByRole('radio',{name:'Comfortable with music',exact:true})).toBeChecked();await page.getByRole('button',{name:'Done with settings',exact:true}).click();
  await page.getByRole('button',{name:'Add child',exact:true}).click();await page.getByRole('textbox',{name:'Child name'}).fill('Charlie');for(let step=0;step<3;step++)await page.getByRole('button',{name:'Next step',exact:true}).click();await page.locator('.parent-guide-footer').getByRole('button',{name:'Add child',exact:true}).click();await expect(page.getByRole('button',{name:'Edit Charlie',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('farmjam-caregiver-settings-v1')).familiarity)).toBe('confident');expect((await family(page)).children.slice(0,2).map(child=>child.profile.parent)).toEqual(['new','confident']);
});

test('practice help follows the selected stage and returns to the current task',async({page})=>{
  await start(page);await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  await page.locator('#young-musician').focus();await page.keyboard.press('Enter');await expect(page.getByRole('dialog',{name:'Farm practice room',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'2. Learn',exact:true}).click();await openHelp(page);
  await expect(page.locator('.caregiver-dialog')).toContainText('Learn waits for you');await expect(page.locator('.caregiver-dialog')).toContainText('A chord means several notes');await expect(page.locator('.caregiver-dialog')).not.toContainText('Press Ready and wait for the count-in');await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'2. Learn',exact:true})).toHaveAttribute('aria-pressed','true');await page.getByRole('button',{name:'Leave practice through the open door'}).click();await openHelp(page);await expect(page.locator('.caregiver-dialog')).toContainText('Tap the sun or moon');await expect(page.locator('.discovery-help')).toHaveCount(0);await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Open settings',exact:true}).dblclick();await page.getByRole('button',{name:'Return to main menu',exact:true}).click();
  await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});await openHelp(page);
  await expect(page.getByRole('heading',{name:'Explore the landscape',exact:true})).toBeVisible();await expect(page.locator('.discovery-help')).toHaveCount(0);
});

test('global familiarity save failures retain the live wording and retry the global preference',async({page})=>{
  await start(page);
  await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  await page.getByRole('button',{name:'Open settings',exact:true}).dblclick();
  await page.evaluate(()=>{
    const original=Storage.prototype.setItem;
    window.restoreCaregiverWrites=()=>{Storage.prototype.setItem=original;};
    Storage.prototype.setItem=function(key,value){if(key==='farmjam-caregiver-settings-v1')throw new DOMException('Full','QuotaExceededError');return original.call(this,key,value);};
  });
  await page.getByRole('tab',{name:'Caregiver',exact:true}).click();await page.getByRole('radio',{name:'Comfortable with music',exact:true}).check();await expect(page.locator('.save-status')).toBeVisible();
  await page.getByRole('tab',{name:'Sound',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Settings',exact:true})).toContainText('relative gain');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('farmjam-caregiver-settings-v1')).familiarity)).toBe('new');
  await page.getByRole('button',{name:'Retry saving',exact:true}).click();await expect(page.locator('.save-status')).toBeVisible();
  await page.evaluate(()=>window.restoreCaregiverWrites());await page.getByRole('button',{name:'Retry saving',exact:true}).click();await expect(page.locator('.save-status')).toHaveCount(0);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('farmjam-caregiver-settings-v1')).familiarity)).toBe('confident');
  await page.getByRole('button',{name:'Return to main menu',exact:true}).click();await page.reload();
  await page.getByRole('button',{name:/^Settings/}).click();await page.getByRole('tab',{name:'Caregiver',exact:true}).click();await expect(page.getByRole('radio',{name:'Comfortable with music',exact:true})).toBeChecked();
});

test('experienced caretaker sees musical explanations in optional guides and in-game help',async({page})=>{
  await start(page,'confident');await page.getByRole('button',{name:/^Settings/}).click();await page.getByRole('tab',{name:/^Guides/}).click();await page.getByRole('button',{name:'Read play an instrument',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Play an instrument',exact:true})).toContainText('current key and beat');await page.getByRole('combobox',{name:'Choose a guide page',exact:true}).selectOption('2');await expect(page.getByRole('dialog',{name:'Play an instrument',exact:true})).toContainText('all twelve notes');await page.keyboard.press('Escape');await page.getByRole('button',{name:'Done with settings',exact:true}).click();
  await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});await page.locator('#instrument-piano').focus();await page.keyboard.press('e');await openHelp(page);await expect(page.locator('.instrument-help')).toContainText('all twelve notes');await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Open settings',exact:true}).dblclick();await expect(page.getByRole('dialog',{name:'Settings'})).toContainText('relative gain');await page.getByRole('tab',{name:'Instruments',exact:true}).click();await expect(page.getByRole('dialog',{name:'Settings'})).toContainText('I, IV and V triads');
});

for(const failedKey of ['farmjam-settings-v1','farmjam-children-v1'])test(`failed ${failedKey} writes cannot silently delete a child; retry finishes the confirmed operation`,async({page})=>{
  await start(page);const original=await family(page);const settings=await page.evaluate(()=>localStorage.getItem('farmjam-settings-v1'));
  await page.evaluate(key=>{
    const setItem=Storage.prototype.setItem;
    window.restoreProfileWrites=()=>{Storage.prototype.setItem=setItem;};
    Storage.prototype.setItem=function(name,value){if(name===key)throw new DOMException('Storage full','QuotaExceededError');return setItem.call(this,name,value);};
  },failedKey);
  await page.getByRole('button',{name:'Edit Alex',exact:true}).click();await page.getByRole('button',{name:'Delete child',exact:true}).click();await page.getByRole('button',{name:'Delete child permanently',exact:true}).click();
  await expect(page.getByRole('alertdialog',{name:'Delete Alex?',exact:true})).toBeVisible();await expect(page.getByRole('alert')).toContainText('Deletion could not be fully saved');
  expect(await family(page)).toEqual(original);expect(await page.evaluate(()=>localStorage.getItem('farmjam-settings-v1'))).toBe(settings);
  await page.evaluate(()=>window.restoreProfileWrites());await page.getByRole('button',{name:'Delete child permanently',exact:true}).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);const saved=await family(page);expect(saved.children).toEqual([original.children[1]]);expect(saved.selectedId).toBe('sam');
  await expect(page.getByRole('radio',{name:'Select Sam',exact:true})).toBeChecked();await page.reload();expect(await family(page)).toEqual(saved);
});
