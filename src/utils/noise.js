// Small dependency-free 1D Perlin noise implementation.
export function createPerlin(seed = 1) {
  const gradients = new Map();
  const rand = (n) => {
    const x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453123;
    return x - Math.floor(x);
  };
  const gradient = (i) => {
    if (!gradients.has(i)) gradients.set(i, rand(i) * 2 - 1);
    return gradients.get(i);
  };
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x) => {
    const i = Math.floor(x);
    const t = x - i;
    const a = gradient(i);
    const b = gradient(i + 1);
    const u = fade(t);
    return (a * (1 - u) + b * u + 1) / 2;
  };
}

export function createNoisePair(seed, energySpeed = 0.07, complexitySpeed = 0.11) {
  const energy = createPerlin(seed * 13.37 + 4.2);
  const complexity = createPerlin(seed * 31.91 + 9.7);
  return {
    energyAt: (bar) => energy(bar * energySpeed),
    complexityAt: (bar) => complexity(bar * complexitySpeed),
  };
}
