import {test,expect,waitForInstrumentSettling} from './fixtures.js';

for (const [variant,roll] of [['regular',.9],['frequent',.1],['rare',.27]]) {
  test.describe(variant,()=>{
    test.use({sceneVisitorRoll:roll});
    test('scenery respects tree depth and remains playable',async({page},testInfo)=>{
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.goto('/');
      await page.getByRole('button',{name:'Tap to play'}).click();
      await expect(page.locator('.start-overlay')).toHaveCount(0,{timeout:30000});
      for (const scene of ['farm','garden','pond','dusk','night','late-night','dawn']) {
        const host=page.locator(`.scene-${scene}`);
        await expect(host).toBeVisible();
        await expect(host.locator('.celestial-control')).toHaveAttribute('data-settled','true');
        for (const panel of [false,true]) {
          if (panel) {
            await page.locator('#instrument-piano').focus();await page.keyboard.press('e');
            await expect(page.locator('.performance-piano')).toBeVisible();
          }
          await waitForInstrumentSettling(page);
          const trees=host.locator('.landscape-foreground:not([data-visual-layer])');
          await expect(trees).toHaveCount(scene==='late-night'?0:1);
          if (scene!=='late-night') {
            await expect(trees.locator('[data-habitat-tree]')).toHaveCount(2);
            await expect(host.locator('.landscape-background [data-habitat-tree]')).toHaveCount(0);
          }
          for (const object of await host.locator('.interactive-object').all()) {
            const habitat=await object.getAttribute('data-habitat');
            const depth=Number(await object.evaluate(node=>getComputedStyle(node).zIndex));
            if (scene!=='late-night') {
              const treeDepth=Number(await trees.evaluate(node=>getComputedStyle(node).zIndex));
              expect(habitat==='bank'?depth<treeDepth:depth>treeDepth).toBe(true);
            }
            const point=await object.evaluate(element=>{
              const box=element.getBoundingClientRect();
              for(const y of [.25,.5,.75])for(const x of [.25,.5,.75]){
                if(element.contains(document.elementFromPoint(box.x+box.width*x,box.y+box.height*y)))return {x:box.width*x,y:box.height*y};
              }
              return null;
            });
            expect(point,'object retains a reachable touch area').not.toBeNull();
            await object.click({position:point});
          }
          // Probe actual painted overlap, including rotating sails. Temporarily
          // enable tree hit testing; production scenery stays pointer-transparent.
          if (scene==='pond'&&variant==='regular'&&!panel&&testInfo.project.name==='desktop') {
            const overlap=await host.evaluate(element=>{
              const tree=element.querySelector('[data-habitat-tree="right"]');
              const mill=element.querySelector('[data-sound="windmill"]');
              const box=mill.getBoundingClientRect();
              tree.style.pointerEvents='visiblePainted';
              try {
                for(let y=box.top;y<box.bottom;y+=2)for(let x=box.left;x<box.right;x+=2){
                  const hits=document.elementsFromPoint(x,y);
                  const front=hits.findIndex(hit=>tree.contains(hit));
                  const back=hits.findIndex(hit=>mill.contains(hit));
                  if(front>=0&&back>=0)return front<back;
                }
                return false;
              } finally {tree.style.removeProperty('pointer-events');}
            });
            expect(overlap,'nearer tree paints over the windmill').toBe(true);
          }
          if (panel) await page.getByRole('button',{name:'Put instrument down'}).click();
        }
        await page.getByRole('button',{name:'Change landscape'}).click();
      }
    });
  });
}
