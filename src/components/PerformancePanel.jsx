import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpFromLine, Wind } from 'lucide-react';
import { INSTRUMENTS } from '../utils/music';
import { PIANO_NOTES, FLUTE_NOTES, MARIMBA_NOTES, GUITAR_CHORDS, trumpetNote } from '../utils/performance';
import './performance.css';
import { useSwipeNotes } from './useSwipeNotes';

function PressControl({ label, className='', onPress, onRelease=()=>{}, children, style, swipeNote }) {
  const owners=useRef(new Set());
  const [pressed,setPressed]=useState(false);
  function down(token) { if(owners.current.has(token))return; owners.current.add(token);setPressed(true);onPress(token); }
  function up(token) { if(!owners.current.delete(token))return;onRelease(token);setPressed(owners.current.size>0); }
  return <button type="button" aria-label={label} aria-pressed={pressed} data-swipe-note={swipeNote} className={`${className} ${pressed?'pressed':''}`} style={style}
    onPointerDown={event=>{if(event.button!==0)return;event.preventDefault();if(swipeNote!==undefined)return;event.currentTarget.setPointerCapture(event.pointerId);down(`pointer-${event.pointerId}`);}}
    onPointerUp={event=>up(`pointer-${event.pointerId}`)} onPointerCancel={event=>up(`pointer-${event.pointerId}`)} onLostPointerCapture={event=>up(`pointer-${event.pointerId}`)}
    onKeyDown={event=>{if(!event.repeat&&['Enter',' '].includes(event.key)){event.preventDefault();down(`key-${event.key}`);}}}
    onKeyUp={event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();up(`key-${event.key}`);}}}
    onBlur={()=>{for(const token of [...owners.current])if(token.startsWith('key-'))up(token);}}>{children}</button>;
}

function Keyboard({ audio, notes, kind }) {
  const surface=useRef(null);
  useSwipeNotes(surface,(note,token)=>kind==='marimba'?audio.manualStrike(note,`${note}-${token}`):audio.manualNoteOn(note,token),(_,token)=>{if(kind==='piano')audio.manualNoteOff(token);});
  let whiteIndex=-1;
  const whiteCount=notes.filter(note=>!note.includes('#')).length;
  return <div ref={kind==='flute'?undefined:surface} className={`manual-keyboard ${kind}`} style={{'--white-count':whiteCount}}>
    {notes.map(note=>{
      const sharp=note.includes('#');if(!sharp)whiteIndex++;
      return <PressControl key={note} swipeNote={kind==='flute'?undefined:note} label={`${kind==='marimba'?'Marimba bar':kind==='flute'?'Flute note':'Piano key'} ${note}`} className={`note-key ${sharp?'sharp-key':'natural-key'}`}
        style={sharp?{left:`${(whiteIndex+.68)/whiteCount*100}%`,width:`${.64/whiteCount*100}%`}:{gridColumn:whiteIndex+1}}
        onPress={token=>kind==='marimba'?audio.manualStrike(note,`${note}-${token}`):audio.manualNoteOn(note,`${note}-${token}`)}
        onRelease={token=>{if(kind!=='marimba')audio.manualNoteOff(`${note}-${token}`);}}><span>{note}</span>{kind==='marimba'&&<i className="bar-bolt"/>}</PressControl>;
    })}
  </div>;
}

function Trumpet({ audio }) {
  const valves=useRef([new Set(),new Set(),new Set()]);
  const breath=useRef(new Set());
  const register=useRef(0);
  const [fingering,setFingering]=useState([false,false,false]);
  const [partial,setPartial]=useState(0);
  function update() {
    const pressed=valves.current.map(owners=>owners.size>0);setFingering(pressed);
    audio.manualNoteOff('trumpet-breath');
    if(breath.current.size)audio.manualNoteOn(trumpetNote(pressed,register.current),'trumpet-breath',.6);
  }
  return <div className="manual-trumpet">
    <svg className="trumpet-body-art" viewBox="0 0 900 190" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="manual-brass" x2="0" y2="1"><stop stopColor="#fff2a5"/><stop offset=".5" stopColor="#dfb550"/><stop offset="1" stopColor="#a87e32"/></linearGradient></defs><path d="M58 110H620q65 0 120-63v117q-55-43-120-43H58Z" fill="url(#manual-brass)" stroke="#a37c34" strokeWidth="5"/><ellipse cx="740" cy="105" rx="30" ry="61" fill="#7d6136" stroke="#f4d775" strokeWidth="9"/><path d="M250 110v48h350q40 0 40-38" stroke="#e9c76e" strokeWidth="17" fill="none"/><path d="M65 102H23v28h42" fill="#bdc6bf" stroke="#89958d" strokeWidth="4"/></svg>
    <div className="trumpet-register" role="group" aria-label="Trumpet register">{['C4','G4','C5','E5','G5'].map((note,index)=><button key={note} aria-pressed={partial===index} onClick={()=>{register.current=index;setPartial(index);update();}}>{note}</button>)}</div>
    <div className="trumpet-valve-controls">{[0,1,2].map(index=><PressControl key={index} label={`Trumpet valve ${index+1}`} className="valve-control" onPress={token=>{valves.current[index].add(token);update();}} onRelease={token=>{valves.current[index].delete(token);update();}}><span>{index+1}</span><i/></PressControl>)}</div>
    <PressControl label="Blow trumpet" className="trumpet-breath" onPress={token=>{breath.current.add(token);update();}} onRelease={token=>{breath.current.delete(token);update();}}><Wind size={28}/></PressControl>
    <output className="trumpet-pitch" aria-live="polite">{trumpetNote(fingering,partial)}</output>
  </div>;
}

function Guitar({ audio }) {
  const chordOwners=useRef(new Map());const chordRef=useRef('Open');const [chord,setChord]=useState('Open');
  const surface=useRef(null);
  useSwipeNotes(surface,index=>pluck(Number(index)));
  function choose(token,value) {
    if(value)chordOwners.current.set(token,value);else chordOwners.current.delete(token);
    const selected=[...chordOwners.current.values()].at(-1)??'Open';chordRef.current=selected;setChord(selected);
  }
  function pluck(index) {
    const note=GUITAR_CHORDS[chordRef.current][index];if(!note)return;
    audio.manualStrike(note,`string-${index}`,.7);
  }
  return <div className="manual-guitar">
    <div className="guitar-chords">{['C','G','Am','F'].map(value=><PressControl key={value} label={`Hold guitar chord ${value}`} className="chord-control" onPress={token=>choose(token,value)} onRelease={token=>choose(token,null)}>{value}</PressControl>)}<output>{chord}</output></div>
    <div ref={surface} className="guitar-stringboard" role="group" aria-label="Guitar strings" onPointerDown={event=>event.preventDefault()}>
      <div className="guitar-soundhole"/>
      {GUITAR_CHORDS[chord].map((note,index)=><button key={index} data-swipe-note={index} className="playable-string" aria-label={`Guitar string ${index+1}${note?` ${note}`:' muted'}`} style={{'--string-weight':`${3-index*.3}px`}} onKeyDown={event=>{if(!event.repeat&&[' ','Enter'].includes(event.key)){event.preventDefault();pluck(index);}}}><i/><span>{note??'Mute'}</span></button>)}
    </div>
  </div>;
}

function Drums({ audio }) {
  const pads=[['hat','Hi-hat'],['crash','Crash cymbal'],['ride','Ride cymbal'],['tom','High tom'],['floorTom','Floor tom'],['rim','Rim'],['snare','Snare'],['kick','Kick drum'],['clap','Hand clap'],['shaker','Shaker']];
  return <div className="manual-drums">
    <svg className="drum-stands" viewBox="0 0 1000 230" preserveAspectRatio="none" aria-hidden="true"><g stroke="#7c9495" strokeWidth="5" fill="none"><path d="M130 45v130l-55 45m55-45l55 45M835 45v130l-55 45m55-45l55 45M340 87v75l-55 45m55-45l45 45M680 87v75l-50 45m50-45l50 45M475 156l-32 61m115-61l32 61"/></g></svg>
    {pads.map(([hit,label])=><PressControl key={hit} label={label} className={`drum-pad pad-${hit}`} onPress={token=>audio.manualNoteOn(hit,`${hit}-${token}`,hit==='hat'?.5:.7)}><span>{label}</span><b className="drum-lug one"/><b className="drum-lug two"/></PressControl>)}
  </div>;
}

export function PerformancePanel({ name, audio, onClose }) {
  useEffect(()=>{
    const stop=()=>audio.stopManualVoices();const hidden=()=>{if(document.hidden)stop();};
    window.addEventListener('blur',stop);document.addEventListener('visibilitychange',hidden);
    return ()=>{stop();window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',hidden);};
  },[audio]);
  return <section className={`performance-panel performance-${name}`} aria-label={`${INSTRUMENTS[name].label} play surface`}>
    <header><h2>{INSTRUMENTS[name].label}</h2><button className="return-instrument" aria-label="Put instrument down" title="Put instrument down" onClick={onClose}><ArrowUpFromLine size={20}/></button></header>
    <div className="performance-surface">
      {name==='piano'&&<Keyboard audio={audio} notes={PIANO_NOTES} kind="piano"/>}
      {name==='flute'&&<Keyboard audio={audio} notes={FLUTE_NOTES} kind="flute"/>}
      {name==='marimba'&&<Keyboard audio={audio} notes={MARIMBA_NOTES} kind="marimba"/>}
      {name==='melody'&&<Trumpet audio={audio}/>}
      {name==='guitar'&&<Guitar audio={audio}/>}
      {name==='drums'&&<Drums audio={audio}/>}
    </div>
  </section>;
}