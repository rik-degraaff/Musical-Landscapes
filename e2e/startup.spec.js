import {test,expect} from './fixtures.js';

test.beforeEach(async({page})=>{
  const viewport=page.viewportSize();
  if(viewport.height>viewport.width)await page.setViewportSize({width:viewport.height,height:viewport.width});
});

async function instrumentEngine(page,delay=false) {
  await page.evaluate(async delay=>{
    const source=await(await fetch('/src/App.jsx')).text();
    const url=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(source)[1];
    const {AudioEngine}=await import(url);
    const original=AudioEngine.prototype.initialize;
    AudioEngine.prototype.initialize=async function(){
      window.audioEngine=this;
      if(delay)await new Promise(resolve=>{window.finishStartup=resolve;});
      await original.call(this);
    };
  },delay);
}

test('manual input after a failed-load retry keeps the drawing synchronized',async({page})=>{
  await page.route('**/audio/instruments/piano/C3.mp3',route=>route.abort());
  await page.goto('/');await instrumentEngine(page);
  await page.getByRole('button',{name:'Tap to play'}).click();
  await expect(page.getByRole('alert')).toContainText('could not start');
  await page.unroute('**/audio/instruments/piano/C3.mp3');
  await page.getByRole('button',{name:'Tap to play'}).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  const piano=page.locator('#instrument-piano');
  await piano.click();await expect(piano).toHaveAttribute('aria-pressed','true');
  await piano.focus();await page.keyboard.press('e');
  await page.getByRole('button',{name:'Piano key C4',exact:true}).focus();
  await page.keyboard.down('Space');
  expect(await page.evaluate(()=>window.audioEngine.active.piano)).toBe(false);
  await expect(piano).toHaveAttribute('aria-pressed','false');
  await page.keyboard.up('Space');
});

test('child selection during loading supplies the final performance settings',async({page})=>{
  await page.goto('/');
  await page.evaluate(()=>{
    const family=JSON.parse(localStorage.getItem('farmjam-children-v1'));
    const child=structuredClone(family.children[0]);child.id='advanced';child.name='Advanced';
    child.settings={instruments:{piano:{complexity:1.5}}};
    family.children.push(child);localStorage.setItem('farmjam-children-v1',JSON.stringify(family));
  });
  await page.reload();await instrumentEngine(page,true);
  await page.getByRole('button',{name:'Tap to play'}).click();
  await expect.poll(()=>page.evaluate(()=>typeof window.finishStartup)).toBe('function');
  await page.getByRole('radio',{name:'Select Advanced'}).click();
  await page.evaluate(()=>window.finishStartup());
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  expect(await page.evaluate(()=>window.audioEngine.performanceSettings.piano.complexity)).toBe(1.5);
  await expect(page.locator('#young-musician')).toHaveAttribute('data-child-name','Advanced');
});