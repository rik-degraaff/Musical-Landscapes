import React, { useEffect, useRef, useState } from 'react';
import { DAY_PHASES, nextDayPhase, celestialPosition } from '../utils/dayCycle';

export function useCelestialPhase(scene) {
  const [phase, setPhase] = useState(DAY_PHASES[scene]);
  const phaseRef = useRef(phase);
  useEffect(() => {
    const from = phaseRef.current;
    const to = nextDayPhase(from, scene);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      phaseRef.current = to;
      setPhase(to);
      return;
    }
    let frame;
    const start = performance.now();
    const animate = now => {
      const progress = Math.min(1, (now - start) / 1000);
      const eased = progress * progress * (3 - 2 * progress);
      const value = from + (to - from) * eased;
      phaseRef.current = value;
      setPhase(value);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [scene]);
  return phase;
}

export function CelestialControl({ scene, phase, onAdvance }) {
  const position = celestialPosition(phase);
  return <button className={`celestial-control ${position.moon ? 'is-moon' : 'is-sun'}`} onClick={onAdvance} aria-label="Change landscape" title={position.moon ? 'Moon: change landscape' : 'Sun: change landscape'} style={{ left: `${position.x}%`, top: `max(36px, ${position.y}%)` }}>
  </button>;
}