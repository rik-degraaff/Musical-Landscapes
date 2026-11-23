import React,{useEffect,useMemo,useRef,useState} from 'react';
import {AudioLines,Check,Hand,Headphones,ListMusic,Music,Play,RotateCcw,Square,Users} from 'lucide-react';
import {PRACTICE_ACTIVITIES,guidedExercise,practiceOpening,rhythmEcho} from '../utils/guidedPractice';
import {attemptSummary,createTimingAttempt,practiceDisplayOptions,scoreTimedInput} from '../utils/practice';
import {practiceProfile} from '../utils/practiceComposition';
import {AVAILABLE_INSTRUMENTS} from '../utils/music';
import {PracticeRoomLayout} from './PracticeRoomLayout';
import {PracticeExit,PracticeSelectors} from './PracticeRoomControls';
import {HelpButton} from './CaregiverHelp';
import {SoundHelpButton} from './SoundHelp';
import {InstrumentSurface,PressControl} from './PerformancePanel';
import {InstrumentArt} from './InstrumentArt';
import {GesturePointer,useGestureTimeline} from './GesturePointer';
import {useDemonstrationTarget} from './useDemonstrationTargets';
import {gestureTrack} from '../utils/guideDemonstrations';

const activityIcons={hear:Headphones,copy:Hand,rhythm:AudioLines,band:Users};
const phaseInstructions={
  ready:['Ready',Headphones],example:['Listen',Headphones],count:['Get ready',Music],
  response:['Your turn',Hand],copy:['Your turn',Hand],done:['Well played!',Check],
  retry:['Try again',RotateCcw],paused:['Paused',Square],playing:['Play along',Users],
};

function Action({icon:Icon,children,primary=false,className='',...props}) {
  return <button className={`guided-action ${primary?'is-primary':''} ${className}`} {...props}><Icon aria-hidden="true"/><span>{children}</span></button>;
}

function TargetHand({host,cue,activity,index}) {
  const {elapsed,reduced}=useGestureTimeline({active:true,duration:1500,iterations:1,resetKey:`${activity}:${index}`});
  const target=useDemonstrationTarget(host,'[data-practice-cue="true"]',cue,index,.35);
  return <GesturePointer frame={gestureTrack({elapsed,duration:1500,reduced,from:target,gesture:'tap'})} percent className="guide-practice-hand"/>;
}

export function GuidedPracticeView({
  room,roomProps,child,name,root,profile,options,audio,activity,phase,step,count,mark,leadBeat,onPad,
  cue,focusEvents,pad=false,chooser=false,details=false,hasDetails=false,older=false,shared=false,
  fullName=name,fullProfile=profile,notice,audioStatus,soundMuted,onSoundHelp,onHelp,onClose,onChoose,onToggleChooser,
  onStart,onStop,onCopy,onExtend,onReplay,onHearAgain,onDetails,onFull,onInstrument,onPhrase,onEasier,overlay,
}) {
  const [instruction,Icon]=phaseInstructions[activity==='hear'&&phase==='done'?'copy':phase];
  const noteNames=(cue?.notes??[cue?.note]).filter(Boolean).join(' + ');
  const copyInstruction=cue?.fingering?.length
    ?`Pluck string ${cue.fingering[0].string+1}.`
    :pad?'Tap the practice pad.':`Play ${noteNames}.`;
  const listening=phase==='example'||phase==='count';
  const running=listening||phase==='response'||phase==='playing';
  const copy=activity==='copy',rhythm=activity==='rhythm',band=activity==='band';
  const hear=activity==='hear';
  const completed=phase==='done'||phase==='retry';
  const startLabel=hear?(completed?'Hear it again':'Hear it'):rhythm?(completed?(notice?'Hear the phrase rhythm':'Try again'):'Hear the rhythm'):'Start the band';
  const ActivityIcon=activityIcons[activity];
  const showHand=phase==='copy'&&Boolean(cue)&&!chooser;
  return <PracticeRoomLayout roomRef={room} roomProps={{...roomProps,className:'guided-practice','data-activity':activity,'data-practice-phase':phase}}
    header={<header className="practice-topbar guided-header">
      <HelpButton onOpen={onHelp}/><SoundHelpButton status={audioStatus} muted={soundMuted} onOpen={onSoundHelp}/>
      <span className="guided-instrument"><InstrumentArt type={name}/><span>{AVAILABLE_INSTRUMENTS[name].label}</span></span>
      <Action icon={ListMusic} aria-expanded={chooser} onClick={onToggleChooser}>Choose an activity</Action>
      <PracticeExit onClose={onClose}/>
    </header>}
    readout={chooser&&<section className="guided-chooser" aria-label="Practice activity choices">
      <div className="guided-choices">{PRACTICE_ACTIVITIES.map(({id,label})=><Action key={id} icon={activityIcons[id]} aria-pressed={activity===id} onClick={()=>onChoose(id)}>{label}</Action>)}</div>
      <div className="guided-tools">
        <PracticeSelectors name={fullName} onInstrument={onInstrument} phrasePrompt onPhrase={onPhrase} phrases={fullProfile.phrases}/>
        <Action icon={Music} onClick={onFull}>Full practice</Action>
      </div>
    </section>}
    transport={!chooser&&<div className="guided-sidebar">
      <div className="guided-prompt" role="status"><Icon aria-hidden="true"/><strong>{notice??(hear&&phase==='done'?'Your turn?':instruction)}</strong>
        {phase==='copy'&&cue&&<span className="practice-sr-only">{copyInstruction}</span>}
        {phase==='response'&&<span className="practice-sr-only">Tap the rhythm pad.</span>}
      </div>
      {options.playbackNotes&&noteNames&&<span className="guided-note-name">{noteNames}</span>}
      {older&&!running&&<div className="guided-tools">
        <PracticeSelectors name={fullName} onInstrument={onInstrument} phrasePrompt onPhrase={onPhrase} phrases={fullProfile.phrases}/>
      </div>}
      <div className="guided-actions">
        {running&&<Action icon={Square} primary onClick={onStop}>Stop</Action>}
        {!running&&!copy&&<Action icon={ActivityIcon} primary={!(hear&&phase==='done')} className={hear?'practice-hear-action':''} onClick={onStart}>{startLabel}</Action>}
        {hear&&phase==='done'&&<Action icon={Hand} primary onClick={onCopy}>My turn</Action>}
        {copy&&phase==='copy'&&<Action icon={Headphones} onClick={onReplay}>Hear this sound</Action>}
        {copy&&completed&&<Action icon={RotateCcw} primary onClick={onCopy}>Copy it again</Action>}
        {copy&&completed&&count<(shared?1:child?.age==='3to4'?2:3)&&<Action icon={Music} onClick={onExtend}>{count===1?'Try two sounds':'Try three sounds'}</Action>}
        {copy&&!running&&<Action icon={Headphones} onClick={onHearAgain}>Hear it again</Action>}
        {copy&&completed&&!shared&&<Action icon={AudioLines} onClick={()=>onChoose('rhythm')}>Tap the rhythm</Action>}
        {copy&&phase==='paused'&&<Action icon={Hand} primary onClick={onCopy}>My turn</Action>}
        {rhythm&&completed&&<Action icon={AudioLines} onClick={onEasier}>Try a steady beat</Action>}
        {rhythm&&completed&&<Action icon={Users} onClick={()=>onChoose('band')}>Play with the band</Action>}
        {band&&!running&&<Action icon={Music} onClick={()=>onFull(3)}>Phrase challenge</Action>}
        {hasDetails&&!running&&<Action icon={ListMusic} aria-expanded={details} onClick={onDetails}>{details?'Hide details':'Show details'}</Action>}
      </div>
      {phase==='count'&&<div className="guided-steps" aria-label={`Lead-in ${leadBeat+1} of 2`}>{[0,1].map(index=><span key={index} data-state={index===leadBeat?'current':undefined}/>)}</div>}
      {phase!=='count'&&(rhythm||copy&&count>1)&&<div aria-label="Actions" className="guided-steps">{Array.from({length:count},(_,index)=><span key={index} data-state={index<step?'complete':index===step?'current':undefined}>{index<step?<Check size={15} aria-label="Complete"/>:index+1}</span>)}</div>}
    </div>}
    surface={!chooser&&<div className="practice-surface-host guided-surface" inert={listening}>
      {rhythm||pad?<PressControl className={`guided-pad${phase==='response'?' is-ready':''}`} label={rhythm?'Rhythm pad':'Practice pad'} demoPressed={Boolean(cue)||mark} onPress={onPad}><AudioLines aria-hidden="true"/><span>{rhythm?'Rhythm pad':'Practice pad'}</span></PressControl>
        :<InstrumentSurface name={name} audio={audio} root={root} options={options} profile={profile} cue={cue} focusEvents={focusEvents} practice/>}
    </div>}
    overlay={overlay??(showHand&&<TargetHand host={room} cue={cue} activity={activity} index={step}/>)}
  />;
}

export function GuidedPractice({room,roomProps,child,name,root,settings,audio,onInstrument,onFull,blocked,...header}) {
  const opening=practiceOpening(child?.age,name);
  const [activity,setActivity]=useState('hear');
  const [phase,setPhase]=useState('ready');
  const [step,setStep]=useState(0);
  const [cueIndex,setCueIndex]=useState(-1);
  const [count,setCount]=useState(opening.count);
  const [steady,setSteady]=useState(true);
  const [chooser,setChooser]=useState(false);
  const [details,setDetails]=useState(false);
  const [mark,setMark]=useState(false);
  const [leadBeat,setLeadBeat]=useState(0);
  const [notice,setNotice]=useState('');
  const phaseRef=useRef(phase);
  const stepRef=useRef(step);
  const timer=useRef(null);
  const timing=useRef(null);
  const attempt=useRef([]);
  const guidedName=activity==='band'?name:opening.instrument;
  const pad=activity!=='band'&&guidedName!==name;
  const saved=settings.instruments[guidedName];
  const options=practiceDisplayOptions(saved,activity==='band'||details);
  const profile=practiceProfile(guidedName,root,{...saved,genre:audio.genre});
  const fullProfile=practiceProfile(name,root,{...settings.instruments[name],genre:audio.genre});
  const exercise=useMemo(()=>guidedExercise(guidedName,profile,count),[guidedName,profile,count]);
  const rhythm=rhythmEcho(exercise,steady);
  const source=activity==='rhythm'?rhythm:exercise;
  const target=exercise.events[Math.min(step,exercise.events.length-1)];
  const cue=phase==='copy'?target:source.events[cueIndex];
  const focusEvents=activity==='band'?undefined:['guitar','ukulele'].includes(guidedName)?[cue??target]:exercise.events;
  const input=useRef(null);

  function enterPhase(next) {phaseRef.current=next;setPhase(next);}
  function moveStep(next) {stepRef.current=next;setStep(next);}
  function clearRun() {
    window.clearTimeout(timer.current);setMark(false);timing.current=null;
    audio.stopPracticeRun();window.dispatchEvent(new Event('farmjam-input-reset'));setCueIndex(-1);
  }
  function stop(next='paused') {clearRun();enterPhase(next);setNotice('');}
  const interrupt=useRef(null);
  interrupt.current=()=>stop();
  useEffect(()=>{
    audio.switchPracticeInstrument(guidedName);
    audio.onPracticeInput=value=>input.current(value);
    const pause=()=>interrupt.current();
    const hide=()=>{if(document.hidden)pause();};
    audio.onPracticeInterrupt=pause;
    window.addEventListener('blur',pause);document.addEventListener('visibilitychange',hide);
    return ()=>{
      window.clearTimeout(timer.current);audio.stopPracticeRun();
      window.dispatchEvent(new Event('farmjam-input-reset'));
      audio.onPracticeInput=null;audio.onPracticeInterrupt=null;
      window.removeEventListener('blur',pause);document.removeEventListener('visibilitychange',hide);
    };
  },[audio,guidedName]);
  useEffect(()=>{if(blocked){interrupt.current();setChooser(false);}},[blocked]);
  useEffect(()=>{
    if(!room.current||blocked||room.current.contains(document.activeElement))return;
    const selector=chooser?'[aria-pressed="true"]':phase==='copy'?'[data-practice-cue="true"]':'.guided-action.is-primary';
    (room.current.querySelector(selector)??room.current.querySelector('.guided-header .guided-action'))?.focus();
  },[room,blocked,chooser,activity,phase,step]);

  function choose(next) {
    if(blocked)return;
    clearRun();moveStep(0);setNotice('');setChooser(false);
    if(next==='rhythm'&&activity!=='rhythm')setSteady(true);
    setActivity(next);enterPhase(next==='copy'?'copy':'ready');
  }
  function start(kind=activity,phrase=source,replay=false,steadyRound=steady) {
    if(blocked)return;
    clearRun();setNotice('');
    if(!replay)moveStep(0);
    if(kind==='rhythm')attempt.current=createTimingAttempt(phrase);
    const run=audio.startGuidedPractice(kind,phrase,{
      onCue:index=>setCueIndex(replay?stepRef.current:index),
      onBeat:beat=>{setCueIndex(-1);setLeadBeat(beat);enterPhase('count');},
      onResponse:()=>{setCueIndex(-1);enterPhase('response');},
      onEnd:()=>{
        const summary=kind==='rhythm'?attemptSummary(attempt.current):null;
        stop(replay?'copy':summary&&summary.hits<summary.total?'retry':'done');
        if(summary&&summary.hits===summary.total&&steadyRound){setSteady(false);setNotice('Now try the phrase rhythm');}
      },
    });
    if(!run){enterPhase('paused');setNotice('Tap to try again');return;}
    timing.current=run;
    enterPhase(kind==='band'?'playing':'example');
  }
  function copyNote(note) {
    if(phaseRef.current!=='copy'||blocked)return;
    const current=stepRef.current;
    if(note!==exercise.events[current]?.note){setNotice('Try the highlighted sound');return;}
    const next=current+1;
    moveStep(next);setNotice('');
    if(next===exercise.events.length)enterPhase('done');
  }
  input.current=({note})=>copyNote(note);
  function tapPad() {
    if(blocked)return;
    const current=phaseRef.current;
    if(activity==='rhythm'){
      if(current!=='response'||!timing.current)return;
      const {responseTick,beatTicks}=timing.current;
      const beat=(audio.practiceTicks()-responseTick)/beatTicks;
      const result=scoreTimedInput(attempt.current,'rim',beat);
      if(result.correct)moveStep(attemptSummary(attempt.current).hits);
      audio.playPracticePad('rim');
    }else{
      const note=exercise.events[Math.min(stepRef.current,count-1)].note;
      audio.playPracticePad(note);copyNote(note);
    }
    setMark(true);window.clearTimeout(timer.current);timer.current=window.setTimeout(()=>setMark(false),160);
  }
  return <GuidedPracticeView {...header} room={room} roomProps={roomProps} child={child} name={guidedName} root={root}
    profile={profile} options={options} audio={audio} activity={activity} phase={phase} step={step} onHelp={()=>header.onHelp(activity)}
    count={activity==='rhythm'?rhythm.events.length:count} mark={mark} leadBeat={leadBeat} onPad={tapPad} notice={notice}
    cue={cue} focusEvents={focusEvents} pad={pad} chooser={chooser} details={details}
    hasDetails={Object.keys(options).some(key=>['noteLabels','playbackNotes','fingeringCharts','fretDots'].includes(key)&&saved[key])}
    older={opening.showTools} shared={opening.shared} fullName={name} fullProfile={fullProfile}
    onChoose={choose} onToggleChooser={()=>{stop('ready');setChooser(!chooser);}}
    onStart={()=>start()} onStop={()=>stop()} onCopy={()=>choose('copy')} onExtend={()=>{setCount(count+1);choose('hear');}}
    onReplay={()=>start('hear',{events:[{...target,time:'0:0:0'}]},true)} onHearAgain={()=>{setActivity('hear');start('hear',exercise);}} onDetails={()=>setDetails(!details)}
    onInstrument={instrument=>{onInstrument(instrument);choose('hear');}} onPhrase={index=>onFull(0,index)}
    onFull={stage=>onFull(typeof stage==='number'?stage:0)} onEasier={()=>{setSteady(true);start('rhythm',rhythmEcho(exercise,true),false,true);}}
  />;
}
