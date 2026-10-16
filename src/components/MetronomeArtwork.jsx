import React from 'react';

/** Shared artwork only. Scheduling and input remain in Metronome. */
export function MetronomeBody() {
  return <svg className="metronome-body" viewBox="0 0 100 140" aria-hidden="true"><path d="M32 6h36l25 124H7Z" fill="#9d7053" stroke="#624d40" strokeWidth="3"/><path d="M36 14h28l18 101H18Z" fill="#f0e2be" stroke="#c19b69" strokeWidth="2"/><path d="M6 126h88v10H6Z" fill="#526d58"/><circle cx="50" cy="112" r="7" fill="#526d58"/>{[28,44,60,76,92].map(y=><path key={y} d={`M43 ${y}h14`} stroke="#977c5c" strokeWidth="1"/>)}</svg>;
}

export function MetronomeArtwork({tempo=104,sound=true}) {
  return <div className="guide-metronome-art">
    <MetronomeBody/>
    <svg className="guide-metronome-mechanism" viewBox="0 0 100 140" aria-hidden="true"><path d="M50 17V112" stroke="#526d58" strokeWidth="3"/><g className="guide-metronome-weight" transform={`translate(0 ${22.4+(tempo-40)/168*64.4})`}><rect x="40" y="-7" width="20" height="14" rx="2" fill="#d5a75d" stroke="#624d40" strokeWidth="2"/><path d="M43-2h14m-14 4h14" stroke="#624d4055"/></g><text x="50" y="124" textAnchor="middle" fontSize="7" fill="#473b2b">{tempo} BPM</text><rect x="28" y="128" width="44" height="10" rx="2" fill="#3f5949" stroke="#243f31"/><path d="m34 131-3 2h3l3 2v-6Z" fill="#fff5db"/><rect x="43" y="130" width="25" height="6" rx="1" fill="#253d30" stroke="#b5bd9a" strokeWidth=".5"/><rect x={sound?56:44} y="131" width="10" height="4" fill="#f0cf79"/></svg>
  </div>;
}
