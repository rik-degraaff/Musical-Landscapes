import { mkdir, writeFile } from 'node:fs/promises';
import { SCENE_RECORDINGS } from '../src/audio/sceneRecordings.js';

const destination = new URL('../public/audio/scenery/source/', import.meta.url);
await mkdir(destination, { recursive: true });
for (const [name, recording] of Object.entries(SCENE_RECORDINGS)) {
  const response = await fetch(recording.url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Could not download ${name}: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000) throw new Error(`Empty ${name} recording`);
  await writeFile(new URL(recording.file, destination), bytes);
  console.log(`${name}: ${bytes.length} bytes`);
}