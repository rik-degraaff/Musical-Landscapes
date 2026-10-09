import React,{useRef} from 'react';
import {PANFLUTE_NOTES} from '../utils/performance';
import {useSwipeNotes} from './useSwipeNotes';
import './panflute.css';

export function PanFlute({audio,cue,options,PressControl}) {
  const surface=useRef(null);
  useSwipeNotes(surface,(note,token)=>audio.manualNoteOn(note,token,.6),(_,token)=>audio.manualNoteOff(token));
  return <div ref={surface} className="panflute-pipes" role="group" aria-label="Pan flute pipes">
    {PANFLUTE_NOTES.map((note,index)=><PressControl key={note} label={`Pan flute pipe ${note}`} swipeNote={note} demoPressed={cue?.note===note} className={`panflute-pipe ${note.includes('#')?'sharp-pipe':''}`} style={{'--pipe-length':`${100-index*1.9}%`}} onPress={token=>audio.manualNoteOn(note,token,.6)} onRelease={token=>audio.manualNoteOff(token)}><i className="pipe-mouth" aria-hidden="true"/><span hidden={!options.noteLabels}>{note}</span></PressControl>)}
    <div className="panflute-binding" aria-hidden="true"/>
  </div>;
}