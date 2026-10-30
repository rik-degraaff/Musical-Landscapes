import React,{useRef} from 'react';
import {useSwipeNotes} from './useSwipeNotes';
import './touch-instruments.css';

// Both surfaces use the profile's canonical bank in play, guides and practice.
// Bellows are automatic; no second gesture is needed to sustain an accordion key.
export function TouchInstrument({name,audio,profile,options,cue,PressControl}) {
  const surface=useRef(null);
  const harp=name==='harp';
  const notes=profile.keyboardNotes;
  const columns=Math.min(notes.length,13);
  const attack=(note,token)=>harp?audio.manualStrike(note,`${note}-${token}`,.65):audio.manualNoteOn(note,token,.6);
  useSwipeNotes(surface,attack,(_,token)=>{if(!harp)audio.manualNoteOff(token);});
  const active=Boolean(cue?.note||cue?.notes?.length);
  return <div ref={surface} className={`touch-instrument touch-${name} ${active?'is-sounding':''}`} role="group" aria-label={harp?'Harp strings':'Accordion keys'}>
    {!harp&&<div className="accordion-bellows" aria-hidden="true"><i/><i/><i/><i/><i/></div>}
    <div className="touch-note-bank" style={{'--note-columns':columns,'--note-rows':Math.ceil(notes.length/columns)}}>
      {notes.map((note,index)=><PressControl key={note} label={`${harp?'Harp string':'Accordion key'} ${note}`} swipeNote={note}
        className={`note-key ${harp?'harp-string':'accordion-key'} ${note.includes('#')?'accidental-note':'scale-note'}`}
        style={{'--string-height':`${94-(index%columns)/Math.max(1,columns-1)*34}%`}}
        demoPressed={cue?.note===note||Boolean(cue?.notes?.includes(note))}
        onPress={token=>attack(note,`${note}-${token}`)} onRelease={token=>{if(!harp)audio.manualNoteOff(`${note}-${token}`);}}>
        <i aria-hidden="true"/><span hidden={!options.noteLabels}>{note}</span>
      </PressControl>)}
    </div>
  </div>;
}
