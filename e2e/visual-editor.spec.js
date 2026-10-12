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

test('editor canvas and controls fit desktop and portrait phone layouts',async({page},testInfo)=>{
  for(const viewport of [{width:1440,height:900},{width:393,height:851}]){
    await page.setViewportSize(viewport);
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect.poll(()=>page.locator('.editor-frame-wrap').evaluate(node=>node.getBoundingClientRect().width<=node.closest('.editor-stage').getBoundingClientRect().width)).toBe(true);
    await page.getByRole('button',{name:'Cow button',exact:true}).click();
    await page.screenshot({path:testInfo.outputPath(`editor-${viewport.width}.png`),fullPage:true});
  }
});

test('responsive endpoint resizing interpolates and leaves the other endpoint intact', async ({page}) => {
  test.skip(test.info().project.name !== 'desktop', 'Native canvas grips are checked on desktop.');
  const preview = page.frameLocator('iframe');
  const cow = preview.getByRole('button', {name:'Cow',exact:true});
  await cow.click();
  await page.getByRole('button',{name:'Fit responsive endpoints',exact:true}).click();
  await expect(page.getByLabel('Endpoint width')).toBeVisible();
  const minimum = Number(await page.getByLabel('Endpoint width').inputValue());
  await page.getByRole('button',{name:'Maximum 1920 x 1080',exact:true}).click();
  const maximum = Number(await page.getByLabel('Endpoint width').inputValue());
  await page.getByRole('button',{name:'Minimum 360 x 240',exact:true}).click();
  await page.getByLabel('Aspect lock').uncheck();
  const handle = preview.getByRole('button',{name:'Resize selected item se',exact:true});
  const box = await handle.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2); await page.mouse.down();
  await page.mouse.move(box.x+box.width/2+25,box.y+box.height/2+12,{steps:5}); await page.mouse.up();
  const changed = Number(await page.getByLabel('Endpoint width').inputValue());
  expect(changed).toBeGreaterThan(minimum+10);
  await page.getByRole('button',{name:'Maximum 1920 x 1080',exact:true}).click();
  await expect(page.getByLabel('Endpoint width')).toHaveValue(String(Number(maximum.toFixed(2))));
  await page.getByLabel('Viewport width').fill('1140'); await page.getByLabel('Viewport height').fill('660');
  await expect.poll(()=>cow.evaluate(node=>node.getBoundingClientRect().width)).toBeCloseTo((changed+maximum)/2,0);
  await page.getByLabel('Viewport width').fill('9000');
  await expect(page.getByLabel('Viewport width')).toHaveValue('1920');
});

test('background layers can occlude an interactable and reset without changing SVG identity', async ({page}) => {
  const preview = page.frameLocator('iframe');
  const barn = preview.locator('.landscape-art:not([data-visual-layer]) > g[transform]').filter({has:preview.locator('path[d="M-118 12H118V154H-118Z"]')});
  await page.getByRole('button',{name:'landscape-art svg',exact:true}).click();
  await page.getByRole('button',{name:'Browse SVG parts',exact:true}).click();
  await page.getByRole('button',{name:'Barn g',exact:true}).click();
  await page.getByLabel('Layer depth').fill('60');
  await expect(preview.locator('[data-visual-layer]')).toHaveCount(1);
  await expect(barn).toHaveCSS('visibility','hidden');
  await expect(preview.locator('[data-visual-layer]')).toHaveCSS('z-index','60');
  await page.getByRole('button',{name:'Refresh scene outline',exact:true}).click();
  await page.getByRole('button',{name:'Cow button',exact:true}).click();
  await page.getByRole('button',{name:'Fit responsive endpoints',exact:true}).click();
  await page.getByRole('button',{name:'Maximum 1920 x 1080',exact:true}).click();
  const position = await barn.evaluate(node=>{const bounds=node.getBoundingClientRect(),world=node.closest('.landscape-world').getBoundingClientRect();return {x:(bounds.left+bounds.width/2-world.left)/world.width*100,y:(bounds.top+bounds.height/2-world.top)/world.height*100};});
  await page.getByLabel('Endpoint x').fill(String(position.x)); await page.getByLabel('Endpoint y').fill(String(position.y));
  expect(await preview.locator('[data-visual-layer]').evaluate(node=>{const cow=node.parentElement.querySelector('.cow');const bounds=cow.getBoundingClientRect();return document.elementsFromPoint(bounds.left+bounds.width/2,bounds.top+bounds.height/2).some(hit=>hit.closest('[data-visual-layer]'));})).toBe(true);
  await page.getByRole('button',{name:'landscape-art svg',exact:true}).click();
  await page.getByRole('button',{name:'Browse SVG parts',exact:true}).click();
  await page.getByRole('button',{name:'Barn g',exact:true}).click();
  await page.getByRole('button',{name:'Reset selected item',exact:true}).click();
  await expect(preview.locator('[data-visual-layer]')).toHaveCount(0);
  await expect(barn).toHaveCSS('visibility','visible');
});

test('saved instrument placement remains draggable and can still equip in the normal game', async ({page,context}) => {
  test.skip(test.info().project.name !== 'desktop', 'Native game drag checked on desktop.');
  const preview = page.frameLocator('iframe');
  await page.getByRole('button',{name:'Pause animations',exact:true}).click();
  await preview.locator('#instrument-piano').click();
  await page.getByLabel('styles left',{exact:true}).fill('22%');
  await page.getByLabel('styles top',{exact:true}).fill('25%');
  await page.getByRole('button',{name:'Fit responsive endpoints',exact:true}).click();
  await page.getByRole('button',{name:'Maximum 1920 x 1080',exact:true}).click();
  await page.getByLabel('Endpoint width').fill('160');
  await page.getByRole('button',{name:'Interact',exact:true}).click();
  const sandbox=preview.locator('#instrument-piano');
  const sandboxBox=await sandbox.boundingBox();
  await page.mouse.move(sandboxBox.x+sandboxBox.width/2,sandboxBox.y+sandboxBox.height/2);await page.mouse.down();
  await page.mouse.move(sandboxBox.x+sandboxBox.width/2+65,sandboxBox.y+sandboxBox.height/2+40,{steps:8});await page.mouse.up();
  await expect.poll(async()=>{const next=await sandbox.boundingBox();return Math.hypot(next.x-sandboxBox.x,next.y-sandboxBox.y);}).toBeGreaterThan(20);
  await page.getByRole('button',{name:'Save to project',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Saved to');
  const game = await context.newPage();
  await game.addInitScript(()=>localStorage.setItem('farmjam-children-v1',JSON.stringify({children:[{id:'player',name:'Player',age:'5to7',profile:{age:'5to7',music:'new',instruments:[],parent:'some'}}],selectedId:'player'})));
  await game.goto('/'); await game.getByRole('button',{name:'Tap to play',exact:true}).click();
  await expect(game.locator('#young-musician')).toBeVisible({timeout:20000});
  const piano = game.locator('#instrument-piano');
  const box = await piano.boundingBox();
  await game.mouse.move(box.x+box.width/2,box.y+box.height/2); await game.mouse.down();
  await game.mouse.move(box.x+box.width/2+100,box.y+box.height/2+60,{steps:8}); await game.mouse.up();
  await expect.poll(async()=>{const next=await piano.boundingBox();return Math.hypot(next.x-box.x,next.y-box.y);}).toBeGreaterThan(30);
  const moved=await piano.boundingBox(),child=await game.locator('#young-musician').boundingBox();
  await game.mouse.move(moved.x+moved.width/2,moved.y+moved.height/2); await game.mouse.down();
  await game.mouse.move(child.x+child.width/2,child.y+child.height/2,{steps:10}); await game.mouse.up();
  await expect(game.locator('.performance-piano')).toBeVisible();
  await game.close();
});

test('background resizing uses the saved geometry at both endpoints and between them', async ({page}) => {
  const preview=page.frameLocator('iframe');
  const barn=preview.locator('.landscape-art:not([data-visual-layer]) [data-name="Barn"]');
  await page.getByRole('button',{name:'Barn g',exact:true}).click();
  await page.getByRole('button',{name:'Fit responsive endpoints',exact:true}).click();
  await page.getByLabel('Endpoint x').fill('60'); await page.getByLabel('Endpoint y').fill('55');
  await page.getByLabel('Endpoint width').fill('80'); await page.getByLabel('Endpoint height').fill('90');
  const geometry=()=>barn.evaluate(node=>{const bounds=node.getBoundingClientRect(),world=node.closest('.landscape-world').getBoundingClientRect();return {width:bounds.width,height:bounds.height,x:(bounds.left+bounds.width/2-world.left)/world.width*100,y:(bounds.top+bounds.height/2-world.top)/world.height*100};});
  await expect.poll(async()=> (await geometry()).width).toBeCloseTo(80,0);
  await expect.poll(async()=> (await geometry()).x).toBeCloseTo(60,0);
  await expect.poll(async()=> (await geometry()).y).toBeCloseTo(55,0);
  await page.getByRole('button',{name:'Maximum 1920 x 1080',exact:true}).click();
  await page.getByLabel('Endpoint x').fill('70'); await page.getByLabel('Endpoint y').fill('65');
  await page.getByLabel('Endpoint width').fill('320'); await page.getByLabel('Endpoint height').fill('350');
  await expect.poll(async()=> (await geometry()).width).toBeCloseTo(320,0);
  await expect.poll(async()=> (await geometry()).x).toBeCloseTo(70,0);
  await expect.poll(async()=> (await geometry()).y).toBeCloseTo(65,0);
  await page.getByLabel('Viewport width').fill('1140'); await page.getByLabel('Viewport height').fill('660');
  await expect.poll(async()=> (await geometry()).width).toBeCloseTo(200,0);
  await expect.poll(async()=> (await geometry()).height).toBeCloseTo(220,0);
  await expect.poll(async()=> (await geometry()).x).toBeCloseTo(65,0);
});

test('fitting preserves undo snapshots and property reset retains layout and layer data', async ({page}) => {
  const preview=page.frameLocator('iframe');
  await preview.locator('#instrument-piano').click();
  await page.getByLabel('styles left',{exact:true}).fill('22%');
  await page.getByRole('button',{name:'Fit responsive endpoints',exact:true}).click();
  await expect(page.getByLabel('Endpoint width')).toBeVisible();
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  await expect(page.getByLabel('styles left',{exact:true})).toHaveValue('22%');
  await page.getByRole('button',{name:'Redo',exact:true}).click();
  await expect(page.getByLabel('Endpoint width')).toBeVisible();
  await page.getByLabel('Layer depth').fill('61');
  await page.getByLabel('Add visual property').selectOption('attributes:fill');
  await page.getByRole('button',{name:'Add',exact:true}).click();
  await page.getByRole('button',{name:'Reset attributes fill',exact:true}).click();
  await expect(page.getByLabel('Endpoint width')).toBeVisible();
  await expect(page.getByLabel('Layer depth')).toHaveValue('61');
  await page.getByLabel('Viewport width').fill('1140');
  await expect(preview.locator('.can-resize')).toHaveCount(0);
});

test('direct background resize preserves its SVG pivot after saving and reloading', async ({page,context}) => {
  test.skip(test.info().project.name!=='desktop','Native resize grips are checked on desktop.');
  const preview=page.frameLocator('iframe');
  await page.getByRole('button',{name:'Desktop viewport',exact:true}).click();
  await page.getByRole('button',{name:'Barn g',exact:true}).click();
  const barn=preview.locator('.landscape-art [data-name="Barn"]');
  const original=await barn.evaluate(node=>node.getBoundingClientRect().width);
  const handle=await preview.getByRole('button',{name:'Resize selected item se',exact:true}).boundingBox();
  await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);await page.mouse.down();
  await page.mouse.move(handle.x+handle.width/2+25,handle.y+handle.height/2+20,{steps:5});await page.mouse.up();
  await expect(barn).toHaveCSS('transform-box','fill-box');
  const edited=await barn.evaluate(node=>{const box=node.getBoundingClientRect();return {width:box.width,height:box.height,x:box.left+box.width/2,y:box.top+box.height/2};});
  expect(edited.width).toBeGreaterThan(original+10);
  await page.getByRole('button',{name:'Save to project',exact:true}).click();await expect(page.getByRole('status')).toContainText('Saved to');
  const game=await context.newPage();await game.setViewportSize({width:1440,height:900});await game.goto('/');
  const saved=game.locator('.landscape-art [data-name="Barn"]');
  await expect(saved).toHaveCSS('transform-box','fill-box');
  const geometry=await saved.evaluate(node=>{const box=node.getBoundingClientRect();return {width:box.width,height:box.height,x:box.left+box.width/2,y:box.top+box.height/2};});
  for (const key of Object.keys(edited)) expect(geometry[key]).toBeCloseTo(edited[key],0);
  await game.close();
});

test('nested background layers reflect child edits without hidden copied ancestors',async({page})=>{
  const preview=page.frameLocator('iframe');
  await page.getByRole('button',{name:'Barn g',exact:true}).click();await page.getByLabel('Layer depth').fill('60');
  await page.getByRole('button',{name:'Browse SVG parts',exact:true}).click();
  await page.getByRole('button',{name:'path: M-118 12H118V154H-118Z path',exact:true}).click();
  await page.getByLabel('attributes fill',{exact:true}).fill('#abcdef');
  await expect(preview.locator('[data-visual-layer] path[d="M-118 12H118V154H-118Z"]')).toHaveAttribute('fill','#abcdef');
  await page.getByLabel('Layer depth').fill('61');
  await expect(preview.locator('[data-visual-layer]')).toHaveCount(2);
  await expect(preview.locator('[data-visual-layer] path[d="M-118 12H118V154H-118Z"]')).toHaveCount(1);
  await expect(preview.locator('[data-visual-layer] path[d="M-118 12H118V154H-118Z"]')).toHaveCSS('visibility','visible');
  await page.getByRole('button',{name:'Refresh scene outline',exact:true}).click();
  await page.getByRole('button',{name:'landscape-art svg',exact:true}).click();
  await page.getByLabel('Layer depth').fill('20');
  await expect(preview.locator('.landscape-art:not([data-visual-layer])')).toHaveCSS('z-index','20');
  await expect(preview.locator('[data-visual-layer]').first()).toHaveCSS('z-index','60');
  await expect(preview.locator('[data-visual-layer]').last()).toHaveCSS('z-index','61');
});

test('SVG point editing and individual clothing edits persist independently of the outfit', async ({page}) => {
  const preview = page.frameLocator('iframe');
  await page.getByRole('button',{name:'Character',exact:true}).click();
  await expect(preview.locator('.avatar-live-preview')).toBeVisible();
  await page.getByRole('button',{name:'Select SVG parts',exact:true}).click();
  const hair = preview.locator('.avatar-live-preview [data-avatar-part="hair-front"] path').first();
  await hair.click();
  await page.getByLabel('attributes fill',{exact:true}).fill('#123456');
  await page.getByRole('button',{name:'Edit SVG points',exact:true}).click();
  await expect(preview.getByRole('button',{name:'SVG anchor 1',exact:true})).toBeVisible();
  const original = await hair.getAttribute('d');
  await preview.getByRole('button',{name:'SVG anchor 1',exact:true}).focus();
  await page.keyboard.press('ArrowRight');
  await expect(hair).not.toHaveAttribute('d',original);
  await page.getByRole('button',{name:'Undo',exact:true}).click(); await expect(hair).toHaveAttribute('d',original);
  await page.getByRole('button',{name:'Edit SVG points',exact:true}).click();
  await page.locator('.editor-avatar summary').click();
  await page.getByLabel('Preview top',{exact:true}).selectOption('hoodie');
  await expect(hair).toHaveAttribute('fill','#123456');
  await page.getByLabel('Preview hair',{exact:true}).selectOption('bob');
  await expect(hair).not.toHaveAttribute('fill','#123456');
  await page.getByLabel('Preview hair',{exact:true}).selectOption('short');
  await expect(hair).toHaveAttribute('fill','#123456');
  const top = preview.locator('.avatar-live-preview [data-avatar-part="top"] path').first();
  await page.getByRole('button',{name:'Top: Hoodie / Path 1 path',exact:true}).click();
  await page.getByLabel('attributes fill',{exact:true}).fill('#abcdef');
  await page.getByLabel('Preview bottom',{exact:true}).selectOption('skirt');
  await expect(top).toHaveAttribute('fill','#abcdef');
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