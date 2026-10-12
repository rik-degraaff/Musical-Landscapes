import test from 'node:test';
import assert from 'node:assert/strict';
import { MIN_VIEWPORT, MAX_VIEWPORT, interpolateGeometry, boundedFormula, validateResponsiveLayout, updateEndpoint, instrumentHome } from '../src/utils/responsiveVisuals.js';

const layout = { kind: 'box', min: { x: 20, y: 80, width: 60, height: 50 }, max: { x: 35, y: 60, width: 180, height: 160 } };

test('responsive layouts match both fixed endpoints and clamp beyond them', () => {
  assert.deepEqual(interpolateGeometry(layout, MIN_VIEWPORT), layout.min);
  assert.deepEqual(interpolateGeometry(layout, MAX_VIEWPORT), layout.max);
  assert.deepEqual(interpolateGeometry(layout, { width: 100, height: 100 }), layout.min);
  assert.deepEqual(interpolateGeometry(layout, { width: 4000, height: 3000 }), layout.max);
  assert.deepEqual(interpolateGeometry(layout, { width: 1140, height: 660 }), { x: 27.5, y: 70, width: 120, height: 105 });
});

test('endpoint edits preserve the opposite endpoint and derive bounded formulas', () => {
  const next = updateEndpoint(layout, 'min', { ...layout.min, width: 80 });
  assert.deepEqual(next.max, layout.max);
  assert.equal(next.min.width, 80);
  assert.match(boundedFormula(60, 180), /^clamp\(60.00px, calc\(.+vw\), 180.00px\)$/);
  assert.match(boundedFormula(160, 50, 'height'), /^clamp\(50.00px, calc\(.+vh\), 160.00px\)$/);
});

test('invalid layouts cannot enter saved visual data', () => {
  assert.throws(() => validateResponsiveLayout({ ...layout, kind: 'script' }));
  assert.throws(() => validateResponsiveLayout({ ...layout, min: { ...layout.min, width: 0 } }));
  assert.throws(() => validateResponsiveLayout({ ...layout, max: { ...layout.max, x: NaN } }));
});

test('instrument homes initialize responsive positions without owning later drag state', () => {
  const fallback = {x:15,y:35,volume:-9};
  const document = {version:1,rules:[{selector:'#instrument-piano',attributes:{},styles:{},layout}]};
  assert.deepEqual(instrumentHome(document,'piano',fallback,MIN_VIEWPORT),{x:20,y:80,volume:-9});
  assert.deepEqual(fallback,{x:15,y:35,volume:-9});
  assert.equal(instrumentHome(document,'drums',fallback,MAX_VIEWPORT),fallback);
  document.rules[0]={selector:'#instrument-piano',attributes:{},styles:{left:'22%',top:'25%'}};
  assert.deepEqual(instrumentHome(document,'piano',fallback,MAX_VIEWPORT),{x:22,y:25,volume:-9});
});