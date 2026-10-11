export function releaseManualVoice(voice,when,release) {
  const gain=voice.envelope.gain;
  try {
    try {
      gain.cancelAndHoldAtTime(when);
    } catch {
      const level=gain.value;
      gain.cancelScheduledValues(when);
      gain.setValueAtTime(level,when);
    }
    gain.setTargetAtTime(0,when,release/5);
    gain.setValueAtTime(0,when+release);
  } catch {
    try {gain.value=0;} catch {}
  } finally {
    const deadline=when+release+.005;
    voice.stopAt=Math.min(voice.stopAt??Infinity,deadline);
    try {voice.source.stop(voice.stopAt);} catch {}
  }
}