import React from 'react';
import { SceneObjects } from './Scene';
export function PondScene({audio}) {
  return <SceneObjects scene="pond" audio={audio} objects={[{sound:'frog',label:'Frog',className:'frog'},{sound:'windmill',label:'Windmill',className:'windmill'}]}/>;
}
