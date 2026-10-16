import React from 'react';
import {Headphones,Footprints,Timer,Users,Play,Pause,RotateCcw,DoorOpen,ArrowRight} from 'lucide-react';
import {INSTRUMENTS} from '../utils/music';
import {PRACTICE_STAGES} from '../utils/practice';
import {InstrumentArt} from './InstrumentArt';

const stageIcons=[Headphones,Footprints,Timer,Users];

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
