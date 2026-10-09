export const MANUAL_RELEASE = { piano: 0.9, guitar: 0.4, ukulele:0.35, panflute:0.22, marimba: 0.35, melody: 0.14, flute: 0.22 };

export function createSustainLoop(channels, sampleRate, frequency) {
  const length = Math.min(...channels.map(channel => channel.length));
  const start = Math.round(sampleRate * 0.5);
  const fade = Math.round(sampleRate * 0.06);
  const period = sampleRate / frequency;
  const nominalEnd = Math.min(Math.round(sampleRate * 1.6), length - 1);
  if (nominalEnd <= start + fade * 3) throw new Error('Recording is too short for a sustain loop');
  let end = nominalEnd;
  let bestError = Infinity;
  const search = Math.ceil(period * 2);
  for (let candidate = nominalEnd - search; candidate <= nominalEnd; candidate++) {
    let error = 0;
    for (const channel of channels) {
      for (let offset = 0; offset < fade; offset += 4) {
        const difference = channel[candidate - fade + offset] - channel[start + offset];
        error += difference * difference;
      }
    }
    if (error < bestError) { bestError = error; end = candidate; }
  }
  const waveforms = channels.map(channel => {
    const output = channel.slice(0, end);
    for (let offset = 0; offset < fade; offset++) {
      const progress = offset / (fade - 1);
      const blend = progress * progress * (3 - 2 * progress);
      output[end - fade + offset] = channel[end - fade + offset] * (1 - blend) + channel[start + offset] * blend;
    }
    return output;
  });
  return { waveforms, loopStart: (start + fade) / sampleRate, loopEnd: end / sampleRate };
}