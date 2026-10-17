import React,{useEffect,useRef,useState} from 'react';
import {Music} from 'lucide-react';
import {INSTRUMENTS} from '../utils/music';
import {practiceProfile} from '../utils/practiceComposition';
import {noteMidi} from '../utils/autoplay';
import {PRACTICE_TIMING_TOLERANCE,learningSteps,createTimingAttempt,scoreTimedInput,expireSteps,attemptSummary} from '../utils/practice';
import {InstrumentSurface} from './PerformancePanel';
import {InstrumentArt} from './InstrumentArt';
import {PracticeRoomArt} from './PracticeRoomArt';
import {YoungMusicianArt} from './YoungMusician';
import {Metronome} from './Metronome';
import {PracticeFeedback} from './PracticeFeedback';
import {HelpButton} from './CaregiverHelp';
import {PracticeStageTabs,PracticeSelectors,PracticeProgress,PracticeTransport,PracticeExit,PracticeReadout,PracticePhraseTrack,PracticeDuration} from './PracticeRoomControls';
import './practice.css';

export function PracticeRoom({child,audio,initialInstrument,settings,root,onClose,onHelp}) {
  const [name,setName]=useState(initialInstrument);
  const [phraseIndex,setPhraseIndex]=useState(0);
  const [stage,setStage]=useState(0);
  const [step,setStep]=useState(0);
  const [running,setRunning]=useState(false);
  const [complete,setComplete]=useState(false);
  const [cue,setCue]=useState(null);
  const [feedback,setFeedback]=useState({tone:'pending',text:'Ready'});
  const [feedbackItems,setFeedbackItems]=useState([]);
  const feedbackSequence=useRef(0);
  const inputLocation=useRef(null);
  const expireFeedback=useRef(id=>setFeedbackItems(items=>items.filter(item=>item.id!==id))).current;
  const [beat,setBeat]=useState(-1);
  const [countingIn,setCountingIn]=useState(false);
  const [summary,setSummary]=useState(null);
  const [results,setResults]=useState([]);
  const [companions,setCompanions]=useState({});
  const [metronomeOpen,setMetronomeOpen]=useState(false);
  const state=useRef({});
  const attempt=useRef([]);
  const resultSnapshot=useRef([]);
  const learned=useRef({step:-1,remaining:[]});
  const session=useRef(null);
  const cycle=useRef(0);
  const totals=useRef({hits:0,total:0});
  const frame=useRef(null);
  const cueTimer=useRef(null);
  const room=useRef(null);
  const options={...settings.instruments[name],noteLabels:true,playbackNotes:true,fingeringCharts:true};
  const profile=practiceProfile(name,root,{...options,genre:audio?.genre??'folk'});
  const phrase=profile.phrases[Math.min(phraseIndex,profile.phrases.length-1)];
  const steps=learningSteps(phrase);
  state.current={name,stage,step,steps,phrase,running,complete};
  const target=stage===1&&!complete?steps[step]?.cue:cue;
  const matchesNote=(instrument,actual,expected)=>['guitar','ukulele'].includes(instrument)?noteMidi(actual)%12===noteMidi(expected)%12:actual===expected;

  function captureInput(event) {
    const control=event.target.closest('button,[role="slider"]');
    if(!control?.closest('.practice-surface-host'))return;
    const bounds=control.getBoundingClientRect();
    inputLocation.current={x:event.type==='pointerdown'?event.clientX:bounds.left+bounds.width/2,y:event.type==='pointerdown'?event.clientY:bounds.top+bounds.height/2,time:performance.now()};
  }
  function showInputFeedback(note,tone) {
    const bounds=room.current.getBoundingClientRect();
    const surface=room.current.querySelector('.practice-surface-host').getBoundingClientRect();
    const controls=[...room.current.querySelectorAll('.practice-surface-host button')];
    const control=controls.find(button=>button.getAttribute('data-swipe-note')===note||button.getAttribute('aria-label')?.endsWith(` ${note}`)||button.classList.contains(`pad-${note}`));
    const target=control?.getBoundingClientRect();
    const recent=inputLocation.current;
    const point=recent&&performance.now()-recent.time<500?recent:target?{x:target.left+target.width/2,y:target.top+target.height*.55}:{x:surface.left+surface.width/2,y:surface.top+surface.height*.6};
    const id=++feedbackSequence.current;
    const offset=[-16,12,0,22,-24][id%5];
    const x=Math.max(55,Math.min(bounds.width-55,point.x-bounds.left+offset));
    const y=Math.max(90,Math.min(bounds.height-34,point.y-bounds.top-18));
    setFeedbackItems(items=>[...items.slice(-23),{id,tone,text:tone==='correct'?'Good note':'Try again',x:x/bounds.width*100,y:y/bounds.height*100,drift:offset}]);
  }

  function cancel() {
    cancelAnimationFrame(frame.current);frame.current=null;
    window.clearTimeout(cueTimer.current);
    audio.stopPracticeRun();window.dispatchEvent(new Event('farmjam-input-reset'));
    state.current.running=false;setRunning(false);setCue(null);setBeat(-1);
  }
  function reset() {
    setFeedbackItems([]);inputLocation.current=null;
    cancel();learned.current={step:-1,remaining:[]};setStep(0);state.current.step=0;setComplete(false);state.current.complete=false;setSummary(null);setResults([]);resultSnapshot.current=[];setFeedback({tone:'pending',text:'Ready'});
  }
  function updateResults() {
    const previous=resultSnapshot.current;
    const next=attempt.current.map(value=>({status:value.missed?'missed':value.remaining.length===0?'correct':'pending',hits:value.hits}));
    if(next.length===previous.length&&next.every((value,index)=>value.status===previous[index].status&&value.hits===previous[index].hits))return;
    resultSnapshot.current=next;
    setResults(next.map(value=>value.status));
  }
  function updateSummary() {
    const current=attemptSummary(attempt.current);
    const hits=totals.current.hits+current.hits;
    const total=totals.current.total+current.total;
    setSummary(total?{hits,total,percent:Math.round(hits/total*100)}:null);
  }
  function advanceCycle(nextCycle,sourcePhrase) {
    if(nextCycle<=cycle.current)return;
    if(state.current.stage===0){state.current.complete=true;setComplete(true);cycle.current=nextCycle;return;}
    const previous=attemptSummary(attempt.current);
    totals.current.hits+=previous.hits;totals.current.total+=previous.total;
    cycle.current=nextCycle;attempt.current=createTimingAttempt(sourcePhrase);setResults([]);resultSnapshot.current=[];updateSummary();
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
      if(current.complete&&current.stage===1)return;
      if(current.stage===0)return;
      if(current.stage===1){
        const expected=current.steps[current.step];if(!expected)return;
        if(learned.current.step!==current.step)learned.current={step:current.step,remaining:[...expected.notes]};
        const matched=learned.current.remaining.findIndex(value=>matchesNote(current.name,note,value));
        if(matched<0){showInputFeedback(note,'wrong');setFeedback({tone:'wrong',text:'Try again'});return;}
        showInputFeedback(note,'correct');
        learned.current.remaining.splice(matched,1);
        if(learned.current.remaining.length){setFeedback({tone:'correct',text:'Good note, finish the chord'});return;}
        const next=current.step+1;current.step=next;setStep(next);setFeedback({tone:'correct',text:'Correct!'});
        learned.current={step:-1,remaining:[]};
        if(next===current.steps.length){current.complete=true;setComplete(true);setFeedback({tone:'correct',text:'Phrase learned!'});}
      }else if(current.running&&session.current){
        const elapsedTicks=ticks-session.current.startTick;
        if(elapsedTicks<0)return;
        const nextCycle=Math.floor(elapsedTicks/session.current.barTicks);
        advanceCycle(nextCycle,current.phrase);
        const beatInBar=(elapsedTicks-nextCycle*session.current.barTicks)/session.current.beatTicks;
        const result=scoreTimedInput(attempt.current,note,beatInBar,PRACTICE_TIMING_TOLERANCE,(expected,actual)=>matchesNote(current.name,actual,expected));
        showInputFeedback(note,result.correct?'correct':'wrong');
        setFeedback({tone:result.correct?'correct':'wrong',text:result.correct?'On time!':'Try the highlighted note'});
        updateResults();
        updateSummary();
        if(attempt.current.every(value=>value.remaining.length===0)){current.complete=true;setComplete(true);setFeedback({tone:'correct',text:'Phrase complete!'});}
      }
    };
    audio.onPracticeInterrupt=()=>{cancel();setFeedback({tone:'pending',text:'Paused — restart when ready'});};
    const blur=()=>{cancel();setFeedback({tone:'pending',text:'Paused — restart when ready'});};
    window.addEventListener('blur',blur);
    return ()=>{audio.onPracticeInput=null;audio.onPracticeInterrupt=null;window.removeEventListener('blur',blur);};
  },[audio]);
  useEffect(()=>{
    const host=room.current?.querySelector('.practice-surface-host');
    if(!host)return;
    if(!cue||stage===1){host.style.setProperty('--cue-remaining','0%');return;}
    const started=performance.now();
    let animation;
    const tick=()=>{
      const remaining=Math.max(0,1-(performance.now()-started)/Math.max(1,cue.duration*1000));
      host.style.setProperty('--cue-remaining',`${remaining*100}%`);
      host.querySelector('.practice-duration-track')?.setAttribute('aria-valuenow',String(Math.round(remaining*100)));
      if(remaining>0)animation=requestAnimationFrame(tick);
    };
    tick();return ()=>cancelAnimationFrame(animation);
  },[cue,stage]);
  useEffect(()=>{
    const escape=event=>{
      if(event.defaultPrevented||document.querySelector('dialog[open]'))return;
      if(event.key==='Escape'){event.preventDefault();onClose();}
      if(event.key==='Tab'){
        const controls=[...room.current.querySelectorAll('button:not(:disabled),select,[tabindex="0"]'),...document.querySelectorAll('.live-coach button')];
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
    setSummary(stage===0?null:total?{hits,total,percent:Math.round(hits/total*100)}:null);setFeedback({tone:'pending',text:'Stopped'});
  }
  function startAttempt() {
    reset();attempt.current=createTimingAttempt(phrase);cycle.current=0;totals.current={hits:0,total:0};setSummary(null);setRunning(true);state.current.running=true;setCountingIn(true);setFeedback({tone:'pending',text:'Count in'});
    session.current=audio.startPracticeRun(phrase,stage===3,event=>{
      window.clearTimeout(cueTimer.current);
      setCue(event);setFeedback({tone:'pending',text:stage===0?'Listening':state.current.complete?'Phrase complete!':'Your turn'});
      setCountingIn(false);cueTimer.current=window.setTimeout(()=>setCue(null),Math.max(30,event.duration*1000));
    },nextCycle=>advanceCycle(nextCycle,phrase),(value,_cycle,isCountIn)=>{setBeat(value);setCountingIn(isCountIn);},(instrument,phraseNumber)=>setCompanions(current=>({...current,[instrument]:phraseNumber})),{demo:stage===0});
    if(!session.current){setRunning(false);state.current.running=false;setFeedback({tone:'pending',text:'Tap Start after audio resumes'});return;}
    const tick=()=>{
      if(!state.current.running)return;
      const elapsedTicks=audio.practiceTicks()-session.current.startTick;
      if(elapsedTicks>=0){
        const nextCycle=Math.floor(elapsedTicks/session.current.barTicks);
        advanceCycle(nextCycle,phrase);
        const beatInBar=(elapsedTicks-nextCycle*session.current.barTicks)/session.current.beatTicks;
        if(stage>1)expireSteps(attempt.current,beatInBar,PRACTICE_TIMING_TOLERANCE);
      }
      updateResults();
      frame.current=requestAnimationFrame(tick);
    };
    frame.current=requestAnimationFrame(tick);
  }
  const targetNotes=target?.notes??(target?.note?[target.note]:[]);
  const progress=stage===1?Math.min(step,steps.length):stage===0?(complete?steps.length:0):attempt.current.reduce((sum,value)=>sum+value.hits,0);
  return <section ref={room} className="practice-room" role="dialog" aria-modal="true" aria-label="Farm practice room" onPointerDownCapture={captureInput} onKeyDownCapture={captureInput}>
    <PracticeRoomArt/>
    <header className="practice-topbar"><HelpButton onOpen={()=>onHelp(name,stage)}/><h1 className="practice-room-title"><Music size={22}/>Farm Practice</h1>
      <div className="practice-lineup" role="group" aria-label="Musician and instruments">
        <div className="practice-musician" data-child-name={child?.name}><YoungMusicianArt child={child}/><InstrumentArt type={name}/><span>{INSTRUMENTS[name].label}</span></div>
        <div className="practice-neighbors" aria-label="Other landscape instruments">{settings.selected.filter(instrument=>instrument!==name).map(instrument=><button key={instrument} className={companions[instrument]!==undefined?'is-accompanying':''} aria-label={`Switch to ${INSTRUMENTS[instrument].label}`} title={companions[instrument]!==undefined?`${INSTRUMENTS[instrument].label}, phrase ${companions[instrument]+1}`:`Practice ${INSTRUMENTS[instrument].label}`} onClick={()=>{cancel();setPhraseIndex(0);setName(instrument);}}><InstrumentArt type={instrument}/></button>)}</div>
      </div>
      <PracticeSelectors name={name} onInstrument={instrument=>{cancel();setPhraseIndex(0);setName(instrument);}} phraseIndex={phraseIndex} onPhrase={index=>{cancel();setPhraseIndex(index);}} phrases={profile.phrases}/>
      <Metronome audio={audio} open={metronomeOpen} onOpen={()=>setMetronomeOpen(true)} onClose={()=>setMetronomeOpen(false)}/>
      <PracticeExit onClose={onClose}/>
    </header>
    <PracticeStageTabs stage={stage} onChange={index=>{cancel();setStage(index);}}/>
    <main className="practice-main">
      <PracticeReadout target={stage===1&&complete?'Finished':countingIn?`Count ${beat+1}`:targetNotes.join(' + ')||'Ready'} feedback={feedback}><PracticeProgress beat={beat} progress={progress} max={steps.length} summary={summary}/></PracticeReadout>
      <PracticeTransport stage={stage} running={running} summary={summary} complete={complete} onToggle={()=>running?stopAttempt():startAttempt()} onRestart={reset} onNext={()=>{if(stage===3){onClose();return;}cancel();setStage(stage+1);}}/>
      <PracticePhraseTrack events={stage===1?steps:phrase.events} current={stage===1?(complete?-1:step):(cue?.eventIndex??-1)} completed={stage===1?step:0} results={stage>1?results:[]}/>
      <div className="practice-surface-host" data-timed-cue={stage!==1&&Boolean(cue)}><PracticeDuration remaining={cue?1:0}/><InstrumentSurface key={`${name}:${phraseIndex}:${stage}`} name={name} audio={audio} root={root} options={options} profile={profile} cue={target} practice/></div>
    </main>
    <PracticeFeedback items={feedbackItems} onExpire={expireFeedback}/>
  </section>;
}
