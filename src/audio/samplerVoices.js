export function attachOwnedSamplerVoices(Tone, sampler, buffers) {
  const voices = new Set();
  const releases = new WeakMap();
  const samples = new Map(Object.entries(buffers).map(([note, buffer]) => {
    const numeric = Number.parseInt(note, 10);
    return [Number.isFinite(numeric) ? numeric : Tone.Frequency(note).toMidi(), buffer];
  }));
  const originalReleaseAll = sampler.releaseAll;
  const originalDispose = sampler.dispose;
  let disposed = false;

  function discard(entry) {
    voices.delete(entry);
    try {
      entry.source.disconnect();
    } finally {
      if (!entry.source.disposed) entry.source.dispose();
    }
  }

  function stop(entry, time, release) {
    const previousRelease = releases.get(entry);
    const stopTime = Math.min(time, entry.stopTime);
    const fadeOut = Math.min(release, previousRelease + (entry.stopTime - stopTime));
    if (stopTime === entry.stopTime && fadeOut >= previousRelease) return;
    entry.source.fadeOut = fadeOut;
    entry.source.stop(stopTime);
    entry.stopTime = stopTime;
    releases.set(entry, fadeOut);
  }

  sampler.triggerAttackRelease = function (note, duration, time, velocity = 1) {
    if (disposed) return sampler;
    const frequency = Tone.Frequency(note).toFrequency();
    const midiFloat = 69 + 12 * Math.log2(frequency / 440);
    const midi = Math.round(midiFloat);
    let sampleMidi;
    for (let interval = 0; interval < 96; interval++) {
      if (samples.has(midi + interval)) {
        sampleMidi = midi + interval;
        break;
      }
      if (samples.has(midi - interval)) {
        sampleMidi = midi - interval;
        break;
      }
    }
    if (sampleMidi === undefined) throw new Error(`No available buffers for note: ${midi}`);
    const buffer = samples.get(sampleMidi);
    const playbackRate = 2 ** ((midiFloat - sampleMidi) / 12);
    const startTime = Tone.Time(time).toSeconds();
    const stopTime = startTime + Tone.Time(duration).toSeconds();
    const source = new Tone.ToneBufferSource({
      url: buffer,
      context: sampler.context,
      fadeIn: 0.002,
      fadeOut: sampler.release,
      curve: 'exponential',
      playbackRate,
    });
    const entry = { source, startTime, stopTime, note };
    voices.add(entry);
    releases.set(entry, Tone.Time(sampler.release).toSeconds());
    source.onended = () => { voices.delete(entry); };
    try {
      source.connect(sampler.output);
      source.start(startTime, 0, buffer.duration / playbackRate, velocity);
      source.stop(stopTime);
    } catch (error) {
      discard(entry);
      throw error;
    }
    return sampler;
  };

  sampler.releaseAll = function (time) {
    if (disposed) return sampler;
    originalReleaseAll.call(sampler, time);
    const stopTime = Tone.Time(time).toSeconds();
    const release = Tone.Time(sampler.release).toSeconds();
    for (const entry of voices) stop(entry, stopTime, release);
    return sampler;
  };

  sampler.dispose = function () {
    if (disposed) return sampler;
    disposed = true;
    try {
      for (const entry of [...voices]) discard(entry);
    } finally {
      originalDispose.call(sampler);
    }
    return sampler;
  };

  return {
    voices,
    cancelFrom(startTime) {
      const boundary = Tone.Time(startTime).toSeconds();
      const now = Tone.immediate();
      for (const entry of [...voices]) {
        if (entry.startTime < boundary) continue;
        if (entry.startTime > now) discard(entry);
        else stop(entry, now, 0.035);
      }
    },
    dispose() { return sampler.dispose(); },
  };
}