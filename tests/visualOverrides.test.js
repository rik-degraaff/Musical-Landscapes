import test from 'node:test';
import assert from 'node:assert/strict';
import { validateVisualOverrides, visualOverrideCSS } from '../src/utils/visualOverrides.js';

test('empty visual overrides generate no game styling', () => {
  assert.equal(visualOverrideCSS(validateVisualOverrides({ version: 1, rules: [] })), '');
});

test('visual overrides preserve SVG paths and responsive CSS constraints', () => {
  const value = { version: 1, rules: [{ selector: '.art-moo > path:nth-of-type(1)', attributes: { d: 'M0 0Q20 40 80 0Z', fill: '#123456' }, styles: { width: 'clamp(76px, min(13vh, 12vw), 120px)' }, maxWidth: 700 }] };
  assert.equal(validateVisualOverrides(value), value);
  assert.match(visualOverrideCSS(value), /@media\(max-width:700px\).*clamp\(76px, min\(13vh, 12vw\), 120px\) !important/);
});

test('visual overrides reject executable attributes, unsafe CSS, and duplicate selectors', () => {
  const rule = { selector: '.art-moo', attributes: {}, styles: {} };
  for (const changed of [{ attributes: { onclick: 'alert(1)' } }, { styles: { fill: 'url(https://example.com)' } }, { selector: '.art-moo;body' }, { maxWidth: -1 }]) {
    assert.throws(() => validateVisualOverrides({ version: 1, rules: [{ ...rule, ...changed }] }));
  }
  assert.throws(() => validateVisualOverrides({ version: 1, rules: [rule, rule] }));
});