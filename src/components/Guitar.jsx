import React, {useEffect,useRef,useState} from 'react';
import {GUITAR_LIBRARY,OPEN_STRINGS,GUITAR_FRETS,fretPosition,guitarEvent} from '../utils/guitar';
import {useSwipeNotes} from './useSwipeNotes';
import {flashInput} from './inputFeedback';

function ChordDiagram({chord}) {
  const pressed=chord.frets.filter(fret=>fret>0);
  const start=pressed.length?Math.max(1,Math.min(...pressed)):1;
  return <svg className="chord-diagram" viewBox="0 0 68 48" aria-label={`${chord.name} fingering`} role="img">
    {[0,1,2,3,4,5].map(string=><path key={`string-${string}`} d={`M${9+string*10} 10V46`} stroke="#547164" strokeWidth="1"/>)}
    {[0,1,2,3,4].map(fret=><path key={`fret-${fret}`} d={`M9 ${10+fret*9}H59`} stroke="#547164" strokeWidth={start===1&&fret===0?2:1}/>)}
    {chord.frets.map((fret,string)=>fret===null?<text key={string} x={9+string*10} y="7" textAnchor="middle" fontSize="8" fill="#547164">x</text>:fret===0?<circle key={string} cx={9+string*10} cy="4" r="2.5" stroke="#547164" fill="none"/>:<circle key={string} data-fret={fret} cx={9+string*10} cy={14.5+(fret-start)*9} r="3" fill="#a55b40"/>)}
    {start>1&&<text x="1" y="17" fontSize="7" fill="#547164">{start}</text>}
  </svg>;
}

export function Guitar({audio,cue,root,PressControl,options}) {
  const library=GUITAR_LIBRARY[root];
  const owners=useRef(new Map());
  const selection=useRef(null);
  const surface=useRef(null);
  const [selected,setSelected]=useState(null);
  const demo=cue?(cue.chord?cue:guitarEvent(root,cue)):null;
  const shown=demo?.chord??selected;
  const chord=library.chords.find(value=>value.name===shown);
  const buttons=library.chords.filter(value=>options.seventhChords||value.size===3);
  const notes=chord?.notes??OPEN_STRINGS;
  const notesRef=useRef(notes);notesRef.current=notes;
  useEffect(()=>{owners.current.clear();selection.current=null;setSelected(null);},[root]);
  useEffect(()=>{if(demo?.chord){selection.current=demo.chord;setSelected(demo.chord);}},[cue]);
  function choose(token,name) {
    if(name)owners.current.set(token,name);else owners.current.delete(token);
    selection.current=[...owners.current.values()].at(-1)??null;
    setSelected(selection.current);
    const shape=library.chords.find(value=>value.name===selection.current);
    notesRef.current=shape?.notes??OPEN_STRINGS;
  }
  function pluck(string) { const note=notesRef.current[string];if(note)audio.manualStrike(note,`string-${string}`,.7); }
  useSwipeNotes(surface,value=>pluck(Number(value)));
  return <div className="manual-guitar guitar-fretboard-layout">
    <div ref={surface} className="guitar-stringboard" role="group" aria-label="Guitar strings" onPointerDown={event=>event.preventDefault()}>
      <div className="guitar-neck" aria-hidden="true">
        {Array.from({length:GUITAR_FRETS+1},(_,fret)=><i className={`fret-line ${fret===0?'nut':''}`} key={fret} style={{left:`${fretPosition(fret)*100}%`}}/>)}
        {[3,5,7,9,12,15,17,19,21].map(fret=><i className="neck-inlay" key={fret} style={{left:`${(fretPosition(fret-1)+fretPosition(fret))*50}%`}}/>)}
      </div>
      <div className="guitar-soundhole" aria-hidden="true"/>
      {notes.map((note,string)=><button key={string} data-swipe-note={string} className="playable-string" aria-label={`Guitar string ${string+1}${note?` ${note}`:' muted'}`} style={{'--string-weight':`${3-string*.3}px`}} onKeyDown={event=>{if(!event.repeat&&[' ','Enter'].includes(event.key)){event.preventDefault();flashInput(event.currentTarget);pluck(string);}}}><i/></button>)}
      <div className={`guitar-chords neck-chord-controls ${options.fingeringCharts?'with-charts':''}`} role="group" aria-label="Chords in the current key">
        {buttons.map(value=><PressControl key={value.name} label={`Hold guitar chord ${value.name}`} className={`chord-control ${shown===value.name?'playing-chord':''}`} onPress={token=>choose(token,value.name)} onRelease={token=>choose(token,null)}><span className="chord-name">{value.name}</span>{options.fingeringCharts&&<ChordDiagram chord={value}/>}</PressControl>)}
      </div>
      <div className="guitar-fingering-overlay" aria-hidden="true">
        {options.fretDots&&chord?.frets.map((fret,string)=>fret===null?null:<i className={`fingering-dot ${fret===0?'open-string-dot':''}`} key={string} data-string={string+1} data-fret={fret} style={{left:`${fret===0?0:(fretPosition(fret-1)+fretPosition(fret))*50}%`,top:`${(string+.5)/6*100}%`}}/>)}
        {shown&&<span className="neck-chord-name">{shown}</span>}
        {options.fretDots&&demo?.fingering?.map(input=><i className="phrase-note-dot" key={input.string} style={{left:`${input.fret===0?0:(fretPosition(input.fret-1)+fretPosition(input.fret))*50}%`,top:`${(input.string+.5)/6*100}%`}}/>)}
      </div>
    </div>
  </div>;
}