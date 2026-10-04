import React from 'react';
import { InteractiveObject } from './Scene';

export function DuskScene({ audio }) {
  return <>
    <InteractiveObject audio={audio} sound="cricket" label="Cricket" className="cricket" />
    <InteractiveObject audio={audio} sound="airplane" label="Airplane" className="airplane" />
  </>;
}