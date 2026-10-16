import React,{useState} from 'react';
import {Cloud,Play,RotateCcw,Sun,Timer} from 'lucide-react';
import {InstrumentArt} from './InstrumentArt';
import {YoungMusicianArt} from './YoungMusician';
import './learning.css';

export function GestureHand({pose='point'}) {
  // Original SVG poses stay vector-sharp and can share the same motion paths in help and play.
  return <svg className={`gesture-hand hand-${pose}`} viewBox="0 0 80 90" aria-hidden="true">
    {pose==='grip'?<path d="M23 76 13 49q-3-9 4-11 6-2 10 8V24q0-9 7-9t7 9v13-20q0-9 7-9t7 9v22-16q0-8 6-8t6 8v24q10-8 12-2 3 7-7 19L61 79Z"/>:pose==='open'?<path d="M22 77 7 45q-3-7 3-10t12 10l3 6V19q0-8 6-8t6 8v24-31q0-8 6-8t6 8v31-25q0-8 6-8t6 8v27-17q0-8 6-8t6 8v29q0 14-13 23Z"/>:<path d="M24 78 11 54q-5-9 1-13t15 10V14q0-9 7-9t7 9v27q2-7 8-6 5 0 6 7 3-5 8-3 5 1 5 9 11-4 11 8 0 14-16 24Z"/>}
    <path className="hand-crease" d="M33 58q14-9 26 0M31 73h23"/>
  </svg>;
}

export function GestureDemo({gesture='tap',target='instrument',instrument='piano',label}) {
  const [playing,setPlaying]=useState(false);
  const [replay,setReplay]=useState(0);
  const wind=gesture==='hold'&&['flute','melody'].includes(instrument);
  const instruction=label??(wind?(instrument==='melody'?'Hold the breath area and press a valve; slide to change register':'Hold the indicated keys together; slide the headjoint control to change register'):({tap:'Tap once', 'double-tap':'Tap twice',drag:'Drag to your avatar',swipe:'Swipe across',hold:'Press and hold',tempo:'Slide up for slower, down for faster'}[gesture]));
  return <figure className="gesture-demo">
    <div key={replay} className={`gesture-stage gesture-${gesture} ${wind?'gesture-wind':''} ${playing?'is-demonstrating':''}`} aria-hidden="true">
      <div className="gesture-source">{target==='avatar'?<YoungMusicianArt/>:target==='weather'?<Cloud/>:target==='sun'?<Sun/>:target==='metronome'?<Timer/>:<InstrumentArt type={instrument}/>}</div>
      {gesture==='drag'&&<div className="gesture-destination"><YoungMusicianArt/></div>}
      {gesture==='swipe'&&<div className="gesture-strings"><i/><i/><i/><i/></div>}
      <div className="gesture-pointer"><GestureHand pose={gesture==='drag'?'grip':gesture==='hold'?'open':'point'}/><i className="gesture-tap-ring"/></div>
      {wind&&<><div className="gesture-second-pointer"><GestureHand/><i className="gesture-tap-ring"/></div><span className="gesture-register">↔ Register</span></>}
      {gesture==='drag'&&<span className="gesture-route">→</span>}
    </div>
    <figcaption>{instruction}</figcaption>
    <button type="button" onClick={()=>{setPlaying(true);setReplay(value=>value+1);}}>{playing?<RotateCcw size={16}/>:<Play size={16}/>}<span>{playing?'Replay demonstration':'Show me'}</span></button>
    <p className="gesture-static-note">The picture shows the gesture. You can try it when you return to play.</p>
  </figure>;
}
