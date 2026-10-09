import {patterns,transposeEvents} from './music.js';
import {guitarInputs,noteMidi} from './autoplay.js';
import {midiNote} from './performance.js';

export const OPEN_STRINGS = ['E2','A2','D3','G3','B3','E4'];
export const GUITAR_FRETS = 24;
export const UKULELE_STRINGS = ['G4','C4','E4','A4'];
export const UKULELE_FRETS = 18;
const names=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const scale=[0,2,4,5,7,9,11];
const qualities=['','m','m','','','m','dim'];
const sevenths=['maj7','m7','m7','maj7','7','m7','m7b5'];

function shapeFor(tones,tuning,fretCount) {
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

function buildChords(root,tuning,fretCount) {
  const tonic=names.indexOf(root);
  const chords=[];
  for(let degree=0;degree<7;degree++)for(const size of [3,4]) {
    const tones=Array.from({length:size},(_,index)=>(tonic+scale[(degree+index*2)%7])%12);
    const chordRoot=(tonic+scale[degree])%12;
    const frets=shapeFor(tones,tuning,fretCount);
    const pressed=frets.filter(fret=>fret>0);
    const averageFret=pressed.reduce((sum,fret)=>sum+fret,0)/Math.max(1,pressed.length);
    const distanceFromSoundhole=pressed.length?pressed.reduce((sum,fret)=>sum+1-(fretPosition(fret-1,fretCount)+fretPosition(fret,fretCount))/2,0)/pressed.length:1;
    chords.push({name:names[chordRoot]+(size===3?qualities[degree]:sevenths[degree]),degree,size,tones,frets,averageFret,distanceFromSoundhole,notes:frets.map((fret,string)=>midiNote(noteMidi(tuning[string])+fret))});
  }
  return chords.sort((first,second)=>first.distanceFromSoundhole-second.distanceFromSoundhole||first.name.localeCompare(second.name));
}

function annotate(events,chords,tuning,fretCount) {
  return events.map((event,index)=>{
    const notes=event.notes??[event.note];
    const pitches=notes.map(note=>noteMidi(note)%12);
    const neighbors=events.slice(Math.max(0,index-1),index+2).flatMap(value=>value.notes??[value.note]).map(note=>noteMidi(note)%12);
    const candidates=chords.filter(chord=>pitches.every(pitch=>chord.tones.includes(pitch)));
    const score=chord=>neighbors.filter(pitch=>chord.tones.includes(pitch)).length*2+(chord.tones[0]===pitches[0]?2:0)-(chord.size===4?1:0)-chord.degree*.01;
    candidates.sort((first,second)=>score(second)-score(first));
    const chord=candidates[0];
    if(!chord)throw new Error(`Unmapped guitar phrase: ${notes}`);
    const fingering=guitarInputs(notes,tuning,fretCount);
    if(fingering.length!==notes.length)throw new Error(`Unplayable string phrase: ${notes}`);
    return {...event,chord:chord.name,fingering};
  });
}

function buildLibrary(name,tuning,fretCount) {
  return Object.fromEntries(names.map(root=>{
    const chords=buildChords(root,tuning,fretCount);
    const phrases=patterns[name].map(phrase=>{
      const events=transposeEvents(phrase.events,root).map((event,index)=>({...event,notes:phrase.events[index].notes?.map(note=>midiNote(noteMidi(note)+names.indexOf(root)))}));
      return {...phrase,events:annotate(events,chords,tuning,fretCount)};
    });
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
  return STRING_INSTRUMENTS[instrument].library[root].phrases.flatMap(phrase=>phrase.events).find(value=>value.time===event.time&&JSON.stringify(value.notes??[value.note])===JSON.stringify(event.notes??[event.note]))??null;
}

export function fretPosition(fret,fretCount=GUITAR_FRETS) { return (1-2**(-fret/12))/(1-2**(-fretCount/12)); }