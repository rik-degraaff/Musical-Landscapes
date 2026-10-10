import { mkdir, writeFile } from 'node:fs/promises';
import { SCENE_RECORDINGS } from '../src/audio/sceneRecordings.js';
import { FIELD_RECORDINGS } from '../src/audio/sceneSounds.js';

const recordings = { ...SCENE_RECORDINGS, ...FIELD_RECORDINGS };
const requested = process.argv.find(argument => argument.startsWith('--sounds='))?.slice(9).split(',');
if (requested?.some(name => !Object.hasOwn(recordings, name))) throw new Error('Unknown recorded scenery sound');

const destination = new URL('../public/audio/scenery/source/', import.meta.url);
await mkdir(destination, { recursive: true });
for (const [name, recording] of Object.entries(recordings)) {
  if (requested && !requested.includes(name)) continue;
  const response = await fetch(recording.url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Could not download ${name}: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000) throw new Error(`Empty ${name} recording`);
  await writeFile(new URL(recording.file, destination), bytes);
  console.log(`${name}: ${bytes.length} bytes`);
}