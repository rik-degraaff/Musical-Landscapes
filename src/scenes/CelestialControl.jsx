import React, { useEffect, useRef, useState } from 'react';
import { DAY_PHASES, nextDayPhase, celestialPosition } from '../utils/dayCycle';

export function CelestialControl({ scene, onAdvance }) {
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
  const position = celestialPosition(phase);
  return <button className={`celestial-control ${position.moon ? 'is-moon' : 'is-sun'}`} onClick={onAdvance} aria-label="Change landscape" title={position.moon ? 'Moon: change landscape' : 'Sun: change landscape'} style={{ left: `${position.x}%`, top: `max(36px, ${position.y}%)` }}>
    <svg viewBox="0 0 80 80" aria-hidden="true" style={{ opacity: position.opacity }}>
      {position.moon ? <path d="M57 8A32 32 0 1 0 70 57A31 31 0 0 1 57 8Z" fill="#f8edc3" /> : <><circle cx="40" cy="40" r="39" fill="#fff4ce" opacity=".4" /><circle cx="40" cy="40" r="28" fill={scene === 'dusk' ? '#ffd4a2' : '#ffd875'} /></>}
    </svg>
  </button>;
}