import React,{useRef} from 'react';
import {CircleHelp,Music} from 'lucide-react';
import {CaregiverDialog} from './CaregiverDialog';
import {caregiverHelp,discoveryHelp,instrumentHelp} from '../utils/caregiverHelp';
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

export function CaregiverHelp({topic,familiarity,instrument,discovery,onClose}) {
  const playing=instrumentHelp(instrument,familiarity);
  const discover=discovery?discoveryHelp(discovery,familiarity):[];
  return <CaregiverDialog title="Caregiver help" onClose={onClose} footer={<button onClick={onClose}>Back to {topic==='menu'?'main menu':topic==='practice'?'practice':topic==='settings'?'Settings':'play'}</button>}>
    {playing&&<section className="instrument-help"><h3>{INSTRUMENTS[instrument].label}</h3><p>{playing.action}</p><p className="parent-guide-note">{playing.note}</p></section>}
    {discover.length>0&&<section className="discovery-help"><h3>Explore together</h3><ul className="parent-feature-list">{discover.map(([label,text])=><li key={label}><Music/><span><strong>{label}</strong> {text}</span></li>)}</ul></section>}
    <GuideTopic topic={topic} familiarity={familiarity}/>
  </CaregiverDialog>;
}