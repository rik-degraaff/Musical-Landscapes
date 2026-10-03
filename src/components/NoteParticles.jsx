import React from 'react';
export function NoteParticles({events}) {
  return <div className="particle-layer">{events.map(e=><span key={e.id} className="note-particle" style={{left:e.x,top:e.y}}>{e.glyph}</span>)}</div>;
}
