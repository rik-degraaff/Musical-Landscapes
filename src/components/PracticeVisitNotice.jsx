import React,{useRef,useState} from 'react';
import {BookOpen} from 'lucide-react';
import {CaregiverDialog} from './CaregiverDialog';
import './caregiver.css';

const ageGuidance={
  under3:'Sit together. Play one sound, then let your child touch any of the big instrument controls. You can leave after a single turn.',
  '3to4':'Tap the headphones together, point to the glowing control, and take turns copying one sound. Add a second sound when your child wants more.',
  '5to7':'Start with an echo. Let your child pick an instrument, copy a few sounds, or tap along on any of its controls. Try the band when they want to play freely.',
  '8plus':'Let your child choose a phrase or join the band. Try the metronome and a slower tempo together when they want to work on timing.',
};

export function PracticeVisitTrigger({child,inRoom=false,onOpen}) {
  const lastTap=useRef(null);
  function activate(event) {
    if(!inRoom||event.detail===0){onOpen();return;}
    const now=performance.now();
    const previous=lastTap.current;
    if(previous&&now-previous.time<=450&&Math.hypot(previous.x-event.clientX,previous.y-event.clientY)<28){
      lastTap.current=null;
      onOpen();
      return;
    }
    lastTap.current={time:now,x:event.clientX,y:event.clientY};
  }
  return <button type="button" className="practice-visit-trigger" aria-haspopup="dialog"
    aria-label={inRoom?'Practice guide for caregivers. Double tap me':`${child.name} found the practice room. Tap to learn more`}
    onClick={activate} onBlur={()=>{lastTap.current=null;}}>
    <BookOpen size={20} aria-hidden="true"/>
    <span>{inRoom?<strong>Double tap me</strong>:<><strong>{child.name} found Farm Practice</strong><small>Tap to learn more</small></>}</span>
  </button>;
}

export function PracticeVisitNotice({child,read,enabled,onAcknowledge,onLater,onDisable,onClose}) {
  const [choice,setChoice]=useState('');
  return <CaregiverDialog title="Farm Practice for caregivers" onClose={onClose} footer={<>
    {enabled&&<button className="practice-disable" onClick={onDisable}>Turn off practice for {child.name}</button>}
    <button onClick={onLater}>Later</button>
  </>}>
    <section className="practice-intro">
      <h3>What is Farm Practice?</h3>
      <p>It’s a quiet place to hear, copy, and play real instruments at your own pace. {child.name} can follow the highlighted sounds, echo a beat, or play along with the band. The door goes back to the farm.</p>
      <h3>Start together</h3>
      <p>{ageGuidance[child.age]??ageGuidance['5to7']}</p>
      <h3>Make it fit your child</h3>
      <p>In <strong>Settings → Instruments</strong>, choose the level, note labels, and chord details. In the room, <strong>Activities</strong> changes the game. <strong>Full practice</strong> has the phrase picker and metronome.</p>
      <p>Use <strong>Settings → Caregiver → Allow practice room</strong> to turn practice off or back on for the selected child.</p>
    </section>
    {!read&&<section className="practice-acknowledgment">
      <label>After reading, choose “Take turns” to confirm.
        <select value={choice} onChange={event=>setChoice(event.target.value)}>
          <option value="">Choose an answer</option>
          <option value="listen">Listen quietly</option>
          <option value="turns">Take turns</option>
          <option value="speed">Play faster</option>
        </select>
      </label>
      <button className="learning-action" disabled={choice!=='turns'} onClick={onAcknowledge}>I’ve read the guide</button>
    </section>}
  </CaregiverDialog>;
}
