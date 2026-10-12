import React, { useEffect, useRef, useState } from 'react';
import App from '../App';
import { InteractiveObject, SCENES, ScenePreviewContext } from '../scenes/Scene';
import { InstrumentArt } from '../components/InstrumentArt';
import { ParentGuide } from '../components/ParentGuide';
import { LandscapeArt } from '../scenes/LandscapeArt';
import { INSTRUMENTS } from '../utils/music';
import { DEFAULT_AVATAR, normalizeChild } from '../utils/children';
import { normalizeSettings } from '../utils/settings';
import { SCENE_SOUNDS } from '../audio/sceneSounds';
import { installVisualOverrides } from '../utils/visualOverrides';
import { describeNode, sceneEntities, targetFor } from './editorSelection';
import '../components/parent-guide.css';
import './preview.css';

const child = normalizeChild({ id: 'editor-preview', name: 'Preview', age: '5to7', avatar: DEFAULT_AVATAR, settings: normalizeSettings({}) });
const send = payload => parent.postMessage({ source: 'farmjam-preview', ...payload }, location.origin);

export function EditorPreview() {
  const [config, setConfig] = useState({ view: 'scene', scene: 0, mode: 'select', parts: false, paused: false, visitor: 'regular', avatar: DEFAULT_AVATAR, age: '5to7' });
  const configRef = useRef(config);
  configRef.current = config;
  const selected = useRef(null);
  const drag = useRef(null);
  const [audio] = useState(() => {
    let engine;
    let ready;
    let enabled = false;
    const silent = { tempo: 92, metronomeSound: false, tempoHeld: false, getMetronomePhase: () => performance.now() / 652, getCue: () => null, setTempo: value => value };
    return new Proxy({
      async enable() {
        if (!engine) {
          const { AudioEngine } = await import('../audio/AudioEngine');
          engine = new AudioEngine();
        }
        ready ??= engine.init();
        await ready;
        enabled = true;
      },
      disable() { enabled = false; engine?.dispose(); engine = undefined; ready = undefined; },
      playSceneSound(type) { return enabled ? engine?.playSceneSound(type) : undefined; },
      dispose() {},
      close() { engine?.dispose(); },
    }, { get(target, key) { if (key in target) return target[key]; if (enabled && engine && key in engine) return typeof engine[key] === 'function' ? engine[key].bind(engine) : engine[key]; return key in silent ? silent[key] : () => {}; } });
  });
  useEffect(() => () => audio.close(), [audio]);
  useEffect(() => {
    const overrides = installVisualOverrides(document, { version: 1, rules: [] });
    const outline = document.createElement('div');
    outline.className = 'editor-selection-outline';
    document.body.append(outline);
    const choose = node => {
      selected.current = node;
      const value = describeNode(node);
      if (value) send({ type: 'selection', value });
    };
    const message = event => {
      if (event.origin !== location.origin || event.source !== parent || event.data?.source !== 'farmjam-editor') return;
      const { type, value } = event.data;
      if (type === 'config') {
        setConfig(value);
        document.body.classList.toggle('editor-animations-paused', value.paused);
        if (value.sound) audio.enable().then(() => send({ type: 'sound-ready' })).catch(error => send({ type: 'error', value: error.message }));
        else audio.disable();
      }
      if (type === 'draft') overrides.update(value);
      if (type === 'select') {
        const node = document.querySelector(value);
        if (node) { choose(node); node.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
      }
      if (type === 'refresh') send({ type: 'entities', value: sceneEntities(document) });
      if (type === 'replay') {
        const node = selected.current;
        const objects = node?.closest('.interactive-object') ? [node.closest('.interactive-object')] : [...document.querySelectorAll('.interactive-object')];
        objects.forEach(object => object.click());
        if (node && !node.closest('.interactive-object')) node.getAnimations({ subtree: true }).forEach(animation => { animation.currentTime = 0; animation.play(); });
      }
      if (type === 'parts' && selected.current) send({ type: 'entities', value: [selected.current, ...selected.current.querySelectorAll('svg,g,path,ellipse,circle,rect,line,polygon,polyline,stop,.object-reaction,.object-effect,.instrument-drawing')].map(describeNode).filter(Boolean) });
    };
    const down = event => {
      const current = configRef.current;
      if (current.mode === 'interact' || event.button !== 0) return;
      const node = targetFor(event.target, current.parts);
      if (!node) return;
      event.preventDefault(); event.stopImmediatePropagation(); choose(node);
      const bounds = node.getBoundingClientRect();
      const world = document.querySelector('.landscape-world')?.getBoundingClientRect();
      if (current.mode === 'drag' && current.view === 'scene' && world) {
        drag.current = { node, pointerId: event.pointerId, x: event.clientX, y: event.clientY, bounds, world, svg: node instanceof SVGElement, baseTranslate: getComputedStyle(node).translate };
        node.setPointerCapture(event.pointerId);
      }
    };
    const move = event => {
      const current = drag.current;
      if (!current || current.pointerId !== event.pointerId) return;
      event.preventDefault(); event.stopImmediatePropagation();
      const dx = event.clientX - current.x, dy = event.clientY - current.y;
      const { node, bounds, world } = current;
      let styles;
      if (current.svg) {
        const matrix = node.ownerSVGElement?.getScreenCTM();
        const point = matrix ? new DOMPoint(dx, dy).matrixTransform(matrix.inverse()) : { x: dx, y: dy };
        const origin = matrix ? new DOMPoint(0, 0).matrixTransform(matrix.inverse()) : { x: 0, y: 0 };
        const previous = current.baseTranslate === 'none' ? [0, 0] : current.baseTranslate.split(' ').map(parseFloat);
        styles = { translate: `${(previous[0] + point.x - origin.x).toFixed(2)}px ${((previous[1] || 0) + point.y - origin.y).toFixed(2)}px` };
      } else if (node.classList.contains('interactive-object')) {
        styles = { '--object-x': `${((bounds.left + bounds.width / 2 + dx - world.left) / world.width * 100).toFixed(2)}%` };
        const airborne = getComputedStyle(node).getPropertyValue('--object-center').trim();
        styles[airborne ? '--object-center' : '--object-base'] = `${((bounds.top + (airborne ? bounds.height / 2 : bounds.height) + dy - world.top) / world.height * 100).toFixed(2)}%`;
      } else {
        styles = { left: `${((bounds.left + bounds.width / 2 + dx - world.left) / world.width * 100).toFixed(2)}%`, top: `${((bounds.top + bounds.height / 2 + dy - world.top) / world.height * 100).toFixed(2)}%`, right: 'auto', bottom: 'auto', transform: 'translate(-50%, -50%)' };
      }
      send({ type: 'drag', value: { selector: describeNode(node).selector, styles } });
    };
    const up = event => {
      if (!drag.current) return;
      event.preventDefault(); event.stopImmediatePropagation();
      const node = drag.current.node;
      try { node.releasePointerCapture(drag.current.pointerId); } catch {}
      drag.current = null;
      send({ type: 'drag-end' }); choose(node);
    };
    const click = event => {
      if (event.isTrusted && configRef.current.mode !== 'interact' && targetFor(event.target,configRef.current.parts)) { event.preventDefault(); event.stopImmediatePropagation(); }
    };
    let frame;
    const paint = () => {
      const node = selected.current;
      if (node?.isConnected && configRef.current.mode !== 'interact') {
        const box = node.getBoundingClientRect();
        Object.assign(outline.style, { display: 'block', left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
      } else outline.style.display = 'none';
      frame = requestAnimationFrame(paint);
    };
    paint(); window.addEventListener('message', message);
    document.addEventListener('pointerdown', down, true); document.addEventListener('pointermove', move, true);
    document.addEventListener('pointerup', up, true); document.addEventListener('pointercancel', up, true);
    document.addEventListener('click', click, true);
    send({ type: 'ready' });
    return () => {
      overrides.dispose(); outline.remove(); cancelAnimationFrame(frame); window.removeEventListener('message', message);
      document.removeEventListener('pointerdown', down, true); document.removeEventListener('pointermove', move, true);
      document.removeEventListener('pointerup', up, true); document.removeEventListener('pointercancel', up, true);
      document.removeEventListener('click', click, true);
    };
  }, [audio]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => send({ type: 'entities', value: sceneEntities(document) }));
    return () => cancelAnimationFrame(frame);
  }, [config.view, config.scene, config.avatar, config.age, config.visitor]);
  const previewChild = { ...child, avatar: config.avatar, age: config.age };
  if (config.view === 'objects') return <main className="editor-lineup"><header><h1>Object Library</h1><span>{SCENE_SOUNDS.length} scenery objects / {Object.keys(INSTRUMENTS).length} instruments</span></header><section className="editor-object-grid">{SCENE_SOUNDS.map(sound => <article key={sound}><div className="scene"><InteractiveObject sound={sound} label={sound} className={sound === 'water' ? 'faucet' : sound} audio={audio}/></div><strong>{sound}</strong></article>)}{Object.entries(INSTRUMENTS).map(([name, instrument]) => <article key={name}><div className={`instrument editor-library-instrument ${config.playing ? 'playing' : ''}`} id={`instrument-${name}`} role="button" tabIndex={0} aria-label={instrument.label}><InstrumentArt type={name}/></div><strong>{instrument.label}</strong></article>)}</section></main>;
  if (config.view === 'character') return <main className="app-shell"><div className={`scene scene-${SCENES[config.scene].id}`}><LandscapeArt scene={SCENES[config.scene].id} phase={0}/></div><ParentGuide key={config.age} settings={child.settings} developmentPreview={{step:4,name:'Preview',avatar:config.avatar,age:config.age,onAvatarChange:avatar=>send({type:'avatar',value:avatar})}} onComplete={()=>false} onClose={()=>send({type:'view',value:'menu'})}/></main>;
  if (config.view === 'menu') return <ScenePreviewContext.Provider value={.9}><App key={`menu:${config.scene}:${JSON.stringify(config.avatar)}:${config.age}`} developmentPreview={{ sceneIndex: config.scene, child: previewChild, audio, playing:false }}/></ScenePreviewContext.Provider>;
  return <ScenePreviewContext.Provider value={config.visitor === '0' ? .1 : config.visitor === '1' ? .27 : .9}><App key={`${config.scene}:${config.visitor}:${JSON.stringify(config.avatar)}:${config.age}`} developmentPreview={{ sceneIndex: config.scene, child: previewChild, audio }}/></ScenePreviewContext.Provider>;
}