import React from 'react';
import { InteractiveObject } from './Scene';

export function DawnScene({ audio }) {
  return <>
    <InteractiveObject audio={audio} sound="rooster" label="Rooster" className="rooster" />
    <InteractiveObject audio={audio} sound="chimes" label="Wind chimes" className="chimes" />
  </>;
}