import React from 'react';
import { InstrumentArt } from './InstrumentArt';
export function Instrument({name,label,x,y,active,onToggle,onPointerDown,onPointerMove,onPointerUp}) {
  return <div id={`instrument-${name}`} className={`instrument ${active?'playing':''}`} style={{left:`${x}%`,top:`${y}%`}}
    role="button" tabIndex={0} aria-label={`${label}, ${active?'playing':'off'}`}
    onKeyDown={e=>{if(!e.repeat&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onToggle(name);}}}
    onPointerDown={e=>onPointerDown(e,name)} onPointerMove={e=>onPointerMove(e,name)} onPointerUp={e=>onPointerUp(e,name)}>
    <div className="instrument-card"><div className="instrument-glow"/><InstrumentArt type={name}/><div className="instrument-label">{label}</div><div className="instrument-state">{active?'playing':'tap me'}</div></div>
  </div>;
}
