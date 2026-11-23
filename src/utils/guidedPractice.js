import {trumpetNote} from './performance.js';

export const PRACTICE_ACTIVITIES = [
  {id:'hear',label:'Hear it'},
  {id:'copy',label:'Copy it'},
  {id:'rhythm',label:'Tap the rhythm'},
  {id:'band',label:'Play with the band'},
];

export function practiceOpening(age, instrument) {
  return {
    count:age==='8plus'?3:1,
    shared:age==='under3',
    showTools:age==='8plus',
    instrument:instrument==='flute'||(age==='under3'&&instrument==='melody')?'drums':instrument,
  };
}

const actionTimes=['0:0:0','0:1:0','0:2:2'];

// Three fixed rhythms are voiced on canonical controls from this key and difficulty.
export function guidedExercise(name, profile, count=1) {
  let actions;
  if(name==='guitar'||name==='ukulele'){
    const chord=profile.chords[0];
    actions=[...chord.notes].map((note,string)=>({note,chord:chord.name,fingering:[{string,fret:chord.frets[string],note}]})).reverse();
  }else{
    const notes=name==='drums'?profile.hits:name==='melody'
      ?Array.from({length:profile.registers},(_,register)=>trumpetNote([false,false,false],register))
      :name==='panflute'?profile.notes:profile.keyboardNotes;
    const direct=notes.filter(note=>!note.includes('#'));
    const bank=direct.length>=2?direct:notes;
    actions=bank.map(note=>({note}));
  }
  return {degree:0,events:Array.from({length:count},(_,index)=>({
    ...actions[index%actions.length],time:actionTimes[index],dur:'8n',velocity:.62,
  }))};
}

export function rhythmEcho(phrase, steady=false) {
  return {events:(steady?[0,1,2].map(index=>({time:`0:${index}:0`})):phrase.events)
    .map(({time})=>({time,note:'rim',dur:'8n',velocity:.56}))};
}
