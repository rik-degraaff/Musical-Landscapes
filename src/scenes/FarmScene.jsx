import React from 'react';
import { SceneObjects } from './Scene';
export function FarmScene({audio}) {
  return <SceneObjects scene="farm" audio={audio} objects={[{sound:'moo',label:'Cow',className:'cow'},{sound:'tractor',label:'Tractor',className:'tractor'}]}/>;
}
