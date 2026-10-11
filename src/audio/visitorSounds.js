export const VISITOR_SOUNDS = ['sheep', 'horse', 'bee', 'woodpecker', 'duck', 'otter', 'cicada', 'balloon', 'fox', 'badger', 'moth', 'shootingStar', 'dove', 'deer'];

export const VISITOR_RECORDINGS = {
  sheep: { file: 'visitor-sheep.mp3', url: 'https://cdn.freesound.org/previews/710/710300_201532-hq.mp3', source: 'https://freesound.org/people/michaelperfect/sounds/710300/', license: 'CC0-1.0', verified: '2026-10-11', duration: 1.825, gain: 0.85, fadeIn: 0.015, fadeOut: 0.08 },
  horse: { file: 'visitor-horse.mp3', url: 'https://cdn.freesound.org/previews/656/656661_14434814-hq.mp3', source: 'https://freesound.org/people/dontwanttobehere/sounds/656661/', license: 'CC0-1.0', verified: '2026-10-11', offset: 0.5, duration: 5.4, fadeIn: 0.025, fadeOut: 0.12 },
  duck: { file: 'visitor-duck.mp3', url: 'https://cdn.freesound.org/previews/719/719115_11244040-hq.mp3', source: 'https://freesound.org/people/OwennewO/sounds/719115/', license: 'CC0-1.0', verified: '2026-10-11', duration: 1.254, fadeIn: 0.015, fadeOut: 0.06 },
  fox: { file: 'visitor-fox.mp3', url: 'https://cdn.freesound.org/previews/537/537587_11971718-hq.mp3', source: 'https://freesound.org/people/craigsays/sounds/537587/', license: 'CC0-1.0', verified: '2026-10-11', offset: 6.3, duration: 2.8, fadeIn: 0.03, fadeOut: 0.12 },
  dove: { file: 'visitor-dove.mp3', url: 'https://cdn.freesound.org/previews/607/607243_887696-hq.mp3', source: 'https://freesound.org/people/D4XX/sounds/607243/', license: 'CC0-1.0', verified: '2026-10-11', duration: 1.598, fadeIn: 0.025, fadeOut: 0.1 },
};

export const VISITOR_FOLEY = {
  bee: { duration: 2.2, description: 'Organic, wandering harmonic wing buzz with turbulent air.' },
  woodpecker: { duration: 1.6, description: 'Two irregular rolls of dry, resonant woody knocks.' },
  otter: { duration: 2.4, description: 'Small paw splashes, bubbling water and a trailing ripple.' },
  cicada: { duration: 2.2, description: 'Swelling, rapidly pulsed broadband rasp with resonant overtones.' },
  balloon: { duration: 2.4, description: 'Soft valve tick, burner air rush and low turbulent roar.' },
  badger: { duration: 2.2, description: 'Close leaf scuffs and two soft nasal sniffs.' },
  moth: { duration: 1.8, description: 'Delicate, irregular papery wing flutter.' },
  shootingStar: { duration: 2.6, description: 'Imaginary descending airy whistle with a soft shimmering tail.' },
  deer: { duration: 2.4, description: 'Four soft paired hoof steps on earth followed by a breathy snort.' },
};

function burst(time, start, length, attack = 0.008, decay = 5) {
  const elapsed = time - start;
  if (elapsed < 0 || elapsed >= length) return 0;
  return Math.min(1, elapsed / attack, (length - elapsed) / 0.035) * Math.exp(-elapsed * decay);
}

export function createVisitorSample(type, sampleRate = 44100) {
  const specification = VISITOR_FOLEY[type];
  if (!specification) throw new Error(`Unknown visitor foley: ${type}`);
  if (!Number.isFinite(sampleRate) || sampleRate < 8000) throw new Error('Invalid visitor sample rate');
  const { duration } = specification;
  const samples = new Float32Array(Math.ceil(sampleRate * duration));
  let seed = [...type].reduce((hash, character) => Math.imul(hash, 31) + character.charCodeAt(0), 2166136261) >>> 0;
  let lowNoise = 0;
  let midNoise = 0;
  let phase = 0;
  let peak = 0;
  const lowCoefficient = 1 - Math.exp(-2 * Math.PI * 420 / sampleRate);
  const midCoefficient = 1 - Math.exp(-2 * Math.PI * 2400 / sampleRate);
  for (let index = 0; index < samples.length; index++) {
    const time = index / sampleRate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    lowNoise += lowCoefficient * (noise - lowNoise);
    midNoise += midCoefficient * (noise - midNoise);
    const air = midNoise - lowNoise;
    let value = 0;
    if (type === 'bee') {
      phase += 2 * Math.PI * (178 + 19 * Math.sin(time * 7.1) + 7 * Math.sin(time * 19.3) + lowNoise * 12) / sampleRate;
      const approach = 0.35 + 0.65 * Math.sin(Math.PI * time / duration) ** 2;
      value = (Math.sin(phase) * 0.27 + Math.sin(phase * 2 + 0.3) * 0.19 + Math.sin(phase * 3) * 0.1 + air * 0.42) * approach * (0.8 + 0.2 * Math.sin(time * 31));
    } else if (type === 'woodpecker') {
      for (const strike of [0.04, 0.12, 0.205, 0.292, 0.385, 0.49, 0.83, 0.905, 0.988, 1.08, 1.18]) {
        const elapsed = time - strike;
        if (elapsed >= 0 && elapsed < 0.16) {
          const body = Math.sin(elapsed * 2 * Math.PI * 710) + 0.48 * Math.sin(elapsed * 2 * Math.PI * 1193) + 0.22 * Math.sin(elapsed * 2 * Math.PI * 2039);
          value += (body * 0.42 + air * 1.4) * burst(time, strike, 0.16, 0.0015, 38);
        }
      }
    } else if (type === 'otter') {
      value = lowNoise * 0.24 * Math.sin(Math.PI * time / duration);
      for (const [start, strength] of [[0.035, 0.8], [0.41, 1], [0.86, 0.65], [1.27, 0.9], [1.63, 0.48]]) {
        const elapsed = Math.max(0, time - start);
        const splash = burst(time, start, 0.45, 0.012, 8);
        const bubble = Math.sin(2 * Math.PI * (620 * elapsed + 760 * elapsed * elapsed));
        value += strength * (air * 1.2 + lowNoise * 1.5 + bubble * 0.12) * splash;
      }
    } else if (type === 'cicada') {
      phase += 2 * Math.PI * (3250 + 140 * Math.sin(time * 8)) / sampleRate;
      const rasp = (0.35 + 0.65 * Math.sin(time * Math.PI * 83) ** 4) * (0.68 + 0.32 * Math.sin(time * 5.3) ** 2);
      value = (air * 0.9 + (noise - midNoise) * 0.28 + Math.sin(phase) * 0.14 + Math.sin(phase * 1.43) * 0.08) * rasp * Math.sin(Math.PI * time / duration) ** 0.7;
    } else if (type === 'balloon') {
      const burner = burst(time, 0.14, 1.95, 0.18, 0.22);
      value = (lowNoise * 2.1 + air * 0.62) * burner * (0.85 + 0.15 * Math.sin(time * 37));
      value += air * burst(time, 0.035, 0.08, 0.002, 35) * 0.8;
    } else if (type === 'badger') {
      for (const start of [0.03, 0.29, 0.64, 1.18, 1.58]) {
        value += (air * 0.8 + (noise - midNoise) * 0.24 + lowNoise * 0.5) * burst(time, start, 0.28, 0.015, 9) * (0.5 + 0.5 * Math.sin(time * 143) ** 2);
      }
      for (const start of [0.85, 1.84]) value += (lowNoise * 1.5 + air * 0.4) * burst(time, start, 0.23, 0.07, 6);
    } else if (type === 'moth') {
      const flutter = Math.sin(2 * Math.PI * (19 * time + 2.8 * time * time) + 0.6 * Math.sin(time * 17)) ** 8;
      value = (air * 0.8 + (noise - midNoise) * 0.16) * flutter * (0.65 + 0.35 * Math.sin(time * 8.7) ** 2);
    } else if (type === 'shootingStar') {
      phase += 2 * Math.PI * (1900 * Math.exp(-time * 0.75) + 330) / sampleRate;
      const glide = Math.sin(Math.PI * time / duration) ** 1.3;
      value = (Math.sin(phase) * 0.25 + air * 0.17) * glide;
      for (const [start, frequency] of [[0.32, 2637], [0.62, 2093], [0.95, 1760], [1.31, 1319], [1.67, 1047]]) {
        const elapsed = Math.max(0, time - start);
        value += (Math.sin(elapsed * 2 * Math.PI * frequency) + 0.25 * Math.sin(elapsed * 2 * Math.PI * frequency * 2.71)) * burst(time, start, 0.85, 0.04, 4) * 0.075;
      }
    } else if (type === 'deer') {
      for (const start of [0.035, 0.46, 0.92, 1.35]) {
        const elapsed = Math.max(0, time - start);
        value += (Math.sin(elapsed * 2 * Math.PI * 165) * 0.3 + lowNoise * 1.4 + air * 0.5) * burst(time, start, 0.22, 0.005, 20);
        value += air * 0.5 * burst(time, start + 0.045, 0.12, 0.004, 24);
      }
      value += (lowNoise * 1.6 + air * 0.8) * burst(time, 1.78, 0.43, 0.035, 4) * (0.7 + 0.3 * Math.sin(time * 110));
    }
    const fade = Math.max(0, Math.min(1, index / (sampleRate * 0.025), (samples.length - index - 1) / (sampleRate * 0.14)));
    samples[index] = Math.tanh(value) * fade;
    peak = Math.max(peak, Math.abs(samples[index]));
  }
  const gain = 0.8 / Math.max(peak, 0.001);
  for (let index = 0; index < samples.length; index++) samples[index] *= gain;
  return samples;
}