import React,{useEffect,useRef,useState} from 'react';
import {Music,Footprints,Timer,Users,Play,Pause,RotateCcw,Check,CircleAlert,DoorOpen} from 'lucide-react';
import {INSTRUMENTS} from '../utils/music';
import {equippedProfile} from '../utils/difficulty';
import {noteMidi} from '../utils/autoplay';
import {PRACTICE_STAGES,PRACTICE_TIMING_TOLERANCE,learningSteps,createTimingAttempt,scoreTimedInput,expireSteps,attemptSummary} from '../utils/practice';
import {InstrumentSurface} from './PerformancePanel';
import {InstrumentArt} from './InstrumentArt';
import {PracticeRoomArt} from './PracticeRoomArt';
import {YoungMusicianArt} from './YoungMusician';
import {Metronome} from './Metronome';
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
  const [countingIn,setCountingIn]=useState(false);
  const [summary,setSummary]=useState(null);
  const [results,setResults]=useState([]);
  const [companions,setCompanions]=useState({});
  const [metronomeOpen,setMetronomeOpen]=useState(false);
  const state=useRef({});
  const attempt=useRef([]);
  const learned=useRef({step:-1,remaining:[]});
  const session=useRef(null);
  const cycle=useRef(0);
  const totals=useRef({hits:0,total:0});
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
    cancel();learned.current={step:-1,remaining:[]};setStep(0);state.current.step=0;setComplete(false);state.current.complete=false;setSummary(null);setResults([]);setFeedback({tone:'pending',text:'Ready'});
  }
  function updateSummary() {
    const current=attemptSummary(attempt.current);
    const hits=totals.current.hits+current.hits;
    const total=totals.current.total+current.total;
    setSummary(total?{hits,total,percent:Math.round(hits/total*100)}:null);
  }
  function advanceCycle(nextCycle,sourcePhrase) {
    if(nextCycle<=cycle.current)return;
    const previous=attemptSummary(attempt.current);
    totals.current.hits+=previous.hits;totals.current.total+=previous.total;
    cycle.current=nextCycle;attempt.current=createTimingAttempt(sourcePhrase);setResults([]);updateSummary();
  }
  useEffect(()=>{
    audio.beginPractice(initialInstrument);
    const previous=document.activeElement;
    room.current?.querySelector('select')?.focus();
    return ()=>{cancelAnimationFrame(frame.current);window.clearTimeout(cueTimer.current);audio.endPractice();previous?.focus();};
  },[audio]);
  useEffect(()=>{reset();audio.switchPracticeInstrument(name);},[name,phraseIndex,stage,root,options.complexity]);
  useEffect(()=>{
    audio.onPracticeInput=({note,ticks})=>{
      const current=state.current;
      if(current.complete)return;
      if(current.stage===0){
        const expected=current.steps[current.step];if(!expected)return;
        if(learned.current.step!==current.step)learned.current={step:current.step,remaining:[...expected.notes]};
        const matched=learned.current.remaining.findIndex(value=>matchesNote(current.name,note,value));
        if(matched<0){setFeedback({tone:'wrong',text:'Try again'});return;}
        learned.current.remaining.splice(matched,1);
        if(learned.current.remaining.length){setFeedback({tone:'correct',text:'Good note, finish the chord'});return;}
        const next=current.step+1;current.step=next;setStep(next);setFeedback({tone:'correct',text:'Correct!'});
        learned.current={step:next,remaining:[]};
        if(next===current.steps.length){current.complete=true;setComplete(true);setFeedback({tone:'correct',text:'Phrase learned!'});}
      }else if(current.running&&session.current){
        const elapsedTicks=ticks-session.current.startTick;
        if(elapsedTicks<0)return;
        const nextCycle=Math.floor(elapsedTicks/session.current.barTicks);
        advanceCycle(nextCycle,current.phrase);
        const beatInBar=(elapsedTicks-nextCycle*session.current.barTicks)/session.current.beatTicks;
        const result=scoreTimedInput(attempt.current,note,beatInBar,PRACTICE_TIMING_TOLERANCE,(expected,actual)=>matchesNote(current.name,actual,expected));
        setFeedback({tone:result.correct?'correct':'wrong',text:result.correct?'On time!':'Try the highlighted note'});
        setResults(attempt.current.map(value=>value.missed?'missed':value.remaining.length===0?'correct':'pending'));
        updateSummary();
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
  function stopAttempt() {
    if(!state.current.running)return;
    const current=attemptSummary(attempt.current);
    totals.current.hits+=current.hits;totals.current.total+=current.total;
    const hits=totals.current.hits,total=totals.current.total;
    cancel();state.current.running=false;setRunning(false);setCountingIn(false);
    setSummary(total?{hits,total,percent:Math.round(hits/total*100)}:null);setFeedback({tone:'pending',text:'Stopped'});
  }
  function startAttempt() {
    reset();attempt.current=createTimingAttempt(phrase);cycle.current=0;totals.current={hits:0,total:0};setSummary(null);setRunning(true);state.current.running=true;setCountingIn(true);setFeedback({tone:'pending',text:'Count in'});
    session.current=audio.startPracticeRun(phrase,stage===2,event=>{
      window.clearTimeout(cueTimer.current);
      setCue(event);setFeedback({tone:'pending',text:'Your turn'});
      setCountingIn(false);cueTimer.current=window.setTimeout(()=>setCue(null),Math.max(30,event.duration*1000));
    },nextCycle=>advanceCycle(nextCycle,phrase),(value,_cycle,isCountIn)=>{setBeat(value);setCountingIn(isCountIn);},(instrument,phraseNumber)=>setCompanions(current=>({...current,[instrument]:phraseNumber})));
    if(!session.current){setRunning(false);state.current.running=false;setFeedback({tone:'pending',text:'Tap Start after audio resumes'});return;}
    const tick=()=>{
      if(!state.current.running)return;
      const elapsedTicks=audio.practiceTicks()-session.current.startTick;
      if(elapsedTicks>=0){
        const nextCycle=Math.floor(elapsedTicks/session.current.barTicks);
        advanceCycle(nextCycle,phrase);
        const beatInBar=(elapsedTicks-nextCycle*session.current.barTicks)/session.current.beatTicks;
        expireSteps(attempt.current,beatInBar,PRACTICE_TIMING_TOLERANCE);
      }
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
      <div className="practice-lineup" role="group" aria-label="Musician and instruments">
        <div className="practice-musician"><YoungMusicianArt/><InstrumentArt type={name}/><span>{INSTRUMENTS[name].label}</span></div>
        <div className="practice-neighbors" aria-label="Other landscape instruments">{settings.selected.filter(instrument=>instrument!==name).map(instrument=><button key={instrument} className={companions[instrument]!==undefined?'is-accompanying':''} aria-label={`Switch to ${INSTRUMENTS[instrument].label}`} title={companions[instrument]!==undefined?`${INSTRUMENTS[instrument].label}, phrase ${companions[instrument]+1}`:`Practice ${INSTRUMENTS[instrument].label}`} onClick={()=>{cancel();setPhraseIndex(0);setName(instrument);}}><InstrumentArt type={instrument}/></button>)}</div>
      </div>
      <label className="practice-select"><span className="practice-instrument-tools" aria-hidden="true"><InstrumentArt type={name}/></span><select aria-label="Practice instrument" value={name} onChange={event=>{cancel();setPhraseIndex(0);setName(event.target.value);}}>{Object.entries(INSTRUMENTS).map(([id,instrument])=><option key={id} value={id}>{instrument.label}</option>)}</select></label>
      <label className="practice-select"><select aria-label="Practice phrase" value={Math.min(phraseIndex,profile.phrases.length-1)} onChange={event=>{cancel();setPhraseIndex(Number(event.target.value));}}>{profile.phrases.map((value,index)=><option key={index} value={index}>Phrase {index+1} · {value.events.length} actions</option>)}</select></label>
      <Metronome audio={audio} open={metronomeOpen} onOpen={()=>setMetronomeOpen(true)} onClose={()=>setMetronomeOpen(false)}/>
      <button className="practice-exit" aria-label="Leave practice through the open door" title="Leave practice" onClick={onClose}><DoorOpen size={26}/><span>Leave</span></button>
    </header>
    <nav className="practice-stages" aria-label="Practice stages">{PRACTICE_STAGES.map((label,index)=>{const Icon=stageIcons[index];return <button key={label} aria-pressed={stage===index} onClick={()=>{cancel();setStage(index);}}><Icon size={18}/>{index+1}. {label}</button>;})}</nav>
    <main className="practice-main">
      <div className="practice-guide"><div className="practice-target"><strong>{complete?'Finished':countingIn?`Count ${beat+1}`:targetNotes.join(' + ')||'Listen'}</strong></div>
        <div key={`${feedback.tone}:${feedback.text}`} className="practice-feedback-display" data-tone={feedback.tone} role="status" aria-live="polite">{feedback.tone==='correct'?<Check size={28}/>:feedback.tone==='wrong'?<CircleAlert size={28}/>:<Music size={24}/>}<strong>{feedback.text}</strong></div>
        <div className="practice-tools"><div className="practice-progress"><progress aria-label="Practice progress" max={steps.length} value={progress}/>{summary&&<span className="practice-score">{summary.hits}/{summary.total} · {summary.percent}%</span>}</div><div className="practice-beat-strip" aria-label="Beat">{[0,1,2,3].map(value=><i key={value} className={beat===value?'is-current':''}/>)}</div></div>
      </div>
      <div className="practice-control-dock">{stage>0&&<button className="practice-run-button" aria-label={running?'Stop practice':'Start repeating'} onClick={()=>running?stopAttempt():startAttempt()}>{running?<Pause size={18}/>:<Play size={18}/>}<span>{running?'Stop':summary?'Repeat':'Ready'}</span></button>}<button className="practice-restart-button" aria-label="Restart practice" title="Restart practice" onClick={reset}><RotateCcw size={17}/><span>Restart</span></button></div>
      <div className="practice-phrase-track" aria-label="Phrase actions">{(stage===0?steps:phrase.events).map((value,index)=><span key={index} className={`${stage===0&&index<step?'is-complete':''} ${(stage===0&&index===step&&!complete)||(stage>0&&cue?.eventIndex===index)?'is-current':''} ${stage>0&&results[index]==='correct'?'is-complete':''} ${results[index]==='missed'?'is-missed':''}`}>{stage===0?value.notes.join('+'):(value.notes??[value.note]).join('+')}</span>)}</div>
      <div className="practice-surface-host"><InstrumentSurface key={`${name}:${phraseIndex}:${stage}`} name={name} audio={audio} root={root} options={options} profile={profile} cue={target} practice/></div>
    </main>
  </section>;
}