import {test,expect} from './fixtures.js';

const scenes=['farm','garden','pond','dusk','night','late-night','dawn'];
const visitors=[['sheep','horse'],['bee','woodpecker'],['duck','otter'],['cicada','balloon'],['fox','badger'],['moth','shootingStar'],['dove','deer']];

test('entering gameplay and every scene transition roll anew, including revisiting a scene',async({page})=>{
  await page.setViewportSize({width:852,height:393});await page.goto('/');
  await expect(page.locator('.scene-farm .visitor-object')).toHaveCount(0);
  await page.evaluate(()=>window.__testVisitorRoll=.1);
  await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  await expect(page.locator('.scene-farm .visitor-object')).toHaveAttribute('data-sound','sheep');
  await page.evaluate(()=>window.__testVisitorRoll=.27);
  await page.getByRole('button',{name:'Open settings'}).dblclick();await page.getByRole('button',{name:'Close settings',exact:true}).click();
  await expect(page.locator('.scene-farm .visitor-object')).toHaveAttribute('data-sound','sheep');
  for(let index=1;index<=7;index++){
    await page.getByRole('button',{name:'Change landscape'}).click({force:true});
    const scene=scenes[index%7];await expect(page.locator(`.scene-${scene} .visitor-object`)).toHaveAttribute('data-sound',visitors[index%7][1]);
    await expect(page.locator(`.scene-${scene} .interactive-object`)).toHaveCount(2);
  }
  await page.evaluate(()=>window.__testVisitorRoll=.9);
  for(let index=0;index<7;index++)await page.getByRole('button',{name:'Change landscape'}).click({force:true});
  await expect(page.locator('.scene-farm .visitor-object')).toHaveCount(0);
});

for(const [tier,roll] of [[0,.1],[1,.27]])test.describe(`visitor tier ${tier+1}`,()=>{
  test.use({sceneVisitorRoll:roll});
  test('each scene keeps two objects with a stable, audible and animated visitor',async({page},testInfo)=>{
    test.setTimeout(120000);
    const size=page.viewportSize();if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/');
    await page.evaluate(async()=>{
      const {AudioEngine}=await import('/src/audio/AudioEngine.js');const init=AudioEngine.prototype.initialize;
      AudioEngine.prototype.initialize=async function(){await init.call(this);window.audioEngine=this;};
    });
    await page.getByRole('button',{name:'Tap to play'}).click();await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
    for(const [index,scene] of scenes.entries()){
      const host=page.locator(`.scene-${scene}`);await expect(host).toBeVisible();
      await expect(host.locator('.celestial-control')).toHaveAttribute('data-settled','true');
      await expect(host.locator('.interactive-object')).toHaveCount(2);await expect(host.locator('.visitor-object')).toHaveCount(1);
      const sound=visitors[index][tier];const object=host.locator(`[data-sound="${sound}"]`);
      await expect(object).toBeVisible();expect(await object.locator('.visitor-art path').count()).toBeGreaterThan(2);
      const bounds=await object.boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.x+bounds.width).toBeLessThanOrEqual(page.viewportSize().width);expect(bounds.y+bounds.height).toBeLessThanOrEqual(page.viewportSize().height);
      await page.evaluate(()=>{
        const engine=window.audioEngine;window.visitorAnalyser=engine.sceneGain.context.createAnalyser();window.visitorAnalyser.fftSize=1024;engine.sceneGain.connect(window.visitorAnalyser);
      });
      if(testInfo.project.use.hasTouch)await object.tap();else await object.click();
      await expect(object.locator('.reacting')).toHaveCount(1);
      const level=await page.evaluate(async()=>{
        const samples=new Float32Array(window.visitorAnalyser.fftSize);let peak=0;const end=performance.now()+700;
        while(performance.now()<end){window.visitorAnalyser.getFloatTimeDomainData(samples);peak=Math.max(peak,Math.sqrt(samples.reduce((sum,value)=>sum+value*value,0)/samples.length));await new Promise(resolve=>requestAnimationFrame(resolve));}
        window.audioEngine.sceneGain.disconnect(window.visitorAnalyser);window.visitorAnalyser.disconnect();return peak;
      });
      expect(level,`${sound} audio`).toBeGreaterThan(.001);
      await expect(object.locator('.reacting')).toHaveCount(0);
      await object.focus();await page.keyboard.press('Space');await expect(object.locator('.reacting')).toHaveCount(1);
      await page.screenshot({path:testInfo.outputPath(`${scene}-${sound}.png`)});
      await page.getByRole('button',{name:'Open settings'}).dblclick();await page.getByRole('button',{name:'Close settings',exact:true}).click();await expect(object).toBeVisible();
      await page.getByRole('button',{name:'Change landscape'}).click({force:true});
    }
    await expect(page.locator('.scene-farm .visitor-object')).toHaveAttribute('data-sound',visitors[0][tier]);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.locator('.scene-farm .visitor-object').focus();await page.keyboard.press('Space');
    await expect(page.locator('.scene-farm .visitor-object .reacting')).toHaveCount(0);
    await page.evaluate(()=>window.__testVisitorRoll=.9);
    for(let index=0;index<7;index++)await page.getByRole('button',{name:'Change landscape'}).click({force:true});
    await expect(page.locator('.scene-farm .visitor-object')).toHaveCount(0);await expect(page.getByRole('button',{name:'Cow',exact:true})).toBeVisible();
    expect(errors).toEqual([]);
  });
});