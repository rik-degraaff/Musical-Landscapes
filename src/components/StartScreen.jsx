import React from 'react';
export function StartScreen({loading,error,onStart}) {
  return <div className="start-overlay">
    <div className="title-note">♪</div>
    <h1>Musical<br/><span>Landscape</span></h1>
    <p>{error ?? 'Make a tiny world that makes music.'}</p>
    <button className="start-button" disabled={loading} onClick={onStart}>{loading?'Loading sounds…':'Tap to play'}</button>
    {!loading && <div className="hint">Tap instruments to add them · drag them around · tap things in the world</div>}
  </div>;
}
