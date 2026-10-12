import { test, expect } from '@playwright/test';

test.beforeEach(async ({page,context}) => {
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.editorErrors=errors;
  let document = {version:1,rules:[]};
  let revision = 'original';
  await context.route(/\/src\/data\/visual-overrides\.json(?:\?.*)?$/,route=>route.fulfill({contentType:'text/javascript',body:`export default ${JSON.stringify(document)};`}));
  await page.route('**/__editor/api/visuals',async route=>{
    if(route.request().method()==='POST') {
      const payload=route.request().postDataJSON();
      if(payload.revision!==revision)return route.fulfill({status:409,json:{error:'The project changed since you opened it.'}});
      document=payload.document;revision='saved';
      return route.fulfill({json:{revision}});
    }
    return route.fulfill({json:{document,revision}});
  });
  await page.goto('/__editor');
  await expect(page.getByRole('status')).toHaveText('Project loaded');
  await expect(page.frameLocator('iframe').locator('.art-moo')).toBeVisible();
});

test('SVG paths and colors update live, undo, and stay isolated until explicit save',async({page,context})=>{
  const preview=page.frameLocator('iframe');
  const game=await context.newPage();
  await game.addInitScript(()=>{Math.random=()=>.9;});
  await game.goto('/');
  const original=await game.locator('.art-moo > path[fill]').first().getAttribute('fill');
  await page.getByRole('button',{name:'Objects',exact:true}).click();
  await expect(preview.locator('.art-moo')).toBeVisible();
  await page.getByRole('button',{name:'Select SVG parts',exact:true}).click();
  const path=preview.locator('.art-moo > path[fill]').first();
  await path.click();
  await expect(page.getByLabel('attributes d',{exact:true})).toBeVisible();
  const originalPath=await path.getAttribute('d');
  await page.getByLabel('attributes d',{exact:true}).fill('M20 30H100V90H20Z');
  await expect(path).toHaveAttribute('d','M20 30H100V90H20Z');
  await page.getByLabel('attributes fill',{exact:true}).fill('#123456');
  await expect(path).toHaveAttribute('fill','#123456');
  await expect(game.locator('.art-moo > path[fill]').first()).toHaveAttribute('fill',original);
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  await expect(path).not.toHaveAttribute('fill','#123456');
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  await expect(path).toHaveAttribute('d',originalPath);
  await page.getByRole('button',{name:'Redo',exact:true}).click();
  await expect(path).toHaveAttribute('d','M20 30H100V90H20Z');
  const request=page.waitForRequest(request=>request.url().endsWith('/__editor/api/visuals')&&request.method()==='POST');
  await page.getByRole('button',{name:'Save to project',exact:true}).click();
  expect((await request).postDataJSON().document.rules[0].attributes.d).toBe('M20 30H100V90H20Z');
  await expect(page.getByRole('status')).toContainText('Saved to');
  await game.reload();
  await expect(game.locator('.art-moo > path[fill]').first()).toHaveAttribute('d','M20 30H100V90H20Z');
  await game.close();
});

test('object library, real character dialog, replay, responsive viewport, and visitor choices work',async({page})=>{
  const preview=page.frameLocator('iframe');
  await page.getByRole('button',{name:'Objects',exact:true}).click();
  await expect(preview.locator('.interactive-object')).toHaveCount(28);
  await expect(preview.locator('.instrument')).toHaveCount(8);
  await page.getByLabel('Instrument animations').check();
  await expect(preview.locator('.instrument.playing')).toHaveCount(8);
  await page.getByRole('button',{name:'Interact',exact:true}).click();
  await preview.getByRole('button',{name:'frog',exact:true}).click();
  await expect(preview.locator('.art-frog').locator('..')).toHaveClass(/reacting/);
  await page.getByRole('button',{name:'Pause animations',exact:true}).click();
  await expect(preview.locator('body')).toHaveClass(/editor-animations-paused/);
  await page.getByRole('button',{name:'Character',exact:true}).click();
  await expect(preview.getByRole('dialog',{name:'Add a child',exact:true})).toBeVisible();
  await expect(preview.getByRole('heading',{name:'A look of their own.'})).toBeVisible();
  await preview.locator('.avatar-style-options label').filter({has:preview.locator('input[value="ponytail"]')}).click();
  await expect(preview.locator('.avatar-live-preview .child-avatar')).toHaveAttribute('data-avatar-hair','ponytail');
  await page.locator('.editor-avatar summary').click();
  await page.getByLabel('Preview hair',{exact:true}).selectOption('bob');
  await expect(preview.locator('.avatar-live-preview .child-avatar')).toHaveAttribute('data-avatar-hair','bob');
  await page.getByRole('button',{name:'Scene',exact:true}).click();
  await page.getByLabel('Visitor preview').selectOption('0');
  await expect(preview.getByRole('button',{name:'Sheep',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Compact landscape viewport',exact:true}).click();
  await expect(page.getByLabel('Viewport width')).toHaveValue('780');
  await expect(page.getByLabel('Viewport height')).toHaveValue('284');
  expect(await preview.locator('body').evaluate(()=>({width:innerWidth,height:innerHeight}))).toEqual({width:780,height:284});
});

test('scene object and avatar dragging records reversible percentage constraints',async({page})=>{
  test.skip(test.info().project.name!=='desktop','Native mouse dragging is covered on desktop.');
  const preview=page.frameLocator('iframe');
  await page.getByRole('button',{name:'Drag scene items',exact:true}).click();
  const object=preview.getByRole('button',{name:'Cow',exact:true});
  const box=await object.boundingBox();
  const original=await object.evaluate(node=>getComputedStyle(node).getPropertyValue('--object-x').trim());
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width/2+50,box.y+box.height/2-20,{steps:5});
  await page.mouse.up();
  await expect(page.getByLabel('styles --object-x',{exact:true})).not.toHaveValue(original);
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  await expect.poll(()=>object.evaluate(node=>getComputedStyle(node).getPropertyValue('--object-x').trim())).toBe(original);
  const avatar=preview.locator('#young-musician');
  const avatarBox=await avatar.boundingBox();
  await page.mouse.move(avatarBox.x+avatarBox.width/2,avatarBox.y+avatarBox.height/2);
  await page.mouse.down();
  await page.mouse.move(avatarBox.x+avatarBox.width/2+40,avatarBox.y+avatarBox.height/2-20,{steps:5});
  await page.mouse.up();
  await expect(page.getByLabel('styles left',{exact:true})).toHaveValue(/%/);
  await expect(page.getByRole('button',{name:'Save to project',exact:true})).toBeEnabled();
});

test.afterEach(async ({page}) => {
  expect(page.editorErrors).toEqual([]);
});

test('compact-only color overrides restore at desktop sizes and decorative SVG scenery is draggable',async({page})=>{
  const preview=page.frameLocator('iframe');
  await page.getByRole('button',{name:'Select SVG parts',exact:true}).click();
  const barn=preview.locator('.landscape-art > g[transform]').filter({has:preview.locator('path[d="M-118 12H118V154H-118Z"]')});
  await page.getByRole('button',{name:'landscape-art svg',exact:true}).click();
  await page.getByRole('button',{name:'Browse SVG parts',exact:true}).click();
  await page.getByRole('button',{name:'path: M-118 12H118V154H-118Z path',exact:true}).click();
  await page.getByLabel('Compact viewport only').check();
  await page.getByLabel('attributes fill',{exact:true}).fill('#123456');
  await expect(barn.locator('path').first()).toHaveAttribute('fill','#cc6c59');
  await page.getByRole('button',{name:'Compact landscape viewport',exact:true}).click();
  await expect(barn.locator('path').first()).toHaveAttribute('fill','#123456');
  await page.getByRole('button',{name:'Desktop viewport',exact:true}).click();
  await expect(barn.locator('path').first()).toHaveAttribute('fill','#cc6c59');
  if(test.info().project.name==='desktop') {
    await page.getByRole('button',{name:'Select SVG parts',exact:true}).click();
    await page.getByRole('button',{name:'Drag scene items',exact:true}).click();
    const box=await barn.boundingBox();
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
    await page.mouse.down();
    await page.mouse.move(box.x+box.width/2-40,box.y+box.height/2+15,{steps:5});
    await page.mouse.up();
    await expect(page.getByLabel('styles translate',{exact:true})).toHaveValue(/px/);
    await expect(barn).toHaveCSS('translate',/px/);
  }
});