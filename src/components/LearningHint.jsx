import React,{useState} from 'react';
import {Lightbulb} from 'lucide-react';
import {CaregiverDialog} from './CaregiverDialog';
import {GestureDemo} from './GestureDemo';
import {INSTRUMENTS} from '../utils/music';

export function LearningBeacon({hint,onOpen}) {
  return <button key={hint.id} className="learning-beacon" aria-label={`Learn something new: ${hint.title}`} onClick={onOpen}><Lightbulb size={21}/><span>Something to try</span></button>;
}

export function LearningHint({hint,instruments,onEquip,onPractice,onClose}) {
  const [instrument,setInstrument]=useState(instruments[0]);
  const target=hint.id==='practice'?'avatar':hint.id==='weather'?'weather':hint.id==='landscape'?'sun':'instrument';
  return <CaregiverDialog title={hint.title} onClose={onClose} footer={<button onClick={onClose}>Back to play</button>}>
    <p>{hint.text}</p>
    <GestureDemo gesture={hint.gesture} target={target} instrument={instrument}/>
    {hint.id==='equip'&&<div className="learning-actions"><label>Instrument <select aria-label="Instrument to play yourself" value={instrument} onChange={event=>setInstrument(event.target.value)}>{instruments.map(id=><option key={id} value={id}>{INSTRUMENTS[id].label}</option>)}</select></label><button className="learning-action" onClick={()=>{onClose();onEquip(instrument);}}>Play it yourself</button></div>}
    {hint.id==='practice'&&<button className="learning-action" onClick={()=>{onClose();onPractice();}}>Open practice</button>}
    <p className="parent-guide-note">You can replay this hint from Settings → Caregiver. There is no need to try it now.</p>
  </CaregiverDialog>;
}

export function PlayActions({instruments,onEquip,onPractice}) {
  const [instrument,setInstrument]=useState(instruments[0]);
  return <section><h3>Try it from here</h3><div className="learning-actions"><label>Instrument <select aria-label="Instrument to play yourself" value={instrument} onChange={event=>setInstrument(event.target.value)}>{instruments.map(id=><option key={id} value={id}>{INSTRUMENTS[id].label}</option>)}</select></label><button className="learning-action" onClick={()=>onEquip(instrument)}>Play it yourself</button><button className="learning-action" onClick={onPractice}>Open practice</button></div><p>These buttons offer another way to equip an instrument or visit practice.</p></section>;
}
