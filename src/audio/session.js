function sameEventValue(first, second) {
  if (Object.is(first, second)) return true;
  if (!first || !second || typeof first !== 'object' || typeof second !== 'object') return false;
  if (Array.isArray(first) !== Array.isArray(second)) return false;
  if (Array.isArray(first) && first.length !== second.length) return false;
  const keys = Object.keys(first);
  if (keys.length !== Object.keys(second).length) return false;
  return keys.every(key => Object.hasOwn(second, key) && sameEventValue(first[key], second[key]));
}

export function findPhraseIndex(pool, phrase) {
  const index = pool.indexOf(phrase);
  if (index >= 0 || !phrase) return index;
  return pool.findIndex(candidate => sameEventValue(candidate.events, phrase.events));
}

export function capturePracticeSnapshot(state) {
  // Practice temporarily replaces transport and instrument state; copy mutable fields for restoration.
  return {
    active: { ...state.active },
    manual: state.manualInstrument,
    root: state.root,
    metronomeSound: state.metronomeSound,
    tempo: state.tempo,
    equippedPhrase: state.equippedPhrase,
    phraseIdentity: state.phraseIdentity,
    phrasePinned: state.phrasePinned,
  };
}

export function restorePracticeSnapshot(snapshot) {
  // Return the engine-facing field names while copying active flags back into a fresh object.
  return {
    active: { ...snapshot.active },
    manualInstrument: snapshot.manual,
    root: snapshot.root,
    metronomeSound: snapshot.metronomeSound,
    tempo: snapshot.tempo,
    equippedPhrase: snapshot.equippedPhrase,
    phraseIdentity: snapshot.phraseIdentity,
    phrasePinned: snapshot.phrasePinned,
  };
}
