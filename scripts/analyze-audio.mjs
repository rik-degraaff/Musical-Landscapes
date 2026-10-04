import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import ffmpeg from 'ffmpeg-static';
import { SAMPLE_LIBRARY, DRUM_SAMPLES, sampleUrls } from '../src/audio/sampleLibrary.js';
import { SCENE_SOUNDS, createSceneSample, WATER_DROP_TIMES, WATER_DURATION } from '../src/audio/sceneSounds.js';

const root = new URL('../', import.meta.url);
const rate = 48000;
const path = relative => fileURLToPath(new URL(relative, root));
const run = args => {
  const result = spawnSync(ffmpeg, args, { maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(result.stderr.toString());
  return result;
};
const decode = file => {
  const bytes = run(['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '1', '-ar', String(rate), 'pipe:1']).stdout;
  return Float32Array.from({ length: bytes.length / 4 }, (_, index) => bytes.readFloatLE(index * 4));
};
const wav = (samples, file) => {
  const bytes = Buffer.alloc(44 + samples.length * 2);
  bytes.write('RIFF'); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(rate, 24); bytes.writeUInt32LE(rate * 2, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36); bytes.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((value, index) => bytes.writeInt16LE(Math.round(Math.max(-1, Math.min(1, value)) * 32767), 44 + index * 2));
  writeFileSync(file, bytes);
};

mkdirSync(path('public/audio/scenery'), { recursive: true });
const rawDrop = decode(path('public/audio/scenery/source/water-drop.mp3'));
const dropPeak = rawDrop.reduce((peak, value) => Math.max(peak, Math.abs(value)), 0);
const onset = Math.max(0, rawDrop.findIndex(value => Math.abs(value) > dropPeak * 0.08) - 48);
const drop = rawDrop.slice(onset, onset + Math.round(0.35 * rate));
drop.forEach((value, index) => {
  drop[index] = value * Math.min(1, index / (rate * 0.002), (drop.length - index - 1) / (rate * 0.025));
});
const water = new Float32Array(Math.ceil(WATER_DURATION * rate));
for (const impact of WATER_DROP_TIMES) water.set(drop, Math.round(impact * rate));
wav(water, path('public/audio/scenery/water.wav'));
const rooster = decode(path('public/audio/scenery/source/rooster.mp3'));
rooster.forEach((value, index) => { rooster[index] = value * Math.min(1, index / (rate * 0.015), (rooster.length - index - 1) / (rate * 0.05)); });
wav(rooster, path('public/audio/scenery/rooster.wav'));
for (const type of SCENE_SOUNDS) {
  if (type === 'water' || type === 'rooster') continue;
  wav(createSceneSample(type, rate), path(`public/audio/scenery/${type}.wav`));
}

const files = [
  ...Object.keys(SAMPLE_LIBRARY).flatMap(name => Object.values(sampleUrls(name)).map(file => ({ file: `instruments/${file}`, group: name, target: -20 }))),
  ...Object.values(DRUM_SAMPLES).map(sample => ({ file: `instruments/drums/${sample.file}`, group: 'drums', target: -20 })),
  ...SCENE_SOUNDS.map(type => ({ file: `scenery/${type}.wav`, group: type, target: type === 'water' ? -26 : -23 })),
];
const report = {};
const previous = process.argv.includes('--preserve-existing') ? JSON.parse(readFileSync(path('src/audio/audioLevels.json'),'utf8')) : {};
for (const { file, group, target } of files) {
  const samples = decode(path(`public/audio/${file}`));
  let peak = 0;
  let energy = 0;
  const blocks = [];
  for (let start = 0; start < samples.length; start += 2400) {
    let blockEnergy = 0;
    const end = Math.min(samples.length, start + 2400);
    for (let index = start; index < end; index++) {
      const value = samples[index];
      peak = Math.max(peak, Math.abs(value));
      blockEnergy += value * value;
    }
    energy += blockEnergy;
    blocks.push(blockEnergy / (end - start));
  }
  const loudest = Math.max(...blocks);
  const active = blocks.filter(value => value >= loudest / 100);
  const db = value => 20 * Math.log10(Math.max(value, 1e-10));
  const activeRmsDb = db(Math.sqrt(active.reduce((sum, value) => sum + value, 0) / active.length));
  const result = run(['-hide_banner', '-i', path(`public/audio/${file}`), '-af', 'loudnorm=I=-23:TP=-2:LRA=7:print_format=json', '-f', 'null', '-']);
  const stats = JSON.parse(/\{[\s\S]*\}/.exec(result.stderr.toString())[0]);
  const lufs = Number(stats.input_i);
  const measured = Number.isFinite(lufs) && lufs > -65 ? lufs : activeRmsDb;
  const peakDb = Math.max(db(peak), Number(stats.input_tp));
  const gainDb = Math.max(-24, Math.min(18, target - measured, -5 - peakDb));
  report[file] = { group, sha256: createHash('sha256').update(readFileSync(path(`public/audio/${file}`))).digest('hex'), duration: samples.length / rate, peakDb, rmsDb: db(Math.sqrt(energy / samples.length)), activeRmsDb, lufs: Number.isFinite(lufs) ? lufs : null, target, gainDb, correctedLufs: Number.isFinite(lufs) ? lufs + gainDb : null, correctedPeakDb: peakDb + gainDb };
  if(previous[file]?.sha256 === report[file].sha256) report[file]=previous[file];
}
writeFileSync(path('src/audio/audioLevels.json'), `${JSON.stringify(report, (_, value) => typeof value === 'number' ? Math.round(value * 100) / 100 : value, 2)}\n`);
console.table(files.map(({ file }) => ({ file, LUFS: report[file].lufs?.toFixed(1), RMS: report[file].rmsDb.toFixed(1), peak: report[file].peakDb.toFixed(1), gain: report[file].gainDb.toFixed(1) })));
console.log('Saved static gains and waveform measurements to src/audio/audioLevels.json');