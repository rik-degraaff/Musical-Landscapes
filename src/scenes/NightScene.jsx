import React from 'react';
import { SceneObjects } from './Scene';
export function NightScene({audio}) {
  return <SceneObjects scene="night" audio={audio} objects={[{sound:'bell',label:'Little bell',className:'bell'},{sound:'owl',label:'Night owl',className:'owl'}]}/>;
}
