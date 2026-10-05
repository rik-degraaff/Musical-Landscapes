import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpFromLine, Wind, Repeat2 } from 'lucide-react';
import { INSTRUMENTS, patterns, transposeEvents } from '../utils/music';
import { PIANO_NOTES, FLUTE_NOTES, MARIMBA_NOTES, GUITAR_CHORDS, trumpetNote } from '../utils/performance';
import './performance.css';
import { useSwipeNotes } from './useSwipeNotes';
import { flashInput } from './inputFeedback';
import { guitarInputs, keyboardRange, noteMidi, trumpetInput } from '../utils/autoplay';
import { midiNote, TRUMPET_REGISTERS } from '../utils/performance';

function PressControl({ label, className='', onPress, onRelease=()=>{}, children, style, swipeNote }) {
  const owners=useRef(new Set());
  const [pressed,setPressed]=useState(false);
  const buttonRef=useRef(null);
  function down(token) { if(owners.current.has(token))return;flashInput(buttonRef.current); owners.current.add(token);setPressed(true);onPress(token); }
  function up(token) { if(!owners.current.delete(token))return;onRelease(token);setPressed(owners.current.size>0); }
  return <button ref={buttonRef} type="button" aria-label={label} aria-pressed={pressed} data-swipe-note={swipeNote} className={`${className} ${pressed?'pressed':''}`} style={style}
    onPointerDown={event=>{if(event.button!==0)return;event.preventDefault();if(swipeNote!==undefined)return;event.currentTarget.setPointerCapture(event.pointerId);down(`pointer-${event.pointerId}`);}}
    onPointerUp={event=>up(`pointer-${event.pointerId}`)} onPointerCancel={event=>up(`pointer-${event.pointerId}`)} onLostPointerCapture={event=>up(`pointer-${event.pointerId}`)}
    onKeyDown={event=>{if(!event.repeat&&['Enter',' '].includes(event.key)){event.preventDefault();down(`key-${event.key}`);}}}
    onKeyUp={event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();up(`key-${event.key}`);}}}
    onBlur={()=>{for(const token of [...owners.current])if(token.startsWith('key-'))up(token);}}>{children}</button>;
}

function Keyboard({ audio, notes, kind, autoplay }) {
  const [range,setRange]=useState(notes);
  useEffect(()=>{
    if(autoplay) {
      const extra=transposeEvents(patterns[kind].flatMap(phrase=>phrase.events),audio.root).flatMap(event=>event.notes??[event.note]);
      setRange(previous=>keyboardRange(previous,extra));
    }
  },[autoplay,audio,audio.root,kind]);
  notes=range;
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

function Trumpet({ audio, cue }) {
  const valves=useRef([new Set(),new Set(),new Set()]);
  const breath=useRef(new Set());
  const register=useRef(0);
  const [fingering,setFingering]=useState([false,false,false]);
  const [partial,setPartial]=useState(0);
  const demo=cue?.note?trumpetInput(cue.note):null;
  useEffect(()=>{if(cue?.note){const input=trumpetInput(cue.note);if(input){register.current=input.partial;setPartial(input.partial);}}},[cue]);
  function update() {
    const pressed=valves.current.map(owners=>owners.size>0);setFingering(pressed);
    audio.manualNoteOff('trumpet-breath');
    if(breath.current.size)audio.manualNoteOn(trumpetNote(pressed,register.current),'trumpet-breath',.6);
  }
  return <div className="manual-trumpet">
    <svg className="trumpet-body-art" viewBox="0 0 900 190" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="manual-brass" x2="0" y2="1"><stop stopColor="#fff2a5"/><stop offset=".5" stopColor="#dfb550"/><stop offset="1" stopColor="#a87e32"/></linearGradient></defs><path d="M58 110H620q65 0 120-63v117q-55-43-120-43H58Z" fill="url(#manual-brass)" stroke="#a37c34" strokeWidth="5"/><ellipse cx="740" cy="105" rx="30" ry="61" fill="#7d6136" stroke="#f4d775" strokeWidth="9"/><path d="M250 110v48h350q40 0 40-38" stroke="#e9c76e" strokeWidth="17" fill="none"/><path d="M65 102H23v28h42" fill="#bdc6bf" stroke="#89958d" strokeWidth="4"/></svg>
    <div className="trumpet-register" role="group" aria-label="Trumpet register">{TRUMPET_REGISTERS.map((note,index)=><button key={note} aria-pressed={partial===index} onClick={()=>{register.current=index;setPartial(index);update();}}>{note}</button>)}</div>
    <div className="trumpet-valve-controls">{[0,1,2].map(index=><PressControl key={index} label={`Trumpet valve ${index+1}`} className="valve-control" onPress={token=>{valves.current[index].add(token);update();}} onRelease={token=>{valves.current[index].delete(token);update();}}><span>{index+1}</span><i/></PressControl>)}</div>
    <PressControl label="Blow trumpet" className="trumpet-breath" onPress={token=>{breath.current.add(token);update();}} onRelease={token=>{breath.current.delete(token);update();}}><Wind size={28}/></PressControl>
    <output className="trumpet-pitch" aria-live="polite">{cue?.note??trumpetNote(fingering,partial)}</output>
    {demo&&<output className="fingering-cue">{demo.label}</output>}
  </div>;
}

function Guitar({ audio, cue }) {
  const chordOwners=useRef(new Map());const chordRef=useRef('Open');const [chord,setChord]=useState('Open');
  const surface=useRef(null);
  const [frets,setFrets]=useState([0,0,0,0,0,0]);
  const demoNotes=cue?.notes??(cue?.note?[cue.note]:[]);
  const demoFrets=guitarInputs(demoNotes);
  useEffect(()=>{
    if(!cue)return;
    chordRef.current='Open';setChord('Open');
    const inputs=guitarInputs(cue.notes??[cue.note]);
    setFrets([0,1,2,3,4,5].map(string=>inputs.find(input=>input.string===string)?.fret??0));
  },[cue]);
  function stringNote(index) { const base=GUITAR_CHORDS[chordRef.current][index];return base?midiNote(noteMidi(base)+frets[index]):null; }
  useSwipeNotes(surface,index=>pluck(Number(index)));
  function choose(token,value) {
    if(value)chordOwners.current.set(token,value);else chordOwners.current.delete(token);
    const selected=[...chordOwners.current.values()].at(-1)??'Open';chordRef.current=selected;setChord(selected);
  }
  function pluck(index) {
    const note=stringNote(index);if(!note)return;
    audio.manualStrike(note,`string-${index}`,.7);
  }
  return <div className="manual-guitar">
    <div className="guitar-chords">{['C','G','Am','F'].map(value=><PressControl key={value} label={`Hold guitar chord ${value}`} className="chord-control" onPress={token=>choose(token,value)} onRelease={token=>choose(token,null)}>{value}</PressControl>)}<output>{chord}</output></div>
    <div ref={surface} className="guitar-stringboard" role="group" aria-label="Guitar strings" onPointerDown={event=>event.preventDefault()}>
      <div className="guitar-soundhole"/>
      {GUITAR_CHORDS[chord].map((_,index)=>{const note=stringNote(index);const demo=demoFrets.find(value=>value.string===index);return <div className="guitar-string-row" key={index}><input type="number" min="0" max="24" aria-label={`Guitar string ${index+1} fret`} value={frets[index]} onChange={event=>setFrets(values=>values.map((value,position)=>position===index?Math.max(0,Math.min(24,Number(event.target.value))):value))}/><button data-swipe-note={index} className="playable-string" aria-label={`Guitar string ${index+1}${note?` ${note}`:' muted'}`} style={{'--string-weight':`${3-index*.3}px`}} onKeyDown={event=>{if(!event.repeat&&[' ','Enter'].includes(event.key)){event.preventDefault();flashInput(event.currentTarget);pluck(index);}}}><i/><span>{demo?`${demo.note} (${demo.fret})`:note??'Mute'}</span></button></div>;})}
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
  const [autoplay,setAutoplay]=useState(()=>audio.manualAutoplay);
  const [cue,setCue]=useState(null);
  const panelRef=useRef(null);
  function stopAutoplay() { audio.setManualAutoplay(false);setAutoplay(false);setCue(null); }
  useEffect(()=>{
    audio.onManualAutoplayEvent=event=>{setCue(event);if(!event)setAutoplay(audio.manualAutoplay);};
    const cancel=event=>{
      const surface=panelRef.current?.querySelector('.performance-surface');
      if(surface?.contains(event.target)||event.target.closest?.('.equipped-instrument')) stopAutoplay();
    };
    window.addEventListener('pointerdown',cancel,true);
    window.addEventListener('keydown',cancel,true);
    return ()=>{if(audio.manualInstrument===name)audio.setManualAutoplay(false);audio.onManualAutoplayEvent=null;window.removeEventListener('pointerdown',cancel,true);window.removeEventListener('keydown',cancel,true);};
  },[audio]);
  useEffect(()=>{
    if(!panelRef.current)return;
    if(!cue){
      for(const element of panelRef.current.querySelectorAll('button'))if(element.getAnimations().some(animation=>animation.id==='autoplay-hit'))flashInput(element);
      return;
    }
    const notes=cue.notes??[cue.note];
    for(const button of panelRef.current.querySelectorAll('.note-key,.drum-pad')) {
      if(notes.some(note=>button.getAttribute('aria-label')?.endsWith(` ${note}`))||button.classList.contains(`pad-${cue.note}`))flashInput(button,['piano','flute'].includes(name)?cue.duration*1000:0,'autoplay-hit');
    }
    if(name==='melody') {
      const input=trumpetInput(cue.note);
      if(input) {
        flashInput(panelRef.current.querySelectorAll('.trumpet-register button')[input.partial],cue.duration*1000,'autoplay-hit');
        input.valves?.forEach((value,index)=>{if(value)flashInput(panelRef.current.querySelectorAll('.valve-control')[index],cue.duration*1000,'autoplay-hit');});
        flashInput(panelRef.current.querySelector('.trumpet-breath'),cue.duration*1000,'autoplay-hit');
      }
    }
    if(name==='guitar')guitarInputs(notes).forEach(input=>flashInput(panelRef.current.querySelectorAll('.playable-string')[input.string],0,'autoplay-hit'));
  },[cue,name]);
  useEffect(()=>{
    const stop=()=>{stopAutoplay();audio.stopManualVoices();};const hidden=()=>{if(document.hidden)stop();};
    window.addEventListener('blur',stop);document.addEventListener('visibilitychange',hidden);
    return ()=>{if(audio.manualInstrument===name)stop();window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',hidden);};
  },[audio]);
  return <section ref={panelRef} className={`performance-panel performance-${name}`} aria-label={`${INSTRUMENTS[name].label} play surface`}>
    <header><h2>{INSTRUMENTS[name].label}</h2><output className="autoplay-notes">{autoplay?(cue?.notes??(cue?.note?[cue.note]:[])).join(' + '):''}</output><button type="button" className="autoplay-toggle" role="switch" aria-label="Autoplay equipped instrument" aria-checked={autoplay} title="Autoplay equipped instrument" onClick={()=>{audio.setManualAutoplay(!autoplay);setAutoplay(audio.manualAutoplay);}}><Repeat2 size={18}/><span className="autoplay-switch" aria-hidden="true"/></button><button className="return-instrument" aria-label="Put instrument down" title="Put instrument down" onClick={onClose}><ArrowUpFromLine size={20}/></button></header>
    <div className="performance-surface">
      {name==='piano'&&<Keyboard audio={audio} notes={PIANO_NOTES} kind="piano" autoplay={autoplay}/>}
      {name==='flute'&&<Keyboard audio={audio} notes={FLUTE_NOTES} kind="flute" autoplay={autoplay}/>}
      {name==='marimba'&&<Keyboard audio={audio} notes={MARIMBA_NOTES} kind="marimba" autoplay={autoplay}/>}
      {name==='melody'&&<Trumpet audio={audio} cue={cue}/>}
      {name==='guitar'&&<Guitar audio={audio} cue={cue}/>}
      {name==='drums'&&<Drums audio={audio}/>}
    </div>
  </section>;
}