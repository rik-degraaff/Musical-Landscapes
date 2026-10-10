import React from 'react';
import { InteractiveObject } from './Scene';

export function LateNightScene({ audio }) {
  return <>
    <InteractiveObject audio={audio} sound="bat" label="Fluttering bat" className="bat" />
    <InteractiveObject audio={audio} sound="hedgehog" label="Rustling hedgehog" className="hedgehog" />
  </>;
}