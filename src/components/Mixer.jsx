import React from 'react';
import { X, Trees } from 'lucide-react';
export function Mixer({instruments,onVolume,sceneVolume,onSceneVolume,onClose}) {
  return <aside id="landscape-mixer" className="mixer glass" aria-label="Sound mixer">
    <div className="mixer-head"><h2>Little mixer</h2><button onClick={onClose} aria-label="Close mixer" title="Close mixer"><X size={20}/></button></div>
    {Object.entries(instruments).map(([name,i])=><div className="mixer-row" key={name}>
      <div className="mixer-label"><span className={`status-dot ${i.active?'active':''}`}/>{i.icon} {i.label}<b>{i.volume} dB</b></div>
      <input aria-label={`${i.label} volume`} type="range" min="-24" max="6" step="1" value={i.volume} onChange={e=>onVolume(name,e.target.value)}/>
    </div>)}
    <div className="mixer-row scenery-mixer-row">
      <div className="mixer-label"><Trees size={18}/><span>Scenery sounds</span><b>{sceneVolume<=-60?'Muted':`${sceneVolume} dB`}</b></div>
      <input aria-label="Scenery sounds volume" type="range" min="-60" max="0" step="1" value={sceneVolume} onChange={event=>onSceneVolume(event.target.value)}/>
    </div>
  </aside>;
}
