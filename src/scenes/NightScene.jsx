import React from 'react';
import { InteractiveObject } from './Scene';
export function NightScene({audio}) {
  return <>
    <div className="night-sky"><div className="big-moon">☾</div><div className="stars">✦　·　✧　·　✦　·　⋆　·　✧</div></div>
    <div className="night-hill"/><div className="night-cabin"><div className="cabin-roof"/><div className="cabin-window">▦</div></div>
    <InteractiveObject audio={audio} sound="bell" label="Little bell" className="bell"><span>🔔</span></InteractiveObject>
    <InteractiveObject audio={audio} sound="bird" label="Night owl" className="owl"><span>🦉</span></InteractiveObject>
    <div className="fireflies">·　✦　·　✧　·　✦　·</div>
  </>;
}
