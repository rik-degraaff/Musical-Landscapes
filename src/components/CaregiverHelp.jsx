import React,{useRef} from 'react';
import {CircleHelp,Music} from 'lucide-react';
import {CaregiverDialog} from './CaregiverDialog';
import {caregiverHelp} from '../utils/caregiverHelp';
import {INSTRUMENTS} from '../utils/music';

export function HelpButton({onOpen,className=''}) {
  const previous=useRef(null);
  function activate(event) {
    if(event.detail===0){previous.current=null;onOpen();return;}
    const now=performance.now();
    if(previous.current!==null&&now-previous.current<=450){previous.current=null;onOpen();}
    else previous.current=now;
  }
  return <button className={`caregiver-help-button ${className}`} aria-label="Open caregiver help" title="Double-tap for caregiver help" onClick={activate} onBlur={()=>{previous.current=null;}}><CircleHelp size={23}/></button>;
}

export function GuideTopic({topic,familiarity,heading=true}) {
  const content=caregiverHelp(topic,familiarity);
  return <section>{heading&&<h3>{content.title}</h3>}<ul className="parent-feature-list">{content.items.map(([label,text])=><li key={label}><Music/><span><strong>{label}</strong> {text}</span></li>)}</ul><p className="parent-guide-note">{content.note}</p></section>;
}

const PLAYING_HELP={
  piano:'Press or hold the piano keys. The orange keys show the part currently sounding.',
  marimba:'Tap or hold the bars. Orange highlights show the notes to follow.',
  drums:'Tap the pads to play individual drum sounds. Copy a short rhythm, then trade turns.',
  guitar:'Choose a chord on the neck, then swipe across the strings on the soundhole side to strum. Orange markers show the sounding finger positions.',
  ukulele:'Choose a chord on the neck, then swipe across the strings on the soundhole side to strum. Orange rings mark open strings.',
  panflute:'Tap or slide across the pipes. Hold a pipe to sustain its note.',
  flute:'Hold the highlighted physical keys together. Move the headjoint register control higher or lower to change octaves; unsupported key combinations are silent.',
  melody:'Hold the embouchure area to blow, slide left or right to change lip register, and hold the valves to change the note. Release the embouchure to stop.'
};

export function CaregiverHelp({topic,familiarity,instrument,onClose}) {
  return <CaregiverDialog title="Caregiver help" onClose={onClose} footer={<button onClick={onClose}>Back to {topic==='menu'?'main menu':topic==='practice'?'practice':topic==='settings'?'Settings':'play'}</button>}>
    <GuideTopic topic={topic} familiarity={familiarity}/>
    {instrument&&PLAYING_HELP[instrument]&&<section><h4>{INSTRUMENTS[instrument].label}</h4><p>{PLAYING_HELP[instrument]}</p></section>}
  </CaregiverDialog>;
}