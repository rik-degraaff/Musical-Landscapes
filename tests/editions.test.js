import test from 'node:test';
import assert from 'node:assert/strict';
import {TRIAL_INSTRUMENTS,TRIAL_PHRASES,TRIAL_SCENES,trialSettings} from '../src/utils/editions.js';
import {editionPracticeProfile,practiceProfile} from '../src/utils/practiceComposition.js';
import {guidePages} from '../src/utils/guidePages.js';

test('trial preferences normalize controls and cannot introduce extra instruments',()=>{
  const trial=trialSettings('8plus',{selected:['harp'],instruments:{piano:{complexity:.1},harp:{complexity:1}}});
  assert.deepEqual(trial.selected,['piano','drums','ukulele','melody']);
  assert.deepEqual(Object.keys(trial.instruments),trial.selected);
  assert.equal(trial.instruments.piano.complexity,.35);
  assert.equal(trial.instruments.drums.complexity,1);
});

test('all trial levels share the same three Folk phrases per instrument in each trial key',()=>{
  assert.deepEqual(TRIAL_SCENES,['farm','night']);
  for(const root of ['A','Am'])for(const instrument of TRIAL_INSTRUMENTS){
    const simple=editionPracticeProfile(instrument,root,{complexity:.35},true);
    assert.equal(simple.phrases.length,TRIAL_PHRASES);
    assert.equal(new Set(simple.phrases.map(phrase=>JSON.stringify(phrase.events))).size,TRIAL_PHRASES);
    assert.equal(simple.phrases[0].events.length,3);
    for(const complexity of [1,1.5])assert.deepEqual(editionPracticeProfile(instrument,root,{complexity,genre:'rock'},true).phrases,simple.phrases);
    const options={complexity:1.5,genre:'rock'};
    assert.equal(editionPracticeProfile(instrument,'A',options,false),practiceProfile(instrument,'A',options));
  }
});

test('trial guides cover both landscapes, practice and web installation',()=>{
  const trial={trial:true};
  assert.equal(guidePages('profiles',trial).length,0);
  assert.equal(guidePages('landscape',trial).some(page=>page.id==='weather'),false);
  assert.match(guidePages('practice',trial).find(page=>page.id==='tools').paragraphs[0],/3 phrases per instrument/);
  assert.match(guidePages('landscape',trial)[0].paragraphs.join(' '),/Sunny Farm.*Sleepy Night/);
  assert.deepEqual(guidePages('installation',trial).map(page=>page.id),['install','offline','restrict']);
  assert.equal(guidePages('installation')[0].id,'install');
});
