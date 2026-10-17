import test from 'node:test';
import assert from 'node:assert/strict';
import {guideOptions,instrumentDemonstration,practiceDemonstration,guidePracticePhrase} from '../src/utils/guideDemonstrations.js';
import {practiceProfile} from '../src/utils/practiceComposition.js';
import {fluteNote} from '../src/utils/wind.js';

const route={from:{x:80,y:30},to:{x:80,y:70}};
const secondary={from:{x:20,y:50},to:{x:20,y:50}};
test('guides default to Simple without changing the child’s saved controls',()=>{
  const child={settings:{instruments:{guitar:{complexity:1.5,fingeringCharts:true}}}};
  assert.equal(guideOptions(child,'guitar').complexity,.35);
  assert.equal(guideOptions(child,'guitar').fingeringCharts,false);
  assert.equal(guideOptions(child,'guitar','child').complexity,1.5);
  assert.equal(child.settings.instruments.guitar.complexity,1.5);
});
test('guitar and ukulele hold a chord before and throughout the second hand’s sweep',()=>{
  for(const instrument of ['guitar','ukulele']) {
    const profile=practiceProfile(instrument,'C',guideOptions());
    const sample=elapsed=>instrumentDemonstration({instrument,elapsed,route,secondary,profile});
    const chosen=sample(2000);
    assert.equal(chosen.hands[0].pressed,true);assert.equal(chosen.hands[1].opacity,0);
    assert.equal(chosen.cue.chord,profile.chords[0].name);
    assert.deepEqual(chosen.cue.notes,[]);
    for(const elapsed of [3600,4200,5000,5600]) {
      const held=sample(elapsed);assert.equal(held.hands[0].pressed,true);assert.equal(held.hands[1].pressed,true);
    }
    assert.equal(sample(7000).hands[0].pressed,false);
    assert.equal(sample(7000).cue,null);
    const still=instrumentDemonstration({instrument,elapsed:0,route,secondary,profile,reduced:true});
    assert.ok(still.hands.every(hand=>hand.pressed&&hand.opacity===1&&hand.burst===null));
  }
});
test('flute cue fingering corresponds to the demonstrated keys',()=>{
  const profile=practiceProfile('flute','C',guideOptions());
  const sample=elapsed=>instrumentDemonstration({instrument:'flute',elapsed,route,secondary,profile});
  assert.equal(sample(2000).cue.note,fluteNote(['Eb'],0));
  assert.equal(sample(3500).cue.note,fluteNote(['Eb','L1'],0));
});
test('practice stages have their own count-in, cue progression and completion',()=>{
  const {phrase}=guidePracticePhrase(practiceProfile('piano','C',guideOptions()));
  for(const stage of [0,1,2,3]) {
    const initial=practiceDemonstration({stage,elapsed:1500,phrase});
    assert.equal(initial.countIn,stage!==1);
    const first=practiceDemonstration({stage,elapsed:2900,phrase}),later=practiceDemonstration({stage,elapsed:6500,phrase});
    assert.ok(later.index>first.index);
    assert.deepEqual(later.cue.notes,phrase.events[later.index].notes);
    const done=practiceDemonstration({stage,elapsed:7800,phrase});
    assert.equal(done.complete,true);assert.equal(done.progress,phrase.events.length);assert.equal(done.running,false);
  }
});
