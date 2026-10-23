// Web Audio defaults to an ambient session on iOS, which follows Silent mode.
// This API is optional; rejecting it must never prevent ordinary Web Audio.
export function requestPlaybackSession(navigator = globalThis.navigator) {
  try {
    const session = navigator?.audioSession;
    if (session && session.type !== 'playback') session.type = 'playback';
    return session;
  } catch {
    return null;
  }
}

export async function startAudioContext(start, context, {cancelled, timeoutMs = 5000} = {}) {
  let timer;
  try {
    // Keep resume inside the original user gesture, before any asynchronous work.
    const starting = start();
    await Promise.race([
      starting,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Audio start timed out; tap to retry')), timeoutMs); }),
      ...(cancelled ? [cancelled.then(() => { throw new Error('Audio start cancelled'); })] : []),
    ]);
    if (context.state !== 'running') throw new Error(`Audio is ${context.state}; tap to retry`);
  } finally {
    clearTimeout(timer);
  }
}
