import test from 'node:test';
import assert from 'node:assert/strict';
import {beatOffset,durationBeats,learningSteps,createTimingAttempt,scoreTimedInput,expireSteps,attemptSummary,PRACTICE_TIMING_TOLERANCE} from '../src/utils/practice.js';

const phrase={events:[{time:'0:0:0',notes:['C4','E4'],dur:'4n'},{time:'0:1:0',note:'C4',dur:'8n'},{time:'0:2:2',note:'G4',dur:'4n'}]};
test('learn stage keeps each chord as one grouped action and preserves its full fingering',()=>{
  const fingering=[{string:0,note:'C4',fret:0},{string:2,note:'E4',fret:2}];
  const steps=learningSteps({...phrase,events:[{...phrase.events[0],fingering},...phrase.events.slice(1)]});
  assert.deepEqual(steps.map(step=>step.notes),[['C4','E4'],['C4'],['G4']]);
  assert.deepEqual(steps[0].cue.notes,['C4','E4']);assert.deepEqual(steps[0].cue.fingering,fingering);assert.deepEqual(phrase.events[0].notes,['C4','E4']);
  assert.equal(beatOffset('0:2:2'),2.5);assert.equal(durationBeats('2n.'),3);
});
test('repeated pitches on different strings retain their exact phrase fingering',()=>{
  const fingering=[{string:0,note:'G4',fret:0},{string:3,note:'G4',fret:10}];
  const steps=learningSteps({events:[{time:'0:0:0',notes:['G4','G4'],fingering}]});
  assert.equal(steps.length,1);assert.deepEqual(steps[0].cue.fingering,fingering);
});
test('timed practice scores each chord and repeated pitch once inside the timing window',()=>{
  const attempt=createTimingAttempt(phrase);
  assert.equal(scoreTimedInput(attempt,'G4',0).correct,false);
  assert.equal(scoreTimedInput(attempt,'C4',.1).correct,true);
  assert.equal(scoreTimedInput(attempt,'C4',.15).correct,false);
  assert.equal(scoreTimedInput(attempt,'E4',.42).complete,true);
  assert.equal(scoreTimedInput(attempt,'C4',1.1).correct,true);
  expireSteps(attempt,2.9,PRACTICE_TIMING_TOLERANCE);assert.equal(attempt[2].missed,false);
  expireSteps(attempt,4,PRACTICE_TIMING_TOLERANCE);assert.equal(attempt[2].missed,true);
  assert.equal(scoreTimedInput(attempt,'G4',2.5).correct,false);
  assert.deepEqual(attemptSummary(attempt),{hits:3,total:4,percent:75});
});