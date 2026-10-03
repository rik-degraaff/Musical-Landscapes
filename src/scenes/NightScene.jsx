import React from 'react';
import { InteractiveObject } from './Scene';
export function NightScene({audio}) {
  return <>
    <InteractiveObject audio={audio} sound="bell" label="Little bell" className="bell" />
    <InteractiveObject audio={audio} sound="owl" label="Night owl" className="owl" />
  </>;
}
