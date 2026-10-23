import test from 'node:test';
import assert from 'node:assert/strict';
import {requestPlaybackSession,startAudioContext} from '../src/audio/playback.js';

test('requests playback without depending on Audio Session API support or permission',()=>{
  const session={type:'auto'};
  assert.equal(requestPlaybackSession({audioSession:session}),session);
  assert.equal(session.type,'playback');
  assert.equal(requestPlaybackSession({}),undefined);
  assert.equal(requestPlaybackSession({get audioSession(){throw new Error('unsupported');}}),null);
  assert.equal(requestPlaybackSession({audioSession:{get type(){return 'auto';},set type(_){throw new Error('denied');}}}),null);
});

test('audio unlock is synchronous and rejects a resolved resume that is still suspended',async()=>{
  let calls=0;
  const attempt=startAudioContext(()=>{calls++;return Promise.resolve();},{state:'suspended'});
  assert.equal(calls,1);
  await assert.rejects(attempt,/suspended/);
  await assert.rejects(startAudioContext(()=>{throw new Error('denied');},{state:'suspended'}),/denied/);
});

test('a hanging browser resume times out, then a new gesture can succeed',async()=>{
  const context={state:'suspended'};
  let resolve;
  const hanging=new Promise(done=>{resolve=done;});
  await assert.rejects(startAudioContext(()=>hanging,context,{timeoutMs:10}),/timed out/);
  context.state='running';
  await startAudioContext(()=>Promise.resolve(),context);
  resolve();
});

test('canceling an owned graph releases a pending unlock promptly',async()=>{
  let cancel;
  const cancelled=new Promise(done=>{cancel=done;});
  const attempt=startAudioContext(()=>new Promise(()=>{}),{state:'suspended'},{cancelled});
  cancel();
  await assert.rejects(attempt,/cancelled/);
});
