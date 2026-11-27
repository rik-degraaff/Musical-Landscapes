import {test,expect,waitForInstrumentSettling} from './fixtures.js';

const bicycleName='Open travel map with the bicycle';

async function start(page) {
  const {width,height}=page.viewportSize();
  if(height>width)await page.setViewportSize({width:height,height:width});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await page.evaluate(async()=>{
    const source=await(await fetch('/src/App.jsx')).text();
    const url=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(source)[1];
    const {AudioEngine}=await import(url);
    const audioSource=await(await fetch(url)).text();
    window.travelTestTone=await import(/import\s+\*\s+as\s+Tone\s+from\s+["']([^"']+)["']/.exec(audioSource)[1]);
    const init=AudioEngine.prototype.initialize;
    AudioEngine.prototype.initialize=async function(){
      await init.call(this);
      window.travelTestEngine=this;
    };
  });
  await expect(page.locator('[data-edition=full]')).toBeAttached();
  await expect(page.getByRole('button',{name:'For parents',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Tap to play'}).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  return errors;
}

test('a folded map takes the selected avatar both ways, rings twice per trip, and supports closing',async({page},testInfo)=>{
  const errors=await start(page);
  await page.emulateMedia({reducedMotion:'no-preference'});
  const bicycle=page.getByRole('button',{name:bicycleName});
  const map=page.getByRole('dialog',{name:'Travel map'});
  const farm=map.getByRole('button',{name:'Farm',exact:true});
  const jungle=map.getByRole('button',{name:'Jungle',exact:true});
  const rider=map.locator('.travel-map-rider');
  const bellVoices=()=>page.evaluate(()=>window.travelTestEngine.sceneVoices.bikeBell);
  const activate=locator=>testInfo.project.use.hasTouch?locator.tap():locator.click();
  const inSessionAvatar=await page.locator('#young-musician .child-avatar').getAttribute('data-avatar-hair-color');

  await page.evaluate(()=>{
    window.mapPhases=[];
    const inspect=()=>{
      const map=document.querySelector('.travel-map-dialog');
      if(!map?.open||map.dataset.phase===window.mapPhases.at(-1)?.name)return;
      window.mapPhases.push({
        name:map.dataset.phase,
        scene:document.querySelector('.scene').className,
        paperAnimation:getComputedStyle(map.querySelector('.travel-map-paper')).animationName,
        foldAnimation:getComputedStyle(map.querySelector('.travel-map-fold')).animationName,
      });
    };
    new MutationObserver(inspect).observe(document.querySelector('.app-shell'),{childList:true,subtree:true,attributes:true,attributeFilter:['data-phase','open']});
  });
  await activate(bicycle);
  await expect(map).toHaveAttribute('data-phase','ready');
  await expect(farm).toHaveAttribute('aria-current','location');
  await expect(rider.locator('.travel-bike-head')).toHaveAttribute('data-avatar-hair-color',inSessionAvatar);
  await expect.poll(bellVoices).toBe(1);
  await farm.press('Enter');
  await expect(map).toHaveAttribute('data-phase','ready');
  expect(await bellVoices()).toBe(1);
  await page.screenshot({path:testInfo.outputPath('farm-travel-map.png')});
  const farmPoint=await rider.evaluate(element=>parseFloat(element.style.left));
  await activate(jungle);
  await expect(map).toHaveAttribute('data-phase','riding');
  await expect.poll(bellVoices).toBe(2);
  await expect(jungle).toHaveAttribute('aria-disabled','true');
  await expect.poll(()=>rider.evaluate(element=>parseFloat(element.style.left))).toBeGreaterThan(farmPoint+2);
  await expect(page.locator('.scene-farm')).toBeVisible();
  await expect(map).toHaveCount(0);
  await expect(page.locator('.scene-jungle-clearing')).toBeVisible();
  await expect(bicycle).toBeFocused();
  expect(await page.evaluate(()=>window.mapPhases.slice(0,4).map(phase=>phase.name))).toEqual(['opening','ready','riding','closing']);
  expect(await page.evaluate(()=>window.mapPhases[0])).toMatchObject({paperAnimation:'travel-map-open',foldAnimation:'travel-map-unfold'});
  expect(await page.evaluate(()=>window.mapPhases[3].scene)).toContain('scene-jungle-clearing');

  await activate(bicycle);
  await expect(map).toHaveAttribute('data-phase','ready');
  await expect(jungle).toHaveAttribute('aria-current','location');
  await expect(rider).toHaveAttribute('data-direction','left');
  const junglePoint=await rider.evaluate(element=>parseFloat(element.style.left));
  expect(junglePoint).toBeGreaterThan(farmPoint+20);
  await page.keyboard.press('Escape');
  await expect(map).toHaveCount(0);
  await expect(page.locator('.scene-jungle-clearing')).toBeVisible();
  await expect(bicycle).toBeFocused();
  expect(await bellVoices()).toBe(3);

  await activate(bicycle);
  await expect(map).toHaveAttribute('data-phase','ready');
  await activate(farm);
  await expect.poll(()=>rider.evaluate(element=>parseFloat(element.style.left))).toBeLessThan(junglePoint-2);
  await expect(map).toHaveCount(0);
  await expect(page.locator('.scene-farm')).toBeVisible();
  expect(await page.evaluate(()=>[window.travelTestEngine.root,window.travelTestEngine.genre])).toEqual(['A','folk']);
  expect(await bellVoices()).toBe(5);
  expect(errors).toEqual([]);
});

test('reduced-motion travel keeps the band and instrument and cycles every Jungle key and common visitor',async({page},testInfo)=>{
  const errors=await start(page);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('#instrument-drums').click();
  await page.evaluate(()=>window.travelTestEngine.setTempo(150));
  await page.locator('#instrument-piano').press('e');
  await waitForInstrumentSettling(page);
  const bicycle=page.getByRole('button',{name:bicycleName});
  const map=page.getByRole('dialog',{name:'Travel map'});
  await bicycle.press('Enter');
  await expect(map).toHaveAttribute('data-phase','ready');
  await expect(map.locator('.travel-map-fold').first()).toHaveCSS('transform','none');
  await page.evaluate(()=>window.__testVisitorRoll=.1);
  await map.getByRole('button',{name:'Jungle',exact:true}).press('Enter');
  await expect(map).toHaveCount(0);
  const rotate=page.getByRole('button',{name:'Change landscape'});
  const scenes=[
    ['clearing','D','Toucan'],['river','G','Crocodile'],['waterfall','F','Iguana'],
    ['canopy','Em','Monkey'],['night','Bm','Kinkajou'],['moonlit','Dm','Pangolin'],['dawn','Bb','Hummingbird'],
  ];
  for(const [index,[scene,root,visitor]] of scenes.entries()){
    const landscape=page.locator(`.scene-jungle-${scene}`);
    await expect(landscape).toBeVisible();
    await expect.poll(()=>page.evaluate(()=>window.travelTestEngine.root)).toBe(root);
    await expect.poll(()=>page.evaluate(()=>{
      const engine=window.travelTestEngine;
      return {audible:engine.playbackRoot,requested:engine.root,bar:engine.barIndex,transport:window.travelTestTone.Transport.state,
        context:window.travelTestTone.getContext().state,backgrounded:engine.backgrounded,hidden:document.hidden,
        planned:[...engine.scheduledBars.values()].map(({bar,root})=>[bar,root])};
    })).toMatchObject({audible:root,transport:'started',context:'running'});
    await expect(landscape.getByRole('button',{name:visitor,exact:true})).toHaveClass(/visitor-object/);
    await expect(bicycle).toHaveCount(index===0?1:0);
    if(scene==='river'){
      await landscape.getByRole('button',{name:visitor,exact:true}).click();
      expect(await page.evaluate(()=>window.travelTestEngine.sceneVoices.crocodile)).toBe(1);
      await page.screenshot({path:testInfo.outputPath('jungle-river-with-piano.png')});
    }
    if(scene==='canopy')await page.setViewportSize({width:360,height:240});
    if(scene==='canopy'||scene==='dawn'){
      const target=landscape.getByRole('button',{name:scene==='dawn'?'Macaw':visitor,exact:true});
      await expect.poll(()=>target.evaluate(element=>{
        const box=element.getBoundingClientRect();
        return element.contains(document.elementFromPoint(box.x+box.width/2,box.y+box.height/2));
      })).toBe(true);
    }
    await rotate.press('Enter');
  }
  await expect(bicycle).toBeVisible();
  expect(await page.evaluate(()=>({genre:window.travelTestEngine.genre,active:window.travelTestEngine.active.drums,equipped:window.travelTestEngine.manualInstrument})))
    .toEqual({genre:'samba',active:true,equipped:'piano'});
  expect(errors).toEqual([]);
});
