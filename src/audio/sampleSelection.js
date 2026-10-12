const NOTE_NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

export function parseMidi(note) {
  if(typeof note!=='string')return null;
  const match=/^([A-G]#?)(-?\d+)$/.exec(note);
  if(!match)return null;
  const pitch=NOTE_NAMES.indexOf(match[1]);
  if(pitch<0)return null;
  const midi=pitch+(Number(match[2])+1)*12;
  return Number.isSafeInteger(midi)?midi:null;
}

export function prepareSampleCandidates(buffers) {
  const candidates=[];
  for(const note of Object.keys(buffers??{})){
    const midi=parseMidi(note);
    if(midi!==null)candidates.push({note,midi});
  }
  return candidates;
}

export function selectNearestSample(candidates,pitch) {
  if(!Number.isFinite(pitch))return null;
  let selected=null;
  let nearestDistance=Infinity;
  for(const candidate of candidates??[]){
    if(!Number.isFinite(candidate?.midi))continue;
    const distance=Math.abs(candidate.midi-pitch);
    if(distance<nearestDistance){selected=candidate;nearestDistance=distance;}
  }
  return selected;
}