import React from 'react';
import {SkipForward,ArrowUpFromLine,Menu} from 'lucide-react';
import {InstrumentArt} from './InstrumentArt';
import {ChildAvatar} from './ChildAvatar';
import {InstrumentSurface} from './PerformancePanel';
import {PracticeRoomArt} from './PracticeRoomArt';
import {PracticeStageTabs,PracticeSelectors,PracticeProgress,PracticeTransport,PracticeExit} from './PracticeRoomControls';
import {MetronomeArtwork} from './MetronomeArtwork';
import {GestureHand} from './GestureHand';
import {CloudShape,CelestialArtwork} from '../scenes/SkyArt';
import {practiceProfile} from '../utils/practiceComposition';
import {PRACTICE_STAGES} from '../utils/practice';
import {INSTRUMENTS} from '../utils/music';
import './practice.css';
import './guide-illustration.css';

const noop=()=>{};
// These previews never obtain the audio engine or a playback session.
const silentAudio=Object.freeze({manualNoteOn:noop,manualNoteOff:noop,manualStrike:noop,stopManualVoices:noop,setManualPitchBend:noop,manualVoices:new Map()});
const surfaceOptions=Object.freeze({complexity:1,noteLabels:true,playbackNotes:true,fingeringCharts:true});

function Avatar({child,className=''}) {
  return <div className={`guide-avatar ${className}`}><ChildAvatar avatar={child?.avatar} age={child?.age}/></div>;
}

/** The real equipped controls, isolated from pointer, keyboard, and audio input. */
export function GuideInstrumentSurface({instrument='piano',practice=false,cue}) {
  return <div className={`guide-surface performance-${instrument}`} inert aria-hidden="true"><InstrumentSurface name={instrument} root="C" audio={silentAudio} options={surfaceOptions} cue={cue} practice={practice}/></div>;
}

function Sky({weather=false}) {
  return <svg className="guide-sky-art" viewBox="0 0 320 180" aria-hidden="true"><path d="M0 0H320V180H0Z" fill={weather?'#b8dce1':'#9bd6eb'}/><CelestialArtwork x={weather?270:165} y={weather?35:65} radius={weather?20:33}/>{weather&&<g fill="#a4bcca"><CloudShape x={55} y={94} index={0}/><CloudShape x={172} y={57} index={1} scale={.58}/></g>}<path d="M0 147Q70 115 150 145T320 139V180H0Z" fill="#a4bf8a"/><path d="M0 170Q100 143 194 161T320 154V180H0Z" fill="#85ad65"/></svg>;
}

function PracticePreview({instrument,child,stage='Listen',focus,detail=false}) {
  const index=Math.max(0,PRACTICE_STAGES.indexOf(stage));
  const profile=practiceProfile(instrument,'C',surfaceOptions);
  const phrase=profile.phrases[0];
  const cue=phrase?.events[0];
  const notes=(cue?.notes??[cue?.note]).join(' + ');
  const timed=index!==1;
  const selectedFocus=focus??(detail?'progress':undefined);
  const feedback=index===0?'Listening':'Your turn';
  const progress=<PracticeProgress progress={0} max={phrase?.events.length??1} beat={timed?0:-1}/>;
  const transport=<PracticeTransport stage={index} running={timed} complete={false} onToggle={noop} onRestart={noop} onNext={noop}/>;
  const duration=timed?<div className="practice-duration-track" role="progressbar" aria-label="Note hold duration" aria-valuemin={0} aria-valuemax={100} aria-valuenow={60} style={{'--cue-remaining':'60%'}}><i/></div>:null;
  const surface=<div className="practice-surface-host" data-timed-cue={timed} style={{'--cue-remaining':timed?'60%':'0%'}}>{duration}<GuideInstrumentSurface instrument={instrument} practice cue={cue}/></div>;
  const actions=<div className="practice-phrase-track">{phrase?.events.slice(0,6).map((event,i)=><span key={i} className={i===0?'is-current':''}>{(event.notes??[event.note]).join('+')}</span>)}</div>;
  if(selectedFocus)return <div className={`practice-room guide-room-detail guide-detail-${selectedFocus}`} inert>
    <PracticeRoomArt/>
    <div className="guide-detail-heading"><strong>{selectedFocus==='selectors'?'Choose an instrument and phrase':selectedFocus==='exit'?'Repeat, restart or leave':stage}</strong><span>{!['selectors','exit'].includes(selectedFocus)&&`${feedback} · ${notes}`}</span></div>
    {selectedFocus==='selectors'?<div className="guide-detail-selectors"><PracticeSelectors name={instrument} phraseIndex={0} phrases={profile.phrases} onInstrument={noop} onPhrase={noop}/></div>:selectedFocus==='exit'?<><PracticeTransport stage={2} running={false} summary={{hits:2,total:4,percent:50}} complete={false} onToggle={noop} onRestart={noop} onNext={noop}/><div className="guide-detail-exit"><PracticeExit onClose={noop}/><span>Return to the landscape</span></div></>:selectedFocus==='stages'?<PracticeStageTabs stage={index} onChange={noop}/>:<>{selectedFocus==='transport'?transport:progress}{actions}{surface}</>}
  </div>;
  return <svg className="guide-practice-preview" viewBox="0 0 780 450" aria-hidden="true"><foreignObject width="780" height="450"><div xmlns="http://www.w3.org/1999/xhtml" className="practice-room guide-room-canvas" inert>
    <PracticeRoomArt/>
    <header className="practice-topbar"><div className="practice-lineup"><div className="practice-musician"><ChildAvatar avatar={child?.avatar} age={child?.age}/><InstrumentArt type={instrument}/><span>{INSTRUMENTS[instrument].label}</span></div></div><div className="guide-room-selectors"><PracticeSelectors name={instrument} phraseIndex={0} phrases={profile.phrases} onInstrument={noop} onPhrase={noop}/></div><div className="guide-room-metronome"><MetronomeArtwork/></div><PracticeExit onClose={noop}/></header>
    <PracticeStageTabs stage={index} onChange={noop}/>
    <main className="practice-main"><div className="practice-guide"><div className="practice-target"><strong>{notes}</strong></div><div className="practice-feedback-display" data-tone="pending"><strong>{feedback}</strong></div>{progress}</div>{transport}{actions}{surface}</main>
  </div></foreignObject></svg>;
}

function SettingsPreview({instrument,focus,child}) {
  const sound=focus==='sound';
  const display=focus==='display';
  const caregiver=focus==='caregiver';
  return <div className="guide-settings-preview"><div className="guide-settings-tabs"><span className={sound?'is-selected':''}>Sound</span><span className={!sound&&!caregiver?'is-selected':''}>Instruments</span><span className={caregiver?'is-selected':''}>Caregiver</span><span>Guides</span></div>{focus==='selectors'?<div className="guide-slot-grid">{['piano','guitar','drums','flute','marimba','panflute'].map((type,i)=><div className="guide-slot" key={type}><InstrumentArt type={type}/><span>{i+1}. {INSTRUMENTS[type].label} ▾</span></div>)}</div>:caregiver?<div className="guide-caregiver-settings"><strong>Caregiver music familiarity</strong><span>New to music · Know a few basics</span><strong>Learning hints for {child?.name??'your child'}</strong><span>☑ Offer learning hints</span></div>:<><div className="guide-setting-instrument"><InstrumentArt type={instrument}/><strong>{INSTRUMENTS[instrument].label}</strong></div>{sound?<><label>{INSTRUMENTS[instrument].label} volume <span className="guide-setting-slider"><i/></span></label><label>Scenery sounds <span className="guide-setting-slider"><i style={{left:'30%'}}/></span></label></>:display?<div className="guide-display-options"><span>✓ Show note and control labels</span><span>✓ Show playback note names</span><span>✓ Highlight upcoming harmony</span></div>:<><strong className="guide-setting-legend">Equipped complexity</strong><div className="guide-setting-levels"><span>Simple</span><span className="is-selected">Standard</span><span>Advanced</span></div><span className="guide-setting-detail">Display details</span></>}</>}</div>;
}

function Pointer({gesture,secondary=false}) {
  return <div className={`guide-pointer ${secondary?'guide-second-pointer':''}`}><GestureHand pose={gesture==='drag'?'grip':'point'} className="guide-hand-ready"/>{gesture!=='drag'&&<GestureHand pose="pressed" className="guide-hand-contact"/>}<i className="guide-contact-ring"/></div>;
}

/** All illustrated objects come from the same artwork and controls as play. */
export function GuideIllustration({kind='band',instrument='piano',child,stage='Listen',focus,gesture,demonstrating=false,className=''}) {
  const wind=kind==='surface'&&['flute','melody'].includes(instrument)&&gesture==='hold';
  const hasRoute=['drag','swipe','tempo'].includes(gesture);
  const stringSwipe=gesture==='swipe'&&['guitar','ukulele'].includes(instrument);
  return <div className={`guide-illustration guide-art-${kind} guide-instrument-${instrument} ${gesture?`guide-gesture-${gesture}`:''} ${wind?'guide-wind':''} ${stringSwipe?'guide-string-swipe':''} ${demonstrating?'is-demonstrating':''} ${className}`} data-guide-art={kind} aria-hidden="true">
    {['sun','weather'].includes(kind)?<Sky weather={kind==='weather'}/>:['practice-room','practice-stage'].includes(kind)?<PracticePreview instrument={instrument} child={child} stage={stage} focus={focus} detail={kind==='practice-stage'}/>:kind==='metronome'?<><MetronomeArtwork/><span className="guide-tempo-slower">Slower</span><span className="guide-tempo-faster">Faster</span></>:kind==='settings'?<SettingsPreview instrument={instrument} focus={focus} child={child}/>:kind==='profile'?<><Avatar child={child}/><div className="guide-profile-card"><strong>{child?.name??'Your child'}</strong><span>Avatar · instruments · preferences</span><div className="guide-profile-instruments">{['piano','guitar','drums'].map(type=><InstrumentArt key={type} type={type}/>)}</div></div></>:kind==='together'?<><Avatar child={child} className="guide-together-first"/><Avatar child={child} className="guide-together-second"/><div className="guide-together-instrument"><InstrumentArt type={instrument}/></div><span className="guide-together-turn">Your turn · My turn</span></>:kind==='surface'?<><div className="guide-surface-label">{INSTRUMENTS[instrument].label}</div><GuideInstrumentSurface instrument={instrument}/><div className={`guide-surface-toolbar guide-surface-focus-${focus}`} inert><strong>{INSTRUMENTS[instrument].label}</strong><button type="button" className="next-phrase" aria-label="Next phrase"><SkipForward size={20}/></button><button type="button" className="return-instrument" aria-label="Put instrument down"><ArrowUpFromLine size={20}/></button></div></>:kind==='equip'?<><div className="guide-equip-source"><InstrumentArt type={instrument}/></div><Avatar child={child}/><span className="guide-equip-destination"/></>:<><Avatar child={child}/>{['piano','guitar','drums','flute'].map((type,i)=><div className={`guide-band-instrument guide-band-${i}`} key={type}><InstrumentArt type={type}/></div>)}</>}
    {kind==='settings'&&gesture==='double-tap'&&<div className="guide-settings-open" inert><button type="button" aria-label="Settings"><Menu size={22}/><span>Settings</span></button></div>}
    {gesture&&<><Pointer gesture={gesture}/>{wind&&<Pointer gesture="hold" secondary/>}{hasRoute&&<><svg className="guide-motion-route" viewBox="0 0 320 180"><path d={gesture==='tempo'?'M176 123V46':gesture==='drag'?'M78 100Q135 70 217 90':stringSwipe?'M244 50V125':'M90 95H242'}/><path d={gesture==='tempo'?'m170 53 6-8 6 8':gesture==='drag'?'m207 84 11 6-10 6':stringSwipe?'m238 115 6 10 6-10':'m232 89 10 6-10 6'}/></svg><span className="guide-motion-cue guide-start">1</span><span className="guide-motion-cue guide-end">2</span></>}{gesture==='double-tap'&&<span className="guide-contact-label">1 · 2</span>}{gesture==='hold'&&<span className="guide-contact-label">Hold</span>}{wind&&<span className="guide-wind-label">Hold + keys · slide register</span>}</>}
  </div>;
}
