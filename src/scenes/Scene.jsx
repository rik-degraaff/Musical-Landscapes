import React, { useState } from 'react';
import { FarmScene } from './FarmScene';
import { GardenScene } from './GardenScene';
import { PondScene } from './PondScene';
import { NightScene } from './NightScene';

export const SCENES = [
  { id:'farm', name:'Sunny Farm', root:'C', component:FarmScene },
  { id:'garden', name:'Little Garden', root:'G', component:GardenScene },
  { id:'pond', name:'Pond Meadow', root:'F', component:PondScene },
  { id:'night', name:'Sleepy Night', root:'A', component:NightScene },
];

export function InteractiveObject({ sound, audio, emoji, label, className='', children }) {
  const [pulse, setPulse] = useState(false);
  const tap = (e) => {
    e.stopPropagation();
    audio.playSceneSound(sound);
    setPulse(false);
    requestAnimationFrame(() => setPulse(true));
  };
  return <button aria-label={label} className={`interactive-object ${className} ${pulse?'is-tapped':''}`} onClick={tap}>
    {children ?? <span className="object-emoji">{emoji}</span>}
  </button>;
}

export function Scene({ sceneIndex, audio, onRotate }) {
  const scene = SCENES[sceneIndex];
  const SceneComponent = scene.component;
  const sceneAudio = { playSceneSound: (type) => audio.playSceneSound(type, scene.root) };
  return <div className={`scene scene-${scene.id}`}>
    <SceneComponent audio={sceneAudio} />
    <button className="scene-turner" onClick={onRotate} aria-label="Change landscape">
      <span className="turner-arrow">↻</span>
      <span className="turner-sun">☀</span>
    </button>
  </div>;
}
