import React from 'react';
import { SceneObjects } from './Scene';

export function LateNightScene({ audio }) {
  return <SceneObjects scene="late-night" audio={audio} objects={[{sound:'bat',label:'Fluttering bat',className:'bat'},{sound:'hedgehog',label:'Rustling hedgehog',className:'hedgehog'}]}/>;
}