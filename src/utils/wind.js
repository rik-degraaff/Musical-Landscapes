export const FLUTE_KEYS = [
  ['T','B thumb'],['Bb','B-flat thumb'],['L1','Left index'],['L2','Left middle'],['L3','Left ring'],['Gs','G-sharp pinky'],
  ['R1','Right index'],['R2','Right middle'],['R3','Right ring'],['Eb','D-sharp pinky'],['Cs','Low C-sharp'],['C','Low C roller'],['B','Low B roller'],['BbLever','B-flat lever'],['DTrill','D trill'],['DsTrill','D-sharp trill'],['Gizmo','B-foot gizmo']
];
const fingering = (note, register, keys) => ({note,register,keys:keys.split(' ').filter(Boolean)});
const low = [
  ['C4','T L1 L2 L3 R1 R2 R3 C'],['C#4','T L1 L2 L3 R1 R2 R3 Cs'],['D4','T L1 L2 L3 R1 R2 R3'],['D#4','T L1 L2 L3 R1 R2 R3 Eb'],
  ['E4','T L1 L2 L3 R1 R2 Eb'],['F4','T L1 L2 L3 R1 Eb'],['F#4','T L1 L2 L3 R3 Eb'],['G4','T L1 L2 L3 Eb'],['G#4','T L1 L2 L3 Gs Eb'],
  ['A4','T L1 L2 Eb'],['A#4','T L1 R1 Eb'],['B4','T L1 Eb'],['C5','L1 Eb'],['C#5','Eb']
];
const middle = [ ['D5','T L2 L3 R1 R2 R3'],['D#5','T L2 L3 R1 R2 R3 Eb'], ...low.slice(4).map(([note,keys])=>[`${note.slice(0,-1)}${Number(note.at(-1))+1}`,keys]) ];
const high = [
  ['D6','T L2 L3 Eb'],['D#6','T L1 L2 L3 Gs R1 R2 R3 Eb'],['E6','T L1 L2 R1 R2 Eb'],['F6','T L1 L3 R1 Eb'],['F#6','T L1 L3 R3 Eb'],
  ['G6','L1 L2 L3 Eb'],['G#6','L2 L3 Gs Eb'],['A6','T L2 R1 Eb'],['A#6','T R1 DTrill'],['B6','T L1 L3 DsTrill'],['C7','L1 L2 L3 Gs R1 Gizmo']
];
export const FLUTE_FINGERINGS = [
  ...low.map(([note,keys])=>fingering(note,0,keys)),...middle.map(([note,keys])=>fingering(note,1,keys)),...high.map(([note,keys])=>fingering(note,2,keys)),
  fingering('B3',0,'T L1 L2 L3 R1 R2 R3 B'),
  fingering('F#4',0,'T L1 L2 L3 R2 Eb'),fingering('F#5',1,'T L1 L2 L3 R2 Eb'),
  ...[0,1].flatMap(register=>[fingering(register?'A#5':'A#4',register,'Bb L1 Eb'),fingering(register?'A#5':'A#4',register,'T L1 BbLever Eb')])
];

function signature(keys) {
  const linked=new Set(keys);
  if(linked.has('Bb'))linked.delete('T');
  if(linked.has('B')){linked.delete('C');linked.delete('Cs');}
  else if(linked.has('C'))linked.delete('Cs');
  return [...linked].sort().join(',');
}
export function fluteNote(keys, register) {
  return FLUTE_FINGERINGS.find(value=>value.register===register&&signature(value.keys)===signature(keys))?.note??null;
}
export function fluteInput(note) { return FLUTE_FINGERINGS.find(value=>value.note===note)??null; }
export function lipPosition(position, count) {
  const normalized=Math.max(0,Math.min(.999999,position));
  const partial=Math.floor(normalized*count);
  return {partial,cents:(normalized*count-partial-.5)*40};
}