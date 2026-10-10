export const PRACTICE_STAGES=['Learn','Rhythm','Together'];
export const PRACTICE_TIMING_TOLERANCE=.5;

export function beatOffset(time) {
  const [bars,beats,sixteenths]=time.split(':').map(Number);
  return bars*4+beats+sixteenths/4;
}
export function durationBeats(duration) {
  return {'1m':4,'2n.':3,'2n':2,'4n.':1.5,'4n':1,'8n.':.75,'8n':.5,'16n':.25}[duration]??.25;
}
export function learningSteps(phrase) {
  return phrase.events.map((event,eventIndex)=>{
    const notes=[...(event.notes??[event.note])];
    return {eventIndex,notes,note:notes.join(' + '),cue:{...event,notes:event.notes?[...event.notes]:undefined,duration:0}};
  });
}
export function timingSteps(phrase) {
  return phrase.events.map((event,index)=>({index,beat:beatOffset(event.time),notes:[...(event.notes??[event.note])],event})).sort((first,second)=>first.beat-second.beat);
}
export function createTimingAttempt(phrase) {
  return timingSteps(phrase).map(step=>({...step,remaining:[...step.notes],hits:0,missed:false}));
}
export function scoreTimedInput(attempt,note,beat,tolerance=PRACTICE_TIMING_TOLERANCE,matches=(expected,actual)=>expected===actual) {
  const candidates=attempt.filter(step=>!step.missed&&step.remaining.some(expected=>matches(expected,note))&&Math.abs(step.beat-beat)<=tolerance);
  candidates.sort((first,second)=>Math.abs(first.beat-beat)-Math.abs(second.beat-beat));
  const target=candidates[0];
  if(!target)return {correct:false,index:null};
  target.remaining.splice(target.remaining.findIndex(expected=>matches(expected,note)),1);target.hits++;
  return {correct:true,index:target.index,complete:target.remaining.length===0};
}
export function expireSteps(attempt,beat,tolerance=PRACTICE_TIMING_TOLERANCE) {
  for(const step of attempt)if(step.remaining.length&&beat>step.beat+tolerance)step.missed=true;
}
export function attemptSummary(attempt) {
  const total=attempt.reduce((sum,step)=>sum+step.notes.length,0);
  const hits=attempt.reduce((sum,step)=>sum+step.hits,0);
  return {hits,total,percent:Math.round(hits/Math.max(1,total)*100)};
}