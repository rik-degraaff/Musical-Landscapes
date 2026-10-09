import React, {useEffect,useRef,useState} from 'react';
import {STRING_INSTRUMENTS,fretPosition,guitarEvent} from '../utils/guitar';
import {useSwipeNotes} from './useSwipeNotes';
import {flashInput} from './inputFeedback';
import './strings.css';

function ChordDiagram({chord}) {
  const pressed=chord.frets.filter(fret=>fret>0);
  const start=pressed.length?Math.max(1,Math.min(...pressed)):1;
  const end=9+(chord.frets.length-1)*10;
  const rows=Math.max(4,...pressed.map(fret=>fret-start+1));
  const step=36/rows;
  return <svg className="chord-diagram" viewBox={`0 0 ${end+9} 48`} aria-label={`${chord.name} fingering`} role="img">
    {chord.frets.map((_,string)=><path key={`string-${string}`} d={`M${9+string*10} 10V46`} stroke="#547164" strokeWidth="1"/>)}
    {Array.from({length:rows+1},(_,fret)=><path key={`fret-${fret}`} d={`M9 ${10+fret*step}H${end}`} stroke="#547164" strokeWidth={start===1&&fret===0?2:1}/>)}
    {chord.frets.map((fret,string)=>fret===0?<circle key={string} cx={9+string*10} cy="4" r="2.5" stroke="#d65300" strokeWidth="1.5" fill="none"/>:<circle key={string} data-fret={fret} cx={9+string*10} cy={10+(fret-start+.5)*step} r="3" fill="#ff7900" stroke="#713000" strokeWidth="1"/>)}
    {start>1&&<text x="1" y="17" fontSize="7" fill="#547164">{start}</text>}
  </svg>;
}

export function Guitar({audio,cue,root,profile,PressControl,options={},name='guitar'}) {
  const {tuning,frets:fretCount}=STRING_INSTRUMENTS[name];
  const label=name==='ukulele'?'Ukulele':'Guitar';
  const owners=useRef(new Map());
  const selection=useRef(null);
  const surface=useRef(null);
  const [manual,setManual]=useState(null);
  const [played,setPlayed]=useState(null);
  const buttons=profile.chords;
  const selected=manual?.root===root&&manual?.instrument===name&&buttons.some(value=>value.name===manual.chord)?manual.chord:null;
  const candidate=cue?(cue.chord?cue:guitarEvent(root,cue,name)):null;
  const demo=candidate&&buttons.some(value=>value.name===candidate.chord)?candidate:null;
  const shown=selected??demo?.chord;
  const chord=buttons.find(value=>value.name===shown);
  const notes=chord?.notes??tuning;
  const notesRef=useRef(notes);notesRef.current=notes;
  useEffect(()=>{owners.current.clear();selection.current=null;setManual(null);setPlayed(null);},[root,name]);
  function choose(token,chordName) {
    if(chordName)owners.current.set(token,chordName);else owners.current.delete(token);
    const active=[...owners.current.values()].at(-1)??null;
    selection.current={root,instrument:name,chord:active};
    setManual(selection.current);
    setPlayed(null);
    const shape=buttons.find(value=>value.name===(active??demo?.chord));
    notesRef.current=shape?.notes??tuning;
  }
  function pluck(string) {
    const current=selection.current;
    const held=current?.root===root&&current?.instrument===name?buttons.find(value=>value.name===current.chord):null;
    const note=(held?.notes??notesRef.current)[string];
    if(note) {
      audio.manualStrike(note,`string-${string}`,.7);
      setPlayed({root,instrument:name,string,fret:(held??chord)?.frets[string]??0});
    }
  }
  const position=fret=>fret===0?0:(fretPosition(fret-1,fretCount)+fretPosition(fret,fretCount))*50;
  const playedHere=played?.root===root&&played?.instrument===name?played:null;
  useSwipeNotes(surface,value=>pluck(Number(value)));
  return <div className={`manual-guitar guitar-fretboard-layout strings-layout strings-${name}`} style={{'--string-count':tuning.length}}>
    <div ref={surface} className="guitar-stringboard" role="group" aria-label={`${label} strings`} onPointerDown={event=>event.preventDefault()}>
      <div className="guitar-neck" aria-hidden="true">
        {Array.from({length:fretCount+1},(_,fret)=><i className={`fret-line ${fret===0?'nut':''}`} key={fret} style={{left:`${fretPosition(fret,fretCount)*100}%`}}/>)}
        {[3,5,7,9,12,15,17,19,21].filter(fret=>fret<=fretCount).map(fret=><i className="neck-inlay" key={fret} style={{left:`${position(fret)}%`}}/>)}
      </div>
      <div className="guitar-soundhole" aria-hidden="true"/>
      {notes.map((note,string)=><button key={string} data-swipe-note={string} className="playable-string" aria-label={`${label} string ${string+1} ${note}`} style={{'--string-weight':`${3-string*.3}px`}} onKeyDown={event=>{if(!event.repeat&&[' ','Enter'].includes(event.key)){event.preventDefault();flashInput(event.currentTarget);pluck(string);}}}><i/></button>)}
      <div className={`guitar-chords neck-chord-controls ${options.fingeringCharts?'with-charts':''}`} role="group" aria-label="Chords in the current key">
        {buttons.map(value=><PressControl key={value.name} label={`Hold ${name} chord ${value.name}`} className={`chord-control ${shown===value.name?'playing-chord':''}`} onPress={token=>choose(token,value.name)} onRelease={token=>choose(token,null)}><span className="chord-name">{value.name}</span>{options.fingeringCharts&&<ChordDiagram chord={value}/>}</PressControl>)}
      </div>
      <div className="guitar-fingering-overlay" aria-hidden="true">
        {(chord?.frets??tuning.map(()=>0)).map((fret,string)=><i className={`fingering-dot ${fret===0?'open-string-dot':''}`} key={string} data-string={string+1} data-fret={fret} style={{left:`${position(fret)}%`,top:`${(string+.5)/tuning.length*100}%`}}/>)}
        {shown&&<span className="neck-chord-name">{shown}</span>}
        {!selected&&demo?.fingering?.map((input,index)=><i className="phrase-note-dot" key={`${input.string}-${index}`} data-string={input.string+1} data-fret={input.fret} style={{left:`${position(input.fret)}%`,top:`${(input.string+.5)/tuning.length*100}%`}}/>)}
        {playedHere&&<i className="phrase-note-dot manual-note-dot" data-string={playedHere.string+1} data-fret={playedHere.fret} style={{left:`${position(playedHere.fret)}%`,top:`${(playedHere.string+.5)/tuning.length*100}%`}}/>}
      </div>
    </div>
  </div>;
}