import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { DRUM_SAMPLES, SAMPLE_LIBRARY } from '../src/audio/sampleLibrary.js';

const destination = new URL('../public/audio/instruments/', import.meta.url);
let totalBytes = 0;
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--only')) throw new Error('Usage: node scripts/download-instruments.mjs [--only ukulele,panflute]');
const selected = args.length ? args[1].split(',') : [...Object.keys(SAMPLE_LIBRARY), 'drums'];
if (selected.some(name => !SAMPLE_LIBRARY[name] && name !== 'drums')) throw new Error(`Unknown instrument selection: ${args[1]}`);
const download = async url => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(90000) });
      if (!response.ok) throw new Error(`Download failed: ${url} (${response.status})`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      if (attempt === 3) throw error;
    }
  }
};
const validate = (bytes, extension, label) => {
  const valid = extension === 'flac'
    ? bytes.subarray(0, 4).toString() === 'fLaC'
    : extension === 'mp3' && (bytes.subarray(0, 3).toString() === 'ID3' || (bytes[0] === 255 && (bytes[1] & 224) === 224));
  if (bytes.length < 1000 || !valid) throw new Error(`Invalid ${extension} recording: ${label}`);
};

await Promise.all(Object.entries(SAMPLE_LIBRARY).filter(([name]) => selected.includes(name)).map(async ([name, instrument]) => {
  let samples;
  if (!instrument.rootUrl) {
    const url = instrument.url ?? `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/${instrument.source}-mp3.js`;
    const source = (await download(url)).toString('utf8');
    const assignment = /MIDI\.Soundfont\.\w+\s*=\s*(\{[\s\S]*\})\s*;?\s*$/.exec(source);
    if (!assignment) throw new Error(`Unrecognized soundfont format: ${instrument.source}`);
    samples = JSON.parse(assignment[1].replace(/,\s*}$/, '}'));
    if (!samples || typeof samples !== 'object' || Array.isArray(samples)) throw new Error(`Invalid soundfont map: ${name}`);
  }
  const directory = new URL(`${name}/`, destination);
  await mkdir(directory, { recursive: true });
  for (const note of instrument.notes) {
    const extension = instrument.extension ?? 'mp3';
    let bytes;
    if (instrument.rootUrl) {
      bytes = await download(new URL(`${encodeURIComponent(note)}.${extension}`, instrument.rootUrl));
    } else {
      const flats = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };
      const sourceNote = note.replace(/^[A-G]#/, pitch => flats[pitch]);
      const encoded = samples[note] ?? samples[sourceNote];
      if (typeof encoded !== 'string' || !/^data:audio\/mp3;base64,[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new Error(`Missing or invalid MP3: ${name} ${note}`);
      bytes = Buffer.from(encoded.slice(encoded.indexOf(',') + 1), 'base64');
    }
    validate(bytes, extension, `${name} ${note}`);
    await writeFile(new URL(`${note.replace('#', 's')}.${extension}`, directory), bytes);
    totalBytes += bytes.length;
  }
  console.log(`${name}: ${instrument.notes.length} recorded notes`);
}));

if (selected.includes('drums')) {
  const drumDirectory = new URL('drums/', destination);
  await mkdir(drumDirectory, { recursive: true });
  for (const [name, sample] of Object.entries(DRUM_SAMPLES)) {
    const bytes = await download(sample.url);
    validate(bytes, sample.file.split('.').at(-1), name);
    await writeFile(new URL(sample.file, drumDirectory), bytes);
    totalBytes += bytes.length;
  }
  for (const file of ['README.txt', 'LICENSE.txt']) {
    const bytes = await download(`https://raw.githubusercontent.com/freepats/muldjordkit/main/${file}`);
    await writeFile(new URL(`MuldjordKit-${file}`, destination), bytes);
  }
}
console.log(`Downloaded ${(totalBytes / 1024 / 1024).toFixed(2)} MB to ${fileURLToPath(destination)}`);