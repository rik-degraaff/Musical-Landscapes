import {test,expect} from '@playwright/test';

test('gesture family shares artwork and maintains contact throughout dragging',async({page},testInfo)=>{
  await page.goto('/');
  await page.clock.install({time:new Date('2026-10-17T12:00:00Z')});
  await page.clock.pauseAt(new Date('2026-10-17T12:00:01Z'));
  await page.evaluate(async()=>{
    const {default:React}=await import('/node_modules/.vite/deps/react.js');
    const {default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js');
    const {GuideIllustration}=await import('/src/components/GuideIllustration.jsx');
    document.getElementById('root').style.display='none';
    Object.assign(document.body.style,{height:'auto',overflow:'auto'});
    Object.assign(document.documentElement.style,{height:'auto',overflow:'auto'});
    const gallery=document.createElement('div');gallery.id='gesture-review';document.body.append(gallery);
    const cases=[['Tap','band','tap','piano'],['Double tap','profile','double-tap','piano'],['Drag','equip','drag','piano'],['Strum','surface','swipe','guitar'],['Pipes','surface','swipe','panflute'],['Hold','surface','hold','flute'],['Breath + valves','surface','hold','melody'],['Tempo','metronome','tempo','piano']];
    ReactDOM.createRoot(document.getElementById('gesture-review')).render(React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:16,padding:20,background:'#f4f3e8'}},cases.map(([label,kind,gesture,instrument])=>React.createElement('section',{key:label},React.createElement('h3',null,label),React.createElement(GuideIllustration,{kind,gesture,instrument,demonstrating:true})))));
  });
  await expect(page.locator('.gesture-pointer')).toHaveCount(10);
  await page.clock.runFor(100);
  await expect(page.locator('.guide-art-equip .gesture-pointer')).toHaveAttribute('data-pressed','false');
  await page.clock.runFor(600);
  await expect(page.locator('.guide-art-equip .gesture-pointer')).toHaveAttribute('data-pressed','true');
  await expect(page.locator('.guide-art-equip .gesture-burst')).toBeVisible();
  await page.screenshot({path:`artifacts.local/gestures/contact-${testInfo.project.name}.png`,fullPage:true});
  const carried=page.locator('.guide-equip-source');
  const before=await carried.boundingBox();
  await page.clock.runFor(200);
  await expect(page.locator('.guide-gesture-double-tap .gesture-pointer')).toHaveAttribute('data-pressed','false');
  await page.clock.runFor(150);
  await expect(page.locator('.guide-gesture-double-tap .gesture-pointer')).toHaveAttribute('data-pressed','true');
  await expect(page.locator('.guide-gesture-tap .gesture-pointer')).toHaveAttribute('data-pressed','false');
  await page.clock.runFor(450);
  await expect(page.locator('.guide-art-equip .gesture-pointer')).toHaveAttribute('data-pressed','true');
  expect((await carried.boundingBox()).x).toBeGreaterThan(before.x+30);
  const tip=await page.locator('.guide-art-equip .gesture-pointer').evaluate(element=>{
    const box=element.getBoundingClientRect();return {x:box.x+box.width*35/90,y:box.y+box.height*6/95};
  });
  const box=await carried.boundingBox();
  expect(Math.abs(tip.x-box.x-box.width/2)).toBeLessThan(2);
  expect(Math.abs(tip.y-box.y-box.height/2)).toBeLessThan(2);
  await expect(page.locator('.guide-art-equip .gesture-burst')).toHaveCount(0);
  await page.screenshot({path:`artifacts.local/gestures/move-${testInfo.project.name}.png`,fullPage:true});
  await page.clock.runFor(1000);
  await expect(page.locator('.guide-art-equip .gesture-pointer')).toHaveAttribute('data-pressed','false');
  await expect(page.locator('.hand-open,.hand-grip')).toHaveCount(0);
  await page.emulateMedia({reducedMotion:'reduce'});await page.clock.runFor(100);
  await expect(page.locator('.guide-art-equip .gesture-pointer')).toHaveAttribute('data-pressed','true');
  await expect(page.locator('.gesture-burst')).toHaveCount(0);
});
