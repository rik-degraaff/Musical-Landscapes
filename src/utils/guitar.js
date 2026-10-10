import {patterns,transposeEvents,musicalKey} from './music.js';
import {noteMidi} from './autoplay.js';
import {midiNote} from './performance.js';

export const OPEN_STRINGS = ['E2','A2','D3','G3','B3','E4'];
export const GUITAR_FRETS = 24;
export const UKULELE_STRINGS = ['G4','C4','E4','A4'];
export const UKULELE_FRETS = 18;
const names=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const qualities=['','m','m','','','m','dim'];
const sevenths=['maj7','m7','m7','maj7','7','m7','m7b5'];

function shapeFor(tones,tuning,fretCount,required=[]) {
  let best=null;
  let bestScore=Infinity;
  for(let position=0;position<=fretCount;position++) {
    const choices=tuning.map(note=>{
      const base=noteMidi(note);
      return Array.from({length:5},(_,offset)=>position+offset).filter(fret=>fret<=fretCount&&tones.includes((base+fret)%12));
    });
    function visit(string,frets,sounding) {
      if(string===tuning.length) {
        if(!tones.every(tone=>sounding.some(note=>note%12===tone)))return;
        if(required.some(pitches=>pitches.some(pitch=>sounding.filter(note=>note%12===pitch).length<pitches.filter(value=>value===pitch).length)))return;
        const score=Math.max(...frets)*1000+frets.reduce((sum,fret)=>sum+fret,0);
        if(score<bestScore){bestScore=score;best=frets;}
        return;
      }
      for(const fret of choices[string])visit(string+1,[...frets,fret],[...sounding,noteMidi(tuning[string])+fret]);
    }
    visit(0,[],[]);
  }
  if(!best)throw new Error(`No all-string shape for ${tuning}: ${tones}`);
  return best;
}

function buildChords(root,tuning,fretCount,events) {
  const key=musicalKey(root);
  const tonic=key.pitch;
  const scale=key.scale;
  const chordQualities=key.minor?['m','dim','','m','m','','']:qualities;
  const chordSevenths=key.minor?['m7','m7b5','maj7','m7','m7','maj7','7']:sevenths;
  const labels=root.includes('b')||root==='Fm'?['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']:names;
  const chords=[];
  for(let degree=0;degree<7;degree++)for(const size of [3,4]) {
    const tones=Array.from({length:size},(_,index)=>(tonic+scale[(degree+index*2)%7])%12);
    const chordRoot=(tonic+scale[degree])%12;
    const required=size===3?events.map(event=>(event.notes??[event.note]).map(note=>noteMidi(note)%12)).filter(pitches=>pitches.every(pitch=>tones.includes(pitch))):[];
    const frets=shapeFor(tones,tuning,fretCount,required);
    const pressed=frets.filter(fret=>fret>0);
    const averageFret=pressed.reduce((sum,fret)=>sum+fret,0)/Math.max(1,pressed.length);
    const distanceFromSoundhole=pressed.length?pressed.reduce((sum,fret)=>sum+1-(fretPosition(fret-1,fretCount)+fretPosition(fret,fretCount))/2,0)/pressed.length:1;
    chords.push({name:labels[chordRoot]+(size===3?chordQualities[degree]:chordSevenths[degree]),degree,size,tones,frets,averageFret,distanceFromSoundhole,notes:frets.map((fret,string)=>midiNote(noteMidi(tuning[string])+fret))});
  }
  return chords.sort((first,second)=>first.distanceFromSoundhole-second.distanceFromSoundhole||first.name.localeCompare(second.name));
}

export function voiceStringEvent(event,chord) {
  const source=event.notes??[event.note];
  const used=new Set();
  const fingering=[];
  for(const note of source) {
    const strings=chord.notes.map((value,string)=>({value,string})).filter(input=>!used.has(input.string)&&noteMidi(input.value)%12===noteMidi(note)%12);
    strings.sort((first,second)=>Math.abs(noteMidi(first.value)-noteMidi(note))-Math.abs(noteMidi(second.value)-noteMidi(note))||first.string-second.string);
    const input=strings[0];
    if(!input)return null;
    used.add(input.string);
    fingering.push({string:input.string,fret:chord.frets[input.string],note:input.value});
  }
  const notes=fingering.map(input=>input.note);
  return {...event,...(event.notes?{notes}:{note:notes[0]}),chord:chord.name,fingering};
}

function annotate(events,chords) {
  return events.map((event,index)=>{
    const notes=event.notes??[event.note];
    const pitches=notes.map(note=>noteMidi(note)%12);
    const neighbors=events.slice(Math.max(0,index-1),index+2).flatMap(value=>value.notes??[value.note]).map(note=>noteMidi(note)%12);
    const candidates=chords.filter(chord=>pitches.every(pitch=>chord.tones.includes(pitch)));
    const score=chord=>neighbors.filter(pitch=>chord.tones.includes(pitch)).length*2+(chord.tones[0]===pitches[0]?2:0)-(chord.size===4?1:0)-chord.degree*.01;
    candidates.sort((first,second)=>score(second)-score(first));
    const voiced=candidates.map(chord=>voiceStringEvent(event,chord)).find(Boolean);
    if(!voiced)throw new Error(`Unplayable chord phrase: ${notes}`);
    return voiced;
  });
}

function buildLibrary(name,tuning,fretCount) {
  return Object.fromEntries([...names,'C#m','Am','Fm','Db'].map(root=>{
    const source=patterns[name].map(phrase=>({...phrase,events:transposeEvents(phrase.events,root,{preserveUnisons:true})}));
    const chords=buildChords(root,tuning,fretCount,source.flatMap(phrase=>phrase.events));
    const phrases=source.map(phrase=>({...phrase,events:annotate(phrase.events,chords)}));
    return [root,{chords,phrases}];
  }));
}

export const GUITAR_LIBRARY=buildLibrary('guitar',OPEN_STRINGS,GUITAR_FRETS);
export const UKULELE_LIBRARY=buildLibrary('ukulele',UKULELE_STRINGS,UKULELE_FRETS);
export const STRING_INSTRUMENTS={
  guitar:{tuning:OPEN_STRINGS,frets:GUITAR_FRETS,library:GUITAR_LIBRARY},
  ukulele:{tuning:UKULELE_STRINGS,frets:UKULELE_FRETS,library:UKULELE_LIBRARY},
};

export function guitarChord(root,name,instrument='guitar') { return STRING_INSTRUMENTS[instrument].library[root].chords.find(chord=>chord.name===name); }
export function guitarEvent(root,event,instrument='guitar') {
  return STRING_INSTRUMENTS[instrument].library[root].phrases.flatMap(phrase=>phrase.events).find(value=>(!event.chord||value.chord===event.chord)&&value.time===event.time&&JSON.stringify(value.notes??[value.note])===JSON.stringify(event.notes??[event.note]))??null;
}

export function fretPosition(fret,fretCount=GUITAR_FRETS) { return (1-2**(-fret/12))/(1-2**(-fretCount/12)); }