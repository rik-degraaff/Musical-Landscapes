import React from 'react';
import { InteractiveObject } from './Scene';
export function FarmScene({audio}) {
  return <>
    <InteractiveObject audio={audio} sound="moo" label="Cow" className="cow" />
    <InteractiveObject audio={audio} sound="tractor" label="Tractor" className="tractor" />
  </>;
}
