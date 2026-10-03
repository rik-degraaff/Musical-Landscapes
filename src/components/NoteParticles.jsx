import React from 'react';

const notes = [
  { glyph: '♪', className: 'note-one' },
  { glyph: '♫', className: 'note-two' },
  { glyph: '♬', className: 'note-three' },
];

export function NoteParticles({ active }) {
  return (
    <div className={`note-particles ${active ? 'is-active' : ''}`} aria-hidden="true">
      {notes.map(note => (
        <span key={note.className} className={`music-note ${note.className}`}>
          {note.glyph}
        </span>
      ))}
    </div>
  );
}
