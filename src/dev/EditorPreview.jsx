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
import { installVisualOverrides, visualSource } from '../utils/visualOverrides';
import { describeNode, sceneEntities, targetFor } from './editorSelection';
import { installSvgPointEditor } from './SvgPointEditor';
import { measureGeometry, resizeGeometry } from './canvasGeometry';
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
    const overrides = installVisualOverrides(document, { version: 1, rules: [] }, { preview: true });
    let draft = { version: 1, rules: [] };
    const outline = document.createElement('div');
    outline.className = 'editor-selection-outline';
    document.body.append(outline);
    for (const grip of ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']) {
      const handle = document.createElement('button');
      handle.dataset.resizeGrip = grip;
      handle.className = `editor-object-grip grip-${grip}`;
      handle.setAttribute('aria-label', `Resize selected item ${grip}`);
      handle.title = `Resize ${grip}`;
      outline.append(handle);
    }
    const points = installSvgPointEditor(document, {
      onEdit: ({ attributes }) => { if (selected.current) send({ type: 'drag', value: { selector: describeNode(selected.current).selector, attributes } }); },
      onGestureEnd: () => { send({ type: 'drag-end' }); if (selected.current) choose(selected.current); },
    });
    const choose = node => {
      selected.current = node;
      const value = describeNode(node);
      points.select(node, configRef.current.points && configRef.current.mode !== 'interact');
      const world = node.closest('.landscape-world')?.getBoundingClientRect();
      if (value && world) value.geometry = measureGeometry(node, world);
      if (value) send({ type: 'selection', value });
    };
    const message = event => {
      if (event.origin !== location.origin || event.source !== parent || event.data?.source !== 'farmjam-editor') return;
      const { type, value } = event.data;
      if (type === 'config') {
        setConfig(value);
        configRef.current = value;
        points.select(selected.current, value.points && value.mode !== 'interact');
        overrides.setPreview(value.mode !== 'interact');
        document.body.classList.toggle('editor-interacting', value.mode === 'interact');
        document.body.classList.toggle('editor-animations-paused', value.paused);
        if (value.sound) audio.enable().then(() => send({ type: 'sound-ready' })).catch(error => send({ type: 'error', value: error.message }));
        else audio.disable();
      }
      if (type === 'draft') { draft = value; overrides.update(value); points.refresh(); }
      if (type === 'measure') requestAnimationFrame(() => requestAnimationFrame(() => {
        const node = document.querySelector(value.selector);
        const world = node?.closest('.landscape-world')?.getBoundingClientRect();
        send({ type: 'measurement', value: { id: value.id, geometry: world ? measureGeometry(node, world) : null, kind: node instanceof SVGElement && node.ownerSVGElement ? 'svg' : 'box' } });
      }));
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
      if (event.target.closest('[data-svg-handle],[data-svg-point-editor]')) return;
      if (current.mode === 'interact' || event.button !== 0) return;
      const grip = event.target.closest('[data-resize-grip]')?.dataset.resizeGrip;
      const node = grip ? selected.current : targetFor(visualSource(event.target), current.parts);
      if (!node) return;
      event.preventDefault(); event.stopImmediatePropagation(); choose(node);
      const bounds = node.getBoundingClientRect();
      const world = document.querySelector('.landscape-world')?.getBoundingClientRect();
      if ((grip || current.mode === 'drag') && current.view === 'scene' && world) {
        const selector = describeNode(node).selector;
        const layout = draft.rules.find(rule => rule.selector === selector)?.layout;
        if (layout && !current.endpoint) return;
        drag.current = { node, grip, layout, selector, pointerId: event.pointerId, x: event.clientX, y: event.clientY, bounds, world, svg: node instanceof SVGElement && Boolean(node.ownerSVGElement), baseTranslate: getComputedStyle(node).translate, baseScale: getComputedStyle(node).scale };
        document.body.setPointerCapture(event.pointerId);
      }
    };
    const move = event => {
      const current = drag.current;
      if (!current || current.pointerId !== event.pointerId) return;
      event.preventDefault(); event.stopImmediatePropagation();
      const dx = event.clientX - current.x, dy = event.clientY - current.y;
      const { node, bounds, world } = current;
      let styles;
      if (configRef.current.endpoint && current.layout) {
        const geometry = current.grip ? resizeGeometry(bounds, world, current.grip, dx, dy, configRef.current.ratioLocked) : { ...measureGeometry({ getBoundingClientRect: () => bounds }, world), x: (bounds.left + bounds.width / 2 + dx - world.left) / world.width * 100, y: (bounds.top + bounds.height / 2 + dy - world.top) / world.height * 100 };
        send({ type: 'drag', value: { selector: current.selector, layout: { ...current.layout, [configRef.current.endpoint]: geometry } } });
        return;
      }
      if (current.grip) {
        const geometry = resizeGeometry(bounds, world, current.grip, dx, dy, configRef.current.ratioLocked);
        if (current.svg) {
          const previousScale = current.baseScale === 'none' ? [1, 1] : current.baseScale.split(' ').map(Number);
          const matrix = node.parentElement.getScreenCTM();
          const origin = new DOMPoint(0, 0).matrixTransform(matrix.inverse());
          const delta = new DOMPoint((geometry.x / 100 * world.width + world.left) - bounds.left - bounds.width / 2, (geometry.y / 100 * world.height + world.top) - bounds.top - bounds.height / 2).matrixTransform(matrix.inverse());
          const previous = current.baseTranslate.split(' ').map(parseFloat);
          styles = { scale: `${previousScale[0] * geometry.width / bounds.width} ${(previousScale[1] ?? previousScale[0]) * geometry.height / bounds.height}`, 'transform-origin': 'center', 'transform-box': 'fill-box', translate: `${(previous[0] || 0) + delta.x - origin.x}px ${(previous[1] || 0) + delta.y - origin.y}px` };
        } else styles = { width: `${geometry.width.toFixed(2)}px`, height: `${geometry.height.toFixed(2)}px`, left: `${geometry.x}%`, top: `${geometry.y}%`, right: 'auto', bottom: 'auto', transform: 'translate(-50%, -50%)' };
        send({ type: 'drag', value: { selector: current.selector, styles } });
        return;
      }
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
      try { document.body.releasePointerCapture(drag.current.pointerId); } catch {}
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
        const layout = draft.rules.find(rule => rule.selector === describeNode(node)?.selector)?.layout;
        outline.classList.toggle('can-resize', configRef.current.view === 'scene' && !configRef.current.points && (!layout || configRef.current.endpoint));
      } else outline.style.display = 'none';
      frame = requestAnimationFrame(paint);
    };
    paint(); window.addEventListener('message', message);
    document.addEventListener('pointerdown', down, true); document.addEventListener('pointermove', move, true);
    document.addEventListener('pointerup', up, true); document.addEventListener('pointercancel', up, true);
    document.addEventListener('click', click, true);
    send({ type: 'ready' });
    return () => {
      points.dispose(); overrides.dispose(); outline.remove(); cancelAnimationFrame(frame); window.removeEventListener('message', message);
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