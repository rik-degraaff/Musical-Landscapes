import React,{useEffect,useRef,useState} from 'react';
import {Lightbulb} from 'lucide-react';
import {GestureHand} from './GestureHand';
import './live-coach.css';
import {INSTRUMENTS} from '../utils/music';

export function LearningBeacon({hint,onOpen}) {
  return <button key={hint.id} className="learning-beacon" aria-label={`Learn something new: ${hint.title}`} onClick={onOpen}><Lightbulb size={21}/><span>Something to try</span></button>;
}

export function LearningHint({hint,instruments,equipped,practice,suspended,onComplete,onClose}) {
  const [phase,setPhase]=useState(0),[frame,setFrame]=useState(null),[replay,setReplay]=useState(0);
  const targetRef=useRef(null);
  const sweep=useRef(null);
  const instrument=equipped||instruments[0];
  const stringed=['guitar','ukulele'].includes(instrument);
  useEffect(()=>{setPhase(0);sweep.current=null;},[equipped,suspended]);
  let step=hint.id,selector='',endSelector='',text=hint.text,gesture=hint.gesture;
  if(hint.id==='tap')selector='.instrument:not(.equipped-instrument)';
  if(hint.id==='landscape')selector='.celestial-control[data-settled="true"]';
  if(hint.id==='weather')selector='.scenery-cloud-shape';
  if(hint.id==='equip') {
    if(!equipped){step='drag';selector=`#instrument-${instrument}`;endSelector='#young-musician';}
    else {
      step=stringed&&phase===0?'chord':'play';gesture=stringed&&phase>0?'swipe':'tap';
      selector=stringed?(phase===0?'.performance-panel .chord-control':'.performance-panel .playable-string'):'.performance-panel .natural-key, .performance-panel .drum-pad, .performance-panel .panflute-pipe, .performance-panel .flute-key-Eb, .performance-panel .trumpet-embouchure';
      text=stringed?(phase===0?'Hold a chord here.':'Keep holding the chord and sweep across the strings.'):instrument==='drums'?'Tap this drum.':instrument==='marimba'?'Tap this bar.':instrument==='flute'?'Hold this key to play a note.':instrument==='melody'?'Hold the lip control to blow a note.':'Hold this key or pipe to play a note.';
    }
  }
  if(hint.id==='practice') {
    if(!practice){step='enter';selector='#young-musician';}
    else {step='ready';gesture='tap';selector='.practice-run-button';text='Tap Ready to hear the phrase. If you chose Learn, choose Listen first.';}
  }
  useEffect(()=>{
    if(suspended)return;
    let request;const began=performance.now();
    const animate=()=>{
      if(stringed&&step==='play'&&!document.querySelector('.performance-panel .chord-control[aria-pressed="true"]'))setPhase(0);
      const target=[...document.querySelectorAll(selector)].find(element=>{const box=element.getBoundingClientRect();return box.width>0&&box.height>0;})||(step==='ready'?document.querySelector('.practice-stages button'):null),end=endSelector?document.querySelector(endSelector):null;
      targetRef.current=target;
      const box=target?.getBoundingClientRect(),destination=end?.getBoundingClientRect();
      const board=stringed&&step==='play'?document.querySelector('.performance-panel .guitar-stringboard')?.getBoundingClientRect():null;
      const visible=document.visibilityState==='visible'&&document.hasFocus()&&window.innerWidth>window.innerHeight;
      if(!visible||!box||box.width===0||box.height===0){setFrame(null);}
      else {
        const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const cycle=((performance.now()-began)%3000)/3000;
        const travel=reduced?0:Math.min(1,Math.max(0,(cycle-.2)/.5));
        const x=box.left+box.width*(board?.85:.5),y=board?board.top+8:box.top+box.height/2;
        const pressed=gesture==='double-tap'?(cycle>.2&&cycle<.3)||(cycle>.4&&cycle<.5):cycle>.2&&cycle<.7;
        setFrame({x:destination?x+(destination.left+destination.width/2-x)*travel:x,y:destination?y+(destination.top+destination.height/2-y)*travel:y+(board?travel*(board.height-16):0),pressed:reduced||pressed,end:destination?{x:destination.left+destination.width/2,y:destination.top+destination.height/2}:board?{x,y:board.bottom-8}:null,start:{x,y},captionY:practice?Math.min(window.innerHeight-80,document.querySelector('.practice-control-dock')?.getBoundingClientRect().top??80):undefined,reduced});
      }
      request=requestAnimationFrame(animate);
    };request=requestAnimationFrame(animate);
    return ()=>cancelAnimationFrame(request);
  },[selector,endSelector,gesture,suspended,replay,practice,step,stringed]);
  useEffect(()=>{
    if(suspended||!['play','chord','ready'].includes(step))return;
    const performed=event=>{
      if(event.type==='keydown'&&(event.repeat||!['Enter',' '].includes(event.key)))return;
      if(event.type==='pointerdown'&&event.button!==0)return;
      if(step==='ready') {
        if(event.target.closest('.practice-run-button')?.getAttribute('aria-label')==='Start repeating')onComplete(hint.id);
        return;
      }
      if(stringed&&step==='play') {
        const held=document.querySelector('.performance-panel .chord-control[aria-pressed="true"]');
        if(!held){setPhase(0);return;}
        const string=event.target.closest('.performance-panel .playable-string');
        if(!string)return;
        if(event.type==='keydown')onComplete(hint.id);
        else sweep.current={pointer:event.pointerId,string};
        return;
      }
      if(!targetRef.current?.contains(event.target)||event.target.closest('.practice-stages'))return;
      if(step==='chord')setPhase(1);else onComplete(hint.id);
    };
    const moved=event=>{
      if(!stringed||step!=='play'||sweep.current?.pointer!==event.pointerId||!event.buttons)return;
      if(!document.querySelector('.performance-panel .chord-control[aria-pressed="true"]')){setPhase(0);sweep.current=null;return;}
      const string=document.elementFromPoint(event.clientX,event.clientY)?.closest('.performance-panel .playable-string');
      if(string&&string!==sweep.current.string){sweep.current=null;onComplete(hint.id);}
    };
    const released=event=>{if(sweep.current?.pointer===event.pointerId)sweep.current=null;};
    // Observe real input only; the demonstration never dispatches input or owns audio.
    const eventType=step==='ready'?'click':'pointerdown';
    document.addEventListener(eventType,performed,true);if(step!=='ready')document.addEventListener('keydown',performed,true);
    document.addEventListener('pointermove',moved,true);document.addEventListener('pointerup',released,true);
    return ()=>{document.removeEventListener(eventType,performed,true);document.removeEventListener('keydown',performed,true);document.removeEventListener('pointermove',moved,true);document.removeEventListener('pointerup',released,true);};
  },[hint.id,step,suspended,onComplete,stringed]);
  if(suspended)return null;
  return <div className={`live-coach ${practice?'coach-in-practice':''}`} data-hint={hint.id} data-step={step}>
    {frame&&<><div className="coach-hand" style={{left:frame.x,top:frame.y}}><GestureHand pose={frame.pressed?'pressed':'point'}/></div>{frame.reduced&&frame.end&&<svg className="coach-route" aria-hidden="true"><path d={`M${frame.start.x},${frame.start.y} L${frame.end.x},${frame.end.y}`}/><circle cx={frame.end.x} cy={frame.end.y} r="12"/></svg>}</>}
    <div className="coach-caption" style={practice?{top:frame?.captionY??80}:undefined}><p role="status">{text}</p><button onClick={()=>setReplay(value=>value+1)}>Replay gesture</button><button onClick={onClose}>Stop hint</button></div>
  </div>;
}

export function PlayActions({instruments,onEquip,onPractice}) {
  const [instrument,setInstrument]=useState(instruments[0]);
  return <section><h3>Try it from here</h3><div className="learning-actions"><label>Instrument <select aria-label="Instrument to play yourself" value={instrument} onChange={event=>setInstrument(event.target.value)}>{instruments.map(id=><option key={id} value={id}>{INSTRUMENTS[id].label}</option>)}</select></label><button className="learning-action" onClick={()=>onEquip(instrument)}>Play it yourself</button><button className="learning-action" onClick={onPractice}>Open practice</button></div><p>These buttons offer another way to equip an instrument or visit practice.</p></section>;
}
