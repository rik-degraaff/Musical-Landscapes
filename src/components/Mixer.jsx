import React from 'react';
import { X } from 'lucide-react';
export function Mixer({instruments,onVolume,onClose}) {
  return <aside className="mixer glass">
    <div className="mixer-head"><h2>Little mixer</h2><button onClick={onClose} aria-label="Close mixer" title="Close mixer"><X size={20}/></button></div>
    {Object.entries(instruments).map(([name,i])=><div className="mixer-row" key={name}>
      <div className="mixer-label"><span className={`status-dot ${i.active?'active':''}`}/>{i.icon} {i.label}<b>{i.volume} dB</b></div>
      <input aria-label={`${i.label} volume`} type="range" min="-24" max="6" step="1" value={i.volume} onChange={e=>onVolume(name,e.target.value)}/>
    </div>)}
  </aside>;
}
