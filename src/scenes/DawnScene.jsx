import React from 'react';
import { SceneObjects } from './Scene';

export function DawnScene({ audio }) {
  return <SceneObjects scene="dawn" audio={audio} objects={[{sound:'rooster',label:'Rooster',className:'rooster'},{sound:'chimes',label:'Wind chimes',className:'chimes'}]}/>;
}