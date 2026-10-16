import React from 'react';
import {BookOpen,CircleHelp} from 'lucide-react';
import {CaregiverDialog} from './CaregiverDialog';
import {contextualHelp,instrumentHelp} from '../utils/caregiverHelp';
import {GUIDES} from '../utils/learning';
import {INSTRUMENTS} from '../utils/music';
import {GestureDemo} from './GestureDemo';
import {GuideIllustration} from './GuideIllustration';
import {PlayActions} from './LearningHint';
import './guides.css';

export function HelpButton({onOpen,className=''}) {
  return <button className={`caregiver-help-button ${className}`} aria-label="Open caregiver help" title="Help for this screen" onClick={onOpen}><CircleHelp size={23}/></button>;
}

export function GuideTopic({topic,familiarity,heading=true,child,practiceStage,illustrate=false}) {
  const content=contextualHelp(topic,familiarity,practiceStage);
  return <section className={`help-topic ${illustrate?'guide-task':''}`}>
    <div className="guide-task-copy">{heading&&<h3>{content.title}</h3>}{content.paragraphs.map(text=><p key={text}>{text}</p>)}{content.note&&<p>{content.note}</p>}</div>
    {illustrate&&<GuideIllustration {...content.illustration} child={child}/>}
  </section>;
}

export function CaregiverHelp({topic,familiarity,instrument,child,practiceStage,onClose,onGuides,instruments,onEquip,onPractice}) {
  const playing=topic==='instruments'?instrumentHelp(instrument,familiarity):null;
  const content=contextualHelp(topic,familiarity,practiceStage);
  const guide=GUIDES.find(value=>value.id===(playing?'instruments':content.guide));
  const openGuide=id=>{onClose();onGuides(id);};
  return <CaregiverDialog title="Caregiver help" onClose={onClose} footer={<button onClick={onClose}>Back to {topic==='menu'?'main menu':topic==='practice'?'practice':topic==='settings'?'Settings':'play'}</button>}>
    {playing?<section className="guide-task instrument-help">
      <div className="guide-task-copy"><h3>Play the {INSTRUMENTS[instrument].label.toLowerCase()}</h3><p>{playing.action}</p><p>{playing.note}</p></div>
      <GestureDemo instrument={instrument} child={child} gesture={['guitar','ukulele','panflute'].includes(instrument)?'swipe':['flute','melody'].includes(instrument)?'hold':'tap'}/>
    </section>:<GuideTopic topic={topic} familiarity={familiarity} child={child} practiceStage={practiceStage} illustrate/>}
    {['instruments','landscape'].includes(topic)&&instruments?.length>0&&onEquip&&onPractice&&<PlayActions instruments={instruments} onEquip={onEquip} onPractice={onPractice}/>}
    {onGuides&&<nav className="help-guide-links" aria-label="More caregiver help">
      {guide&&<button className="learning-action" onClick={()=>openGuide(guide.id)}><BookOpen size={17}/>Read: {guide.title}</button>}
      <button className="learning-action" onClick={()=>openGuide('index')}>All guides</button>
    </nav>}
  </CaregiverDialog>;
}
