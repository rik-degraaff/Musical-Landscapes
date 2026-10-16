import React,{useState} from 'react';
import {Play,RotateCcw} from 'lucide-react';
import {GuideIllustration} from './GuideIllustration';
import './learning.css';

export {GestureHand} from './GestureHand';

export function GestureDemo({gesture='tap',target='instrument',instrument='piano',label,child}) {
  const [playing,setPlaying]=useState(false);
  const [replay,setReplay]=useState(0);
  const wind=gesture==='hold'&&['flute','melody'].includes(instrument);
  const instruction=label??(wind?(instrument==='melody'?'Hold the breath area and press a valve; slide to change register':'Keys work together; slide the headjoint control to change register'):({tap:'Tap once','double-tap':'Tap twice',drag:'Drag to your avatar',swipe:instrument==='panflute'?'Slide across the pipes':'Choose a chord, then swipe across the strings',hold:'Press and hold',tempo:'Slide up for slower, down for faster'}[gesture]));
  const kind=target==='weather'?'weather':target==='sun'?'sun':target==='metronome'?'metronome':target==='avatar'?'profile':gesture==='drag'?'equip':'surface';
  return <figure className="gesture-demo">
    <GuideIllustration key={replay} kind={kind} instrument={instrument} child={child} gesture={gesture} demonstrating={playing}/>
    <figcaption>{instruction}</figcaption>
    <button type="button" onClick={()=>{setPlaying(true);setReplay(value=>value+1);}}>{playing?<RotateCcw size={16}/>:<Play size={16}/>}<span>{playing?'Replay demonstration':'Show me'}</span></button>
    <p className="gesture-static-note">Follow the hand. Numbered marks show where a movement starts and ends. Try it when you return to play.</p>
  </figure>;
}
