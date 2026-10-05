export const DAY_PHASES = { farm: 0.22, garden: 0.5, pond: 0.77, dusk: 0.96, night: 1.5, dawn: 0.04 };

export function nextDayPhase(current, scene) {
  const target = DAY_PHASES[scene];
  return target + Math.ceil((current - target) / 2) * 2;
}

export function celestialPosition(phase) {
  const cycle = ((phase % 2) + 2) % 2;
  const progress = cycle % 1;
  return { x: 12 + progress * 76, y: 42 - Math.sin(progress * Math.PI) * 31, moon: cycle >= 1, opacity: Math.min(1, Math.sin(progress * Math.PI) * 8) };
}