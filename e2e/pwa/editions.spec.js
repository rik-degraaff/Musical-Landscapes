import {test,expect} from '@playwright/test';
import {fixtureParent,fixtureSession,mockParentService} from '../accountFixtures.js';

async function passParentCheck(dialog) {
  const question=await dialog.locator('.membership-field').innerText();
  const [a,b,c]=question.match(/\d+/g).map(Number);
  await dialog.getByRole('textbox',{name:/For a parent/}).fill(String(a*b+c));
  await dialog.getByRole('button',{name:'Continue as parent'}).click();
}

test('trial saves an age, alternates morning and night, and offers three phrases per instrument',async({page})=>{
  const loaded=new Set();
  const scenery=new Set();
  page.on('request',request=>{
    const folder=/\/audio\/instruments\/([^/]+)\//.exec(request.url())?.[1];
    if(folder)loaded.add(folder);
    const effect=/\/audio\/scenery\/([^/]+)\.wav/.exec(request.url())?.[1];
    if(effect)scenery.add(effect);
  });
  await page.goto('/');
  const play=page.getByRole('button',{name:'Tap to play'});
  await expect(page.getByText('Play this free trial for as long as you like. It has no ads.')).toBeVisible();
  await expect(play).toBeDisabled();
  await page.getByRole('combobox',{name:'Child age range'}).selectOption('3to4');
  await play.click();
  const musician=page.getByRole('button',{name:'Enter practice room'});
  await expect(musician).toBeVisible({timeout:30000});
  expect([...loaded].sort()).toEqual(['drums','melody','piano','ukulele']);
  await expect(page.locator('.scene-farm')).toBeVisible();
  await expect(page.getByRole('button',{name:/open travel map/i})).toHaveCount(0);
  expect(scenery.has('bikeBell')).toBe(false);
  expect(scenery.has('crocodile')).toBe(false);
  const landscape=page.getByRole('button',{name:'Change landscape'});
  await landscape.focus();await landscape.press('Enter');
  await expect(page.locator('.scene-night')).toBeVisible();
  await landscape.press('Enter');
  await expect(page.locator('.scene-farm')).toBeVisible();
  await landscape.press('Enter');
  await expect(page.locator('.scene-night')).toBeVisible();
  await expect(page.getByRole('button',{name:'Change music weather'})).toHaveCount(0);
  await expect(page.locator('.landscape-world .instrument')).toHaveCount(4);

  await musician.focus();await page.keyboard.press('Enter');
  const room=page.getByRole('dialog',{name:'Farm practice room'});
  await room.getByRole('button',{name:'Choose an activity'}).click();
  await room.getByRole('button',{name:'Phrase practice'}).click();
  const instrument=room.getByRole('combobox',{name:'Practice instrument'});
  await expect(instrument.locator('option')).toHaveText(['Piano','Drums','Ukulele','Trumpet']);
  for(const id of ['piano','drums','ukulele','melody']){
    await instrument.selectOption(id);
    await expect(room.getByRole('combobox',{name:'Practice phrase'}).locator('option')).toHaveCount(3);
  }
  await room.getByRole('button',{name:'Start repeating'}).click();
  await expect(room.getByRole('button',{name:'Stop practice'})).toBeVisible();
  await room.getByRole('button',{name:'Stop practice'}).click();
  await expect(room.getByRole('button',{name:'Start repeating'})).toBeVisible();

  await page.reload();
  await expect(play).toBeEnabled();
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  const age=page.getByRole('combobox',{name:'Child age range'});
  await expect(age).toHaveValue('3to4');
  await age.selectOption('8plus');
  await page.reload();
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  await expect(age).toHaveValue('8plus');
  expect(await page.evaluate(()=>localStorage.getItem('farmjam-children-v1'))).toBeNull();
});

test('trial guides and parent entry explain the unlock without exposing purchases to children',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'For parents',exact:true}).click();
  const parent=page.getByRole('dialog',{name:'FarmJam for parents'});
  await expect(parent.getByText('Unlimited free trial')).toBeVisible();
  await expect(parent.getByText(/bicycle trips between the Farm and Jungle.*complete practice library.*child profiles/)).toBeVisible();
  await expect(parent.getByRole('button',{name:'Continue to one-time checkout'})).toHaveCount(0);
  const gate=parent.getByRole('textbox',{name:/For a parent/});
  await gate.fill('1');
  await parent.getByRole('button',{name:'Continue as parent'}).click();
  await expect(parent.getByRole('status')).toContainText('Ask a parent');
  await passParentCheck(parent);
  await expect(parent.getByRole('textbox',{name:'Parent email'})).toBeVisible();
  await parent.getByRole('button',{name:'Done'}).click();

  await page.getByRole('button',{name:'Settings',exact:true}).click();
  await page.getByRole('tab',{name:/Guides/}).click();
  await expect(page.getByRole('button',{name:/manage child profiles/i})).toHaveCount(0);
  await page.getByRole('button',{name:'Read explore the landscape'}).click();
  await expect(page.getByRole('heading',{name:'Explore morning and night'})).toBeVisible();
  await expect(page.getByRole('combobox',{name:'Choose a guide page'}).locator('option')).toHaveCount(2);
});

test('an invitation uses parent sign-in and grants full access only after redemption',async({page,context})=>{
  const token='c'.repeat(64);
  let unlocked=false,receivedToken;
  await mockParentService(context,body=>{
    if(body.action==='redeem'){receivedToken=body.token;unlocked=receivedToken===token;}
    return {unlocked};
  });
  await page.goto('/');
  await expect(page.locator('[data-edition=trial]')).toBeAttached();
  await page.evaluate(value=>{location.hash=`invite=${value}`;},token);
  await expect(page).not.toHaveURL(/#invite=/);
  const dialog=page.getByRole('dialog',{name:'FarmJam for parents'});
  await passParentCheck(dialog);
  await dialog.getByRole('textbox',{name:'Parent email'}).fill(fixtureParent.email);
  await dialog.getByRole('button',{name:'Email me a code'}).click();
  await dialog.getByRole('textbox',{name:'Email code'}).fill('123456');
  await dialog.getByRole('button',{name:'Sign in'}).click();
  await expect(page.locator('[data-edition=trial]')).toBeAttached();
  await dialog.getByRole('button',{name:'Redeem invitation'}).click();
  await expect(page.getByRole('button',{name:'Add child'})).toBeVisible();
  expect(receivedToken).toBe(token);
  await expect(page.getByText('Unlimited free trial')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button',{name:'Add child'})).toBeVisible();
  await page.getByRole('button',{name:/^Settings/}).click();
  await expect(page.getByRole('button',{name:'Manage parent account'})).toBeVisible();
  await page.getByRole('tab',{name:/Guides/}).click();
  await expect(page.getByRole('button',{name:'Read manage child profiles'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Read install and prepare your device'})).toBeVisible();
});

test('checkout return waits for the server grant and keeps existing child profiles',async({page,context})=>{
  let checkout=false,paid=false;
  await mockParentService(context,body=>{
    if(body.action==='checkout'){checkout=true;return {url:'https://checkout.stripe.com/farmjam-fixture'};}
    return {unlocked:paid};
  });
  await context.route('https://checkout.stripe.com/farmjam-fixture',route=>route.fulfill({status:302,headers:{
    location:'http://127.0.0.1:5176/?checkout=complete',
  }}));
  await page.addInitScript(session=>{
    localStorage.setItem('farmjam-parent-session-v1',JSON.stringify(session));
    localStorage.setItem('farmjam-children-v1',JSON.stringify({children:[{id:'saved',name:'River',age:'5to7'}],selectedId:'saved'}));
  },fixtureSession());
  await page.goto('/?edition=full');
  await expect(page.getByRole('radio',{name:'Select River'})).toHaveCount(0);
  await page.getByRole('button',{name:'For parents'}).click();
  const dialog=page.getByRole('dialog',{name:'FarmJam for parents'});
  await passParentCheck(dialog);
  await dialog.getByRole('button',{name:'Continue to one-time checkout'}).click();
  await expect.poll(()=>checkout).toBe(true);
  await passParentCheck(dialog);
  await expect(dialog.getByText(/Payment confirmation can take a moment/)).toBeVisible();
  await expect(page.locator('[data-edition=trial]')).toBeAttached();
  paid=true;
  await dialog.getByRole('button',{name:'Check access'}).click();
  await expect(page.getByRole('radio',{name:'Select River'})).toBeChecked();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button',{name:'Tap to play',exact:true}).click();
  await expect(page.getByRole('button',{name:'Open travel map with the bicycle'})).toBeVisible({timeout:30000});
});
