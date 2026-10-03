import React from 'react';
import { InteractiveObject } from './Scene';
export function GardenScene({audio}) {
  return <>
    <InteractiveObject audio={audio} sound="water" label="Outdoor faucet" className="faucet" />
    <InteractiveObject audio={audio} sound="bird" label="Bird" className="bird" />
  </>;
}
