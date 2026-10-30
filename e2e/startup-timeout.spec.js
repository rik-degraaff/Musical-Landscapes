import {test,expect} from './fixtures.js';

test('a stalled recording unlocks startup and late completion cannot break a retry',async({page})=>{
  const size=page.viewportSize();
  if(size.height>size.width)await page.setViewportSize({width:size.height,height:size.width});
  let release;
  const gate=new Promise(resolve=>{release=resolve;});
  let requests=0;
  await page.route('**/audio/instruments/piano/C3.mp3',async route=>{
    if(++requests===1)await gate;
    await route.continue();
  });
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  try {
    await page.goto('/');
    await page.evaluate(async()=>{
      const source=await(await fetch('/src/App.jsx')).text();
      const url=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(source)[1];
      const {AudioEngine}=await import(url);
      const initialize=AudioEngine.prototype.initialize;
      AudioEngine.prototype.initialize=async function(){window.audioEngine=this;await initialize.call(this);};
    });
    await page.getByRole('button',{name:'Tap to play',exact:true}).click();
    await expect(page.getByRole('button',{name:'Loading sounds…',exact:true})).toBeDisabled();
    await expect(page.getByRole('alert')).toContainText('could not start',{timeout:20000});
    await expect(page.getByRole('button',{name:'Tap to play',exact:true})).toBeEnabled();
    await expect(page.locator('.start-settings')).toBeEnabled();
    await page.getByRole('button',{name:'Tap to play',exact:true}).click();
    await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
    release();
    await expect.poll(()=>page.evaluate(()=>window.audioEngine.ready)).toBe(true);
    await page.locator('#instrument-piano').focus();await page.keyboard.press('e');
    const key=page.getByRole('button',{name:'Piano key C5',exact:true});
    await key.focus();await page.keyboard.down('Space');
    await expect.poll(()=>page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(1);
    await page.keyboard.up('Space');
    await expect.poll(()=>page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
    expect(errors).toEqual([]);
  } finally {release();}
});
