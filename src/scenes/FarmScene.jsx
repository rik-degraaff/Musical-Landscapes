import React from 'react';
import { InteractiveObject } from './Scene';
export function FarmScene({audio}) {
  return <>
    <div className="sun"/><div className="cloud cloud-a"/><div className="cloud cloud-b"/>
    <div className="hill hill-back"/><div className="hill hill-front"/>
    <div className="farm-fence"/><div className="barn"><div className="barn-roof"/><div className="barn-door">▦</div></div>
    <InteractiveObject audio={audio} sound="moo" label="Cow" className="cow">
      <span className="cow-body">🐄</span>
    </InteractiveObject>
    <InteractiveObject audio={audio} sound="tractor" label="Tractor" className="tractor">
      <span className="tractor-body">🚜</span>
    </InteractiveObject>
    <div className="grass tufts">⌁⌁⌁⌁⌁⌁⌁</div>
  </>;
}
