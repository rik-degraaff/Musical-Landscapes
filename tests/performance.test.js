import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import { PIANO_NOTES, GUITAR_CHORDS, trumpetNote, slidePosition } from '../src/utils/performance.js';
import {createTimingAttempt,scoreTimedInput,expireSteps,attemptSummary} from '../src/utils/practice.js';

const practiceSource=readFileSync(new URL('../src/components/PracticeRoom.jsx',import.meta.url),'utf8');
const practiceMethods=/  function reset\(\) \{[\s\S]*?(?=  useEffect\(\(\)=>\{)/.exec(practiceSource)?.[0];
assert.ok(practiceMethods,'practice result, reset and cycle methods must be available');
const practicePhrase={events:[{time:'0:0:0',notes:['C4','E4']},{time:'0:2:0',note:'G4'}]};

function practiceHarness() {
  const published=[],summaries=[];
  const refs={attempt:{current:createTimingAttempt(practicePhrase)},resultSnapshot:{current:[]},state:{current:{stage:2}},cycle:{current:0},totals:{current:{hits:0,total:0}},learned:{current:{step:0,remaining:[]}},inputLocation:{current:null}};
  const context={...refs,createTimingAttempt,attemptSummary,setResults:next=>published.push(Array.from(next)),setSummary:next=>summaries.push(next),setFeedbackItems:()=>{},cancel:()=>{},setStep:()=>{},setComplete:()=>{},setFeedback:()=>{}};
  const methods=runInNewContext(`${practiceMethods}\n({reset,updateResults,advanceCycle})`,context);
  return {...refs,...methods,published,summaries};
}

test('manual instruments have compact piano, open strings and acoustic trumpet valve intervals', () => {
  assert.equal(PIANO_NOTES.length, 19);
  assert.equal(PIANO_NOTES[0], 'C4');
  assert.equal(PIANO_NOTES.at(-1), 'F#5');
  assert.deepEqual(GUITAR_CHORDS.Open, ['E2','A2','D3','G3','B3','E4']);
  assert.equal(trumpetNote([false,false,false], 0), 'C4');
  assert.equal(trumpetNote([true,false,false], 0), 'A#3');
  assert.equal(trumpetNote([false,true,false], 0), 'B3');
  assert.equal(trumpetNote([true,true,true], 1), 'C#4');
});
test('overlapping instruments slide apart inside screen bounds', () => {
  const result = slidePosition({x:200,y:200}, {width:100,height:80}, [{x:200,y:200,width:100,height:80}], {left:0,top:0,right:600,bottom:500});
  assert.ok(Math.abs(result.x-200)>=110 || Math.abs(result.y-200)>=90);
});

test('practice publishes only changed statuses or hit counts, not idle frames or wrong notes',()=>{
  const room=practiceHarness();
  room.updateResults();
  assert.deepEqual(room.published,[['pending','pending']]);
  function idle() {
    const snapshot=room.resultSnapshot.current;
    const publications=room.published.length;
    for(let frame=0;frame<600;frame++)room.updateResults();
    assert.equal(room.published.length,publications);
    assert.equal(room.resultSnapshot.current,snapshot);
  }
  idle();
  assert.equal(scoreTimedInput(room.attempt.current,'D4',0).correct,false);
  room.updateResults();idle();assert.equal(room.published.length,1);
  assert.equal(scoreTimedInput(room.attempt.current,'C4',0).correct,true);
  room.updateResults();idle();assert.equal(room.published.length,2);
  assert.deepEqual(room.published.at(-1),['pending','pending']);
  assert.equal(room.resultSnapshot.current[0].hits,1);
  assert.equal(scoreTimedInput(room.attempt.current,'C4',0).correct,false);
  room.updateResults();assert.equal(room.published.length,2);
  assert.equal(scoreTimedInput(room.attempt.current,'E4',0).complete,true);
  room.updateResults();idle();assert.equal(room.published.length,3);
  assert.deepEqual(room.published.at(-1),['correct','pending']);
  expireSteps(room.attempt.current,3);
  room.updateResults();idle();assert.equal(room.published.length,4);
  assert.deepEqual(room.published.at(-1),['correct','missed']);
});

test('practice reset, cycle rollover and changed attempt length invalidate the published snapshot',()=>{
  const room=practiceHarness();
  room.updateResults();
  room.advanceCycle(1,practicePhrase);
  assert.deepEqual(room.published.at(-1),[]);
  assert.equal(room.resultSnapshot.current.length,0);
  assert.equal(room.totals.current.total,3);
  room.updateResults();assert.equal(room.published.length,3);
  assert.deepEqual(room.published.at(-1),['pending','pending']);
  const attempt=room.attempt.current;
  room.advanceCycle(1,practicePhrase);room.updateResults();
  assert.equal(room.attempt.current,attempt);assert.equal(room.published.length,3);
  room.reset();
  assert.deepEqual(room.published.at(-1),[]);
  assert.equal(room.resultSnapshot.current.length,0);
  room.attempt.current=createTimingAttempt(practicePhrase);
  room.updateResults();assert.equal(room.published.length,5);
  room.attempt.current.pop();room.updateResults();
  assert.deepEqual(room.published.at(-1),['pending']);assert.equal(room.published.length,6);
  room.attempt.current=[];room.updateResults();room.updateResults();
  assert.deepEqual(room.published.at(-1),[]);assert.equal(room.published.length,7);
  room.state.current.stage=0;
  room.advanceCycle(2,practicePhrase);
  assert.equal(room.state.current.complete,true);
  assert.equal(room.published.length,7);
});