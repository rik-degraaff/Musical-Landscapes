import React from 'react';
import { InteractiveObject } from './Scene';
export function PondScene({audio}) {
  return <>
    <InteractiveObject audio={audio} sound="frog" label="Frog" className="frog" />
    <InteractiveObject audio={audio} sound="windmill" label="Windmill" className="windmill" />
  </>;
}
