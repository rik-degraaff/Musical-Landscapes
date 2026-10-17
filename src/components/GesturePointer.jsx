import React,{useEffect,useState} from 'react';
import {GestureHand} from './GestureHand';
import {gestureFrame} from '../utils/gestures';

/** Passive visual only: never dispatches input or acquires audio. */
export function GesturePointer({frame,className='',percent=false}) {
  const unit=percent?'%':'px';
  return <div className={`gesture-pointer ${className}`} data-pressed={frame.pressed} style={{left:`${frame.x}${unit}`,top:`${frame.y}${unit}`,opacity:frame.opacity}}>
    <GestureHand pose="point" className="gesture-ready"/>
    <GestureHand pose="pressed" className="gesture-contact"/>
    {frame.burst!==null&&<svg className="gesture-burst" viewBox="-24 -24 48 48" aria-hidden="true" style={{opacity:1-frame.burst,transform:`translate(-50%,-50%) scale(${.65+frame.burst*.7})`}}>
      <circle r={5+frame.burst*7}/>{[0,60,120,180,240,300].map(angle=><path key={angle} transform={`rotate(${angle})`} d="M0-15V-20"/>)}
    </svg>}
  </div>;
}

export function useGestureTimeline({active,gesture,speed=1,iterations=2}) {
  const [elapsed,setElapsed]=useState(0),[reduced,setReduced]=useState(false);
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const changed=()=>setReduced(media.matches);changed();media.addEventListener('change',changed);
    return ()=>media.removeEventListener('change',changed);
  },[]);
  useEffect(()=>{
    setElapsed(0);
    if(!active||reduced)return;
    let request;const began=performance.now();
    const animate=()=>{
      const next=performance.now()-began;setElapsed(next);
      if(!gestureFrame({gesture,elapsed:next,speed,iterations}).finished)request=requestAnimationFrame(animate);
    };
    request=requestAnimationFrame(animate);return ()=>cancelAnimationFrame(request);
  },[active,gesture,speed,iterations,reduced]);
  return {elapsed,reduced,speed,iterations};
}
