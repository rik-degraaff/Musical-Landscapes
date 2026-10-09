import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultSettings,normalizeSettings,applyPreset,phraseComplexity,loadSettings} from '../src/utils/settings.js';

test('advanced information is hidden by default and settings preserve safe individual controls',()=>{
  const defaults=defaultSettings();
  assert.equal(defaults.selected.length,6);
  assert.deepEqual(normalizeSettings({selected:['piano','piano']}).selected,defaults.selected);
  assert.deepEqual(normalizeSettings({selected:['piano','drums','guitar','melody','marimba','flute']}).selected,['piano','drums','guitar','melody','marimba','flute']);
  for(const options of Object.values(defaults.instruments)){assert.equal(options.fingeringCharts,false);assert.equal(options.noteLabels,false);assert.equal(options.playbackNotes,false);assert.equal(options.fretDots,false);}
  const saved=normalizeSettings({instruments:{guitar:{complexity:99,fingeringCharts:true,noteLabels:'true'}}});
  assert.equal(saved.instruments.guitar.complexity,2);assert.equal(saved.instruments.guitar.fingeringCharts,true);assert.equal(saved.instruments.guitar.noteLabels,false);
  assert.deepEqual(loadSettings({getItem(){throw Error('unavailable');}}),defaults);
});
test('presets affect every instrument while preserving display choices and phrase complexity is bounded',()=>{
  const original=defaultSettings();original.instruments.guitar.fingeringCharts=true;
  const simple=applyPreset(original,'Simple');
  for(const options of Object.values(simple.instruments)){assert.equal(options.complexity,.35);assert.equal(options.seventhChords,false);}
  assert.equal(simple.instruments.guitar.fingeringCharts,true);assert.equal(original.instruments.piano.complexity,1);
  assert.equal(phraseComplexity(.8,1),.8);assert.ok(Math.abs(phraseComplexity(.8,.35)-.28)<1e-12);assert.equal(phraseComplexity(.8,2),1);
});