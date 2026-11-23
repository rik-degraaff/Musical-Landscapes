import React,{useRef} from 'react';
import {PracticeRoomHeader,PracticeRoomLayout} from './PracticeRoomLayout';
import {ScaledGamePreview} from './ScaledGamePreview';
import {PracticeProgress,PracticeTransport,PracticeReadout,PracticePhraseTrack,PracticeDuration} from './PracticeRoomControls';
import {MetronomeMini} from './MetronomeArtwork';
import {DEFAULT_INSTRUMENTS} from '../utils/music';
import {GuideInstrumentSurface,silentAudio} from './GuideInstrumentSurface';
import {GuidedPracticeView} from './GuidedPractice';
import {guidedExercise,practiceOpening} from '../utils/guidedPractice';
import {GesturePointer} from './GesturePointer';
import {useDemonstrationTarget} from './useDemonstrationTargets';
import {practiceProfile} from '../utils/practiceComposition';
import {PRACTICE_STAGES,practiceDisplayOptions} from '../utils/practice';
import {practiceDemonstration,gestureTrack,guidePracticePhrase} from '../utils/guideDemonstrations';

const noop=()=>{};

function CueHand({host,cue,elapsed,duration,reduced}) {
  const target=useDemonstrationTarget(host,null,cue,'',.12);
  return <GesturePointer frame={gestureTrack({elapsed,duration,reduced,from:target,gesture:'hold'})} percent className="guide-practice-hand"/>;
}

function StringCueHands({host,elapsed,duration,reduced,cue}) {
  const chord=useDemonstrationTarget(host,'.chord-control.playing-chord',cue);
  const first=useDemonstrationTarget(host,'.playable-string');
  const last=useDemonstrationTarget(host,'.playable-string:last-of-type');
  return <><GesturePointer frame={gestureTrack({elapsed,duration,reduced,from:chord,gesture:'hold'})} percent className="guide-practice-hand"/><GesturePointer frame={gestureTrack({elapsed,start:duration*.25,duration:duration*.65,reduced,from:first,to:last,gesture:'swipe'})} percent className="guide-practice-hand"/></>;
}

export function GuidePracticePreview(props) {
  return <ScaledGamePreview>{props.activity?<GuidedPreview {...props}/>:<GuidePracticeRoom {...props}/>}</ScaledGamePreview>;
}

function GuidedPreview({instrument,child,activity,focus,elapsed,reduced,options}) {
  const host=useRef(null);
  const opening=practiceOpening(child?.age,instrument);
  const name=activity==='band'?instrument:opening.instrument;
  const pad=activity==='rhythm'||name!==instrument;
  const profile=practiceProfile(name,'C',options);
  const exercise=guidedExercise(name,profile,activity==='copy'?2:opening.count);
  const chooser=focus==='activities';
  const phase=chooser?'ready':activity==='copy'?'copy':activity==='band'?(elapsed>=900&&elapsed<6200?'playing':'ready')
    :elapsed===0?'ready':elapsed<900?'ready':activity==='rhythm'?(elapsed<3000?'example':elapsed<4500?'count':elapsed<6800?'response':'done')
      :elapsed<2600?'example':'done';
  const step=activity==='copy'?Number(elapsed>2900):activity==='rhythm'&&phase==='response'?Math.min(3,Math.floor((elapsed-4500)/650)):0;
  const cue=activity==='copy'?exercise.events[step]:phase==='example'?exercise.events[Math.min(exercise.events.length-1,Math.floor((elapsed-900)/600))]:null;
  const selector=chooser?'.guided-choices button':phase==='copy'?'[data-practice-cue="true"]':phase==='response'?'.guided-pad':phase==='done'&&activity==='hear'?'.guided-actions button:nth-child(2)':'.guided-action.is-primary';
  const target=useDemonstrationTarget(host,selector,cue,phase+step);
  const showHand=elapsed>0||reduced;
  const mark=activity==='rhythm'&&(phase==='example'||phase==='response')&&elapsed%650<260;
  return <GuidedPracticeView room={host} roomProps={{inert:true,'data-guide-focus':focus??activity}}
    activity={activity} phase={phase} chooser={chooser} count={activity==='rhythm'?3:exercise.events.length} step={step} mark={mark} leadBeat={Number(elapsed>=3750)}
    name={name} child={child} root="C" audio={silentAudio} profile={profile} options={options}
    cue={cue} focusEvents={activity==='band'?undefined:['guitar','ukulele'].includes(name)?[cue??exercise.events[0]]:exercise.events}
    pad={pad} older={opening.showTools} shared={opening.shared} fullName={instrument}
    fullProfile={practiceProfile(instrument,'C',options)}
    overlay={showHand?<GesturePointer frame={gestureTrack({elapsed:elapsed%1800,duration:1800,reduced,from:target,gesture:'tap'})} percent className="guide-practice-hand"/>:<span hidden/>}/>;
}

function GuidePracticeRoom({instrument,child,stage='Listen',focus,detail=false,elapsed=0,reduced=false,options}) {
  const host=useRef(null);
  const index=Math.max(0,PRACTICE_STAGES.indexOf(stage));
  const displayOptions=practiceDisplayOptions(options);
  const profile=practiceProfile(instrument,'C',displayOptions);
  const {phrase,index:phraseIndex}=guidePracticePhrase(profile);
  const state=practiceDemonstration({stage:index,elapsed,phrase,reduced});
  const overview=!detail&&!focus;
  const exit=focus==='exit';
  const exitStep=elapsed===0?1:Math.min(3,Math.floor(elapsed/2000));
  const action=exit?['Stop','Repeat','Restart','Leave'][exitStep]:state.feedback;
  const selector=exit?['.practice-run-button','.practice-run-button','.practice-restart-button','.practice-exit'][exitStep]:!reduced&&state.beforePhrase&&index!==1?'.practice-run-button':null;
  const target=useDemonstrationTarget(host,selector,state.cue,index);
  const hand=gestureTrack({elapsed:exit?elapsed%2000:selector?elapsed:state.eventElapsed,reduced,from:target,gesture:selector?'tap':'hold',duration:exit?2000:selector?3000:state.eventDuration});
  const showHand=!overview&&(exit||(index!==0||state.beforePhrase)&&!state.countIn&&!state.complete);
  const {eventDuration,eventElapsed}=state;
  const notes=(state.cue?.notes??(state.cue?.note?[state.cue.note]:[])).join(' + ');
  const selected=child?.settings?.selected??DEFAULT_INSTRUMENTS;
  const companions=index===3&&state.running&&!state.countIn?Object.fromEntries(selected.filter(name=>name!==instrument).slice(0,2).map(name=>[name,0])):{};
  return <PracticeRoomLayout roomRef={host} roomProps={{inert:true,className:`full-practice ${overview?'guide-room-canvas':'guide-room-detail'}`,'data-demo-stage':stage,'data-demo-event':state.index,'data-demo-action':action,'data-guide-focus':focus??'room'}}
    header={<PracticeRoomHeader child={child} name={instrument} selected={selected} companions={companions} phrases={profile.phrases} phraseIndex={phraseIndex} onInstrument={noop} onPhrase={noop} onHelp={noop} onClose={noop} onGuided={noop}
      metronome={<div className="metronome-widget"><MetronomeMini angle={state.running&&!reduced?-Math.cos(elapsed/600*Math.PI)*16:0}/></div>}/>}
    stage={exit?2:index} onStage={noop}
    readout={<PracticeReadout target={state.countIn?`Count ${state.beat+1}`:state.complete?'Finished':(displayOptions.playbackNotes&&notes)||'Ready'} feedback={{tone:state.complete?'correct':'pending',text:exit?action:state.feedback}}><PracticeProgress progress={state.progress} max={phrase.events.length} beat={index===1?-1:state.beat}/></PracticeReadout>}
    transport={<PracticeTransport stage={exit?2:index} running={exit?exitStep===0:state.running} summary={exit&&exitStep===1?{hits:2,total:4,percent:50}:null} complete={state.complete} onToggle={noop} onRestart={noop} onNext={noop}/>}
    phraseTrack={<PracticePhraseTrack showNotes={displayOptions.playbackNotes} events={phrase.events} current={state.cue?state.index:-1} completed={state.progress}/>}
    surface={<div className="practice-surface-host" data-timed-cue={index===0&&!!state.cue} style={{'--cue-remaining':`${state.remaining*100}%`}}><PracticeDuration remaining={state.remaining}/><GuideInstrumentSurface instrument={instrument} options={displayOptions} practice cue={state.cue} bare/></div>}
    overlay={showHand&&(selector?<GesturePointer frame={hand} percent className="guide-practice-hand"/>:['guitar','ukulele'].includes(instrument)?<StringCueHands host={host} cue={state.cue} elapsed={eventElapsed} duration={eventDuration} reduced={reduced}/>:<>{(state.cue?.notes??[state.cue?.note]).filter(Boolean).map(note=><CueHand key={note} host={host} cue={{note}} elapsed={eventElapsed} duration={eventDuration} reduced={reduced}/>)}</>)}
  />;
}
