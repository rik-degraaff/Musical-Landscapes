import React from 'react';
import { SceneObjects } from './Scene';

export function DuskScene({ audio }) {
  return <SceneObjects scene="dusk" audio={audio} objects={[{sound:'cricket',label:'Cricket',className:'cricket'},{sound:'airplane',label:'Airplane',className:'airplane'}]}/>;
}