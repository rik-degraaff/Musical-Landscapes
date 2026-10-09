import {patterns,transposeEvents} from './music.js';
import {STRING_INSTRUMENTS} from './guitar.js';
import {noteMidi,trumpetInput} from './autoplay.js';
import {fluteInput} from './wind.js';
import {midiNote} from './performance.js';

export function difficultyLevel(options={}) {
  const value=options.complexity??1;
  return value<=.5?'Simple':value<=1?'Standard':'Advanced';
}

export function equippedProfile(name,root,options={}) {
  const level=difficultyLevel(options);
  const strings=STRING_INSTRUMENTS[name];
  const library=strings?.library[root];
  const chords=library?.chords.filter(chord=>level==='Advanced'||(chord.size===3&&(level!=='Simple'||[0,3,4].includes(chord.degree))))??[];
  const available=library?.phrases??patterns[name].map(phrase=>({...phrase,events:transposeEvents(phrase.events,root)}));
  const hits=level==='Simple'?['kick','snare','hat']:level==='Standard'?['kick','snare','hat','shaker','tom','clap','rim']:['kick','snare','hat','shaker','tom','clap','rim','crash','ride','floorTom'];
  const registers=level==='Simple'?2:level==='Standard'?4:6;
  const fluteRegisters=level==='Simple'?1:level==='Standard'?2:3;
  const compatible=available.filter(phrase=>phrase.events.every(event=>{
    if(strings)return chords.some(chord=>chord.name===event.chord);
    if(name==='drums')return hits.includes(event.note);
    if(name==='melody')return (trumpetInput(event.note)?.partial??99)<registers;
    if(name==='flute')return (fluteInput(event.note)?.register??99)<fluteRegisters;
    return true;
  }));
  const threshold=level==='Simple'?.3:level==='Standard'?.65:1;
  const preferred=compatible.filter(phrase=>phrase.complexity<=threshold);
  let phrases=preferred.length?preferred:compatible;
  if(!phrases.length){
    if(strings){const chord=chords.find(value=>value.degree===0)??chords[0];phrases=[{energy:.2,complexity:.1,events:[{time:'0:0:0',notes:chord.notes,dur:'2n',velocity:.45,chord:chord.name,fingering:chord.frets.map((fret,string)=>({string,fret,note:chord.notes[string]}))}]}];}
    else if(name==='flute'||name==='melody'){const note=name==='flute'?`${root}4`:'C4';phrases=[{energy:.2,complexity:.1,events:[{time:'0:0:0',note,dur:'2n',velocity:.4}]}];}
    else throw new Error(`No compatible equipped phrases for ${name} ${root}`);
  }
  if(phrases.length===1){
    const source=phrases[0];
    const first=source.events[0];
    const variation={...source,energy:Math.min(1,source.energy+.1),complexity:Math.min(threshold,source.complexity+.05),events:[{...first,time:'0:0:0',dur:'4n',velocity:(first.velocity??.45)*.9},{...first,time:'0:2:0',dur:'4n',velocity:(first.velocity??.45)*.8}]};
    if(JSON.stringify(source.events)!==JSON.stringify(variation.events))phrases=[source,variation];
  }
  const played=phrases.flatMap(phrase=>phrase.events.flatMap(event=>event.notes??[event.note]));
  const notes=name==='drums'?[]:[...new Set(played)].sort((first,second)=>noteMidi(first)-noteMidi(second));
  const keyboardNotes=notes.length?Array.from({length:noteMidi(notes.at(-1))-noteMidi(notes[0])+1},(_,index)=>midiNote(noteMidi(notes[0])+index)):[];
  return {level,phrases,chords,notes,keyboardNotes,hits,registers,fluteRegisters};
}