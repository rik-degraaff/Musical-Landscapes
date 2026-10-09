import { midiNote } from '../utils/performance.js';

const range = (start, count, existing) => [...new Set([...existing, ...Array.from({length:count},(_,index)=>midiNote(start+index))])];
export const SAMPLE_LIBRARY = {
  piano: { source: 'acoustic_grand_piano', notes: range(60,17,['C3','E3','G#3','G#5','C6']), release: 0.65 },
  guitar: { source: 'acoustic_guitar_nylon', notes: range(40,28,['G#4','C5','E5']), release: 0.4 },
  melody: { source: 'trumpet', notes: range(54,26,['G#5','C6']), release: 0.15 },
  marimba: { source: 'marimba', notes: range(72,13,['E6','G#6']), release: 0.35 },
  flute: { source: 'flute', notes: range(60,13,['E5','G#5','C6']), release: 0.22 },
  ukulele: {
    source: 'FreePats Ukulele 2026-08-11',
    url: 'https://freepats.zenvoid.org/GuitarFamily/ukulele.html',
    rootUrl: 'https://raw.githubusercontent.com/freepats/ukulele1/86d345f6f7b79a106ace98eca0da19b087786dba/samples/',
    license: 'CC0-1.0',
    licenseUrl: 'https://github.com/freepats/ukulele1/blob/86d345f6f7b79a106ace98eca0da19b087786dba/LICENSE.txt',
    author: 'Mateusz Dąbrowski',
    extension: 'flac',
    notes: ['C4','D4','E4','F#4','G4','A4','B4','C#5','D#5','F5','G5','A5','C6'],
    release: 0.35,
  },
  panflute: {
    source: 'pan_flute',
    url: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/pan_flute-mp3.js',
    license: 'CC-BY-3.0-US',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/us/',
    notes: range(60,22,[]),
    release: 0.22,
  },
};

export const DRUM_SAMPLES = {
  kick: { file: 'kick.flac', url: 'https://raw.githubusercontent.com/freepats/muldjordkit/main/samples/KdrumL/1-KdrumL.flac' },
  snare: { file: 'snare.flac', url: 'https://raw.githubusercontent.com/freepats/muldjordkit/main/samples/Snare1/10-Snare.flac' },
  hat: { file: 'hat.flac', url: 'https://raw.githubusercontent.com/freepats/muldjordkit/main/samples/HihatClosed/10-HihatClosed.flac' },
  tom: { file: 'tom.flac', url: 'https://raw.githubusercontent.com/freepats/muldjordkit/main/samples/Tom1/10-Tom1.flac' },
  clap: { file: 'clap.mp3', url: 'https://cdn.freesound.org/previews/561/561119_12517458-hq.mp3' },
  crash: { file:'crash.flac',url:'https://raw.githubusercontent.com/freepats/muldjordkit/main/samples/CrashL/1-CrashL.flac' },
  ride: { file:'ride.flac',url:'https://raw.githubusercontent.com/freepats/muldjordkit/main/samples/RideL/10-RideL.flac' },
  floorTom: { file:'floor-tom.flac',url:'https://raw.githubusercontent.com/freepats/muldjordkit/main/samples/Tom4/10-Tom4.flac' },
};

export const DRUM_NOTES = { kick: 'C2', snare: 'D2', hat: 'F#2', tom: 'G2', clap: 'D#2', rim: 'C#2', shaker: 'A#2', crash:'C#3',ride:'D#3',floorTom:'F2' };

export function sampleUrls(name) {
  const instrument = SAMPLE_LIBRARY[name];
  if (!instrument) throw new Error(`Unknown sampled instrument: ${name}`);
  return Object.fromEntries(instrument.notes.map(note => [note, `${name}/${note.replace('#', 's')}.${instrument.extension ?? 'mp3'}`]));
}