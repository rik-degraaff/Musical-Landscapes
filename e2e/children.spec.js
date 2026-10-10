import {test,expect} from '@playwright/test';

const CHILDREN_KEY='farmjam-children-v1';
const SETTINGS_KEY='farmjam-settings-v1';

async function start(page){const size=page.viewportSize();if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});await page.goto('/');}
async function children(page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'{"children":[],"selectedId":null}'),CHILDREN_KEY);}
async function settings(page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),SETTINGS_KEY);}
async function next(page){await page.getByRole('button',{name:'Next step',exact:true}).click();}
async function openNameStep(page){await page.getByRole('button',{name:'Add child',exact:true}).click();for(let step=0;step<3;step++)await next(page);}
async function avatarMarkup(svg){return svg.evaluate(element=>({viewBox:element.getAttribute('viewBox'),art:element.innerHTML}));}
async function expectAvatar(svg,child,preview){
  await expect(svg).toBeVisible();await expect(svg).toHaveAttribute('data-age',child.age);
  for(const [field,value] of Object.entries(child.avatar)){
    const attribute=`data-avatar-${field.replace(/[A-Z]/g,letter=>`-${letter.toLowerCase()}`)}`;
    await expect(svg).toHaveAttribute(attribute,value);
  }
  expect(await avatarMarkup(svg)).toEqual(preview);
}
async function addChild(page,{name,age,styles,colors,level}){
  await openNameStep(page);
  await page.getByRole('textbox',{name:'Child name'}).fill(name);
  await page.getByRole('radio',{name:age,exact:true}).check();await next(page);
  for(const label of styles)await page.getByRole('radio',{name:label,exact:true}).check();
  for(const label of colors)await page.getByRole('radio',{name:label,exact:true}).check();
  const preview=await avatarMarkup(page.locator('.avatar-live-preview svg'));
  await next(page);await next(page);
  await page.getByRole('radio',{name:level,exact:true}).check();
  await page.getByRole('button',{name:'Use these settings',exact:true}).click();
  for(let step=6;step<10;step++)await next(page);
  await page.getByRole('dialog',{name:'Add a child',exact:true}).getByRole('button',{name:'Add child',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Add a child',exact:true})).toHaveCount(0);
  await expect(page.locator('.start-overlay')).toBeVisible();await expect(page.getByRole('button',{name:'Tap to play'})).toBeEnabled();
  const saved=await children(page);const child=saved.children.find(value=>value.id===saved.selectedId);
  expect(child.name).toBe(name.trim());return {child,preview};
}
async function play(page){await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});}
async function expectMusician(page,child,preview){
  await expect(page.locator('#young-musician')).toHaveAttribute('data-child-name',child.name);
  await expectAvatar(page.locator('#young-musician svg.child-avatar'),child,preview);
  await page.locator('#young-musician').focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog',{name:'Farm practice room'})).toBeVisible();
  await expectAvatar(page.locator('.practice-musician svg.child-avatar'),child,preview);
  await page.getByRole('button',{name:'Leave practice through the open door'}).click();
}

test('empty menu cannot play and every cancellation path discards child setup',async({page})=>{
  await start(page);const playButton=page.getByRole('button',{name:'Tap to play'});
  await expect(playButton).toBeDisabled();await expect(page.getByRole('radio',{name:/^Select /})).toHaveCount(0);
  const initialSettings=await settings(page);
  for(const cancel of ['Escape','Cancel child setup','Cancel setup']){
    await openNameStep(page);await page.getByRole('textbox',{name:'Child name'}).fill('Draft');
    await next(page);await next(page);await next(page);
    await page.getByRole('button',{name:'Use these settings',exact:true}).click();
    expect((await children(page)).children).toEqual([]);expect(await settings(page)).toEqual(initialSettings);
    if(cancel==='Escape')await page.keyboard.press('Escape');else await page.getByRole('button',{name:cancel,exact:true}).click();
    await expect(page.getByRole('dialog',{name:'Add a child',exact:true})).toHaveCount(0);
    expect((await children(page)).children).toEqual([]);expect((await children(page)).selectedId).toBeNull();
    expect(await page.evaluate(()=>localStorage.getItem('farmjam-parent-guide-v1'))).toBeNull();
    await expect(playButton).toBeDisabled();await expect(page.getByRole('button',{name:'Add child',exact:true})).toBeFocused();
  }
  await page.reload();await expect(playButton).toBeDisabled();expect((await children(page)).children).toEqual([]);
});

test('child name is required, rejects whitespace, and limits the trimmed name to forty characters',async({page})=>{
  await start(page);await openNameStep(page);
  const name=page.getByRole('textbox',{name:'Child name'});const forward=page.getByRole('button',{name:'Next step',exact:true});
  await expect(name).toHaveAttribute('required','');await expect(name).toHaveAttribute('maxlength','40');
  for(const value of ['','   ']){await name.fill(value);await expect(forward).toBeDisabled();}
  await name.fill('A'.repeat(41));expect((await name.inputValue()).trim().length).toBeLessThanOrEqual(40);
  await name.fill('  Player  ');await expect(forward).toBeEnabled();await forward.click();
  await expect(page.locator('.avatar-live-preview')).toContainText('Player');expect((await children(page)).children).toEqual([]);
  await page.getByRole('button',{name:'Previous step',exact:true}).click();await name.fill(' ');await expect(forward).toBeDisabled();
});

test('cancelling another child preserves the selected saved child and all its settings',async({page})=>{
  await start(page);
  const savedSettings=await page.evaluate(async()=>{
    const {defaultSettings}=await import('/src/utils/settings.js');const saved=defaultSettings();
    saved.selected=['piano','drums','guitar','melody','marimba','flute'];
    saved.instruments.piano.complexity=1;saved.instruments.guitar.fingeringCharts=true;saved.instruments.flute.noteLabels=true;
    localStorage.setItem('farmjam-settings-v1',JSON.stringify(saved));
    localStorage.setItem('farmjam-children-v1',JSON.stringify({children:[{id:'player',name:'Player',age:'5to7',settings:saved}],selectedId:'player'}));
    return saved;
  });
  await page.reload();await expect(page.getByRole('radio',{name:'Select Player',exact:true})).toBeChecked();
  await expect.poll(()=>settings(page)).toEqual(savedSettings);const original=await children(page);
  await openNameStep(page);await page.getByRole('textbox',{name:'Child name'}).fill('Draft');
  await next(page);await next(page);await next(page);
  await page.getByRole('radio',{name:'Simple',exact:true}).check();await page.getByRole('button',{name:'Use these settings',exact:true}).click();
  expect(await children(page)).toEqual(original);expect(await settings(page)).toEqual(savedSettings);
  await page.getByRole('button',{name:'Cancel setup',exact:true}).click();
  await expect(page.getByRole('radio',{name:'Select Player',exact:true})).toBeChecked();await expect(page.getByRole('button',{name:'Tap to play'})).toBeEnabled();
  expect(await children(page)).toEqual(original);expect(await settings(page)).toEqual(savedSettings);
  await page.reload();await expect(page.getByRole('radio',{name:'Select Player',exact:true})).toBeChecked();expect(await settings(page)).toEqual(savedSettings);
});

test('two children keep independent avatars, ages and settings through selection, reload, gameplay and practice',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await start(page);
  const first=await addChild(page,{name:'  Alex  ',age:'3\u20134',styles:['Curls','Overalls','Shorts'],colors:['Hair color: Black','Eye color: Green','Skin tone: Tan','Top primary color: Teal','Top secondary color: Mint','Bottom primary color: Moss','Bottom secondary color: Peach'],level:'Simple'});
  const firstSaved=await children(page);
  const second=await addChild(page,{name:'Sam',age:'8+',styles:['Ponytail','Sweater','Skirt'],colors:['Hair color: Golden','Eye color: Blue','Skin tone: Deep','Top primary color: Blue','Top secondary color: Rose','Bottom primary color: Plum','Bottom secondary color: Lilac'],level:'Advanced'});
  const saved=await children(page);expect(saved.children).toHaveLength(2);expect(saved.children[0]).toEqual(firstSaved.children[0]);
  expect(first.child.id).not.toBe(second.child.id);expect(first.child.age).toBe('3to4');expect(second.child.age).toBe('8plus');
  expect(first.child.avatar).not.toEqual(second.child.avatar);expect(first.preview.art).not.toEqual(second.preview.art);
  expect(Object.values(first.child.settings.instruments).every(value=>value.complexity===.35)).toBe(true);
  expect(Object.values(second.child.settings.instruments).every(value=>value.complexity===1.5)).toBe(true);
  await expect(page.getByRole('radio',{name:'Select Sam',exact:true})).toBeChecked();
  await page.reload();await expect(page.getByRole('radio',{name:'Select Sam',exact:true})).toBeChecked();expect(await children(page)).toEqual(saved);
  await page.getByRole('radio',{name:'Select Alex',exact:true}).click();
  await expect(page.getByRole('radio',{name:'Select Alex',exact:true})).toBeChecked();
  await expect.poll(()=>settings(page)).toEqual(first.child.settings);
  await page.reload();await expect(page.getByRole('radio',{name:'Select Alex',exact:true})).toBeChecked();
  expect((await children(page)).selectedId).toBe(first.child.id);await expect.poll(()=>settings(page)).toEqual(first.child.settings);
  await play(page);await expectMusician(page,first.child,first.preview);
  await page.getByRole('button',{name:'Open settings'}).dblclick();await page.getByRole('tab',{name:'Instruments',exact:true}).click();
  await page.getByRole('combobox',{name:'Configure instrument'}).selectOption('piano');await page.getByRole('radio',{name:'Standard',exact:true}).check();
  await expect.poll(async()=>((await children(page)).children.find(child=>child.id===first.child.id)).settings.instruments.piano.complexity).toBe(1);
  const changed=await children(page);expect(changed.children.find(child=>child.id===second.child.id)).toEqual(second.child);
  const expectedSettings=structuredClone(first.child.settings);expectedSettings.instruments.piano.complexity=1;
  expect(changed.children.find(child=>child.id===first.child.id).settings).toEqual(expectedSettings);
  await page.reload();await expect.poll(()=>settings(page)).toEqual(expectedSettings);
  await page.getByRole('radio',{name:'Select Sam',exact:true}).click();await expect.poll(()=>settings(page)).toEqual(second.child.settings);
  await page.reload();await expect(page.getByRole('radio',{name:'Select Sam',exact:true})).toBeChecked();await expect.poll(()=>settings(page)).toEqual(second.child.settings);
  await play(page);await expectMusician(page,second.child,second.preview);expect(errors).toEqual([]);
});

for(const saved of ['broken',JSON.stringify({children:[],selectedId:'missing'}),JSON.stringify({children:[{id:'invalid',name:' ',age:'5to7'}],selectedId:'invalid'})]){
  test(`invalid saved children cannot unlock play: ${saved}`,async({page})=>{
    await page.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:CHILDREN_KEY,value:saved});
    await start(page);await expect(page.getByRole('button',{name:'Tap to play'})).toBeDisabled();
    await expect(page.getByRole('radio',{name:/^Select /})).toHaveCount(0);
  });
}