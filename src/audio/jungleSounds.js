const TAU = 2 * Math.PI;

function envelope(elapsed, duration, attack, release, damping) {
  return Math.min(1, elapsed / attack, (duration - elapsed) / release) * Math.exp(-damping * elapsed);
}

function call(start, duration, frequency, {
  glide = 0, vibrato = 0, flutter = 0, reed = 0.2, breath = 0.1, strength = 1, attack = 0.035,
} = {}) {
  return (time, low, air) => {
    const elapsed = time - start;
    if (elapsed < 0 || elapsed >= duration) return 0;
    const phase = TAU * elapsed * (frequency + glide * elapsed / (2 * duration)) + vibrato * Math.sin(TAU * 21 * elapsed);
    const voice = Math.sin(phase) * 0.65 + reed * (Math.sin(phase * 2) + Math.sin(phase * 3) * 0.46);
    const pulse = 0.68 + 0.32 * Math.cos(TAU * flutter * elapsed);
    return (voice + breath * (air + low * 0.7)) * pulse * strength * envelope(elapsed, duration, attack, 0.06, 2.4);
  };
}

function rustle(start, duration, {weight = 0.35, flutter = 0, strength = 1, attack = 0.016, damping = 6} = {}) {
  return (time, low, air) => {
    const elapsed = time - start;
    if (elapsed < 0 || elapsed >= duration) return 0;
    const pulse = 0.22 + 0.78 * Math.cos(TAU * elapsed * (flutter + elapsed * flutter * 0.18)) ** 4;
    return (air + low * weight) * pulse * strength * envelope(elapsed, duration, attack, 0.036, damping);
  };
}

function splash(start, duration, frequency, strength = 1) {
  return (time, low, air) => {
    const elapsed = time - start;
    if (elapsed < 0 || elapsed >= duration) return 0;
    const bubble = Math.sin(TAU * elapsed * (frequency + elapsed * frequency * 0.7));
    return (low * 1.6 + air * 0.85 + bubble * 0.27) * strength * envelope(elapsed, duration, 0.011, 0.045, 9);
  };
}

function strike(start, duration, frequency, partials, strength = 1) {
  return (time, low, air) => {
    const elapsed = time - start;
    if (elapsed < 0 || elapsed >= duration) return 0;
    let ring = 0;
    for (const [ratio, level, damping] of partials) {
      ring += Math.sin(TAU * frequency * ratio * elapsed) * level * Math.exp(-damping * elapsed);
    }
    const click = (air + low * 0.25) * 0.25 * Math.exp(-elapsed * 96);
    return (ring + click) * strength * envelope(elapsed, duration, 0.004, 0.035, 0);
  };
}

const shimmer = [[1, 1, 6], [2.01, 0.18, 15], [2.84, 0.07, 31]];
const dryScales = [[1, 1, 32], [1.83, 0.3, 41], [2.72, 0.14, 53]];

// Original illustrative foley. The animals' movements and calls each get their own timbre and rhythm.
const foley = {
  macaw: {
    duration: 1.38,
    sounds: [
      call(0.045, 0.36, 720, {glide: -330, vibrato: 0.8, flutter: 18, reed: 0.52, breath: 0.45}),
      call(0.54, 0.29, 860, {glide: -360, vibrato: 0.72, flutter: 19, reed: 0.46, breath: 0.38, strength: 0.85}),
      rustle(0.93, 0.36, {flutter: 10, strength: 0.46}),
    ],
  },
  tapir: {
    duration: 1.63,
    sounds: [
      rustle(0.04, 0.31, {weight: 1.7, damping: 13}),
      rustle(0.31, 0.27, {weight: 1.4, damping: 12, strength: 0.74}),
      call(0.66, 0.55, 192, {glide: 72, vibrato: 0.18, reed: 0.4, breath: 0.48, attack: 0.09, strength: 0.65}),
      rustle(1.22, 0.28, {weight: 1.9, damping: 5, strength: 0.7, attack: 0.055}),
    ],
  },
  toucan: {
    duration: 1.25,
    sounds: [
      call(0.065, 0.22, 575, {glide: -172, reed: 0.1, breath: 0.2, attack: 0.018}),
      call(0.34, 0.24, 550, {glide: -148, reed: 0.12, breath: 0.15, attack: 0.018, strength: 0.86}),
      call(0.8, 0.32, 510, {glide: -151, reed: 0.11, breath: 0.2, attack: 0.018, strength: 0.77}),
    ],
  },
  morpho: {
    duration: 1.42,
    sounds: [
      rustle(0.045, 0.61, {flutter: 6, attack: 0.105, damping: 2.1}),
      rustle(0.64, 0.68, {flutter: 8, attack: 0.07, damping: 2.9, strength: 0.7}),
    ],
  },
  riverTurtle: {
    duration: 1.29,
    sounds: [
      splash(0.06, 0.29, 518),
      splash(0.39, 0.26, 715, 0.64),
      splash(0.72, 0.31, 855, 0.48),
      rustle(0.43, 0.69, {weight: 1.15, attack: 0.1, damping: 3, strength: 0.26}),
    ],
  },
  heron: {
    duration: 1.5,
    sounds: [
      call(0.09, 0.49, 338, {glide: -140, vibrato: 1, flutter: 26, reed: 0.48, breath: 1.1, attack: 0.082}),
      call(0.65, 0.27, 295, {glide: -110, vibrato: 0.72, flutter: 27, reed: 0.4, breath: 0.76, strength: 0.68}),
      rustle(0.99, 0.38, {weight: 0.75, flutter: 4, strength: 0.48}),
    ],
  },
  crocodile: {
    duration: 1.57,
    sounds: [
      call(0.08, 0.67, 115, {glide: -47, vibrato: 0.66, flutter: 21, reed: 0.4, breath: 0.95, attack: 0.16}),
      splash(0.68, 0.4, 178, 0.76),
      rustle(0.88, 0.53, {weight: 2.8, attack: 0.08, damping: 4.4, strength: 0.52}),
    ],
  },
  capybara: {
    duration: 1.35,
    sounds: [
      call(0.045, 0.14, 486, {glide: 120, reed: 0.1, breath: 0.08, attack: 0.021}),
      call(0.24, 0.17, 590, {glide: 100, reed: 0.09, breath: 0.09, attack: 0.022, strength: 0.78}),
      call(0.51, 0.3, 593, {glide: -123, vibrato: 0.42, reed: 0.1, breath: 0.11, strength: 0.72}),
      rustle(0.96, 0.28, {weight: 1.1, flutter: 13, strength: 0.42}),
    ],
  },
  sloth: {
    duration: 1.62,
    sounds: [
      rustle(0.04, 0.57, {flutter: 3, attack: 0.11, damping: 3.5}),
      call(0.53, 0.62, 950, {glide: -250, vibrato: 0.3, reed: 0.055, breath: 0.3, attack: 0.16, strength: 0.5}),
      rustle(0.97, 0.54, {flutter: 6, attack: 0.09, damping: 2.7, strength: 0.64}),
    ],
  },
  monkey: {
    duration: 1.4,
    sounds: [
      call(0.04, 0.17, 386, {glide: 285, vibrato: 0.38, reed: 0.24, attack: 0.02}),
      call(0.28, 0.21, 481, {glide: 325, vibrato: 0.4, reed: 0.26, attack: 0.022, strength: 0.86}),
      call(0.65, 0.32, 625, {glide: -280, vibrato: 0.56, flutter: 15, reed: 0.31, strength: 0.84}),
      call(1.04, 0.2, 420, {glide: -135, reed: 0.16, breath: 0.52, strength: 0.48}),
    ],
  },
  treeFrog: {
    duration: 1.35,
    sounds: [
      call(0.055, 0.22, 1030, {glide: -420, vibrato: 0.32, flutter: 43, reed: 0.17, attack: 0.015}),
      call(0.36, 0.19, 1160, {glide: -510, vibrato: 0.29, flutter: 47, reed: 0.16, attack: 0.017, strength: 0.85}),
      call(0.89, 0.28, 1010, {glide: -410, vibrato: 0.32, flutter: 44, reed: 0.17, attack: 0.016, strength: 0.79}),
    ],
  },
  kinkajou: {
    duration: 1.42,
    sounds: [
      call(0.09, 0.32, 630, {glide: 210, vibrato: 0.42, reed: 0.25, attack: 0.075}),
      call(0.5, 0.43, 865, {glide: -520, vibrato: 0.51, reed: 0.28, breath: 0.2, attack: 0.067, strength: 0.81}),
      rustle(1.01, 0.27, {weight: 0.45, flutter: 15, strength: 0.54}),
    ],
  },
  firefly: {
    duration: 1.35,
    sounds: [
      strike(0.07, 0.51, 1046.5, shimmer),
      strike(0.31, 0.5, 1318.51, shimmer, 0.7),
      strike(0.65, 0.55, 1567.98, shimmer, 0.48),
    ],
  },
  iguana: {
    duration: 1.39,
    sounds: [
      rustle(0.07, 0.21, {weight: 1.2, flutter: 31, attack: 0.029, damping: 11}),
      rustle(0.32, 0.22, {weight: 0.84, flutter: 25, attack: 0.022, damping: 10, strength: 0.78}),
      rustle(0.64, 0.59, {weight: 0.21, flutter: 2, attack: 0.085, damping: 4, strength: 0.77}),
    ],
  },
  pangolin: {
    duration: 1.53,
    sounds: [
      strike(0.07, 0.17, 320, dryScales),
      strike(0.31, 0.17, 387, dryScales, 0.68),
      strike(0.43, 0.17, 305, dryScales, 0.9),
      strike(0.73, 0.18, 340, dryScales, 0.73),
      rustle(0.44, 0.84, {weight: 1.2, flutter: 12, attack: 0.07, damping: 2.8, strength: 0.45}),
    ],
  },
  hummingbird: {
    duration: 1.42,
    sounds: [
      call(0.05, 0.7, 52, {glide: 11, flutter: 48, reed: 0.74, breath: 0.45, attack: 0.13}),
      call(0.42, 0.13, 1500, {glide: 690, reed: 0.05, attack: 0.016, strength: 0.38}),
      call(0.76, 0.57, 64, {glide: -16, flutter: 47, reed: 0.64, breath: 0.54, attack: 0.065, strength: 0.65}),
    ],
  },
  basilisk: {
    duration: 1.25,
    sounds: [splash(.07, .22, 180), splash(.24, .24, 243, .83), splash(.43, .27, 290, .67),
      rustle(.7, .45, {weight: .8, flutter: 18, strength: .56})],
  },
  kingfisher: {
    duration: 1.2,
    sounds: [.08, .26, .44, .73].map((start, index) =>
      call(start, .15, 1570 + index * 130, {glide: 820, flutter: 30, reed: .28, attack: .016})),
  },
  coati: {
    duration: 1.33,
    sounds: [rustle(.09, .27, {weight: 1.8, flutter: 23}),
      call(.35, .27, 380, {glide: 290, vibrato: .62, breath: .6, reed: .4}),
      call(.72, .38, 645, {glide: -340, vibrato: .72, breath: .48, strength: .78})],
  },
  orchidMantis: {
    duration: 1.14,
    sounds: [rustle(.08, .46, {flutter: 32, attack: .05, damping: 3}),
      strike(.32, .19, 480, dryScales, .72), strike(.59, .19, 590, dryScales),
      rustle(.64, .43, {flutter: 10, damping: 3, strength: .68})],
  },
  potoo: {
    duration: 1.66,
    sounds: [call(.09, .46, 590, {glide: -110, reed: .08, breath: .29, attack: .09}),
      call(.59, .44, 440, {glide: -95, reed: .08, breath: .22, attack: .08, strength: .85}),
      call(1.08, .48, 340, {glide: -105, reed: .1, breath: .28, attack: .08, strength: .65})],
  },
  ocelot: {
    duration: 1.47,
    sounds: [call(.06, .54, 205, {glide: 160, vibrato: .6, flutter: 24, reed: .57, breath: .23}),
      call(.62, .71, 365, {glide: -230, vibrato: .84, flutter: 13, reed: .53, breath: .28, strength: .73})],
  },
  tarsier: {
    duration: 1.23,
    sounds: [call(.07, .19, 1660, {glide: -430, vibrato: .3, reed: .16, attack: .024}),
      call(.38, .23, 1480, {glide: 500, vibrato: .5, reed: .1, attack: .042}),
      call(.78, .21, 1930, {glide: -630, reed: .14, attack: .03, strength: .76})],
  },
  agouti: {
    duration: 1.3,
    sounds: [.06, .17, .37, .72, .87].map((start, index) =>
      rustle(start, .2, {weight: 2, flutter: 13 + index * 5, attack: .025, damping: 7})),
  },
  colugo: {
    duration: 1.37,
    sounds: [rustle(.07, .91, {weight: 1.1, flutter: 3, attack: .22, damping: 2.1}),
      call(.75, .44, 575, {glide: 200, vibrato: .7, reed: .23, breath: .58, strength: .5})],
  },
  motmot: {
    duration: 1.44,
    sounds: [call(.08, .28, 466, {glide: -65, reed: .15, attack: .054}),
      call(.36, .35, 398, {glide: -77, reed: .12, attack: .055}),
      call(.92, .39, 432, {glide: -104, reed: .16, attack: .054, strength: .83})],
  },
  peccary: {
    duration: 1.31,
    sounds: [call(.08, .39, 143, {glide: 29, reed: .65, flutter: 26, breath: .5}),
      call(.52, .31, 166, {glide: -45, reed: .72, flutter: 32, breath: .49, strength: .82}),
      rustle(.88, .36, {weight: 1.45, flutter: 16, damping: 5})],
  },
  quetzal: {
    duration: 1.42,
    sounds: [call(.06, .32, 820, {glide: 67, reed: .12, attack: .041}),
      call(.46, .26, 1030, {glide: 210, reed: .09, attack: .03, strength: .86}),
      call(.84, .42, 1150, {glide: -310, reed: .06, attack: .055, strength: .76})],
  },
};

export const JUNGLE_SOUNDS = Object.keys(foley);

export function createJungleSample(type, sampleRate = 44100) {
  const specification = foley[type];
  if (!Object.hasOwn(foley, type)) throw new Error(`Unknown Jungle foley: ${type}`);
  if (!Number.isFinite(sampleRate) || sampleRate < 8000) throw new Error('Invalid Jungle sample rate');
  const {duration, sounds} = specification;
  const samples = new Float32Array(Math.ceil(sampleRate * duration));
  let seed = [...type].reduce((hash, character) => Math.imul(hash, 31) + character.charCodeAt(0), 2166136261) >>> 0;
  let low = 0;
  let mid = 0;
  let peak = 0;
  const lowCoefficient = 1 - Math.exp(-TAU * 300 / sampleRate);
  const midCoefficient = 1 - Math.exp(-TAU * 2450 / sampleRate);
  for (let index = 0; index < samples.length; index++) {
    const time = index / sampleRate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    low += lowCoefficient * (noise - low);
    mid += midCoefficient * (noise - mid);
    let value = 0;
    for (const sound of sounds) value += sound(time, low, mid - low);
    samples[index] = value;
    peak = Math.max(peak, Math.abs(value));
  }
  const gain = 0.8 / Math.max(peak, 0.001);
  for (let index = 0; index < samples.length; index++) samples[index] *= gain;
  return samples;
}
