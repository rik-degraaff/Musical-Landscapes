export const BPM = 92;
export const BEATS_PER_BAR = 4;
export const BAR = '1m';

export const DRUM_HITS = new Set(['kick', 'snare', 'hat', 'shaker', 'tom', 'clap', 'rim']);

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
export function note(root, semitones, octave) {
  const midi = NOTE_NAMES.indexOf(root) + 12 * (octave + 1) + semitones;
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const oct = Math.floor(midi / 12) - 1;
  return `${name}${oct}`;
}

export function transposeEvents(events, root) {
  return events.map(e => ({
    ...e,
    notes: e.notes?.map(n => transposeNote(n, root)) ?? undefined,
    note: e.note && !DRUM_HITS.has(e.note) ? transposeNote(e.note, root) : e.note,
  }));
}

function transposeNote(value, root) {
  const match = /^([A-G]#?)(-?\d+)$/.exec(value);
  if (!match) return value;
  const midi = (parseInt(match[2], 10) + 1) * 12 + NOTE_NAMES.indexOf(match[1]);
  const rootMidi = 12 * 5 + NOTE_NAMES.indexOf(root);
  const relative = midi - (12 * 5 + NOTE_NAMES.indexOf('C'));
  const transposedMidi = rootMidi + relative;
  return `${NOTE_NAMES[((transposedMidi % 12) + 12) % 12]}${Math.floor(transposedMidi / 12) - 1}`;
}

export function nearestBar(bars, energy, complexity) {
  let best = bars[0];
  let bestDistance = Infinity;
  for (const bar of bars) {
    const de = bar.energy - energy;
    const dc = bar.complexity - complexity;
    const distance = de * de + dc * dc;
    if (distance < bestDistance) { bestDistance = distance; best = bar; }
  }
  return best;
}

// Each instrument has hand-authored one-bar phrases. Energy and complexity
// stay independent, so a busy phrase can still be played gently.
const P = (energy, complexity, events) => ({ energy, complexity, events });

export const patterns = {
  piano: [
    P(.06,.08,[{time:'0:0:0',notes:['C3','G3','E4','G4'],dur:'1m',velocity:.34}]),
    P(.15,.23,[{time:'0:0:0',notes:['C4','E4','G4'],dur:'2n',velocity:.42},{time:'0:2:0',notes:['G3','D4','G4'],dur:'2n',velocity:.36}]),
    P(.22,.43,[{time:'0:0:0',notes:['C4','G4'],dur:'8n',velocity:.43},{time:'0:1:0',notes:['E4','G4'],dur:'4n',velocity:.36},{time:'0:2:0',notes:['D4','G4'],dur:'8n',velocity:.4},{time:'0:3:0',notes:['E4','C5'],dur:'4n',velocity:.38}]),
    P(.31,.18,[{time:'0:0:0',notes:['C3','G3','E4'],dur:'2n',velocity:.35},{time:'0:2:0',notes:['G3','D4','G4'],dur:'2n',velocity:.32}]),
    P(.38,.48,[{time:'0:0:0',notes:['C4','E4'],dur:'8n',velocity:.48},{time:'0:1:2',notes:['G4','C5'],dur:'8n',velocity:.38},{time:'0:2:0',notes:['D4','G4'],dur:'4n',velocity:.4},{time:'0:3:2',notes:['E4','G4'],dur:'8n',velocity:.38}]),
    P(.46,.34,[{time:'0:0:0',notes:['C4','G4'],dur:'4n',velocity:.45},{time:'0:1:0',notes:['E4','G4','C5'],dur:'4n',velocity:.35},{time:'0:2:2',notes:['D4','G4'],dur:'8n',velocity:.4},{time:'0:3:0',notes:['C4','E4','G4'],dur:'4n',velocity:.36}]),
    P(.54,.60,[{time:'0:0:0',notes:['C4','E4','G4'],dur:'8n',velocity:.5},{time:'0:0:2',notes:['D4','G4'],dur:'8n',velocity:.34},{time:'0:1:0',notes:['E4','G4','C5'],dur:'4n',velocity:.4},{time:'0:2:0',notes:['D4','F4','A4'],dur:'8n',velocity:.42},{time:'0:3:0',notes:['E4','G4','B4'],dur:'8n',velocity:.38}]),
    P(.63,.40,[{time:'0:0:0',notes:['C4','G4'],dur:'8n',velocity:.46},{time:'0:1:0',notes:['E4','C5'],dur:'8n',velocity:.4},{time:'0:2:0',notes:['G3','D4','G4'],dur:'4n',velocity:.4},{time:'0:3:0',notes:['D4','G4','B4'],dur:'8n',velocity:.42},{time:'0:3:2',notes:['E4','G4'],dur:'8n',velocity:.34}]),
    P(.69,.74,[{time:'0:0:0',notes:['C4','E4'],dur:'8n',velocity:.5},{time:'0:0:2',notes:['G4','C5'],dur:'8n',velocity:.38},{time:'0:1:0',notes:['E4','G4'],dur:'8n',velocity:.43},{time:'0:1:2',notes:['D4','B4'],dur:'8n',velocity:.35},{time:'0:2:0',notes:['C4','E4','G4'],dur:'8n',velocity:.5},{time:'0:2:2',notes:['D4','G4'],dur:'8n',velocity:.34},{time:'0:3:0',notes:['E4','B4'],dur:'8n',velocity:.42}]),
    P(.77,.56,[{time:'0:0:0',notes:['C4','E4','G4'],dur:'4n',velocity:.54},{time:'0:1:2',notes:['D4','G4'],dur:'8n',velocity:.4},{time:'0:2:0',notes:['E4','G4','C5'],dur:'4n',velocity:.46},{time:'0:3:2',notes:['D4','G4','B4'],dur:'8n',velocity:.4}]),
    P(.83,.86,[{time:'0:0:0',notes:['C4','E4','G4'],dur:'8n',velocity:.56},{time:'0:0:2',notes:['D4','F4','A4'],dur:'8n',velocity:.4},{time:'0:1:0',notes:['E4','G4','B4'],dur:'8n',velocity:.48},{time:'0:1:2',notes:['C5','G4'],dur:'8n',velocity:.38},{time:'0:2:0',notes:['D4','G4','B4'],dur:'8n',velocity:.5},{time:'0:2:2',notes:['E4','A4'],dur:'8n',velocity:.38},{time:'0:3:0',notes:['C4','E4','G4'],dur:'8n',velocity:.52},{time:'0:3:2',notes:['D4','G4'],dur:'8n',velocity:.36}]),
    P(.94,.68,[{time:'0:0:0',notes:['C4','G4'],dur:'8n',velocity:.55},{time:'0:0:2',notes:['E4','G4'],dur:'8n',velocity:.42},{time:'0:1:0',notes:['D4','G4','B4'],dur:'4n',velocity:.48},{time:'0:2:0',notes:['C4','E4','G4'],dur:'8n',velocity:.54},{time:'0:2:2',notes:['G4','C5'],dur:'8n',velocity:.42},{time:'0:3:0',notes:['E4','G4','C5'],dur:'4n',velocity:.48}]),
  ],
  guitar: [
    P(.06,.05,[{time:'0:0:0',notes:['C3','G3','E4'],dur:'2n',velocity:.52},{time:'0:2:0',notes:['G3','B3','D4'],dur:'2n',velocity:.44}]),
    P(.16,.18,[{time:'0:0:0',note:'C3',dur:'4n',velocity:.62},{time:'0:1:0',note:'E4',dur:'4n',velocity:.5},{time:'0:2:0',note:'G3',dur:'4n',velocity:.54},{time:'0:3:0',note:'C4',dur:'4n',velocity:.48}]),
    P(.27,.30,[{time:'0:0:0',note:'C3',dur:'4n',velocity:.6},{time:'0:0:2',note:'G3',dur:'8n',velocity:.46},{time:'0:1:0',note:'E4',dur:'4n',velocity:.5},{time:'0:2:0',note:'G3',dur:'4n',velocity:.56},{time:'0:3:0',note:'D4',dur:'4n',velocity:.48}]),
    P(.38,.42,[{time:'0:0:0',notes:['C3','G3','E4'],dur:'4n',velocity:.58},{time:'0:1:2',notes:['G3','C4','E4'],dur:'8n',velocity:.45},{time:'0:2:0',notes:['G3','B3','D4'],dur:'4n',velocity:.54},{time:'0:3:2',note:'B3',dur:'8n',velocity:.44}]),
    P(.5,.22,[{time:'0:0:0',notes:['C3','E3','G3','C4'],dur:'2n',velocity:.62},{time:'0:2:0',notes:['G3','B3','D4'],dur:'2n',velocity:.52}]),
    P(.58,.57,[{time:'0:0:0',note:'C3',dur:'8n',velocity:.64},{time:'0:0:2',note:'G3',dur:'8n',velocity:.48},{time:'0:1:0',note:'E4',dur:'8n',velocity:.56},{time:'0:1:2',note:'G3',dur:'8n',velocity:.46},{time:'0:2:0',note:'A3',dur:'8n',velocity:.6},{time:'0:2:2',note:'E4',dur:'8n',velocity:.5},{time:'0:3:0',note:'C4',dur:'8n',velocity:.54},{time:'0:3:2',note:'G3',dur:'8n',velocity:.46}]),
    P(.7,.76,[{time:'0:0:0',notes:['C3','G3','E4'],dur:'4n',velocity:.66},{time:'0:1:0',note:'G4',dur:'8n',velocity:.5},{time:'0:1:2',note:'E4',dur:'8n',velocity:.48},{time:'0:2:0',notes:['A3','C4','E4'],dur:'4n',velocity:.6},{time:'0:3:0',notes:['G3','B3','D4'],dur:'4n',velocity:.54}]),
    P(.82,.48,[{time:'0:0:0',notes:['C3','E3','G3','C4'],dur:'4n',velocity:.68},{time:'0:1:2',notes:['G3','C4','E4'],dur:'8n',velocity:.5},{time:'0:2:0',notes:['A3','C4','E4'],dur:'4n',velocity:.62},{time:'0:3:2',notes:['G3','B3','D4'],dur:'8n',velocity:.52}]),
    P(.92,.92,[{time:'0:0:0',note:'C3',dur:'8n',velocity:.68},{time:'0:0:2',note:'G3',dur:'8n',velocity:.5},{time:'0:1:0',notes:['C4','E4'],dur:'8n',velocity:.58},{time:'0:1:2',note:'G4',dur:'8n',velocity:.5},{time:'0:2:0',note:'A3',dur:'8n',velocity:.64},{time:'0:2:2',notes:['C4','E4'],dur:'8n',velocity:.52},{time:'0:3:0',note:'D4',dur:'8n',velocity:.58},{time:'0:3:2',note:'B3',dur:'8n',velocity:.5}]),
  ],
  melody: [
    P(.07,.08,[{time:'0:0:0',note:'G4',dur:'2n',velocity:.32},{time:'0:2:0',note:'E4',dur:'2n',velocity:.28}]),
    P(.18,.2,[{time:'0:0:0',note:'G4',dur:'2n',velocity:.42},{time:'0:2:0',note:'E4',dur:'2n',velocity:.34}]),
    P(.29,.35,[{time:'0:0:0',note:'G4',dur:'4n',velocity:.44},{time:'0:1:0',note:'A4',dur:'4n',velocity:.36},{time:'0:2:0',note:'B4',dur:'2n',velocity:.42}]),
    P(.4,.18,[{time:'0:0:0',note:'G4',dur:'2n',velocity:.42},{time:'0:2:0',note:'D5',dur:'2n',velocity:.34}]),
    P(.49,.48,[{time:'0:0:0',note:'G4',dur:'8n',velocity:.5},{time:'0:1:0',note:'A4',dur:'8n',velocity:.38},{time:'0:2:0',note:'B4',dur:'4n',velocity:.46},{time:'0:3:0',note:'G4',dur:'8n',velocity:.4}]),
    P(.61,.62,[{time:'0:0:0',note:'G4',dur:'8n',velocity:.51},{time:'0:0:2',note:'A4',dur:'8n',velocity:.37},{time:'0:1:0',note:'B4',dur:'4n',velocity:.46},{time:'0:2:0',note:'A4',dur:'8n',velocity:.45},{time:'0:2:2',note:'G4',dur:'8n',velocity:.38},{time:'0:3:0',note:'E4',dur:'4n',velocity:.44}]),
    P(.72,.42,[{time:'0:0:0',note:'D5',dur:'4n',velocity:.52},{time:'0:1:0',note:'B4',dur:'4n',velocity:.42},{time:'0:2:0',note:'A4',dur:'2n',velocity:.46}]),
    P(.83,.82,[{time:'0:0:0',note:'G4',dur:'8n',velocity:.54},{time:'0:0:2',note:'B4',dur:'8n',velocity:.4},{time:'0:1:0',note:'D5',dur:'8n',velocity:.48},{time:'0:1:2',note:'B4',dur:'8n',velocity:.4},{time:'0:2:0',note:'A4',dur:'8n',velocity:.48},{time:'0:2:2',note:'G4',dur:'8n',velocity:.4},{time:'0:3:0',note:'E4',dur:'4n',velocity:.45}]),
    P(.94,.6,[{time:'0:0:0',note:'G4',dur:'4n',velocity:.55},{time:'0:1:0',note:'B4',dur:'8n',velocity:.44},{time:'0:2:0',note:'D5',dur:'4n',velocity:.5},{time:'0:3:0',note:'G4',dur:'4n',velocity:.44}]),
  ],
  drums: [
    P(.06,.08,[{time:'0:0:0',note:'kick',velocity:.48},{time:'0:2:0',note:'kick',velocity:.38}]),
    P(.17,.2,[{time:'0:0:0',note:'kick',velocity:.53},{time:'0:2:0',note:'snare',velocity:.32}]),
    P(.3,.35,[{time:'0:0:0',note:'kick',velocity:.52},{time:'0:1:0',note:'hat',velocity:.25},{time:'0:2:0',note:'snare',velocity:.36},{time:'0:3:0',note:'hat',velocity:.28}]),
    P(.4,.2,[{time:'0:0:0',note:'kick',velocity:.52},{time:'0:1:0',note:'shaker',velocity:.25},{time:'0:2:0',note:'snare',velocity:.35},{time:'0:3:0',note:'shaker',velocity:.28}]),
    P(.5,.5,[{time:'0:0:0',note:'kick',velocity:.55},{time:'0:1:0',note:'hat',velocity:.28},{time:'0:2:0',note:'snare',velocity:.38},{time:'0:3:0',note:'hat',velocity:.3},{time:'0:3:2',note:'hat',velocity:.22}]),
    P(.61,.64,[{time:'0:0:0',note:'kick',velocity:.58},{time:'0:0:2',note:'hat',velocity:.23},{time:'0:1:0',note:'rim',velocity:.29},{time:'0:1:2',note:'hat',velocity:.22},{time:'0:2:0',note:'snare',velocity:.42},{time:'0:2:2',note:'shaker',velocity:.22},{time:'0:3:0',note:'hat',velocity:.29},{time:'0:3:2',note:'kick',velocity:.38}]),
    P(.7,.42,[{time:'0:0:0',note:'kick',velocity:.6},{time:'0:1:0',note:'clap',velocity:.34},{time:'0:2:0',note:'kick',velocity:.48},{time:'0:3:0',note:'clap',velocity:.32}]),
    P(.79,.75,[{time:'0:0:0',note:'kick',velocity:.59},{time:'0:0:2',note:'hat',velocity:.25},{time:'0:1:0',note:'hat',velocity:.3},{time:'0:1:2',note:'kick',velocity:.4},{time:'0:2:0',note:'snare',velocity:.43},{time:'0:2:2',note:'hat',velocity:.25},{time:'0:3:0',note:'tom',velocity:.39},{time:'0:3:2',note:'hat',velocity:.24}]),
    P(.9,.93,[{time:'0:0:0',note:'kick',velocity:.64},{time:'0:0:2',note:'hat',velocity:.26},{time:'0:1:0',note:'snare',velocity:.43},{time:'0:1:2',note:'hat',velocity:.27},{time:'0:2:0',note:'kick',velocity:.56},{time:'0:2:2',note:'hat',velocity:.26},{time:'0:3:0',note:'snare',velocity:.46},{time:'0:3:2',note:'hat',velocity:.29}]),
  ],
  marimba: [
    P(.07,.08,[{time:'0:0:0',note:'G5',dur:'2n.',velocity:.34},{time:'0:2:0',note:'E5',dur:'4n',velocity:.28}]),
    P(.2,.24,[{time:'0:0:0',note:'C5',dur:'4n',velocity:.43},{time:'0:1:0',note:'E5',dur:'4n',velocity:.34},{time:'0:2:0',note:'G5',dur:'2n',velocity:.38}]),
    P(.34,.4,[{time:'0:0:0',note:'C5',dur:'8n',velocity:.43},{time:'0:1:0',note:'G5',dur:'4n',velocity:.35},{time:'0:2:0',note:'E5',dur:'8n',velocity:.39},{time:'0:3:0',note:'D5',dur:'4n',velocity:.33}]),
    P(.48,.2,[{time:'0:0:0',note:'C5',dur:'2n',velocity:.45},{time:'0:2:0',note:'G5',dur:'2n',velocity:.36}]),
    P(.6,.58,[{time:'0:0:0',note:'E5',dur:'8n',velocity:.49},{time:'0:0:2',note:'G5',dur:'8n',velocity:.35},{time:'0:1:0',note:'C6',dur:'4n',velocity:.41},{time:'0:2:0',note:'G5',dur:'8n',velocity:.43},{time:'0:3:0',note:'E5',dur:'4n',velocity:.37}]),
    P(.75,.8,[{time:'0:0:0',note:'C5',dur:'8n',velocity:.52},{time:'0:0:2',note:'E5',dur:'8n',velocity:.36},{time:'0:1:0',note:'G5',dur:'8n',velocity:.45},{time:'0:1:2',note:'C6',dur:'8n',velocity:.38},{time:'0:2:0',note:'B5',dur:'8n',velocity:.44},{time:'0:2:2',note:'G5',dur:'8n',velocity:.36},{time:'0:3:0',note:'E5',dur:'4n',velocity:.42}]),
    P(.91,.95,[{time:'0:0:0',note:'C5',dur:'8n',velocity:.56},{time:'0:0:2',note:'E5',dur:'8n',velocity:.39},{time:'0:1:0',note:'G5',dur:'8n',velocity:.49},{time:'0:1:2',note:'B5',dur:'8n',velocity:.4},{time:'0:2:0',note:'C6',dur:'8n',velocity:.52},{time:'0:2:2',note:'G5',dur:'8n',velocity:.38},{time:'0:3:0',note:'E5',dur:'8n',velocity:.46},{time:'0:3:2',note:'D5',dur:'8n',velocity:.35}]),
  ],
  flute: [
    P(.06,.08,[{time:'0:0:0',note:'G4',dur:'1m',velocity:.28}]),
    P(.18,.2,[{time:'0:0:0',note:'G4',dur:'2n',velocity:.38},{time:'0:2:0',note:'E4',dur:'2n',velocity:.31}]),
    P(.3,.35,[{time:'0:0:0',note:'G4',dur:'4n',velocity:.4},{time:'0:1:0',note:'A4',dur:'4n',velocity:.32},{time:'0:2:0',note:'C5',dur:'2n',velocity:.38}]),
    P(.42,.2,[{time:'0:0:0',note:'E5',dur:'2n',velocity:.39},{time:'0:2:0',note:'D5',dur:'2n',velocity:.32}]),
    P(.56,.5,[{time:'0:0:0',note:'G4',dur:'4n',velocity:.44},{time:'0:1:0',note:'B4',dur:'4n',velocity:.34},{time:'0:2:0',note:'D5',dur:'4n',velocity:.4},{time:'0:3:0',note:'B4',dur:'4n',velocity:.32}]),
    P(.7,.68,[{time:'0:0:0',note:'D5',dur:'4n',velocity:.47},{time:'0:1:0',note:'E5',dur:'8n',velocity:.36},{time:'0:1:2',note:'D5',dur:'8n',velocity:.32},{time:'0:2:0',note:'B4',dur:'4n',velocity:.41},{time:'0:3:0',note:'G4',dur:'4n',velocity:.38}]),
    P(.86,.9,[{time:'0:0:0',note:'G4',dur:'8n',velocity:.5},{time:'0:0:2',note:'B4',dur:'8n',velocity:.37},{time:'0:1:0',note:'D5',dur:'4n',velocity:.45},{time:'0:2:0',note:'E5',dur:'8n',velocity:.43},{time:'0:2:2',note:'D5',dur:'8n',velocity:.35},{time:'0:3:0',note:'B4',dur:'4n',velocity:.41}]),
  ],
};

export const INSTRUMENTS = {
  piano:{label:'Piano', icon:'🎹', volume:-7, x:15, y:35, seed:11},
  drums:{label:'Drums', icon:'🥁', volume:-9, x:50, y:35, seed:23},
  guitar:{label:'Acoustic guitar', icon:'🎸', volume:-5, x:85, y:35, seed:37},
  melody:{label:'Trumpet', icon:'🎺', volume:-10, x:15, y:67, seed:51},
  marimba:{label:'Marimba', icon:'🎶', volume:-9, x:50, y:67, seed:63},
  flute:{label:'Flute', icon:'🪈', volume:-12, x:85, y:67, seed:77},
};
