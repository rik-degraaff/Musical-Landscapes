import React from 'react';
import { InteractiveObject } from './Scene';
export function GardenScene({audio}) {
  return <>
    <div className="garden-sky"><div className="garden-sun"/></div>
    <div className="garden-tree tree-left">🌳</div><div className="garden-tree tree-right">🌳</div>
    <div className="garden-ground"/>
    <div className="garden-house"><div className="roof"/><div className="window"/><div className="door"/></div>
    <InteractiveObject audio={audio} sound="water" label="Leaky outdoor faucet" className="faucet">
      <span className="faucet-icon">🚰</span><span className="drops">💧</span>
    </InteractiveObject>
    <InteractiveObject audio={audio} sound="bird" label="Bird" className="bird"><span>🐦</span></InteractiveObject>
    <div className="flower-bed">🌷 🌼 🌷 🌼 🌷</div>
  </>;
}
