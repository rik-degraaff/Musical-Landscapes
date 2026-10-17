import React from 'react';
import {Headphones,Footprints,Timer,Users,Play,Pause,RotateCcw,DoorOpen,ArrowRight,Music,Check,CircleAlert} from 'lucide-react';
import {INSTRUMENTS} from '../utils/music';
import {PRACTICE_STAGES} from '../utils/practice';
import {InstrumentArt} from './InstrumentArt';

const stageIcons=[Headphones,Footprints,Timer,Users];

export function PracticeReadout({target,feedback,children}) {
  const Icon=feedback.tone==='correct'?Check:feedback.tone==='wrong'?CircleAlert:Music;
  return <div className="practice-guide"><div className="practice-target"><strong>{target}</strong></div><div key={`${feedback.tone}:${feedback.text}`} className="practice-feedback-display" data-tone={feedback.tone} role="status" aria-live="polite"><Icon size={feedback.tone==='pending'?24:28}/><strong>{feedback.text}</strong></div>{children}</div>;
}

export function PracticePhraseTrack({events,current=-1,completed=0,results=[]}) {
  return <div className="practice-phrase-track" aria-label="Phrase actions">{events.map((value,index)=><span key={index} className={`${index<completed||results[index]==='correct'?'is-complete':''} ${index===current?'is-current':''} ${results[index]==='missed'?'is-missed':''}`}>{(value.notes??[value.note]).join('+')}</span>)}</div>;
}

export function PracticeDuration({remaining=0}) {
  return <div className="practice-duration-track" role="progressbar" aria-label="Note hold duration" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(remaining*100)}><i/></div>;
}

export function PracticeStageTabs({stage,onChange}) {
  return <nav className="practice-stages" aria-label="Practice stages">{PRACTICE_STAGES.map((label,index)=>{const Icon=stageIcons[index];return <button key={label} aria-pressed={stage===index} onClick={()=>onChange(index)}><Icon size={18}/>{index+1}. {label}</button>;})}</nav>;
}

export function PracticeSelectors({name,onInstrument,phraseIndex,onPhrase,phrases}) {
  return <>
    <label className="practice-select"><span className="practice-instrument-tools" aria-hidden="true"><InstrumentArt type={name}/></span><select aria-label="Practice instrument" value={name} onChange={event=>onInstrument(event.target.value)}>{Object.entries(INSTRUMENTS).map(([id,instrument])=><option key={id} value={id}>{instrument.label}</option>)}</select></label>
    <label className="practice-select"><select aria-label="Practice phrase" value={Math.min(phraseIndex,phrases.length-1)} onChange={event=>onPhrase(Number(event.target.value))}>{phrases.map((value,index)=><option key={index} value={index}>{value.role?`${value.name[0].toUpperCase()}${value.name.slice(1)} · ${value.role} · ${value.chord}`:`Phrase ${index+1}`} · {value.events.length} actions</option>)}</select></label>
  </>;
}

export function PracticeProgress({beat,progress,max,summary}) {
  return <div className="practice-tools"><div className="practice-progress"><progress aria-label="Practice progress" max={max} value={progress}/>{summary&&<span className="practice-score">{summary.hits}/{summary.total} · {summary.percent}%</span>}</div><div className="practice-beat-strip" aria-label="Beat">{[0,1,2,3].map(value=><i key={value} className={beat===value?'is-current':''}/>)}</div></div>;
}

export function PracticeTransport({stage,running,summary,complete,onToggle,onRestart,onNext}) {
  return <div className="practice-control-dock">{stage!==1&&<button className="practice-run-button" aria-label={running?'Stop practice':'Start repeating'} onClick={onToggle}>{running?<Pause size={18}/>:<Play size={18}/>}<span>{running?'Stop':summary?'Repeat':'Ready'}</span></button>}<button className="practice-restart-button" aria-label="Restart practice" title="Restart practice" onClick={onRestart}><RotateCcw size={17}/><span>Restart</span></button><button className="practice-next-button" aria-label={stage===3?'Finish practice':'Next practice step'} disabled={!complete} onClick={onNext}><span>{stage===3?'Finish':'Next'}</span><ArrowRight size={17}/></button></div>;
}

export function PracticeExit({onClose}) {
  return <button className="practice-exit" aria-label="Leave practice through the open door" title="Leave practice" onClick={onClose}><DoorOpen size={26}/><span>Leave</span></button>;
}
