import {test,expect,doubleActivate,waitForInstrumentSettling} from './fixtures.js';

test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    if(localStorage.getItem('farmjam-settings-v1'))return;
    localStorage.setItem('farmjam-settings-v1',JSON.stringify({selected:['piano','drums','accordion','melody','marimba','harp']}));
  });
});

async function start(page){
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await page.evaluate(async()=>{
    const app=await(await fetch('/src/App.jsx')).text();
    const url=/from\s+["']([^"']*\/audio\/AudioEngine[^"']*)["']/.exec(app)[1];
    const {AudioEngine}=await import(url),initialize=AudioEngine.prototype.initialize;
    AudioEngine.prototype.initialize=async function(){await initialize.call(this);window.audioEngine=this;};
  });
  await page.getByRole('button',{name:'Tap to play',exact:true}).click();
  await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
  return errors;
}
async function settings(page,testInfo){await doubleActivate(page.getByRole('button',{name:'Open settings',exact:true}),testInfo);}
async function equip(page,name){
  await waitForInstrumentSettling(page);
  await page.locator(`#instrument-${name}`).focus();await page.keyboard.press('e');
  await expect(page.locator(`.performance-${name}`)).toBeVisible();
}
async function level(page,name){
  return page.evaluate(async name=>{
    let output=window.audioEngine.nodes[name].gain;while(output.output)output=output.output;
    const analyser=output.context.createAnalyser();analyser.fftSize=2048;output.connect(analyser);
    const values=new Float32Array(2048);let peak=0;const until=performance.now()+450;
    while(performance.now()<until){analyser.getFloatTimeDomainData(values);peak=Math.max(peak,Math.sqrt(values.reduce((sum,value)=>sum+value*value,0)/values.length));await new Promise(resolve=>requestAnimationFrame(resolve));}
    output.disconnect(analyser);analyser.disconnect();return peak;
  },name);
}

test('accordion and harp expose playable tier banks, persist choices and produce owned sampled sound',async({page},testInfo)=>{
  const errors=await start(page);
  for(const name of ['accordion','harp']){
    await expect(page.locator(`#instrument-${name} svg path`)).not.toHaveCount(0);
    await equip(page,name);
    for(const [tier,count] of [['Simple',5],['Standard',8],['Advanced',25]]){
      await settings(page,testInfo);await page.getByRole('tab',{name:'Instruments',exact:true}).click();
      await page.getByRole('combobox',{name:'Configure instrument',exact:true}).selectOption(name);
      await page.getByRole('radio',{name:tier,exact:true}).check();await page.keyboard.press('Escape');
      const keys=page.locator(`.touch-${name} .note-key`);await expect(keys).toHaveCount(count);
      const button=keys.first();await button.focus();await page.keyboard.down('Space');
      expect(await level(page,name)).toBeGreaterThan(.0001);
      expect(await page.evaluate(()=>[...window.audioEngine.manualVoices.values()].every(voice=>voice.name==='harp'||voice.source.loop))).toBe(true);
      await page.keyboard.up('Space');
      if(name==='accordion')expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
      else expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBeGreaterThan(0);
      const geometry=await keys.evaluateAll(items=>items.map(item=>{const box=item.getBoundingClientRect();return {x:box.x,y:box.y,right:box.right,bottom:box.bottom,width:box.width,height:box.height};}));
      for(const box of geometry){expect(box.x).toBeGreaterThanOrEqual(0);expect(box.right).toBeLessThanOrEqual(page.viewportSize().width);expect(box.height).toBeGreaterThan(24);}
      if(tier==='Simple')expect(Math.min(...geometry.map(box=>box.width))).toBeGreaterThan(44);
    }
    await page.screenshot({path:`test-results/${testInfo.project.name}-${name}-landscape.png`});
    await page.getByRole('button',{name:'Put instrument down',exact:true}).click();
    expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  }
  await page.reload();await page.getByRole('button',{name:'Tap to play',exact:true}).click();
  await expect(page.locator('#instrument-accordion')).toBeVisible({timeout:30000});await expect(page.locator('#instrument-harp')).toBeVisible();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('farmjam-children-v1')).children[0].settings);
  expect(saved.selected).toContain('accordion');expect(saved.selected).toContain('harp');expect(saved.instruments.harp.complexity).toBe(1.5);
  expect(errors).toEqual([]);
});

test('native multitouch and fast string sweeps preserve note ownership and cancel cleanly',async({page},testInfo)=>{
  const errors=await start(page);await equip(page,'accordion');
  const keys=page.locator('.accordion-key'),points=[];
  for(const [index,key] of [keys.first(),keys.nth(4)].entries()){
    const box=await key.boundingBox();points.push({id:index+1,x:box.x+box.width/2,y:box.y+box.height/2});
  }
  const client=await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(2);
  expect(await level(page,'accordion')).toBeGreaterThan(.0001);
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  await page.getByRole('button',{name:'Put instrument down',exact:true}).click();await equip(page,'harp');
  await page.evaluate(()=>{
    window.plucked=[];const engine=window.audioEngine,attack=engine.manualStrike;
    engine.manualStrike=function(note,...args){window.plucked.push(note);return attack.call(this,note,...args);};
  });
  const strings=page.locator('.harp-string');
  for(const [from,to] of [[0,12],[13,24]]){
    const first=await strings.nth(from).boundingBox(),last=await strings.nth(to).boundingBox();
    const y=Math.max(first.y,last.y)+10,begin={id:1,x:first.x+first.width/2,y},end={id:1,x:last.x+last.width/2,y};
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[begin]});
    await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[end]});
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  await client.detach();
  expect(new Set(await page.evaluate(()=>window.plucked)).size).toBe(25);
  expect(await level(page,'harp')).toBeGreaterThan(.0001);
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  expect(await page.evaluate(()=>window.audioEngine.manualVoices.size)).toBe(0);
  await expect.poll(()=>page.evaluate(()=>window.audioEngine.retiringVoices.size)).toBe(0);
  expect(errors).toEqual([]);
});

test('new instruments have silent Simple guide demonstrations using the real controls',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    window.audioStarts=0;
    for(const node of [window.AudioBufferSourceNode,window.OscillatorNode])if(node){const start=node.prototype.start;node.prototype.start=function(...args){window.audioStarts++;return start.apply(this,args);};}
  });
  await page.goto('/');await page.getByRole('button',{name:/^Settings/}).click();
  await page.getByRole('tab',{name:/^Guides/}).click();await page.getByRole('button',{name:'Read play an instrument',exact:true}).click();
  await page.getByRole('combobox',{name:'Choose a guide page',exact:true}).selectOption('2');
  const baseline=await page.evaluate(()=>window.audioStarts);
  for(const name of ['accordion','harp']){
    await page.getByRole('combobox',{name:'Guide instrument',exact:true}).selectOption(name);
    await expect(page.locator(`.guide-surface .touch-${name} .note-key`)).toHaveCount(5);
    await page.getByRole('button',{name:/^(Show|Replay) gesture$/,exact:true}).click();
    await expect(page.locator(`.guide-instrument-${name} .gesture-pointer`)).toHaveCount(1);
  }
  expect(await page.evaluate(()=>window.audioStarts)).toBe(baseline);expect(errors).toEqual([]);
});

test('new illustrations and playable surfaces remain reachable across landscapes and responsive endpoints',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop','The geometry matrix supplies its own viewport sizes.');
  const errors=await start(page);
  for(const [width,height] of [[360,240],[780,284],[1024,768],[1440,900],[1920,1080]]){
    await page.setViewportSize({width,height});
    for(const name of ['accordion','harp']){
      await equip(page,name);
      for(let scene=0;scene<7;scene++){
        const keys=page.locator(`.touch-${name} .note-key`);
        await expect(keys).toHaveCount(25);
        expect(await keys.evaluateAll(items=>items.every(item=>{
          const box=item.getBoundingClientRect(),target=document.elementFromPoint(box.x+box.width/2,box.bottom-10);
          return box.x>=0&&box.right<=innerWidth&&box.bottom<=innerHeight&&box.height>24&&item.contains(target);
        }))).toBe(true);
        // Keyboard navigation also works where a moving sun passes behind a
        // corner control; this matrix checks the new instrument hit targets.
        await page.getByRole('button',{name:'Change landscape',exact:true}).focus();
        await page.keyboard.press('Enter');
      }
      await page.screenshot({path:`test-results/${name}-${width}x${height}.png`});
      await page.getByRole('button',{name:'Put instrument down',exact:true}).click();
    }
  }
  expect(errors).toEqual([]);
});
