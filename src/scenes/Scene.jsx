import React, { useState } from 'react';
import { FarmScene } from './FarmScene';
import { GardenScene } from './GardenScene';
import { PondScene } from './PondScene';
import { NightScene } from './NightScene';
import { RotateCw } from 'lucide-react';
import { LandscapeArt } from './LandscapeArt';
import { ObjectArt } from './ObjectArt';
import './scene-art.css';

export const SCENES = [
  { id:'farm', name:'Sunny Farm', root:'C', component:FarmScene },
  { id:'garden', name:'Little Garden', root:'G', component:GardenScene },
  { id:'pond', name:'Pond Meadow', root:'F', component:PondScene },
  { id:'night', name:'Sleepy Night', root:'A', component:NightScene },
];

export function InteractiveObject({ sound, audio, label, className='' }) {
  const [taps, setTaps] = useState(0);
  const [pulse, setPulse] = useState(false);
  const tap = (e) => {
    e.stopPropagation();
    audio?.playSceneSound(sound);
    setTaps(value => value + 1);
    setPulse(true);
  };
  return <button type="button" aria-label={label} title={label} data-sound={sound} className={`interactive-object ${className} ${pulse?'is-tapped':''}`} onClick={tap}>
    <span key={taps} className={`object-reaction ${pulse ? 'reacting' : ''}`} onAnimationEnd={event => { if(event.target === event.currentTarget) setPulse(false); }}><ObjectArt type={sound} /></span>
    {pulse && <span key={`effect-${taps}`} className={`object-effect effect-${sound}`} aria-hidden="true"><i/><i/><i/></span>}
  </button>;
}

export function Scene({ sceneIndex, audio, onRotate }) {
  const scene = SCENES[sceneIndex];
  const SceneComponent = scene.component;
  const sceneAudio = { playSceneSound: (type) => audio?.playSceneSound(type) };
  return <div className={`scene scene-${scene.id}`}>
    <LandscapeArt key={scene.id} scene={scene.id} />
    <SceneComponent key={`${scene.id}-objects`} audio={sceneAudio} />
    <button className="scene-turner" onClick={onRotate} aria-label="Change landscape" title="Change landscape">
      <RotateCw size={26} strokeWidth={2} />
    </button>
  </div>;
}
