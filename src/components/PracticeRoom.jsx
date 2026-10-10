import React,{useEffect,useRef,useState} from 'react';
import {Music,X,Footprints,Timer,Users,Play,Pause,RotateCcw,ArrowRight,Check,CircleAlert} from 'lucide-react';
import {INSTRUMENTS} from '../utils/music';
import {equippedProfile} from '../utils/difficulty';
import {noteMidi} from '../utils/autoplay';
import {PRACTICE_STAGES,learningSteps,createTimingAttempt,scoreTimedInput,expireSteps,attemptSummary} from '../utils/practice';
import {InstrumentSurface} from './PerformancePanel';
import {InstrumentArt} from './InstrumentArt';
import {PracticeRoomArt} from './PracticeRoomArt';
import './practice.css';

export function PracticeRoom({audio,initialInstrument,settings,root,onClose}) {
  const [name,setName]=useState(initialInstrument);
  const [phraseIndex,setPhraseIndex]=useState(0);
  const [stage,setStage]=useState(0);
  const [step,setStep]=useState(0);
  const [running,setRunning]=useState(false);
  const [complete,setComplete]=useState(false);
  const [cue,setCue]=useState(null);
  const [feedback,setFeedback]=useState({tone:'pending',text:'Ready'});
  const [beat,setBeat]=useState(-1);
  const [summary,setSummary]=useState(null);
  const [results,setResults]=useState([]);
  const state=useRef({});
  const attempt=useRef([]);
  const session=useRef(null);
  const frame=useRef(null);
  const cueTimer=useRef(null);
  const room=useRef(null);
  const options={...settings.instruments[name],noteLabels:true,playbackNotes:true,fingeringCharts:true};
  const profile=equippedProfile(name,root,options);
  const phrase=profile.phrases[Math.min(phraseIndex,profile.phrases.length-1)];
  const steps=learningSteps(phrase);
  state.current={name,stage,step,steps,phrase,running,complete};
  const target=stage===0&&!complete?steps[step]?.cue:cue;
  const matchesNote=(instrument,actual,expected)=>['guitar','ukulele'].includes(instrument)?noteMidi(actual)%12===noteMidi(expected)%12:actual===expected;

  function cancel() {
    cancelAnimationFrame(frame.current);frame.current=null;
    window.clearTimeout(cueTimer.current);
    audio.stopPracticeRun();window.dispatchEvent(new Event('farmjam-input-reset'));
    state.current.running=false;setRunning(false);setCue(null);setBeat(-1);
  }
  function reset() {
    cancel();setStep(0);state.current.step=0;setComplete(false);state.current.complete=false;setSummary(null);setResults([]);setFeedback({tone:'pending',text:'Ready'});
  }
  useEffect(()=>{
    audio.beginPractice(initialInstrument);
    const previous=document.activeElement;
    room.current?.querySelector('select')?.focus();
    return ()=>{cancelAnimationFrame(frame.current);window.clearTimeout(cueTimer.current);audio.endPractice();previous?.focus();};
  },[audio]);
  useEffect(()=>{reset();audio.switchPracticeInstrument(name);},[name,phraseIndex,stage,root,options.complexity]);
  useEffect(()=>{
    audio.onPracticeInput=({note,time})=>{
      const current=state.current;
      if(current.complete)return;
      if(current.stage===0){
        const expected=current.steps[current.step];if(!expected)return;
        if(!matchesNote(current.name,note,expected.note)){setFeedback({tone:'wrong',text:'Try again'});return;}
        const next=current.step+1;current.step=next;setStep(next);setFeedback({tone:'correct',text:'Correct!'});
        if(next===current.steps.length){current.complete=true;setComplete(true);setFeedback({tone:'correct',text:'Phrase learned!'});}
      }else if(current.running&&session.current){
        const elapsed=(time-session.current.startTime)/session.current.beatSeconds;
        const result=scoreTimedInput(attempt.current,note,elapsed,.32,(expected,actual)=>matchesNote(current.name,actual,expected));
        setFeedback({tone:result.correct?'correct':'wrong',text:result.correct?'On time!':'Try the highlighted note'});
        setResults(attempt.current.map(value=>value.missed?'missed':value.remaining.length===0?'correct':'pending'));
      }
    };
    audio.onPracticeInterrupt=()=>{cancel();setFeedback({tone:'pending',text:'Paused — restart when ready'});};
    const blur=()=>{cancel();setFeedback({tone:'pending',text:'Paused — restart when ready'});};
    window.addEventListener('blur',blur);
    return ()=>{audio.onPracticeInput=null;audio.onPracticeInterrupt=null;window.removeEventListener('blur',blur);};
  },[audio]);
  useEffect(()=>{
    const escape=event=>{
      if(event.key==='Escape'){event.preventDefault();onClose();}
      if(event.key==='Tab'){
        const controls=[...room.current.querySelectorAll('button:not(:disabled),select,[tabindex="0"]')];
        const first=controls[0],last=controls.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    };
    window.addEventListener('keydown',escape);return ()=>window.removeEventListener('keydown',escape);
  },[onClose]);
  function startAttempt() {
    reset();attempt.current=createTimingAttempt(phrase);setRunning(true);state.current.running=true;setFeedback({tone:'pending',text:'Count in'});
    session.current=audio.startPracticeRun(phrase,stage===2,event=>{
      window.clearTimeout(cueTimer.current);
      setCue(event);setFeedback({tone:'pending',text:'Your turn'});
      cueTimer.current=window.setTimeout(()=>setCue(null),Math.max(30,event.duration*1000));
    },()=>{
      cancelAnimationFrame(frame.current);setRunning(false);state.current.running=false;setCue(null);setComplete(true);state.current.complete=true;
      const score=attemptSummary(attempt.current);setSummary(score);setFeedback({tone:score.percent>=70?'correct':'pending',text:score.percent>=70?'Well played!':'Keep practicing'});
      setResults(attempt.current.map(value=>value.remaining.length===0?'correct':'missed'));
    },value=>setBeat(value));
    if(!session.current){setRunning(false);state.current.running=false;setFeedback({tone:'pending',text:'Tap Start after audio resumes'});return;}
    const tick=()=>{
      if(!state.current.running)return;
      const elapsed=(audio.practiceTime()-session.current.startTime)/session.current.beatSeconds;
      expireSteps(attempt.current,elapsed);
      setResults(attempt.current.map(value=>value.missed?'missed':value.remaining.length===0?'correct':'pending'));
      frame.current=requestAnimationFrame(tick);
    };
    frame.current=requestAnimationFrame(tick);
  }
  const stageIcons=[Footprints,Timer,Users];
  const targetNotes=target?.notes??(target?.note?[target.note]:[]);
  const progress=stage===0?Math.min(step,steps.length):attempt.current.reduce((sum,value)=>sum+value.hits,0);
  return <section ref={room} className="practice-room" role="dialog" aria-modal="true" aria-label="Farm practice room">
    <PracticeRoomArt/>
    <header className="practice-topbar"><h1 className="practice-room-title"><Music size={22}/>Farm Practice</h1>
      <label className="practice-select"><span className="practice-instrument-tools" aria-hidden="true"><InstrumentArt type={name}/></span><select aria-label="Practice instrument" value={name} onChange={event=>{cancel();setPhraseIndex(0);setName(event.target.value);}}>{Object.entries(INSTRUMENTS).map(([id,instrument])=><option key={id} value={id}>{instrument.label}</option>)}</select></label>
      <label className="practice-select"><select aria-label="Practice phrase" value={Math.min(phraseIndex,profile.phrases.length-1)} onChange={event=>{cancel();setPhraseIndex(Number(event.target.value));}}>{profile.phrases.map((value,index)=><option key={index} value={index}>Phrase {index+1} · {value.events.length} actions</option>)}</select></label>
      <button className="practice-exit" aria-label="Leave practice" title="Leave practice" onClick={onClose}><X size={24}/></button>
    </header>
    <nav className="practice-stages" aria-label="Practice stages">{PRACTICE_STAGES.map((label,index)=>{const Icon=stageIcons[index];return <button key={label} aria-pressed={stage===index} onClick={()=>{cancel();setStage(index);}}><Icon size={18}/>{index+1}. {label}</button>;})}</nav>
    <main className="practice-main">
      <div className="practice-guide"><div className="practice-target"><strong>{complete?'Finished':beat>=0&&beat<4&&stage>0?`Count ${beat+1}`:targetNotes.join(' + ')||'Ready'}</strong></div>
        <div className="practice-progress"><span className="practice-feedback" data-tone={feedback.tone} role="status">{feedback.tone==='correct'?<Check size={18}/>:feedback.tone==='wrong'?<CircleAlert size={18}/>:null}{feedback.text}</span><progress aria-label="Practice progress" max={steps.length} value={progress}/>{summary&&<span className="practice-score">{summary.hits}/{summary.total} · {summary.percent}%</span>}</div>
        <div className="practice-actions">{stage>0&&<button aria-label={running?'Pause practice':'Start practice'} onClick={()=>running?cancel():startAttempt()}>{running?<Pause size={18}/>:<Play size={18}/>}</button>}<button aria-label="Restart practice" title="Restart practice" onClick={reset}><RotateCcw size={18}/></button>{complete&&stage<2&&<button aria-label="Next practice stage" onClick={()=>setStage(value=>value+1)}><ArrowRight size={18}/></button>}</div>
      </div>
      <div className="practice-phrase-track" aria-label="Phrase actions">{(stage===0?steps:phrase.events).map((value,index)=><span key={index} className={`${stage===0&&index<step?'is-complete':''} ${(stage===0&&index===step&&!complete)||(stage>0&&cue?.eventIndex===index)?'is-current':''} ${stage>0&&results[index]==='correct'?'is-complete':''} ${results[index]==='missed'?'is-missed':''}`}>{stage===0?value.note:(value.notes??[value.note]).join('+')}</span>)}</div>
      <div className="practice-surface-host"><InstrumentSurface key={`${name}:${phraseIndex}:${stage}`} name={name} audio={audio} root={root} options={options} profile={profile} cue={target} practice/></div>
    </main><footer className="practice-footer"><span>{PRACTICE_STAGES[stage]}</span><div className="practice-beat-strip" aria-label="Beat">{[0,1,2,3].map(value=><i key={value} className={beat>=0&&beat%4===value?'is-current':''}/>)}</div></footer>
  </section>;
}