const pitches = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
export function midiNote(value) {
  return `${pitches[value % 12]}${Math.floor(value / 12) - 1}`;
}
export const PIANO_NOTES = Array.from({ length: 34 }, (_, index) => midiNote(48 + index));
export const FLUTE_NOTES = Array.from({ length: 26 }, (_, index) => midiNote(60 + index));
export const MARIMBA_NOTES = Array.from({ length: 22 }, (_, index) => midiNote(72 + index));
export const GUITAR_CHORDS = {
  Open: ['E2','A2','D3','G3','B3','E4'],
  C: [null,'C3','E3','G3','C4','E4'],
  G: ['G2','B2','D3','G3','B3','G4'],
  Am: [null,'A2','E3','A3','C4','E4'],
  F: ['F2','C3','F3','A3','C4','F4'],
};
const valveOffsets = [0, -2, -1, -3, -3, -5, -4, -6];
export const TRUMPET_REGISTERS = ['C4','G4','C5','E5','G5','C6'];
export function trumpetNote(valves, partial) {
  const mask = valves.reduce((value, pressed, index) => value | (pressed ? 1 << index : 0), 0);
  return midiNote([60,67,72,76,79,84][partial] + valveOffsets[mask]);
}

export function guitarChords(root) {
  const shift=pitches.indexOf(root);
  return Object.fromEntries(Object.entries(GUITAR_CHORDS).map(([name,notes])=>{
    const match=/^([A-G])([m]?)$/.exec(name);
    const label=match?`${pitches[(pitches.indexOf(match[1])+shift)%12]}${match[2]}`:name;
    return [label,notes.map(note=>{
      if(!note||name==='Open')return note;
      const parts=/^([A-G]#?)(\d+)$/.exec(note);
      return midiNote(pitches.indexOf(parts[1])+(Number(parts[2])+1)*12+shift);
    })];
  }));
}

export function slidePosition(point, size, obstacles, bounds, gap = 10) {
  const clamp = value => ({ x: Math.max(bounds.left + size.width / 2, Math.min(bounds.right - size.width / 2, value.x)), y: Math.max(bounds.top + size.height / 2, Math.min(bounds.bottom - size.height / 2, value.y)) });
  let result = clamp(point);
  for (let iteration = 0; iteration < 24; iteration++) {
    let moved = false;
    for (const obstacle of obstacles) {
      const halfWidth = (size.width + obstacle.width) / 2 + gap;
      const halfHeight = (size.height + obstacle.height) / 2 + gap;
      const deltaX = result.x - obstacle.x;
      const deltaY = result.y - obstacle.y;
      if (Math.abs(deltaX) >= halfWidth || Math.abs(deltaY) >= halfHeight) continue;
      const candidates = [
        { x: obstacle.x - halfWidth, y: result.y }, { x: obstacle.x + halfWidth, y: result.y },
        { x: result.x, y: obstacle.y - halfHeight }, { x: result.x, y: obstacle.y + halfHeight },
      ].filter(candidate => candidate.x >= bounds.left + size.width / 2 && candidate.x <= bounds.right - size.width / 2 && candidate.y >= bounds.top + size.height / 2 && candidate.y <= bounds.bottom - size.height / 2);
      candidates.sort((first, second) => Math.hypot(first.x - result.x, first.y - result.y) - Math.hypot(second.x - result.x, second.y - result.y));
      if (candidates[0]) { result = candidates[0]; moved = true; }
    }
    if (!moved) break;
  }
  const overlaps = candidate => obstacles.some(obstacle => Math.abs(candidate.x-obstacle.x)<(size.width+obstacle.width)/2+gap && Math.abs(candidate.y-obstacle.y)<(size.height+obstacle.height)/2+gap);
  if(overlaps(result)) {
    const candidates=[];
    for(let vertical=bounds.top+size.height/2;vertical<=bounds.bottom-size.height/2;vertical+=8) {
      for(let horizontal=bounds.left+size.width/2;horizontal<=bounds.right-size.width/2;horizontal+=8) {
        const candidate={x:horizontal,y:vertical};
        if(!overlaps(candidate))candidates.push(candidate);
      }
    }
    candidates.sort((first,second)=>Math.hypot(first.x-point.x,first.y-point.y)-Math.hypot(second.x-point.x,second.y-point.y));
    if(candidates[0])result=candidates[0];
  }
  return result;
}