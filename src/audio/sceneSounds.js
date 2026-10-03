export const SCENE_SOUNDS = ['moo', 'tractor', 'water', 'bird', 'frog', 'windmill', 'bell', 'owl'];
export const WATER_DROP_TIMES = [0.28, 0.93, 1.58];
export const WATER_DROP_FALL = 0.28;
export const WATER_DURATION = 1.85;

export function createSceneSample(type, sampleRate = 44100) {
  const duration = { moo: 1.5, tractor: 2.2, water: WATER_DURATION, bird: 1.1, frog: 1.2, windmill: 2, bell: 2.4, owl: 1.8 }[type];
  if (!duration) throw new Error(`Unknown landscape sound: ${type}`);
  const samples = new Float32Array(Math.ceil(sampleRate * duration));
  let phase = 0;
  let filteredNoise = 0;
  let seed = 12345;
  for (let index = 0; index < samples.length; index++) {
    const time = index / sampleRate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    filteredNoise += (noise - filteredNoise) * 0.08;
    let value = 0;
    if (type === 'moo') {
      const pitch = 105 + 32 * Math.sin(Math.PI * time / duration) - 18 * time / duration;
      phase += 2 * Math.PI * pitch / sampleRate;
      value = (Math.sin(phase) * 0.5 + Math.sin(phase * 3) * 0.22 + Math.sin(phase * 5) * 0.1) * Math.sin(Math.PI * time / duration) ** 0.7;
    } else if (type === 'bird') {
      const chirp = time % 0.34;
      phase += 2 * Math.PI * (2400 + 1600 * Math.sin(chirp * 18)) / sampleRate;
      value = chirp < 0.2 ? Math.sin(phase) * Math.sin(Math.PI * chirp / 0.2) * 0.32 : 0;
    } else if (type === 'owl') {
      const hoot = time % 0.9;
      phase += 2 * Math.PI * (330 + 35 * Math.sin(hoot * 7)) / sampleRate;
      value = hoot < 0.65 ? (Math.sin(phase) + 0.12 * Math.sin(phase * 2)) * Math.sin(Math.PI * hoot / 0.65) * 0.5 : 0;
    } else if (type === 'tractor') {
      phase += 2 * Math.PI * (48 + 6 * Math.sin(time * 9)) / sampleRate;
      value = (Math.sin(phase) * 0.25 + Math.sin(phase * 2) * 0.12 + filteredNoise * 0.7) * (0.65 + 0.35 * Math.sin(time * 2 * Math.PI * 14));
    } else if (type === 'water') {
      for (const impact of WATER_DROP_TIMES) {
        const drop = time - impact;
        if (drop < 0 || drop > 0.18) continue;
        const dropPhase = 2 * Math.PI * (680 * drop + 1200 * (1 - Math.exp(-drop * 35)) / 35);
        const fade = Math.min(1, drop / 0.004, (0.18 - drop) / 0.025);
        value += Math.sin(dropPhase) * Math.exp(-drop * 22) * fade * 0.32;
      }
    } else if (type === 'frog') {
      const croak = time % 0.38;
      phase += 2 * Math.PI * (150 - croak * 110) / sampleRate;
      value = croak < 0.25 ? (Math.sin(phase) * 0.35 + Math.sin(phase * 4) * 0.2) * Math.sin(Math.PI * croak / 0.25) * (0.6 + 0.4 * Math.sin(time * 180)) : 0;
    } else if (type === 'windmill') {
      const clack = time % 0.24;
      value = filteredNoise * 0.3 + (Math.sin(time * 2 * Math.PI * 430) * 0.4 + noise * 0.25) * Math.exp(-clack * 65);
    } else if (type === 'bell') {
      value = [1, 2.76, 5.4, 8.93].reduce((sum, ratio, partial) => sum + Math.sin(time * 2 * Math.PI * 660 * ratio) * Math.exp(-time * (2 + partial)) / (partial + 2), 0);
    }
    const envelope = Math.min(1, time / 0.018, (duration - time) / 0.12);
    samples[index] = Math.max(-0.9, Math.min(0.9, value * envelope));
  }
  return samples;
}