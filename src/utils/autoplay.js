import { midiNote, trumpetNote, TRUMPET_REGISTERS } from './performance.js';

export function noteMidi(note) {
  const match = /^([A-G]#?)(\d+)$/.exec(note);
  return pitchClasses.indexOf(match[1]) + (Number(match[2]) + 1) * 12;
}

export function keyboardRange(notes, extra) {
  const pitches = [...notes, ...extra].map(noteMidi);
  const low = Math.min(...pitches), high = Math.max(...pitches);
  return Array.from({length:high-low+1}, (_, index) => midiNote(low+index));
}

export function guitarInput(note, tuning = ['E2','A2','D3','G3','B3','E4'], frets = tuning.length === 4 ? 18 : 24) {
  const choices = tuning.map((value, string) => ({string, fret:noteMidi(note)-noteMidi(value)})).filter(value => value.fret >= 0 && value.fret <= frets);
  return choices.sort((first, second) => first.fret-second.fret)[0];
}

export function guitarInputs(notes, tuning = ['E2','A2','D3','G3','B3','E4'], frets = tuning.length === 4 ? 18 : 24) {
  let best = null;
  let bestCost = Infinity;
  function assign(index, assigned, cost) {
    if(index === notes.length) {
      const positions=assigned.map(input=>input.fret);
      const score=Math.max(0,...positions)*1000+(positions.length?Math.max(...positions)-Math.min(...positions):0)*100+cost;
      if(score < bestCost) { best=assigned;bestCost=score; }
      return;
    }
    tuning.forEach((base,string)=>{
      const fret=noteMidi(notes[index])-noteMidi(base);
      if(fret>=0&&fret<=frets&&!assigned.some(input=>input.string===string)) assign(index+1,[...assigned,{string,fret,note:notes[index]}],cost+fret);
    });
  }
  assign(0,[],0);
  return best??[];
}

export function matchingGuitarChord(notes, chords) {
  const pitches=[...new Set(notes.map(note=>noteMidi(note)%12))];
  if(pitches.length<2)return null;
  return Object.keys(chords).filter(name=>name!=='Open').find(name=>{
    const chordPitches=new Set(chords[name].filter(Boolean).map(note=>noteMidi(note)%12));
    return pitches.every(pitch=>chordPitches.has(pitch));
  })??null;
}

const pitchClasses = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

export function trumpetInput(note) {
  for (let partial = 0; partial < TRUMPET_REGISTERS.length; partial++) {
    for (let mask = 0; mask < 8; mask++) {
      const fingering=[0,1,2].map(index=>Boolean(mask&(1<<index)));
      if (trumpetNote(fingering,partial) === note) {
        const valves = [0, 1, 2].filter(index => mask & (1 << index)).map(index => index + 1);
        return { partial, valves:fingering, label:`${TRUMPET_REGISTERS[partial]} + ${valves.length ? `valve${valves.length > 1 ? 's' : ''} ${valves.join('+')}` : 'open valves'} + blow` };
      }
    }
  }
  return null;
}
