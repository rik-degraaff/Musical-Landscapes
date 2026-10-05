import React,{useEffect,useRef,useState} from 'react';
import {Volume2,VolumeX} from 'lucide-react';
import {useDismissible} from './useDismissible';
import './metronome.css';

function BodyArt() {
  return <svg className="metronome-body" viewBox="0 0 100 140" aria-hidden="true"><path d="M32 6h36l25 124H7Z" fill="#9d7053" stroke="#624d40" strokeWidth="3"/><path d="M36 14h28l18 101H18Z" fill="#f0e2be" stroke="#c19b69" strokeWidth="2"/><path d="M6 126h88v10H6Z" fill="#526d58"/><circle cx="50" cy="112" r="7" fill="#526d58"/>{[28,44,60,76,92].map(y=><path key={y} d={`M43 ${y}h14`} stroke="#977c5c" strokeWidth="1"/>)}</svg>;
}

export function Metronome({audio,open,onOpen,onClose,disabled}) {
  const container=useRef(null);
  const rail=useRef(null);
  const pointer=useRef(null);
  const [tempo,setTempo]=useState(audio.tempo);
  const [sound,setSound]=useState(audio.metronomeSound);
  const [holding,setHolding]=useState(false);
  const [swing,setSwing]=useState(-1);
  useDismissible(container,open,onClose);
  const finish=()=>{pointer.current=null;setHolding(false);audio.holdTempo(false);};
  useEffect(()=>{
    let frame;
    const animate=()=>{
      setSwing(audio.tempoHeld?0:-Math.cos(Math.PI*audio.getMetronomePhase()));
      frame=requestAnimationFrame(animate);
    };
    frame=requestAnimationFrame(animate);
    const cancel=()=>{pointer.current=null;setHolding(false);audio.holdTempo(false);};
    window.addEventListener('blur',cancel);
    const hidden=()=>{if(document.hidden)cancel();};document.addEventListener('visibilitychange',hidden);
    return ()=>{cancelAnimationFrame(frame);audio.holdTempo(false);window.removeEventListener('blur',cancel);document.removeEventListener('visibilitychange',hidden);};
  },[audio]);
  useEffect(()=>{if(!open)finish();},[open]);
  function update(event) {
    const bounds=rail.current.getBoundingClientRect();
    const value=40+Math.max(0,Math.min(1,(event.clientY-bounds.top)/bounds.height))*168;
    setTempo(audio.setTempo(value));
  }
  return <div ref={container} inert={disabled} aria-hidden={disabled} className={`metronome-widget ${open?'is-open':''} ${holding?'is-held':''}`} style={{'--beat-period':`${60/tempo}s`}}>
    {!open?<button className="metronome-mini" aria-label="Open metronome" title="Metronome" onClick={onOpen}><BodyArt/><i className="mini-pendulum" style={{rotate:`${holding?0:swing*16}deg`}}/><span>{tempo}</span></button>:<section className="metronome-menu" role="dialog" aria-label="Metronome">
      <div className="metronome-mechanism"><BodyArt/><div ref={rail} className="metronome-rail" style={{rotate:`${holding?0:swing*12}deg`}}>
        <i className="metronome-needle" aria-hidden="true"/>
        <button className="metronome-weight" role="slider" aria-label="Metronome tempo weight" aria-orientation="vertical" aria-valuemin={40} aria-valuemax={208} aria-valuenow={tempo} aria-valuetext={`${tempo} beats per minute`} style={{top:`${(tempo-40)/168*100}%`}}
          onPointerDown={event=>{if(event.button!==0||pointer.current!==null)return;event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);pointer.current=event.pointerId;setHolding(true);audio.holdTempo(true);}}
          onPointerMove={event=>{if(pointer.current===event.pointerId)update(event);}}
          onPointerUp={event=>{if(pointer.current===event.pointerId)finish();}} onPointerCancel={event=>{if(pointer.current===event.pointerId)finish();}} onLostPointerCapture={event=>{if(pointer.current===event.pointerId)finish();}}
          onKeyDown={event=>{if(['ArrowUp','ArrowDown','Home','End'].includes(event.key)){event.preventDefault();audio.holdTempo(true);setHolding(true);setTempo(audio.setTempo(event.key==='Home'?40:event.key==='End'?208:audio.tempo+(event.key==='ArrowDown'?1:-1)));}}}
          onKeyUp={event=>{if(['ArrowUp','ArrowDown','Home','End'].includes(event.key))finish();}} onBlur={finish}><span aria-hidden="true"/></button>
      </div></div>
      <output className="metronome-tempo" aria-label="Tempo">{tempo} BPM</output>
      <button className="metronome-sound" role="switch" aria-label="Metronome sound" aria-checked={sound} title="Metronome sound" onClick={()=>{audio.setMetronomeSound(!sound);setSound(!sound);}}>{sound?<Volume2 size={16}/>:<VolumeX size={16}/>}<span className="metronome-switch-track" aria-hidden="true"><i/></span></button>
    </section>}
  </div>;
}