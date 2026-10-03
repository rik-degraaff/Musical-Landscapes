import React from 'react';
import { InstrumentArt } from './InstrumentArt';
import { NoteParticles } from './NoteParticles';

export function Instrument({
  name,
  label,
  x,
  y,
  active,
  onToggle,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}) {
  return (
    <div
      id={`instrument-${name}`}
      className={`instrument ${active ? 'playing' : ''}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={active}
      onKeyDown={event => {
        if (!event.repeat && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onToggle(name);
        }
      }}
      onPointerDown={event => onPointerDown(event, name)}
      onPointerMove={event => onPointerMove(event, name)}
      onPointerUp={event => onPointerUp(event, name)}
    >
      <div className="instrument-drawing">
        <InstrumentArt type={name} />
      </div>
      <NoteParticles active={active} />
    </div>
  );
}
