import test from 'node:test';
import assert from 'node:assert/strict';
import { createSustainLoop, MANUAL_RELEASE } from '../src/audio/envelopes.js';

test('crossfaded wind loops preserve the attack and join the actual next sample at the seam', () => {
  const sampleRate=48000;
  for(const frequency of [185,261.63,440,783.99]) {
    const source=Float32Array.from({length:sampleRate*3},(_,index)=>Math.sin(index/sampleRate*2*Math.PI*frequency)*(0.5+0.12*Math.sin(index/sampleRate*31)));
    const {waveforms,loopStart,loopEnd}=createSustainLoop([source,source.map(value=>value*.7)],sampleRate,frequency);
    const start=Math.round(loopStart*sampleRate),end=Math.round(loopEnd*sampleRate);
    assert.equal(waveforms[0].length,end);
    assert.deepEqual(waveforms[0].slice(0,24000),source.slice(0,24000));
    assert.equal(waveforms[0][end-1],source[start-1]);
    assert.equal(waveforms[1][end-1],Math.fround(source[start-1]*.7));
    const seam=waveforms[0][start]-waveforms[0][end-1];
    assert.equal(seam,source[start]-source[start-1]);
    assert.ok(loopEnd>loopStart+.8);
  }
});

test('piano release is substantially longer than the wind release',()=>{
  assert.ok(MANUAL_RELEASE.piano>=.8);
  assert.ok(MANUAL_RELEASE.flute<.3);
  assert.ok(MANUAL_RELEASE.melody<.2);
});