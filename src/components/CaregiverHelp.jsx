import React from 'react';
import {BookOpen,CircleHelp,Cloud,DoorOpen,Eye,Footprints,Hand,Headphones,Layers,Music,Pencil,Settings2,SkipForward,Sun,Timer,UserPlus,Users,Volume2} from 'lucide-react';
import {CaregiverDialog} from './CaregiverDialog';
import {caregiverHelp,discoveryHelp,instrumentHelp} from '../utils/caregiverHelp';
import {INSTRUMENTS} from '../utils/music';
import {GestureDemo} from './GestureDemo';
import {PlayActions} from './LearningHint';

export function HelpButton({onOpen,className=''}) {
  return <button className={`caregiver-help-button ${className}`} aria-label="Open caregiver help" title="Help for this screen" onClick={onOpen}><CircleHelp size={23}/></button>;
}

export function GuideTopic({topic,familiarity,heading=true}) {
  const content=caregiverHelp(topic,familiarity);
  const icons={menu:[UserPlus,Users,Pencil,Settings2],instruments:[Music,Hand,SkipForward],landscape:[Sun,Cloud,Timer,Settings2],practice:[DoorOpen,Headphones,Footprints,Timer,Users,DoorOpen],settings:[Layers,Eye,Volume2,BookOpen]}[topic]??[];
  return <section>{heading&&<h3>{content.title}</h3>}<ul className="parent-feature-list">{content.items.map(([label,text],index)=>{const Icon=icons[index]??BookOpen;return <li key={label}><Icon aria-hidden="true"/><span><strong>{label}</strong> {text}</span></li>;})}</ul><p className="parent-guide-note">{content.note}</p></section>;
}

export function CaregiverHelp({topic,familiarity,instrument,discovery,onClose,onGuides,instruments,onEquip,onPractice}) {
  const playing=instrumentHelp(instrument,familiarity);
  const discover=discovery?discoveryHelp(discovery,familiarity):[];
  return <CaregiverDialog title="Caregiver help" onClose={onClose} footer={<button onClick={onClose}>Back to {topic==='menu'?'main menu':topic==='practice'?'practice':topic==='settings'?'Settings':'play'}</button>}>
    {playing&&<section className="instrument-help"><h3>{INSTRUMENTS[instrument].label}</h3><p>{playing.action}</p><GestureDemo instrument={instrument} gesture={['guitar','ukulele','panflute'].includes(instrument)?'swipe':['flute','melody'].includes(instrument)?'hold':'tap'}/><p className="parent-guide-note">{playing.note}</p></section>}
    {discover.length>0&&<section className="discovery-help"><h3>Explore together</h3><ul className="parent-feature-list">{discover.map(([label,text])=><li key={label}><Music/><span><strong>{label}</strong> {text}</span></li>)}</ul></section>}
    <GuideTopic topic={topic} familiarity={familiarity}/>
    {instruments&&onEquip&&onPractice&&<PlayActions instruments={instruments} onEquip={onEquip} onPractice={onPractice}/>}
    {onGuides&&<button className="learning-action guide-index-button" onClick={()=>{onClose();onGuides('index');}}>Browse all guides</button>}
  </CaregiverDialog>;
}
