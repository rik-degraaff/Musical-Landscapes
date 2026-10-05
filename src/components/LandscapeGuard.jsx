import React from 'react';
import { RotateCw } from 'lucide-react';

export async function requestLandscape() {
  try { await screen.orientation?.lock?.('landscape'); } catch {}
}

export function LandscapeGuard() {
  async function enter() {
    try { await document.documentElement.requestFullscreen?.(); } catch {}
    await requestLandscape();
  }
  return <div className="landscape-guard" role="dialog" aria-label="Landscape orientation required"><button onClick={enter} aria-label="Enter landscape fullscreen" title="Enter landscape fullscreen"><RotateCw size={48}/></button><strong>Landscape required</strong></div>;
}