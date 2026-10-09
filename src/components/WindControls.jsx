import React, {useEffect,useRef,useState} from 'react';
import {FLUTE_KEYS,fluteNote,fluteInput,lipPosition} from '../utils/wind';
import {TRUMPET_REGISTERS,trumpetNote} from '../utils/performance';
import {trumpetInput} from '../utils/autoplay';
import {useInputReset} from './useInputReset';

export function Flute({audio,cue,profile,PressControl,options}) {
  const registerCount=profile.fluteRegisters;
  const owners=useRef(new Map());
  const registerRef=useRef(0);
  const registerPointer=useRef(null);
  const [register,setRegister]=useState(0);
  const [pitch,setPitch]=useState(null);
  const candidate=cue?.note?fluteInput(cue.note):null;
  const demo=candidate?.register<registerCount?candidate:null;
  useInputReset(()=>{owners.current.clear();registerPointer.current=null;setPitch(null);audio.manualNoteOff('flute-keys',true);});
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
  function selectRegister(value) {
    registerRef.current=Math.max(0,Math.min(registerCount-1,value));setRegister(registerRef.current);update();
  }
  function moveRegister(event) {
    const bounds=event.currentTarget.getBoundingClientRect();
    selectRegister(registerCount-1-Math.min(registerCount-1,Math.max(0,Math.floor((event.clientY-bounds.top)/bounds.height*registerCount))));
  }
  function releaseRegister(event) {if(registerPointer.current===event.pointerId)registerPointer.current=null;}
  return <div className="boehm-flute">
    <div className="flute-mechanism" role="group" aria-label="Boehm flute keys">
      <div className="flute-tube-art" aria-hidden="true"/>
      <div className={`flute-headjoint ${demo?'is-demo':''}`} style={{'--register-count':registerCount}} role="slider" tabIndex={0} aria-label="Flute pitch register" aria-orientation="vertical" aria-valuemin={0} aria-valuemax={registerCount-1} aria-valuenow={register} aria-valuetext={['Low','Middle','High'][register]} title="Pitch register: slide up for higher notes"
        onPointerDown={event=>{if(event.button!==0||registerPointer.current!==null)return;event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);registerPointer.current=event.pointerId;moveRegister(event);}}
        onPointerMove={event=>{if(registerPointer.current===event.pointerId)moveRegister(event);}}
        onPointerUp={releaseRegister} onPointerCancel={releaseRegister} onLostPointerCapture={releaseRegister}
        onKeyDown={event=>{if(['ArrowUp','ArrowDown','Home','End'].includes(event.key)){event.preventDefault();selectRegister(event.key==='Home'?0:event.key==='End'?registerCount-1:registerRef.current+(event.key==='ArrowUp'?1:-1));}}}>
        {Array.from({length:registerCount},(_,index)=>registerCount-1-index).map(value=><span className={`flute-register-level ${register===value?'is-selected':''}`} key={value} aria-hidden="true"><i/>{options.noteLabels&&<small>{['Low','Middle','High'][value]}</small>}</span>)}
        <i className="flute-air-position" style={{top:`${(registerCount-1-register+.5)/registerCount*100}%`}} aria-hidden="true"/>
      </div>
      <div className="flute-key-rod" aria-hidden="true"/>
      <div className="flute-footjoint" aria-hidden="true"/>
      {FLUTE_KEYS.map(([key,label])=><PressControl key={key} label={`Flute key ${label}`} className={`flute-physical-key flute-key-${key}`} demoPressed={Boolean(demo?.keys.includes(key))} onPress={token=>change(key,token,true)} onRelease={token=>change(key,token,false)}><span hidden={!options.noteLabels}>{label}</span><i aria-hidden="true"/></PressControl>)}
      <output className="flute-pitch" hidden={!options.playbackNotes} aria-label="Flute pitch">{cue?.note??pitch??'—'}</output>
    </div>
  </div>;
}

export function Trumpet({audio,cue,profile,PressControl,options}) {
  const registers=TRUMPET_REGISTERS.slice(0,profile.registers);
  const valves=useRef([new Set(),new Set(),new Set()]);
  const lips=useRef(new Map());
  const partialRef=useRef(0);
  const centsRef=useRef(0);
  const [fingering,setFingering]=useState([false,false,false]);
  const [position,setPosition]=useState(.5/registers.length);
  const [blowing,setBlowing]=useState(false);
  const candidate=cue?.note?trumpetInput(cue.note):null;
  const demo=candidate?.partial<registers.length?candidate:null;
  useInputReset(()=>{
    lips.current.clear();valves.current.forEach(held=>held.clear());
    setBlowing(false);setFingering([false,false,false]);audio.manualNoteOff('trumpet-lips',true);
  });
  const releaseRef=useRef(null);
  releaseRef.current=release;
  useEffect(()=>{
    const end=event=>releaseRef.current(event);
    const lostMouse=event=>{if(event.pointerType==='mouse'&&event.buttons===0)end(event);};
    window.addEventListener('pointerup',end,true);
    window.addEventListener('pointercancel',end,true);
    window.addEventListener('pointermove',lostMouse,true);
    return ()=>{window.removeEventListener('pointerup',end,true);window.removeEventListener('pointercancel',end,true);window.removeEventListener('pointermove',lostMouse,true);};
  },[]);
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
    const lip=lipPosition(value,registers.length);
    lips.current.set(event.pointerId,value);
    partialRef.current=lip.partial;centsRef.current=lip.cents;setPosition(value);update();
  }
  function release(event) {
    if(!lips.current.delete(event.pointerId))return;
    const latest=[...lips.current.values()].at(-1);
    if(latest!==undefined){const lip=lipPosition(latest,registers.length);partialRef.current=lip.partial;centsRef.current=lip.cents;setPosition(latest);}
    setBlowing(lips.current.size>0);update();
  }
  const shown=demo?(demo.partial+.5)/registers.length:position;
  return <div className="manual-trumpet">
    <svg className="trumpet-body-art" viewBox="0 0 900 190" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="lip-brass" x2="0" y2="1"><stop stopColor="#fff2a5"/><stop offset=".5" stopColor="#dfb550"/><stop offset="1" stopColor="#a87e32"/></linearGradient></defs><path d="M58 110H620q65 0 120-63v117q-55-43-120-43H58Z" fill="url(#lip-brass)" stroke="#a37c34" strokeWidth="5"/><ellipse cx="740" cy="105" rx="30" ry="61" fill="#7d6136" stroke="#f4d775" strokeWidth="9"/><path d="M250 110v48h350q40 0 40-38" stroke="#e9c76e" strokeWidth="17" fill="none"/></svg>
    <div className="trumpet-valve-controls">{[0,1,2].map(index=><PressControl key={index} label={`Trumpet valve ${index+1}`} className="valve-control" demoPressed={Boolean(demo?.valves[index])} onPress={token=>{valves.current[index].add(token);update();}} onRelease={token=>{valves.current[index].delete(token);update();}}><span>{index+1}</span><i/></PressControl>)}</div>
    <div className={`trumpet-embouchure ${demo||blowing?'is-blowing':''}`} style={{'--register-count':registers.length}} role="slider" tabIndex={0} aria-label="Trumpet embouchure" aria-valuemin={0} aria-valuemax={registers.length-1} aria-valuenow={demo?.partial??partialRef.current} aria-valuetext={registers[demo?.partial??partialRef.current]}
      onPointerDown={event=>{if(event.button!==0)return;event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);lips.current.set(event.pointerId,position);setBlowing(true);move(event);}}
      onPointerMove={event=>{if(lips.current.has(event.pointerId))move(event);}}
      onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}
      onKeyDown={event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();partialRef.current=Math.max(0,Math.min(registers.length-1,partialRef.current+(event.key==='ArrowRight'?1:-1)));centsRef.current=0;setPosition((partialRef.current+.5)/registers.length);update();}if(!event.repeat&&[' ','Enter'].includes(event.key)){event.preventDefault();lips.current.set('keyboard',position);setBlowing(true);update();}}}
      onKeyUp={event=>{if([' ','Enter'].includes(event.key)){event.preventDefault();lips.current.delete('keyboard');setBlowing(lips.current.size>0);update();}}}
      onBlur={()=>{lips.current.delete('keyboard');setBlowing(lips.current.size>0);update();}}>
      {registers.map(note=><span className="lip-segment" key={note}>{options.noteLabels?note:''}</span>)}
      {(demo||blowing)&&<i className={`lip-indicator ${demo?'is-demo':''}`} style={{left:`${Math.max(2,Math.min(98,shown*100))}%`}} aria-label="Lip position"/>}
    </div>
    <output className="trumpet-pitch" hidden={!options.playbackNotes}>{cue?.note??trumpetNote(fingering,partialRef.current)}</output>
  </div>;
}