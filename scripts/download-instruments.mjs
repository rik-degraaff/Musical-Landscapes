import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { DRUM_SAMPLES, SAMPLE_LIBRARY } from '../src/audio/sampleLibrary.js';

const destination = new URL('../public/audio/instruments/', import.meta.url);
let totalBytes = 0;

await Promise.all(Object.entries(SAMPLE_LIBRARY).map(async ([name, instrument]) => {
  const url = `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/${instrument.source}-mp3.js`;
  const response = await fetch(url, { signal: AbortSignal.timeout(90000) });
  if (!response.ok) throw new Error(`Download failed: ${url} (${response.status})`);
  const source = await response.text();
  const assignment = /MIDI\.Soundfont\.\w+\s*=\s*(\{[\s\S]*\})\s*;?\s*$/.exec(source);
  if (!assignment) throw new Error(`Unrecognized soundfont format: ${instrument.source}`);
  const samples = JSON.parse(assignment[1].replace(/,\s*}$/, '}'));
  const directory = new URL(`${name}/`, destination);
  await mkdir(directory, { recursive: true });
  for (const note of instrument.notes) {
    const flats = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };
    const sourceNote = note.replace(/^[A-G]#/, pitch => flats[pitch]);
    const encoded = samples[note] ?? samples[sourceNote];
    if (typeof encoded !== 'string' || !encoded.startsWith('data:audio/mp3;base64,')) throw new Error(`Missing MP3: ${name} ${note}`);
    const bytes = Buffer.from(encoded.slice(encoded.indexOf(',') + 1), 'base64');
    if (bytes.length < 1000) throw new Error(`Empty recording: ${name} ${note}`);
    await writeFile(new URL(`${note.replace('#', 's')}.mp3`, directory), bytes);
    totalBytes += bytes.length;
  }
  console.log(`${name}: ${instrument.notes.length} recorded notes`);
}));

const drumDirectory = new URL('drums/', destination);
await mkdir(drumDirectory, { recursive: true });
for (const [name, sample] of Object.entries(DRUM_SAMPLES)) {
  const response = await fetch(sample.url, { signal: AbortSignal.timeout(90000) });
  if (!response.ok) throw new Error(`Download failed: ${sample.url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000 || (sample.file.endsWith('.flac') && bytes.subarray(0, 4).toString() !== 'fLaC')) throw new Error(`Invalid drum recording: ${name}`);
  await writeFile(new URL(sample.file, drumDirectory), bytes);
  totalBytes += bytes.length;
}
for (const file of ['README.txt', 'LICENSE.txt']) {
  const response = await fetch(`https://raw.githubusercontent.com/freepats/muldjordkit/main/${file}`);
  if (!response.ok) throw new Error(`Missing drum license: ${file}`);
  await writeFile(new URL(`MuldjordKit-${file}`, destination), await response.text());
}
console.log(`Downloaded ${(totalBytes / 1024 / 1024).toFixed(2)} MB to ${fileURLToPath(destination)}`);