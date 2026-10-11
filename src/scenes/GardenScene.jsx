import React from 'react';
import { SceneObjects } from './Scene';
export function GardenScene({audio}) {
  return <SceneObjects scene="garden" audio={audio} objects={[{sound:'water',label:'Outdoor faucet',className:'faucet'},{sound:'bird',label:'Bird',className:'bird'}]}/>;
}
