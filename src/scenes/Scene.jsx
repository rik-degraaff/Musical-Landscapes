import React, { useState } from 'react';
import { FarmScene } from './FarmScene';
import { GardenScene } from './GardenScene';
import { PondScene } from './PondScene';
import { NightScene } from './NightScene';
import { RotateCw } from 'lucide-react';
import { LandscapeArt } from './LandscapeArt';
import { ObjectArt } from './ObjectArt';
import './scene-art.css';
import { WATER_DROP_TIMES, WATER_DROP_FALL, WATER_DURATION } from '../audio/sceneSounds';

export const SCENES = [
  { id:'farm', name:'Sunny Farm', root:'C', component:FarmScene },
  { id:'garden', name:'Little Garden', root:'G', component:GardenScene },
  { id:'pond', name:'Pond Meadow', root:'F', component:PondScene },
  { id:'night', name:'Sleepy Night', root:'A', component:NightScene },
];

export function InteractiveObject({ sound, audio, label, className='' }) {
  const [taps, setTaps] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [startsAt, setStartsAt] = useState(0);
  const tap = (e) => {
    e.stopPropagation();
    const playback = audio?.playSceneSound(sound);
    setStartsAt(playback?.startsAt ?? performance.now());
    setTaps(value => value + 1);
    setPulse(true);
  };
  const delay = Math.max(-0.1, (startsAt - performance.now()) / 1000);
  return <button type="button" aria-label={label} title={label} data-sound={sound} className={`interactive-object ${className} ${pulse?'is-tapped':''}`} onClick={tap}>
    <span key={taps} className={`object-reaction ${pulse ? 'reacting' : ''}`} style={sound === 'water' ? { animationDuration: `${WATER_DURATION}s`, animationDelay: `${delay}s` } : undefined} onAnimationEnd={event => { if(event.target === event.currentTarget) setPulse(false); }}><ObjectArt type={sound} /></span>
    {pulse && (sound === 'water' ? <svg key={`effect-${taps}`} className="object-effect water-drops" viewBox="0 0 160 140" aria-hidden="true">
      {WATER_DROP_TIMES.map(impact => <g key={impact}>
        <path className="falling-drop" d="M106 73q-7 10 0 10q7 0 0-10Z" style={{ animationDuration: `${WATER_DROP_FALL}s`, animationDelay: `${delay + impact - WATER_DROP_FALL}s` }} />
        <ellipse className="drop-ripple" cx="106" cy="128" rx="12" ry="3" style={{ animationDelay: `${delay + impact}s` }} />
      </g>)}
    </svg> : <span key={`effect-${taps}`} className={`object-effect effect-${sound}`} aria-hidden="true"><i/><i/><i/></span>)}
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
