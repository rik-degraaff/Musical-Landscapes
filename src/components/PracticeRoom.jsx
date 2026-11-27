import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {editionPracticeProfile} from '../utils/practiceComposition';
import {useEdition} from './EditionContext';
import {noteMidi} from '../utils/autoplay';
import {PRACTICE_TIMING_TOLERANCE,beatOffset,timingInvitation,practiceDisplayOptions,learningSteps,createTimingAttempt,scoreTimedInput,expireSteps,attemptSummary} from '../utils/practice';
import {InstrumentSurface} from './PerformancePanel';
import {Metronome} from './Metronome';
import {PracticeFeedback} from './PracticeFeedback';
import {PracticeProgress,PracticeTransport,PracticeReadout,PracticePhraseTrack,PracticeDuration} from './PracticeRoomControls';
import {PracticeRoomHeader,PracticeRoomLayout} from './PracticeRoomLayout';
import {GuidedPractice} from './GuidedPractice';
import {practiceOpening} from '../utils/guidedPractice';

export function PracticeRoom({initialInstrument,child,audio,onClose,blocked,...props}) {
  const [name,setName]=useState(initialInstrument);
  const [full,setFull]=useState(null);
  const room=useRef(null);
  const previousFocus=useRef(document.activeElement?.closest('#young-musician,.equipped-instrument,.caregiver-help-corner')??document.getElementById('young-musician'));
  const close=useRef(onClose);close.current=onClose;
  useLayoutEffect(()=>{
    audio.beginPractice(practiceOpening(child?.age,initialInstrument).instrument);
    return ()=>{
      audio.endPractice();
      requestAnimationFrame(()=>{if(previousFocus.current?.isConnected)previousFocus.current.focus();});
    };
  },[audio,child?.age,initialInstrument]);
  useEffect(()=>{
    function navigate(event) {
      if(event.defaultPrevented||document.querySelector('dialog[open]'))return;
      if(event.key==='Escape'&&!room.current?.querySelector('.metronome-widget.is-open')){
        event.preventDefault();close.current();
      }
      if(event.key!=='Tab')return;
      const controls=[...room.current.querySelectorAll('button:not(:disabled),select,input,summary,[tabindex="0"]'),...document.querySelectorAll('.live-coach button')]
        .filter(control=>!control.closest('[inert],[hidden]')&&control.getClientRects().length>0);
      const first=controls[0],last=controls.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
    window.addEventListener('keydown',navigate);
    return ()=>window.removeEventListener('keydown',navigate);
  },[]);
  const shared={...props,child,audio,name,onInstrument:setName,onClose,blocked,room,roomProps:{
    role:'dialog','aria-modal':true,'aria-label':'Farm practice room',inert:blocked,
  }};
  return full
    ?<FullPractice {...shared} initialStage={full.stage} initialPhrase={full.phrase} challenge={full.challenge} onGuided={()=>setFull(null)}/>
    :<GuidedPractice {...shared} onHelp={activity=>props.onHelp(name,activity)} onFull={(stage=0,phrase=0)=>setFull({stage,phrase,challenge:stage===3})}/>;
}

function FullPractice({child,audio,audioStatus,soundMuted,onSoundHelp,name,onInstrument,settings,root,onClose,onHelp,onGuided,room,roomProps,blocked,initialStage,initialPhrase,challenge,caregiverNotice}) {
  const {trial}=useEdition();
  const [phraseIndex,setPhraseIndex]=useState(initialPhrase);
  const [stage,setStage]=useState(initialStage);
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
  const [invitation,setInvitation]=useState(null);
  const options=practiceDisplayOptions(settings.instruments[name]);
  const profile=editionPracticeProfile(name,root,{...options,genre:audio?.genre??'folk'},trial);
  const phrase=profile.phrases[Math.min(phraseIndex,profile.phrases.length-1)];
  const steps=learningSteps(phrase);
  const finite=challenge&&stage>1;
  const endBeat=Math.max(4,...phrase.events.map(event=>beatOffset(event.time)+PRACTICE_TIMING_TOLERANCE));
  state.current={invitation:state.current.invitation,name,stage,step,steps,phrase,running,complete,finite,endBeat};
  const target=stage===1&&!complete?steps[step]?.cue:stage>1?(invitation?.open?invitation.cue:null):cue;
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
    const item={id,tone,text:tone==='correct'?'Good note':'Try again',x:x/bounds.width*100,y:y/bounds.height*100,drift:offset};
    setFeedbackItems(items=>state.current.finite?[item]:[...items.slice(-23),item]);
  }

  function cancel() {
    cancelAnimationFrame(frame.current);frame.current=null;
    window.clearTimeout(cueTimer.current);
    audio.stopPracticeRun();window.dispatchEvent(new Event('farmjam-input-reset'));
    state.current.invitation=null;session.current=null;setCompanions({});state.current.running=false;setRunning(false);setCue(null);setInvitation(null);setBeat(-1);setCountingIn(false);
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
    const current=attemptSummary(attempt.current,true);
    const hits=totals.current.hits+current.hits;
    const total=totals.current.total+current.total;
    setSummary(total?{hits,total,percent:Math.round(hits/total*100)}:null);
  }
  function advanceCycle(nextCycle,sourcePhrase) {
    if(nextCycle<=cycle.current||state.current.finite)return;
    if(state.current.stage===0){state.current.complete=true;setComplete(true);cycle.current=nextCycle;return;}
    const previous=attemptSummary(attempt.current,true);
    totals.current.hits+=previous.hits;totals.current.total+=previous.total;
    cycle.current=nextCycle;attempt.current=createTimingAttempt(sourcePhrase);setResults([]);resultSnapshot.current=[];updateSummary();
  }
  useEffect(()=>{
    room.current?.querySelector('select')?.focus();
    return ()=>{cancelAnimationFrame(frame.current);window.clearTimeout(cueTimer.current);audio.stopPracticeRun();window.dispatchEvent(new Event('farmjam-input-reset'));};
  },[audio]);
  useEffect(()=>{reset();audio.switchPracticeInstrument(name);},[name,phraseIndex,stage,root,options.complexity]);
  useEffect(()=>{
    audio.onPracticeInput=({note,ticks})=>{
      const current=state.current;
      if(!room.current||room.current.inert||current.complete&&current.stage===1)return;
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
        if(elapsedTicks<-PRACTICE_TIMING_TOLERANCE*session.current.beatTicks)return;
        if(current.finite&&elapsedTicks>=current.endBeat*session.current.beatTicks)return;
        const nextCycle=current.finite?0:Math.max(0,Math.floor(elapsedTicks/session.current.barTicks));
        advanceCycle(nextCycle,current.phrase);
        const beatInBar=(elapsedTicks-nextCycle*session.current.barTicks)/session.current.beatTicks;
        expireSteps(attempt.current,beatInBar,PRACTICE_TIMING_TOLERANCE);
        const result=scoreTimedInput(attempt.current,note,beatInBar,PRACTICE_TIMING_TOLERANCE,(expected,actual)=>matchesNote(current.name,actual,expected));
        const active=attempt.current.some(value=>!value.missed&&value.remaining.length&&Math.abs(value.beat-beatInBar)<=PRACTICE_TIMING_TOLERANCE);
        showInputFeedback(note,result.correct?'correct':'wrong');
        setFeedback(result.correct
          ?{tone:'correct',text:result.complete?'On time!':'Good note, finish the chord'}
          :{tone:'wrong',text:active?'Try the highlighted note':'Wait for the next cue'});
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
  const pause=useRef(null);
  pause.current=()=>{cancel();setFeedback({tone:'pending',text:'Paused — restart when ready'});};
  useEffect(()=>{if(blocked){pause.current();setMetronomeOpen(false);}},[blocked]);
  function stopAttempt() {
    if(!state.current.running)return;
    const current=attemptSummary(attempt.current,true);
    totals.current.hits+=current.hits;totals.current.total+=current.total;
    const hits=totals.current.hits,total=totals.current.total;
    cancel();state.current.running=false;setRunning(false);setCountingIn(false);
    setSummary(stage===0?null:total?{hits,total,percent:Math.round(hits/total*100)}:null);setFeedback({tone:'pending',text:'Stopped'});
  }
  function startAttempt() {
    reset();attempt.current=createTimingAttempt(phrase);cycle.current=0;totals.current={hits:0,total:0};setSummary(null);setRunning(true);state.current.running=true;setCountingIn(true);setFeedback({tone:'pending',text:'Count in'});
    session.current=audio.startPracticeRun(phrase,stage===3,event=>{
      window.clearTimeout(cueTimer.current);
      setCue(event);if(stage===0)setFeedback({tone:'pending',text:'Listening'});
      setCountingIn(false);cueTimer.current=window.setTimeout(()=>setCue(null),Math.max(30,event.duration*1000));
    },nextCycle=>advanceCycle(nextCycle,phrase),(value,_cycle,isCountIn)=>{setBeat(value);setCountingIn(isCountIn);},(instrument,phraseNumber)=>setCompanions(current=>({...current,[instrument]:phraseNumber})),{demo:stage===0,single:finite});
    if(!session.current){cancel();setFeedback({tone:'pending',text:'Tap Start after audio resumes'});return;}
    const tick=()=>{
      if(!state.current.running)return;
      const elapsedTicks=audio.practiceTicks()-session.current.startTick;
      if(elapsedTicks>=(stage>1?-.75*session.current.beatTicks:0)){
        if(finite&&elapsedTicks>=endBeat*session.current.beatTicks){
          expireSteps(attempt.current,Infinity);updateResults();updateSummary();
          cancel();setFeedback({tone:state.current.complete?'correct':'pending',text:state.current.complete?'Phrase complete!':'Try again when ready'});return;
        }
        const nextCycle=finite?0:Math.max(0,Math.floor(elapsedTicks/session.current.barTicks));
        advanceCycle(nextCycle,phrase);
        const beatInBar=(elapsedTicks-nextCycle*session.current.barTicks)/session.current.beatTicks;
        if(stage>1){
          expireSteps(attempt.current,beatInBar,PRACTICE_TIMING_TOLERANCE);
          const next=timingInvitation(attempt.current,beatInBar);
          const before=state.current.invitation;
          if(before?.key!==next?.key){
            state.current.invitation=next;setInvitation(next);
            if(next?.open)setCountingIn(false);
            if(!state.current.complete){
              if(next)setFeedback({tone:'pending',text:next.open?'Your turn':'Get ready'});
              else if(before?.open)setFeedback({tone:'pending',text:'Wait for the next cue'});
            }
          }
        }
      }
      updateResults();
      frame.current=requestAnimationFrame(tick);
    };
    frame.current=requestAnimationFrame(tick);
  }
  const readoutCue=invitation?.cue??target;
  const targetNotes=readoutCue?.notes??(readoutCue?.note?[readoutCue.note]:[]);
  const progress=stage===1?Math.min(step,steps.length):stage===0?(complete?steps.length:0):attempt.current.filter(value=>!value.remaining.length).length;
  return <PracticeRoomLayout roomRef={room} roomProps={{...roomProps,className:'full-practice',onPointerDownCapture:captureInput,onKeyDownCapture:captureInput}}
    header={<PracticeRoomHeader child={child} name={name} selected={settings.selected} companions={companions} phrases={profile.phrases} phraseIndex={phraseIndex} audioStatus={audioStatus} soundMuted={soundMuted} onSoundHelp={onSoundHelp}
      onInstrument={instrument=>{cancel();setPhraseIndex(0);onInstrument(instrument);}} onPhrase={index=>{cancel();setPhraseIndex(index);}} onHelp={()=>onHelp(name,stage)} onClose={onClose} onGuided={onGuided}
      metronome={<Metronome audio={audio} open={metronomeOpen} onOpen={()=>setMetronomeOpen(true)} onClose={()=>setMetronomeOpen(false)}/>}/>}
    notice={caregiverNotice} stage={stage} onStage={index=>{cancel();setStage(index);}}
    readout={<PracticeReadout target={stage===1&&complete?'Finished':countingIn?(beat<0?'Ready':`Count ${beat+1}`):options.playbackNotes?targetNotes.join(' + ')||'Ready':'Ready'} accessibleCue={options.playbackNotes?undefined:targetNotes.join(' and ')} feedback={feedback}><PracticeProgress beat={beat} progress={progress} max={steps.length}/></PracticeReadout>}
    transport={<><PracticeTransport stage={stage} running={running} finite={finite} summary={summary} complete={complete} onToggle={()=>running?stopAttempt():startAttempt()} onRestart={reset} onNext={()=>{if(stage===3){onClose();return;}cancel();setStage(stage+1);}}/>{summary&&!running&&stage>1&&<details className="practice-attempt-details"><summary>Attempt details</summary>{summary.hits} of {summary.total} actions · {summary.percent}%</details>}</>}
    phraseTrack={<PracticePhraseTrack showNotes={options.playbackNotes} events={stage===1?steps:phrase.events} current={stage===1?(complete?-1:step):(target?.eventIndex??-1)} preview={invitation&&!invitation.open?invitation.cue.eventIndex:-1} completed={stage===1?step:0} results={stage>1?results:[]}/>}
    surface={<div className="practice-surface-host" data-timed-cue={stage===0&&Boolean(cue)}><PracticeDuration remaining={cue?1:0}/><InstrumentSurface key={`${name}:${phraseIndex}:${stage}`} name={name} audio={audio} root={root} options={options} profile={profile} cue={target} practice/></div>}
    feedback={<PracticeFeedback items={feedbackItems} onExpire={expireFeedback}/>}
  />;
}
