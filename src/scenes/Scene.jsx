import React, { useEffect, useRef, useState } from 'react';
import { FarmScene } from './FarmScene';
import { GardenScene } from './GardenScene';
import { PondScene } from './PondScene';
import { NightScene } from './NightScene';
import { LateNightScene } from './LateNightScene';
import { DawnScene } from './DawnScene';
import { DuskScene } from './DuskScene';
import { CelestialControl, useCelestialPhase } from './CelestialControl';
import { LandscapeArt } from './LandscapeArt';
import { ObjectArt } from './ObjectArt';
import './scene-art.css';
import { WATER_DROP_TIMES, WATER_DROP_FALL, WATER_DURATION } from '../audio/sceneSounds';
import {SCENE_ROOTS} from '../utils/dayCycle';

export const SCENES = [
  { id:'farm', name:'Sunny Farm', root:SCENE_ROOTS.farm, component:FarmScene },
  { id:'garden', name:'Little Garden', root:SCENE_ROOTS.garden, component:GardenScene },
  { id:'pond', name:'Pond Meadow', root:SCENE_ROOTS.pond, component:PondScene },
  { id:'dusk', name:'Evening Meadow', root:SCENE_ROOTS.dusk, component:DuskScene },
  { id:'night', name:'Sleepy Night', root:SCENE_ROOTS.night, component:NightScene },
  { id:'late-night', name:'Moonlit Meadow', root:SCENE_ROOTS.lateNight, component:LateNightScene },
  { id:'dawn', name:'First Light', root:SCENE_ROOTS.dawn, component:DawnScene },
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

export function Scene({ sceneIndex, audio, onRotate, onCelestialSettled }) {
  const sceneRef = useRef(null);
  const advanceRef = useRef(onRotate);
  const lastPointerAdvance = useRef(null);
  advanceRef.current = onRotate;
  const scene = SCENES[sceneIndex];
  const SceneComponent = scene.component;
  const {phase,settled} = useCelestialPhase(scene.id,onCelestialSettled);
  const sceneAudio = { playSceneSound: (type) => audio?.playSceneSound(type) };
  useEffect(() => {
    function handleCelestialTap(event) {
      const sceneElement = sceneRef.current;
      const world = sceneElement?.parentElement;
      if (!world?.contains(event.target) || event.target.closest?.('.mixer,.performance-panel,.top-bar')) return;
      const previous = lastPointerAdvance.current;
      if (event.type === 'click' && previous && performance.now() - previous.time < 800 && Math.hypot(event.clientX - previous.x, event.clientY - previous.y) < 2) {
        event.preventDefault();
        event.stopImmediatePropagation();
        lastPointerAdvance.current = null;
        return;
      }
      const control = sceneElement.querySelector('.celestial-control');
      if (!control) return;
      const bounds = control.getBoundingClientRect();
      const x = event.clientX - (bounds.left + bounds.width / 2);
      const y = event.clientY - (bounds.top + bounds.height / 2);
      if ((event.type !== 'pointerdown' || event.isPrimary) && (event.target.closest?.('.celestial-control') || Math.hypot(x, y) <= bounds.width / 2)) {
        if (event.type === 'pointerdown') {
          event.preventDefault();
          event.stopImmediatePropagation();
          lastPointerAdvance.current = { x: event.clientX, y: event.clientY, time: performance.now() };
          advanceRef.current();
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        advanceRef.current();
      }
    }
    document.addEventListener('pointerdown', handleCelestialTap, true);
    document.addEventListener('click', handleCelestialTap, true);
    return () => {
      document.removeEventListener('pointerdown', handleCelestialTap, true);
      document.removeEventListener('click', handleCelestialTap, true);
    };
  }, []);
  return <div ref={sceneRef} className={`scene scene-${scene.id}`}>
    <LandscapeArt key={scene.id} scene={scene.id} phase={phase} />
    <SceneComponent key={`${scene.id}-objects`} audio={sceneAudio} />
    <CelestialControl scene={scene.id} phase={phase} settled={settled} />
  </div>;
}
