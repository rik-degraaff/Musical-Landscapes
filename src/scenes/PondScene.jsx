import React from 'react';
import { InteractiveObject } from './Scene';
export function PondScene({audio}) {
  return <>
    <div className="pond-sky"><div className="moon-cloud"/></div>
    <div className="pond-hill"/><div className="pond-water"><span className="water-lines">〰 〰 〰 〰 〰</span></div>
    <div className="reeds">🌾🌾🌾</div>
    <InteractiveObject audio={audio} sound="frog" label="Frog" className="frog"><span>🐸</span></InteractiveObject>
    <InteractiveObject audio={audio} sound="windmill" label="Windmill" className="windmill"><span>🌻</span><i>✦</i></InteractiveObject>
    <div className="lilies">🪷　🪷</div>
  </>;
}
