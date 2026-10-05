import React, {useEffect,useRef,useState} from 'react';
import {FLUTE_KEYS,fluteNote,fluteInput,lipPosition} from '../utils/wind';
import {TRUMPET_REGISTERS,trumpetNote} from '../utils/performance';
import {trumpetInput} from '../utils/autoplay';

export function Flute({audio,cue,PressControl,options}) {
  const owners=useRef(new Map());
  const registerRef=useRef(0);
  const [register,setRegister]=useState(0);
  const [pitch,setPitch]=useState(null);
  const demo=cue?.note?fluteInput(cue.note):null;
  useEffect(()=>{if(demo){registerRef.current=demo.register;setRegister(demo.register);}},[cue]);
  function update() {
    const held=[...owners.current].filter(([,tokens])=>tokens.size).map(([key])=>key);
    const note=fluteNote(held,registerRef.current);
    setPitch(note);
    if(note&&held.length)audio.manualNoteOn(note,'flute-keys',.6);
    else audio.manualNoteOff('flute-keys');
  }
  function change(key,token,down) {
    if(!owners.current.has(key))owners.current.set(key,new Set());
    if(down)owners.current.get(key).add(token);else owners.current.get(key).delete(token);
    update();
  }
  return <div className="boehm-flute">
    <div className="flute-register" role="group" aria-label="Flute air register">{['Low','Middle','High'].map((label,index)=><button key={label} aria-pressed={register===index} onClick={()=>{registerRef.current=index;setRegister(index);update();}}>{label}</button>)}<output hidden={!options.playbackNotes} aria-label="Flute pitch">{cue?.note??pitch??'—'}</output></div>
    <div className="flute-mechanism" role="group" aria-label="Boehm flute keys">
      <div className="flute-tube-art" aria-hidden="true"/>
      {FLUTE_KEYS.map(([key,label])=><PressControl key={key} label={`Flute key ${label}`} className={`flute-physical-key flute-key-${key}`} demoPressed={Boolean(demo?.keys.includes(key))} onPress={token=>change(key,token,true)} onRelease={token=>change(key,token,false)}><span hidden={!options.noteLabels}>{label}</span><i aria-hidden="true"/></PressControl>)}
    </div>
  </div>;
}

export function Trumpet({audio,cue,PressControl,options}) {
  const valves=useRef([new Set(),new Set(),new Set()]);
  const lips=useRef(new Map());
  const partialRef=useRef(0);
  const centsRef=useRef(0);
  const [fingering,setFingering]=useState([false,false,false]);
  const [position,setPosition]=useState(.5/TRUMPET_REGISTERS.length);
  const [blowing,setBlowing]=useState(false);
  const demo=cue?.note?trumpetInput(cue.note):null;
  function update() {
    const held=valves.current.map(tokens=>tokens.size>0);setFingering(held);
    if(lips.current.size){
      audio.manualNoteOn(trumpetNote(held,partialRef.current),'trumpet-lips',.6,audio.manualVoices.has('trumpet-lips'));
      audio.setManualPitchBend('trumpet-lips',centsRef.current);
    }else audio.manualNoteOff('trumpet-lips');
  }
  function move(event) {
    const bounds=event.currentTarget.getBoundingClientRect();
    const value=Math.max(0,Math.min(1,(event.clientX-bounds.left)/bounds.width));
    const lip=lipPosition(value,TRUMPET_REGISTERS.length);
    lips.current.set(event.pointerId,value);
    partialRef.current=lip.partial;centsRef.current=lip.cents;setPosition(value);update();
  }
  function release(event) {
    if(!lips.current.delete(event.pointerId))return;
    const latest=[...lips.current.values()].at(-1);
    if(latest!==undefined){const lip=lipPosition(latest,TRUMPET_REGISTERS.length);partialRef.current=lip.partial;centsRef.current=lip.cents;setPosition(latest);}
    setBlowing(lips.current.size>0);update();
  }
  const shown=demo?(demo.partial+.5)/TRUMPET_REGISTERS.length:position;
  return <div className="manual-trumpet">
    <svg className="trumpet-body-art" viewBox="0 0 900 190" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="lip-brass" x2="0" y2="1"><stop stopColor="#fff2a5"/><stop offset=".5" stopColor="#dfb550"/><stop offset="1" stopColor="#a87e32"/></linearGradient></defs><path d="M58 110H620q65 0 120-63v117q-55-43-120-43H58Z" fill="url(#lip-brass)" stroke="#a37c34" strokeWidth="5"/><ellipse cx="740" cy="105" rx="30" ry="61" fill="#7d6136" stroke="#f4d775" strokeWidth="9"/><path d="M250 110v48h350q40 0 40-38" stroke="#e9c76e" strokeWidth="17" fill="none"/></svg>
    <div className="trumpet-valve-controls">{[0,1,2].map(index=><PressControl key={index} label={`Trumpet valve ${index+1}`} className="valve-control" demoPressed={Boolean(demo?.valves[index])} onPress={token=>{valves.current[index].add(token);update();}} onRelease={token=>{valves.current[index].delete(token);update();}}><span>{index+1}</span><i/></PressControl>)}</div>
    <div className={`trumpet-embouchure ${demo||blowing?'is-blowing':''}`} role="slider" tabIndex={0} aria-label="Trumpet embouchure" aria-valuemin={0} aria-valuemax={TRUMPET_REGISTERS.length-1} aria-valuenow={demo?.partial??partialRef.current} aria-valuetext={TRUMPET_REGISTERS[demo?.partial??partialRef.current]}
      onPointerDown={event=>{if(event.button!==0)return;event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);lips.current.set(event.pointerId,position);setBlowing(true);move(event);}}
      onPointerMove={event=>{if(lips.current.has(event.pointerId))move(event);}}
      onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}
      onKeyDown={event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();partialRef.current=Math.max(0,Math.min(TRUMPET_REGISTERS.length-1,partialRef.current+(event.key==='ArrowRight'?1:-1)));centsRef.current=0;setPosition((partialRef.current+.5)/TRUMPET_REGISTERS.length);update();}if(!event.repeat&&[' ','Enter'].includes(event.key)){event.preventDefault();lips.current.set('keyboard',position);setBlowing(true);update();}}}
      onKeyUp={event=>{if([' ','Enter'].includes(event.key)){event.preventDefault();lips.current.delete('keyboard');setBlowing(lips.current.size>0);update();}}}
      onBlur={()=>{lips.current.delete('keyboard');setBlowing(lips.current.size>0);update();}}>
      {TRUMPET_REGISTERS.map(note=><span className="lip-segment" key={note}>{options.noteLabels?note:''}</span>)}
      {(demo||blowing)&&<i className={`lip-indicator ${demo?'is-demo':''}`} style={{left:`${Math.max(2,Math.min(98,shown*100))}%`}} aria-label="Lip position"/>}
    </div>
    <output className="trumpet-pitch" hidden={!options.playbackNotes}>{cue?.note??trumpetNote(fingering,partialRef.current)}</output>
  </div>;
}