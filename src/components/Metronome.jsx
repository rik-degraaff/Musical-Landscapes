import React,{useEffect,useRef,useState} from 'react';
import {useDismissible} from './useDismissible';
import './metronome.css';
import {MetronomeMini,MetronomeMechanism,MetronomeSoundButton} from './MetronomeArtwork';


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
    {!open?<MetronomeMini tempo={tempo} angle={holding?0:swing*16} onOpen={onOpen}/>:<section className="metronome-menu" role="dialog" aria-label="Metronome">
      <MetronomeMechanism tempo={tempo} angle={holding?0:swing*12} railRef={rail} weightProps={{
        onPointerDown:event=>{if(event.button!==0||pointer.current!==null)return;event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);pointer.current=event.pointerId;setHolding(true);audio.holdTempo(true);},
        onPointerMove:event=>{if(pointer.current===event.pointerId)update(event);},
        onPointerUp:event=>{if(pointer.current===event.pointerId)finish();},onPointerCancel:event=>{if(pointer.current===event.pointerId)finish();},onLostPointerCapture:event=>{if(pointer.current===event.pointerId)finish();},
        onKeyDown:event=>{if(['ArrowUp','ArrowDown','Home','End'].includes(event.key)){event.preventDefault();audio.holdTempo(true);setHolding(true);setTempo(audio.setTempo(event.key==='Home'?40:event.key==='End'?208:audio.tempo+(event.key==='ArrowDown'?1:-1)));}},
        onKeyUp:event=>{if(['ArrowUp','ArrowDown','Home','End'].includes(event.key))finish();},onBlur:finish
      }}/>
      <output className="metronome-tempo" aria-label="Tempo">{tempo} BPM</output>
      <MetronomeSoundButton sound={sound} onClick={()=>{audio.setMetronomeSound(!sound);setSound(!sound);}}/>
    </section>}
  </div>;
}