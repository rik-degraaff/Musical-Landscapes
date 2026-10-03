export const SAMPLE_LIBRARY = {
  piano: { source: 'acoustic_grand_piano', notes: ['C3', 'E3', 'G#3', 'C4', 'E4', 'G#4', 'C5', 'E5', 'G#5', 'C6'], release: 0.65 },
  guitar: { source: 'acoustic_guitar_nylon', notes: ['C3', 'E3', 'G#3', 'C4', 'E4', 'G#4', 'C5', 'E5'], release: 0.4 },
  melody: { source: 'trumpet', notes: ['C4', 'E4', 'G#4', 'C5', 'E5', 'G#5', 'C6'], release: 0.15 },
  marimba: { source: 'marimba', notes: ['C5', 'E5', 'G#5', 'C6', 'E6', 'G#6'], release: 0.35 },
  flute: { source: 'flute', notes: ['C4', 'E4', 'G#4', 'C5', 'E5', 'G#5', 'C6'], release: 0.22 },
};

export const DRUM_SAMPLES = {
  kick: { file: 'kick.flac', url: 'https://raw.githubusercontent.com/freepats/muldjordkit/main/samples/KdrumL/1-KdrumL.flac' },
  snare: { file: 'snare.flac', url: 'https://raw.githubusercontent.com/freepats/muldjordkit/main/samples/Snare1/10-Snare.flac' },
  hat: { file: 'hat.flac', url: 'https://raw.githubusercontent.com/freepats/muldjordkit/main/samples/HihatClosed/10-HihatClosed.flac' },
  tom: { file: 'tom.flac', url: 'https://raw.githubusercontent.com/freepats/muldjordkit/main/samples/Tom1/10-Tom1.flac' },
  clap: { file: 'clap.mp3', url: 'https://cdn.freesound.org/previews/561/561119_12517458-hq.mp3' },
};

export const DRUM_NOTES = { kick: 'C2', snare: 'D2', hat: 'F#2', tom: 'G2', clap: 'D#2', rim: 'C#2', shaker: 'A#2' };

export function sampleUrls(name) {
  const instrument = SAMPLE_LIBRARY[name];
  if (!instrument) throw new Error(`Unknown sampled instrument: ${name}`);
  return Object.fromEntries(instrument.notes.map(note => [note, `${name}/${note.replace('#', 's')}.mp3`]));
}