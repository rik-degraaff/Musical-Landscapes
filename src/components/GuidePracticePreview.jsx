import React,{useRef} from 'react';
import {PracticeRoomArt} from './PracticeRoomArt';
import {PracticeStageTabs,PracticeSelectors,PracticeProgress,PracticeTransport,PracticeExit,PracticeReadout,PracticePhraseTrack,PracticeDuration} from './PracticeRoomControls';
import {YoungMusicianArt} from './YoungMusician';
import {InstrumentArt} from './InstrumentArt';
import {MetronomeArtwork} from './MetronomeArtwork';
import {GuideInstrumentSurface} from './GuideInstrumentSurface';
import {GesturePointer} from './GesturePointer';
import {useDemonstrationTarget} from './useDemonstrationTargets';
import {practiceProfile} from '../utils/practiceComposition';
import {PRACTICE_STAGES} from '../utils/practice';
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

export function GuidePracticePreview({instrument,child,stage='Listen',focus,detail=false,elapsed=0,reduced=false,options}) {
  const host=useRef(null);
  const index=Math.max(0,PRACTICE_STAGES.indexOf(stage));
  const profile=practiceProfile(instrument,'C',options);
  const {phrase,index:phraseIndex}=guidePracticePhrase(profile);
  const state=practiceDemonstration({stage:index,elapsed,phrase,reduced});
  const overview=!detail&&!focus;
  const exit=focus==='exit';
  const exitStep=elapsed===0?1:Math.min(3,Math.floor(elapsed/2000));
  const selector=exit?['.practice-run-button','.practice-run-button','.practice-restart-button','.practice-exit'][exitStep]:!reduced&&state.beforePhrase&&index!==1?'.practice-run-button':null;
  const target=useDemonstrationTarget(host,selector,state.cue,index);
  const hand=gestureTrack({elapsed:exit?elapsed%2000:selector?elapsed:state.eventElapsed,reduced,from:target,gesture:selector?'tap':'hold',duration:exit?2000:selector?3000:state.eventDuration});
  const showHand=!overview&&(exit||(index!==0||state.beforePhrase)&&!state.countIn&&!state.complete);
  const {eventDuration,eventElapsed}=state;
  const notes=(state.cue?.notes??(state.cue?.note?[state.cue.note]:[])).join(' + ');
  const transport=<PracticeTransport stage={exit?2:index} running={exit?exitStep===0:state.running} summary={exit&&exitStep===1?{hits:2,total:4,percent:50}:null} complete={state.complete} onToggle={noop} onRestart={noop} onNext={noop}/>;
  const content=<div ref={host} className={`practice-room ${overview?'guide-room-canvas':'guide-room-detail'} guide-detail-${focus??'progress'}`} inert data-demo-stage={stage} data-demo-event={state.index}>
    <PracticeRoomArt/>
    {overview?<><header className="practice-topbar"><div className="practice-lineup"><div className="practice-musician"><YoungMusicianArt child={child}/><InstrumentArt type={instrument}/></div></div><div className="guide-room-selectors"><PracticeSelectors name={instrument} phraseIndex={phraseIndex} phrases={profile.phrases} onInstrument={noop} onPhrase={noop}/></div><div className="guide-room-metronome"><MetronomeArtwork/></div><PracticeExit onClose={noop}/></header><PracticeStageTabs stage={index} onChange={noop}/></>:<div className="guide-detail-heading"><strong>{exit?'Repeat, restart or leave':stage}</strong><span>{exit?['Stop','Repeat','Restart','Leave'][exitStep]:state.feedback}</span></div>}
    {focus==='selectors'?<div className="guide-detail-selectors"><PracticeSelectors name={instrument} phraseIndex={phraseIndex} phrases={profile.phrases} onInstrument={noop} onPhrase={noop}/></div>:exit?<>{transport}<div className="guide-detail-exit"><PracticeExit onClose={noop}/></div></>:<>
      {!overview&&<PracticeStageTabs stage={index} onChange={noop}/>}
      {index===3&&<div className="practice-neighbors guide-companions">{['guitar','drums'].map(name=><button key={name} className={state.running&&!state.countIn?'is-accompanying':''}><InstrumentArt type={name}/></button>)}</div>}
      <PracticeReadout target={state.countIn?`Count ${state.beat+1}`:state.complete?'Finished':notes||'Ready'} feedback={{tone:state.complete?'correct':'pending',text:state.feedback}}><PracticeProgress progress={state.progress} max={phrase.events.length} beat={index===1?-1:state.beat}/></PracticeReadout>
      {transport}<PracticePhraseTrack events={phrase.events} current={state.cue?state.index:-1} completed={state.progress}/>
      <div className="practice-surface-host" data-timed-cue={index!==1&&!!state.cue} style={{'--cue-remaining':`${state.remaining*100}%`}}><PracticeDuration remaining={state.remaining}/><GuideInstrumentSurface instrument={instrument} options={options} practice cue={state.cue}/></div>
    </>}
    {showHand&&(selector?<GesturePointer frame={hand} percent className="guide-practice-hand"/>:['guitar','ukulele'].includes(instrument)?<StringCueHands host={host} cue={state.cue} elapsed={eventElapsed} duration={eventDuration} reduced={reduced}/>:<>{(state.cue?.notes??[state.cue?.note]).filter(Boolean).map(note=><CueHand key={note} host={host} cue={{note}} elapsed={eventElapsed} duration={eventDuration} reduced={reduced}/>)}</>)}
  </div>;
  return overview?<svg className="guide-practice-preview" viewBox="0 0 780 450" aria-hidden="true"><foreignObject width="780" height="450">{content}</foreignObject></svg>:content;
}
