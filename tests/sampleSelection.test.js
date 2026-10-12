import test from 'node:test';
import assert from 'node:assert/strict';
import {parseMidi,prepareSampleCandidates,selectNearestSample} from '../src/audio/sampleSelection.js';

const NOTE_NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

function sortReference(buffers,pitch) {
  const candidates=Object.keys(buffers).map(note=>{
    const parts=/^([A-G]#?)(\d+)$/.exec(note);
    return {note,midi:NOTE_NAMES.indexOf(parts[1])+(Number(parts[2])+1)*12};
  });
  candidates.sort((first,second)=>Math.abs(first.midi-pitch)-Math.abs(second.midi-pitch));
  return candidates[0]??null;
}

test('MIDI parsing covers every semitone and octave without coercing malformed notes',()=>{
  for(let octave=0;octave<=10;octave++)for(const [pitch,note] of NOTE_NAMES.entries())assert.equal(parseMidi(`${note}${octave}`),pitch+(octave+1)*12);
  assert.equal(parseMidi('C-1'),0);
  assert.equal(parseMidi('A4'),69);
  for(const invalid of [undefined,null,42,{},[],true,'','kick','H4','E#4','B#4','Db4','c4','C','C4.5',' C4','C4 ','C+4','C999999999999999999999999'])assert.equal(parseMidi(invalid),null);
});

test('sample preparation retains buffer insertion order and does not mutate the bank',()=>{
  const buffers=Object.freeze({G4:{},C4:{},'D#4':{},A3:{}});
  const keys=Object.keys(buffers);
  const candidates=prepareSampleCandidates(buffers);
  assert.deepEqual(candidates,[{note:'G4',midi:67},{note:'C4',midi:60},{note:'D#4',midi:63},{note:'A3',midi:57}]);
  assert.deepEqual(Object.keys(buffers),keys);
  assert.deepEqual(prepareSampleCandidates(buffers),candidates);
  assert.notEqual(prepareSampleCandidates(buffers),candidates);
});

test('linear selection matches the current stable sort for all semitones, exact roots and out-of-range pitches',()=>{
  const banks=[
    {G4:{},C4:{},'D#4':{},A3:{}},
    {'F#2':{},C2:{},D2:{},G2:{},'D#2':{},'C#2':{},'A#2':{},'C#3':{},'D#3':{},F2:{}},
    {B6:{},C1:{},F3:{},A4:{},'C#5':{},E4:{}},
    Object.fromEntries([9,2,7,0,11,4,1,10,5,8,3,6].map(pitch=>[`${NOTE_NAMES[pitch]}4`,{}])),
    {C4:{}},
    {},
  ];
  for(const buffers of banks){
    const candidates=prepareSampleCandidates(buffers);
    const before=structuredClone(candidates);
    for(let pitch=0;pitch<=144;pitch+=.5)assert.deepEqual(selectNearestSample(candidates,pitch),sortReference(buffers,pitch));
    for(const candidate of candidates)assert.equal(selectNearestSample(candidates,candidate.midi),candidate);
    assert.deepEqual(candidates,before);
    for(const candidate of candidates)Object.freeze(candidate);
    Object.freeze(candidates);
    assert.deepEqual(selectNearestSample(candidates,69),sortReference(buffers,69));
  }
});

test('equal distances keep the first inserted sample even when the higher note comes first',()=>{
  for(const buffers of [{E4:{},C4:{},G4:{}},{C4:{},E4:{},G4:{}}]){
    const candidates=prepareSampleCandidates(buffers);
    assert.equal(selectNearestSample(candidates,62),candidates[0]);
    assert.deepEqual(selectNearestSample(candidates,62),sortReference(buffers,62));
  }
  const duplicates=[{note:'first',midi:60},{note:'second',midi:60}];
  assert.equal(selectNearestSample(duplicates,60),duplicates[0]);
});

test('invalid notes are skipped and missing banks or invalid pitches return no selection',()=>{
  for(const bank of [undefined,null,{}]){
    assert.deepEqual(prepareSampleCandidates(bank),[]);
    assert.equal(selectNearestSample(prepareSampleCandidates(bank),60),null);
  }
  const candidates=prepareSampleCandidates({kick:{},H4:{},C4:{},'E#4':{},'C#4':{}});
  assert.deepEqual(candidates,[{note:'C4',midi:60},{note:'C#4',midi:61}]);
  for(const pitch of [undefined,null,'60',NaN,Infinity,-Infinity])assert.equal(selectNearestSample(candidates,pitch),null);
  assert.equal(selectNearestSample(undefined,60),null);
  assert.equal(selectNearestSample([{note:'invalid',midi:NaN},null,...candidates],60),candidates[0]);
});