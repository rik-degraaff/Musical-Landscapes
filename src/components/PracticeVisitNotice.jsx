import React,{useState} from 'react';
import {CaregiverDialog} from './CaregiverDialog';

export function PracticeAcknowledgment({onAcknowledge}) {
  const [choice,setChoice]=useState('');
  return <section className="practice-acknowledgment">
    <h3>I play, you answer</h3>
    <p>Make one sound, then give your child a turn. You can clap, pat your knees, or use the same instrument.</p>
    {onAcknowledge&&<>
    <p>When you’ve read this tip, choose “Take turns” and confirm.</p>
    <label>What will you try together?
      <select value={choice} onChange={event=>setChoice(event.target.value)}>
        <option value="">Choose an answer</option>
        <option value="listen">Listen quietly</option>
        <option value="turns">Take turns</option>
        <option value="speed">Play faster</option>
      </select>
    </label>
    <button className="learning-action" disabled={choice!=='turns'} onClick={onAcknowledge}>I understand</button></>}
  </section>;
}

export function PracticeVisitNotice({child,onAcknowledge,onClose,onGuide}) {
  return <CaregiverDialog title="A visit to Farm Practice" onClose={onClose} footer={<><button onClick={onGuide}>Read the practice guide</button><button onClick={onClose}>Back to menu</button></>}>
    <p>{child.name} opened the practice room. Start with one sound together, and use the open door whenever you’re ready to return to the farm.</p>
    <PracticeAcknowledgment onAcknowledge={onAcknowledge}/>
  </CaregiverDialog>;
}
