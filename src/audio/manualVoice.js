export function disconnectManualVoice(voice) {
  if (voice.disconnected) return;
  voice.disconnected = true;
  try {
    voice.source.disconnect();
  } finally {
    voice.envelope.disconnect();
  }
}

export function finishManualVoice(voice, token, active, retiring) {
  disconnectManualVoice(voice);
  retiring.delete(voice);
  if (active.get(token) === voice) active.delete(token);
}