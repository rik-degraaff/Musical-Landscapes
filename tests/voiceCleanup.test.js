import test from 'node:test';
import assert from 'node:assert/strict';
import {releaseManualVoice} from '../src/audio/voiceCleanup.js';

test('voice stop is guaranteed when hold automation is absent or throws',()=>{
  for(const mode of ['working','missing','throwing','all automation throws']){
    const stops=[];const calls=[];
    const gain={value:.6,cancelScheduledValues:time=>calls.push(['cancel',time]),setValueAtTime:(value,time)=>calls.push(['value',value,time]),setTargetAtTime:(value,time)=>calls.push(['target',value,time])};
    if(mode==='working')gain.cancelAndHoldAtTime=time=>calls.push(['hold',time]);
    if(mode==='throwing')gain.cancelAndHoldAtTime=()=>{throw Error('unsupported');};
    if(mode==='all automation throws')gain.cancelScheduledValues=()=>{throw Error('unavailable');};
    releaseManualVoice({envelope:{gain},source:{stop:time=>stops.push(time)}},2,.04);
    assert.deepEqual(stops,[2.045],mode);
    if(mode==='all automation throws')assert.equal(gain.value,0);
    else assert.ok(calls.some(call=>call[0]==='value'&&call[1]===0&&call[2]===2.04));
  }
});

test('repeated cleanup tolerates an already ended audio source',()=>{
  const voice={envelope:{gain:{value:0,cancelAndHoldAtTime(){},setTargetAtTime(){},setValueAtTime(){}}},source:{stop(){throw Error('already stopped');}}};
  assert.doesNotThrow(()=>{releaseManualVoice(voice,0,.04);releaseManualVoice(voice,1,.04);});
});

test('repeated releases never postpone the earliest source stop deadline',()=>{
  const stops=[];
  const voice={envelope:{gain:{value:.5,cancelAndHoldAtTime(){},setTargetAtTime(){},setValueAtTime(){}}},source:{stop:time=>stops.push(time)}};
  releaseManualVoice(voice,1,.9);releaseManualVoice(voice,1.1,.04);releaseManualVoice(voice,1.12,.04);
  assert.deepEqual(stops,[1.9049999999999998,1.145,1.145]);
});