import React from 'react';
import { InstrumentArt } from './InstrumentArt';
import { NoteParticles } from './NoteParticles';

export function Instrument({
  name,
  label,
  x,
  y,
  active,
  equipped,
  sliding,
  onEquip,
  onToggle,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}) {
  return (
    <div
      id={`instrument-${name}`}
      className={`instrument ${active ? 'playing' : ''} ${equipped?'equipped-instrument':''} ${sliding?'sliding':''}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={active}
      title={equipped?'Drag away to put down':label}
      onKeyDown={event => {
        if(!event.repeat&&event.key.toLowerCase()==='e'){event.preventDefault();onEquip();return;}
        if (!event.repeat && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onToggle(name);
        }
      }}
      onPointerDown={event => onPointerDown(event, name)}
      onPointerMove={event => onPointerMove(event, name)}
      onPointerUp={event => onPointerUp(event, name)}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={onPointerCancel}
    >
      <div className="instrument-drawing">
        <InstrumentArt type={name} />
      </div>
      <NoteParticles active={active} />
    </div>
  );
}
