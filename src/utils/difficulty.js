import {patterns,transposeEvents} from './music.js';
import {STRING_INSTRUMENTS} from './guitar.js';
import {noteMidi,trumpetInput} from './autoplay.js';
import {fluteInput} from './wind.js';
import {midiNote,PANFLUTE_NOTES} from './performance.js';

function phraseSignature(phrase) {
  return JSON.stringify(phrase.events.map(event=>[event.time,event.dur,event.notes??event.note]));
}

function phraseWithinLevel(phrase,name,level) {
  const limits=level==='Simple'?{events:4,subdivisions:[0]}:{events:8,subdivisions:[0,2]};
  if(phrase.events.length>limits.events)return false;
  return phrase.events.every(event=>{
    const subdivision=Number(event.time.split(':')[2]);
    const notes=event.notes?.length??1;
    const maxNotes=['guitar','ukulele'].includes(name)?4:name==='piano'?(level==='Simple'?2:3):1;
    return limits.subdivisions.includes(subdivision)&&notes<=maxNotes;
  });
}

function simplifyPianoPhrase(phrase) {
  return {...phrase,events:phrase.events.map(event=>{
    if(!event.notes||event.notes.length<=2)return event;
    const notes=[event.notes[0],event.notes.at(-1)];
    return {...event,notes};
  })};
}

function simpleSource(name,source) {
  return source.map((phrase,sourceIndex)=>{
    const prepared=name==='piano'?simplifyPianoPhrase(phrase):phrase;
    return {...prepared,tierSource:sourceIndex};
  });
}

function fitNote(note,name,registers) {
  const accepts=candidate=>{
    if(name==='flute')return (fluteInput(candidate)?.register??99)<registers;
    if(name==='melody')return (trumpetInput(candidate)?.partial??99)<registers;
    return PANFLUTE_NOTES.includes(candidate);
  };
  if(accepts(note))return note;
  const midi=noteMidi(note);
  for(let distance=1;distance<=2;distance++)for(const shift of [-12*distance,12*distance]){
    const candidate=midiNote(midi+shift);
    if(accepts(candidate))return candidate;
  }
  return null;
}

function fitPhrase(name,phrase,registers) {
  if(!['flute','melody','panflute'].includes(name))return phrase;
  const events=phrase.events.map(event=>{
    const notes=event.notes?.map(note=>fitNote(note,name,registers));
    const note=event.note?fitNote(event.note,name,registers):event.note;
    if((notes&&notes.some(value=>!value))||(event.note&&!note))return null;
    return {...event,...(notes?{notes}:{}),...(event.note?{note}:{})};
  });
  return events.some(event=>!event)?null:{...phrase,events};
}

function chordForEvent(event,available,allChords) {
  const notes=event.notes??[event.note];
  const pitches=notes.map(note=>noteMidi(note)%12);
  const original=allChords.find(chord=>chord.name===event.chord);
  const candidates=available.filter(chord=>pitches.every(pitch=>chord.tones.includes(pitch)));
  candidates.sort((first,second)=>{
    const firstMatch=first===original?1:0,secondMatch=second===original?1:0;
    if(firstMatch!==secondMatch)return secondMatch-firstMatch;
    const firstRoot=first.tones[0]===pitches[0]?1:0,secondRoot=second.tones[0]===pitches[0]?1:0;
    return secondRoot-firstRoot||first.degree-second.degree;
  });
  return candidates[0]??null;
}

function fitStringPhrase(phrase,chords,allChords) {
  const events=phrase.events.map(event=>{
    const chord=chordForEvent(event,chords,allChords);
    return chord?{...event,chord:chord.name}:null;
  });
  return events.some(event=>!event)?null:{...phrase,events};
}

function uniquePhrases(phrases) {
  const seen=new Set();
  return phrases.filter(phrase=>{
    const signature=phraseSignature(phrase);
    if(seen.has(signature))return false;
    seen.add(signature);return true;
  });
}

function compatiblePhrases(name,source,chords,library,hits,registers,fluteRegisters) {
  const available=source.map((phrase,sourceIndex)=>fitPhrase(name,{...phrase,tierSource:sourceIndex},name==='flute'?fluteRegisters:registers)).filter(Boolean);
  return available.map(phrase=>STRING_INSTRUMENTS[name]?fitStringPhrase(phrase,chords,library.chords):phrase).filter(Boolean).filter(phrase=>phrase.events.every(event=>{
    if(name==='drums')return hits.includes(event.note);
    if(name==='melody')return (trumpetInput(event.note)?.partial??99)<registers;
    if(name==='flute')return (fluteInput(event.note)?.register??99)<fluteRegisters;
    if(name==='panflute')return (event.notes??[event.note]).every(note=>PANFLUTE_NOTES.includes(note));
    return true;
  }));
}

export function difficultyLevel(options={}) {
  const value=options.complexity??1;
  return value<=.5?'Simple':value<=1?'Standard':'Advanced';
}

export function equippedProfile(name,root,options={}) {
  const level=difficultyLevel(options);
  const strings=STRING_INSTRUMENTS[name];
  const library=strings?.library[root];
  const simpleChords=library?.chords.filter(chord=>chord.size===3&&[0,3,4].includes(chord.degree))??[];
  const standardChords=library?.chords.filter(chord=>chord.size===3&&chord.degree<6)??[];
  const chords=level==='Simple'?simpleChords:level==='Standard'?standardChords:library?.chords??[];
  const hits=level==='Simple'?['kick','snare','hat']:level==='Standard'?['kick','snare','hat','shaker','tom','clap','rim']:['kick','snare','hat','shaker','tom','clap','rim','crash','ride','floorTom'];
  const registers=level==='Simple'?2:level==='Standard'?4:6;
  const fluteRegisters=level==='Simple'?1:level==='Standard'?2:3;
  const source=library?.phrases??patterns[name].map(phrase=>({...phrase,events:transposeEvents(phrase.events,root)}));
  const simpleHits=['kick','snare','hat'];
  const simpleCompatible=compatiblePhrases(name,simpleSource(name,source),simpleChords,library,simpleHits,2,1);
  const simple=uniquePhrases(simpleCompatible.filter(phrase=>phrase.complexity<=.3&&phraseWithinLevel(phrase,name,'Simple')));
  const standardCompatible=compatiblePhrases(name,source,standardChords,library,['kick','snare','hat','shaker','tom','clap','rim'],4,2);
  const standardOnly=uniquePhrases(standardCompatible.filter(phrase=>phrase.complexity<=.65&&phraseWithinLevel(phrase,name,'Standard')&&!simple.some(value=>value.tierSource===phrase.tierSource)));
  const compatible=level==='Simple'?simpleCompatible:level==='Standard'?standardCompatible:compatiblePhrases(name,source,chords,library,hits,registers,fluteRegisters);
  if(simple.length<2||standardOnly.length<2)throw new Error(`Insufficient authored ${level} phrases for ${name} ${root}: ${simple.length} simple, ${standardOnly.length} standard-only`);
  const phrases=level==='Simple'?simple:level==='Standard'?[...simple,...standardOnly]:uniquePhrases(compatible);
  const played=phrases.flatMap(phrase=>phrase.events.flatMap(event=>event.notes??[event.note]));
  const notes=name==='drums'?[]:[...new Set(played)].sort((first,second)=>noteMidi(first)-noteMidi(second));
  const keyboardNotes=notes.length?Array.from({length:noteMidi(notes.at(-1))-noteMidi(notes[0])+1},(_,index)=>midiNote(noteMidi(notes[0])+index)):[];
  return {level,phrases,chords,notes,keyboardNotes,hits,registers,fluteRegisters};
}