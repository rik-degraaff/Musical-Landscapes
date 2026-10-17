import {gestureFrame} from './gestures.js';
import {fluteNote} from './wind.js';
import {trumpetNote} from './performance.js';

export const GUIDE_DURATION=8000;
export const GUIDE_ACTION_DURATION=5600;
export const PRACTICE_DEMO_TIMING=Object.freeze({ready:1000,phraseStart:2800,phraseEnd:7200});
export const SIMPLE_GUIDE_OPTIONS=Object.freeze({complexity:.35,noteLabels:false,playbackNotes:false,fingeringCharts:false,harmonyHints:'off'});

export function guidePracticePhrase(profile) {
  const index=profile.phrases.findIndex(phrase=>phrase.events.length>=3&&phrase.events.length<=6);
  return {phrase:profile.phrases[Math.max(0,index)],index:Math.max(0,index)};
}

export function guideOptions(child,instrument,detail='simple') {
  return detail==='child'?{...SIMPLE_GUIDE_OPTIONS,...child?.settings?.instruments?.[instrument]}:SIMPLE_GUIDE_OPTIONS;
}

/** Declarative tracks share one clock. Delayed contact overlaps an earlier hold. */
export function gestureTrack({elapsed,reduced=false,from,to=from,gesture='tap',start=0,duration=4000,visibleUntil=Infinity}) {
  const frame=gestureFrame({gesture,elapsed:Math.max(0,elapsed-start),duration,from,to,reduced,iterations:1});
  return {...frame,opacity:reduced?1:elapsed<start||elapsed>visibleUntil?0:frame.opacity};
}

export function instrumentDemonstration({instrument,elapsed=0,reduced=false,route,secondary,profile}) {
  const strings=['guitar','ukulele'].includes(instrument);
  const wind=['flute','melody'].includes(instrument);
  if(strings) {
    const chord=gestureTrack({elapsed,reduced,gesture:'hold',from:secondary.from,duration:GUIDE_DURATION});
    const swipe=gestureTrack({elapsed,reduced,gesture:'swipe',...route,start:2200,duration:4400,visibleUntil:7000});
    const held=reduced||chord.pressed;
    const shape=profile.chords[0];
    const swept=Math.min(shape.notes.length,1+Math.floor(swipe.travel*shape.notes.length));
    return {hands:[chord,swipe],cue:held?{chord:shape.name,notes:swipe.pressed?shape.notes.slice(0,swept):[]}:null,caption:reduced?'Hold a chord and sweep the strings':elapsed<1600?'Choose a chord':elapsed<3080?'Hold the chord':elapsed<6000?'Keep holding and sweep the strings':'Let go of both hands'};
  }
  if(wind) {
    const first=gestureTrack({elapsed,reduced,gesture:'hold',...route,duration:GUIDE_DURATION});
    const second=gestureTrack({elapsed,reduced,gesture:'hold',...secondary,start:1400,duration:5600});
    const note=instrument==='flute'?fluteNote(second.pressed?['Eb','L1']:['Eb'],0):trumpetNote([second.pressed,false,false],0);
    return {hands:[first,second],cue:first.pressed?{note}:null,caption:instrument==='melody'?'Hold the breath area, then add a valve':'Hold this key, then add the second key'};
  }
  const gesture=instrument==='panflute'?'swipe':['drums','marimba'].includes(instrument)?'tap':'hold';
  const hand=gestureTrack({elapsed,reduced,gesture,...route,duration:GUIDE_ACTION_DURATION});
  const cue=instrument==='panflute'?{note:profile.notes[Math.min(profile.notes.length-1,Math.round(hand.travel*(profile.notes.length-1)))]}:instrument==='piano'?{note:profile.notes[0]}:profile.phrases[0].events[0];
  return {hands:[hand],cue:hand.pressed?cue:null,caption:gesture==='swipe'?'Press and slide across the pipes':gesture==='hold'?'Press, hold, then let go':'Tap once, then let go'};
}

/** Passive practice state; authored phrase events remain the only note source. */
export function practiceDemonstration({stage=0,elapsed=0,phrase,reduced=false}) {
  const events=phrase.events;
  const {ready,phraseStart,phraseEnd}=PRACTICE_DEMO_TIMING;
  const time=reduced?4400:Math.min(elapsed,GUIDE_DURATION);
  const countIn=stage!==1&&time>=ready&&time<phraseStart;
  const playing=time>=phraseStart&&time<phraseEnd;
  const eventDuration=(phraseEnd-phraseStart)/events.length;
  const index=Math.min(events.length-1,Math.max(0,Math.floor((time-phraseStart)/eventDuration)));
  const part=((time-phraseStart)%eventDuration)/eventDuration;
  const complete=time>=phraseEnd;
  return {index,eventDuration,eventElapsed:Math.max(0,time-phraseStart)%eventDuration,beforePhrase:time<phraseStart,cue:playing||stage===1&&!complete?{...events[index],eventIndex:index}:null,remaining:playing?Math.max(0,1-part):0,beat:countIn?Math.min(3,Math.floor((time-ready)/450)):playing?Math.floor((time-phraseStart)/600)%4:-1,running:stage!==1&&time>=ready&&!complete,complete,progress:complete?events.length:playing?index:0,countIn,
    feedback:complete?'Phrase complete!':countIn?'Count in':!playing?'Ready':stage===0?'Listening':stage===1?'Your turn':stage===2?'Play with the beat':'Play with the band'};
}
