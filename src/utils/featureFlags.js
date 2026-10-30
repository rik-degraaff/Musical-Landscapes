// Keep disabled implementations and saved preferences available for re-enabling.
export const FEATURE_FLAGS = Object.freeze({ flute: false });
export function instrumentEnabled(name) { return FEATURE_FLAGS[name] !== false; }
