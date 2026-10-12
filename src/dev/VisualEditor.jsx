import React, { useEffect, useRef, useState } from 'react';
import { MousePointer2, Move, Hand, Save, Undo2, Redo2, RotateCcw, Play, Pause, RefreshCw, Download, Upload, Shapes, Layers, Monitor, Smartphone, Maximize2, X, ChevronRight, Spline, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown } from 'lucide-react';
import { SCENES } from '../scenes/Scene';
import { DEFAULT_AVATAR, AVATAR_OPTIONS } from '../utils/children';
import { validateVisualOverrides, VISUAL_ATTRIBUTES, VISUAL_STYLES } from '../utils/visualOverrides';
import { MIN_VIEWPORT, MAX_VIEWPORT, boundedFormula } from '../utils/responsiveVisuals';
import './editor.css';

const initialConfig = { view: 'scene', scene: 0, mode: 'select', parts: false, points: false, ratioLocked: true, paused: false, sound: false, playing: false, visitor: 'regular', avatar: DEFAULT_AVATAR, age: '5to7' };
const empty = { version: 1, rules: [] };
const endpoint = '/__editor/api/visuals';

function IconButton({ label, icon: Icon, active, ...props }) {
  return <button type="button" aria-label={label} title={label} aria-pressed={active} className={active ? 'is-active' : ''} {...props}><Icon size={17}/></button>;
}

function VisualEditor() {
  const iframe = useRef(null);
  const stage = useRef(null);
  const importFile = useRef(null);
  const [config, setConfig] = useState(initialConfig);
  const [history, setHistory] = useState({ past: [], present: empty, future: [] });
  const state = useRef(history); state.current = history;
  const [saved, setSaved] = useState(empty);
  const [revision, setRevision] = useState(null);
  const [ready, setReady] = useState(false);
  const [selection, setSelection] = useState(null);
  const [entities, setEntities] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Loading project artwork...');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [size, setSize] = useState({ width: 1440, height: 900 });
  const [area, setArea] = useState({ width: 900, height: 650 });
  const [zoom, setZoom] = useState('fit');
  const [compactRule, setCompactRule] = useState(false);
  const [breakpoint, setBreakpoint] = useState(800);
  const [property, setProperty] = useState('styles:width');
  const dragStarted = useRef(false);
  const measurements = useRef(new Map());
  const [fitting, setFitting] = useState(false);
  const dirty = JSON.stringify(saved) !== JSON.stringify(history.present);
  const send = (type, value) => iframe.current?.contentWindow?.postMessage({ source: 'farmjam-editor', type, value }, location.origin);
  const scale = zoom === 'fit' ? Math.min(1, Math.max(.15, (area.width - 48) / size.width), Math.max(.15, (area.height - 48) / size.height)) : Number(zoom);
  const currentRule = history.present.rules.find(rule => rule.selector === selection?.selector);
  const configRef = useRef(config); configRef.current = config;
  const endpointSize = size.width === MIN_VIEWPORT.width && size.height === MIN_VIEWPORT.height ? 'min' : size.width === MAX_VIEWPORT.width && size.height === MAX_VIEWPORT.height ? 'max' : null;
  const previewConfig = { ...config, endpoint: endpointSize };
  const previewConfigRef = useRef(previewConfig); previewConfigRef.current = previewConfig;

  function change(next, checkpoint = true) {
    try { validateVisualOverrides(next); } catch (failure) { setError(failure.message); return; }
    setError('');
    setHistory(current => ({ past: checkpoint ? [...current.past.slice(-79), current.present] : current.past, present: next, future: [] }));
  }
  function replaceRule(rule, checkpoint = true) {
    change({ version: 1, rules: [...state.current.present.rules.filter(item => item.selector !== rule.selector), rule] }, checkpoint);
  }
  async function measureAt(viewport, selector) {
    setSize(viewport);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const timer = setTimeout(() => { measurements.current.delete(id); reject(new Error('Preview measurement timed out.')); }, 5000);
      measurements.current.set(id, value => { clearTimeout(timer); value.geometry ? resolve(value) : reject(new Error('Select a scene item before fitting its layout.')); });
      send('measure', { id, selector });
    });
  }
  async function fitLayout() {
    if (!selection || fitting) return;
    const viewport = size;
    setFitting(true);
    try {
      const minimum = await measureAt(MIN_VIEWPORT, selection.selector);
      const maximum = await measureAt(MAX_VIEWPORT, selection.selector);
      const previous = state.current.present.rules.find(rule => rule.selector === selection.selector) ?? { selector: selection.selector, attributes: {}, styles: {} };
      const rule = { ...previous, styles: { ...previous.styles }, layout: { kind: minimum.kind, min: minimum.geometry, max: maximum.geometry } };
      delete rule.maxWidth;
      if (rule.layout.kind === 'box') for (const key of ['left', 'top', 'right', 'bottom', 'translate', 'transform', 'width', 'height']) delete rule.styles[key];
      replaceRule(rule);
      setStatus('Responsive endpoints fitted');
    } catch (failure) { setError(failure.message); }
    finally { setSize(endpointSize ? viewport : MIN_VIEWPORT); setFitting(false); }
  }
  function changeLayer(value) {
    const previous = currentRule ?? { selector: selection.selector, attributes: {}, styles: {} };
    replaceRule({ ...previous, layer: Math.max(-10000, Math.min(10000, Math.round(value))) });
  }
  function edit(selector, kind, values, checkpoint = true) {
    const current = state.current.present;
    const previous = current.rules.find(rule => rule.selector === selector) ?? { selector, attributes: {}, styles: {} };
    const rule = { ...previous, [kind]: { ...previous[kind], ...values }, ...(compactRule ? { maxWidth: breakpoint } : {}) };
    const rules = current.rules.filter(value => value.selector !== selector);
    change({ version: 1, rules: [...rules, rule] }, checkpoint);
  }
  function resetProperty(kind, key) {
    if (!currentRule) return;
    const rule = { ...currentRule, [kind]: { ...currentRule[kind] } };
    delete rule[kind][key];
    const rules = history.present.rules.filter(value => value.selector !== rule.selector);
    if (Object.keys(rule.attributes).length || Object.keys(rule.styles).length || rule.layout || rule.layer !== undefined) rules.push(rule);
    change({ version: 1, rules });
  }
  function undo() { setHistory(current => current.past.length ? { past: current.past.slice(0,-1), present: current.past.at(-1), future: [current.present,...current.future] } : current); }
  function redo() { setHistory(current => current.future.length ? { past: [...current.past,current.present], present: current.future[0], future: current.future.slice(1) } : current); }

  useEffect(() => {
    let disposed = false;
    fetch(endpoint).then(async response => {
      const value = await response.json();
      if (!response.ok) throw new Error(value.error);
      validateVisualOverrides(value.document);
      if (!disposed) { setSaved(value.document); setHistory({past:[],present:value.document,future:[]}); setRevision(value.revision); setStatus('Project loaded'); }
    }).catch(failure => { if (!disposed) setError(failure.message); });
    return () => { disposed = true; };
  }, []);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setArea({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const message = event => {
      if (event.origin !== location.origin || event.source !== iframe.current?.contentWindow || event.data?.source !== 'farmjam-preview') return;
      const { type, value } = event.data;
      if (type === 'ready') { setReady(true); send('config', previewConfigRef.current); send('draft', state.current.present); send('refresh'); }
      if (type === 'measurement') { measurements.current.get(value.id)?.(value); measurements.current.delete(value.id); }
      if (type === 'selection') { setSelection(value); setCompactRule(Boolean(state.current.present.rules.find(rule => rule.selector === value.selector)?.maxWidth)); }
      if (type === 'entities') setEntities(value);
      if (type === 'avatar') setConfig(current => JSON.stringify(current.avatar)===JSON.stringify(value)?current:({...current,avatar:value}));
      if (type === 'view') setConfig(current => ({...current,view:value}));
      if (type === 'error') setError(value);
      if (type === 'sound-ready') setStatus('Preview sound ready');
      if (type === 'drag') {
        const current = state.current;
        const previous = current.present.rules.find(rule => rule.selector === value.selector) ?? { selector:value.selector,attributes:{},styles:{} };
        const rule = { ...previous, styles: {...previous.styles,...value.styles}, attributes: {...previous.attributes,...value.attributes}, ...(value.layout ? { layout: value.layout } : {}) };
        const next = {version:1,rules:[...current.present.rules.filter(item => item.selector !== value.selector),rule]};
        validateVisualOverrides(next);
        const nextHistory = { past: dragStarted.current ? current.past : [...current.past.slice(-79),current.present], present:next,future:[] };
        dragStarted.current = true; state.current = nextHistory; setHistory(nextHistory);
      }
      if (type === 'drag-end') dragStarted.current = false;
    };
    window.addEventListener('message', message);
    return () => window.removeEventListener('message', message);
  }, []);
  useEffect(() => { if (ready) send('config',previewConfigRef.current); }, [config,size,ready]);
  useEffect(() => { if (ready) send('draft',history.present); }, [history.present,ready]);
  useEffect(() => {
    const warn = event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload',warn);
    return () => window.removeEventListener('beforeunload',warn);
  }, [dirty]);
  useEffect(() => {
    const key = event => {
      if (event.target.closest('input,textarea,select')) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); }
    };
    window.addEventListener('keydown',key);
    return () => window.removeEventListener('keydown',key);
  }, []);

  async function save() {
    setSaving(true); setError('');
    const snapshot = history.present;
    try {
      const response = await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-FarmJam-Editor':'1'},body:JSON.stringify({document:snapshot,revision})});
      const value = await response.json();
      if (!response.ok) throw new Error(value.error);
      setSaved(snapshot); setRevision(value.revision); setStatus('Saved to src/data/visual-overrides.json');
    } catch (failure) { setError(failure.message); }
    finally { setSaving(false); }
  }
  function exportDraft() {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(history.present,null,2)],{type:'application/json'}));
    link.download = 'farmjam-visual-overrides.json'; link.click(); URL.revokeObjectURL(link.href);
  }
  async function importDraft(event) {
    try { const file = event.target.files[0]; if (file) change(validateVisualOverrides(JSON.parse(await file.text()))); }
    catch (failure) { setError(failure.message); }
    event.target.value = '';
  }
  function resizeDown(event) {
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    const x = event.clientX, y = event.clientY, base = size;
    const target = event.currentTarget;
    const move = next => setSize({width:Math.max(MIN_VIEWPORT.width,Math.min(MAX_VIEWPORT.width,Math.round(base.width+(next.clientX-x)/scale))),height:Math.max(MIN_VIEWPORT.height,Math.min(MAX_VIEWPORT.height,Math.round(base.height+(next.clientY-y)/scale)))});
    const up = () => { target.removeEventListener('pointermove',move); target.removeEventListener('pointerup',up); target.removeEventListener('pointercancel',up); };
    target.addEventListener('pointermove',move); target.addEventListener('pointerup',up); target.addEventListener('pointercancel',up);
  }
  function field(kind, key) {
    const value = currentRule?.[kind]?.[key] ?? selection?.[kind]?.[key] ?? '';
    const edited = currentRule?.[kind]?.[key] !== undefined;
    const color = /^(fill|stroke|stop-color|color|background-color)$/.test(key);
    return <label key={`${kind}:${key}`} className={`editor-property ${edited?'is-edited':''}`}><span>{key}</span><div>{color && <input type="color" aria-label={`${key} swatch`} value={/^#[\da-f]{6}$/i.test(value)?value:'#808080'} onChange={event=>edit(selection.selector,kind,{[key]:event.target.value})}/>} {['d','points','transform','viewBox'].includes(key) ? <textarea rows={key==='d'?4:2} aria-label={`${kind} ${key}`} value={value} spellCheck={false} onChange={event=>edit(selection.selector,kind,{[key]:event.target.value})}/> : <input aria-label={`${kind} ${key}`} value={value} spellCheck={false} onChange={event=>edit(selection.selector,kind,{[key]:event.target.value})}/>}<IconButton icon={RotateCcw} label={`Reset ${kind} ${key}`} disabled={!edited} onClick={()=>resetProperty(kind,key)}/></div></label>;
  }
  const attributeKeys = selection ? [...new Set([...Object.keys(selection.attributes),...Object.keys(currentRule?.attributes??{}),...(selection.tag==='svg'?['viewBox']:[]),...(['path','g','circle','ellipse','rect','polygon','line','polyline'].includes(selection.tag)?['fill','stroke','stroke-width','opacity','transform']:[])])] : [];
  const styleKeys = selection ? [...new Set([...(selection.selector.includes('interactive-object') && selection.tag==='button'?['--object-x','--object-base','--object-center','--object-size','--object-height']:['left','top','width','height','translate','scale','rotate']),...Object.keys(currentRule?.styles??{})])] : [];
  return <main className="visual-editor">
    <header className="editor-header"><div className="editor-brand"><Shapes size={22}/><div><strong>FarmJam Studio</strong><span>Development artwork editor</span></div></div><nav className="editor-tabs" aria-label="Preview view">{[['scene','Scene'],['objects','Objects'],['character','Character'],['menu','Menu']].map(([id,label])=><button key={id} aria-pressed={config.view===id} onClick={()=>{setConfig(current=>({...current,view:id}));setSelection(null);}}>{label}</button>)}</nav><div className="editor-actions"><IconButton icon={Undo2} label="Undo" disabled={!history.past.length} onClick={undo}/><IconButton icon={Redo2} label="Redo" disabled={!history.future.length} onClick={redo}/><IconButton icon={Download} label="Export draft" onClick={exportDraft}/><IconButton icon={Upload} label="Import draft" onClick={()=>importFile.current.click()}/><IconButton icon={RotateCcw} label="Discard unsaved changes" disabled={!dirty} onClick={()=>{if(window.confirm('Discard all unsaved artwork changes?'))change(saved);}}/><button className="editor-save" disabled={!dirty||!revision||saving} onClick={save}><Save size={17}/>{saving?'Saving...':'Save to project'}</button><input hidden ref={importFile} type="file" accept="application/json,.json" onChange={importDraft}/></div></header>
    <div className="editor-body"><section className="editor-preview-area"><div className="editor-toolbar"><div className="editor-segment" aria-label="Preview tool">{[['select','Select',MousePointer2],['drag','Drag scene items',Move],['interact','Interact',Hand]].map(([id,label,icon])=><IconButton key={id} icon={icon} label={label} active={config.mode===id} onClick={()=>setConfig(current=>({...current,mode:id}))}/>)}</div><IconButton icon={Layers} label="Select SVG parts" active={config.parts} onClick={()=>setConfig(current=>({...current,parts:!current.parts}))}/><select aria-label="Scene" value={config.scene} onChange={event=>{setConfig(current=>({...current,scene:Number(event.target.value)}));setSelection(null);}}>{SCENES.map((scene,index)=><option key={scene.id} value={index}>{scene.name}</option>)}</select>{config.view==='scene'&&<select aria-label="Visitor preview" value={config.visitor} onChange={event=>setConfig(current=>({...current,visitor:event.target.value}))}><option value="regular">Regular objects</option><option value="0">First visitor</option><option value="1">Second visitor</option></select>}<div className="editor-toolbar-spacer"/><IconButton icon={config.paused?Play:Pause} label={config.paused?'Resume animations':'Pause animations'} onClick={()=>setConfig(current=>({...current,paused:!current.paused}))}/><IconButton icon={RefreshCw} label="Replay animation" onClick={()=>send('replay')}/><label className="editor-toggle"><input type="checkbox" checked={config.sound} onChange={event=>setConfig(current=>({...current,sound:event.target.checked}))}/>Sound</label></div>
    <div className="editor-viewport-toolbar">
      <div className="editor-segment" aria-label="Responsive endpoint">
        <button aria-pressed={endpointSize==='min'} onClick={()=>setSize(MIN_VIEWPORT)}>Minimum 360 x 240</button>
        <button aria-pressed={endpointSize==='max'} onClick={()=>setSize(MAX_VIEWPORT)}>Maximum 1920 x 1080</button>
      </div>
      <IconButton icon={Monitor} label="Desktop viewport" onClick={()=>setSize({width:1440,height:900})}/><IconButton icon={Smartphone} label="Compact landscape viewport" onClick={()=>setSize({width:780,height:284})}/><IconButton icon={Smartphone} label="Portrait phone viewport" onClick={()=>setSize({width:393,height:851})}/>
      <label>W<input type="number" min={MIN_VIEWPORT.width} max={MAX_VIEWPORT.width} aria-label="Viewport width" value={size.width} onChange={event=>setSize(current=>({...current,width:Math.max(MIN_VIEWPORT.width,Math.min(MAX_VIEWPORT.width,Number(event.target.value)))}))}/></label><span>x</span>
      <label>H<input type="number" min={MIN_VIEWPORT.height} max={MAX_VIEWPORT.height} aria-label="Viewport height" value={size.height} onChange={event=>setSize(current=>({...current,height:Math.max(MIN_VIEWPORT.height,Math.min(MAX_VIEWPORT.height,Number(event.target.value)))}))}/></label>
      <select aria-label="Preview zoom" value={zoom} onChange={event=>setZoom(event.target.value)}><option value="fit">Fit</option><option value="1">100%</option><option value="0.75">75%</option><option value="0.5">50%</option></select><span className="editor-viewport-scale">{Math.round(scale*100)}%</span>
      <label className="editor-toggle"><input type="checkbox" checked={config.ratioLocked} onChange={event=>setConfig(current=>({...current,ratioLocked:event.target.checked}))}/>Aspect lock</label>
    </div>
    {config.view==='objects'&&<div className="editor-library-toolbar"><label className="editor-toggle"><input type="checkbox" checked={config.playing} onChange={event=>setConfig(current=>({...current,playing:event.target.checked}))}/>Instrument animations</label></div>}
    <div className="editor-stage" ref={stage}><div className="editor-frame-wrap" style={{width:size.width*scale,height:size.height*scale}}><iframe ref={iframe} title="Live game preview" src="/__editor/preview" style={{width:size.width,height:size.height,transform:`scale(${scale})`}}/><button className="editor-resize" aria-label="Resize preview viewport" title="Drag to resize the game viewport" onPointerDown={resizeDown}><Maximize2 size={15}/></button></div></div>
    <footer className="editor-status"><span>{dirty?'Unsaved draft':'Project saved'} / {history.present.rules.length} overrides</span><span role="status">{status}</span></footer>{error&&<div className="editor-error" role="alert">{error}<IconButton icon={X} label="Dismiss error" onClick={()=>setError('')}/></div>}</section>
    <aside className="editor-inspector" aria-label="Artwork inspector"><section className="editor-entities"><div className="editor-inspector-title"><h2>Scene Outline</h2><IconButton icon={RefreshCw} label="Refresh scene outline" onClick={()=>send('refresh')}/></div><input type="search" aria-label="Find object or part" placeholder="Find object or part" value={search} onChange={event=>setSearch(event.target.value)}/><div className="editor-entity-list">{entities.filter(entity=>`${entity.label} ${entity.selector}`.toLowerCase().includes(search.toLowerCase())).map(entity=><button key={entity.selector} className={selection?.selector===entity.selector?'is-selected':''} onClick={()=>send('select',entity.selector)}><ChevronRight size={13}/><span>{entity.label}</span><small>{entity.tag}</small></button>)}</div></section>
    {selection?<section className="editor-properties"><div className="editor-inspector-title"><h2>{selection.label}</h2><IconButton icon={RotateCcw} label="Reset selected item" disabled={!currentRule} onClick={()=>change({version:1,rules:history.present.rules.filter(rule=>rule.selector!==selection.selector)})}/></div><code className="editor-selector">{selection.selector}</code>
    <div className="editor-item-tools"><button className="editor-inspect-parts" onClick={()=>send('parts')}><Layers size={15}/>Browse SVG parts</button><IconButton icon={Spline} label="Edit SVG points" active={config.points} onClick={()=>setConfig(current=>({...current,points:!current.points,parts:true,mode:'select'}))}/></div>
    {config.view==='scene'&&selection.geometry&&<details open><summary>Responsive Layout</summary>
      <button className="editor-fit" disabled={fitting} onClick={fitLayout}><Maximize2 size={16}/>{fitting?'Measuring...':currentRule?.layout?'Refit responsive endpoints':'Fit responsive endpoints'}</button>
      {currentRule?.layout&&<>
        <div className="editor-endpoint-status">{endpointSize==='min'?'Minimum':endpointSize==='max'?'Maximum':'Interpolated'} / {size.width} x {size.height}</div>
        {endpointSize&&['x','y','width','height'].map(key=><label className="editor-property" key={key}><span>{key} {key==='x'||key==='y'?'(%)':'(px)'}</span><input type="number" step="0.1" min={key==='width'||key==='height'?8:undefined} aria-label={`Endpoint ${key}`} value={Number(currentRule.layout[endpointSize][key].toFixed(2))} onChange={event=>replaceRule({...currentRule,layout:{...currentRule.layout,[endpointSize]:{...currentRule.layout[endpointSize],[key]:Number(event.target.value)}}})}/></label>)}
        <code className="editor-formula">W: {boundedFormula(currentRule.layout.min.width,currentRule.layout.max.width)}<br/>H: {boundedFormula(currentRule.layout.min.height,currentRule.layout.max.height,'height')}</code>
      </>}
    </details>}
    <details open><summary>Layer Order</summary><div className="editor-layer-tools"><IconButton icon={ChevronsDown} label="Send to back" onClick={()=>changeLayer(-100)}/><IconButton icon={ArrowDown} label="Send backward" onClick={()=>changeLayer((currentRule?.layer??Number(selection.styles['z-index']))-1||-1)}/><input type="number" min="-10000" max="10000" aria-label="Layer depth" value={currentRule?.layer??(Number(selection.styles['z-index'])||0)} onChange={event=>changeLayer(Number(event.target.value))}/><IconButton icon={ArrowUp} label="Bring forward" onClick={()=>changeLayer((currentRule?.layer??(Number(selection.styles['z-index'])||0))+1)}/><IconButton icon={ChevronsUp} label="Bring to front" onClick={()=>changeLayer(100)}/></div></details>
    <label className="editor-toggle"><input type="checkbox" checked={compactRule} disabled={Boolean(currentRule?.layout)} onChange={event=>{setCompactRule(event.target.checked);if(currentRule){const rule={...currentRule};if(event.target.checked)rule.maxWidth=breakpoint;else delete rule.maxWidth;change({version:1,rules:history.present.rules.map(item=>item.selector===rule.selector?rule:item)});}}}/>Compact viewport only</label>{compactRule&&<label className="editor-property"><span>Max width (px)</span><input type="number" min="240" max="4000" value={currentRule?.maxWidth??breakpoint} onChange={event=>{const value=Number(event.target.value);setBreakpoint(value);if(currentRule)change({version:1,rules:history.present.rules.map(rule=>rule===currentRule?{...rule,maxWidth:value}:rule)});}}/></label>}
    <details open><summary>SVG Geometry And Color</summary>{attributeKeys.map(key=>field('attributes',key))}</details><details open><summary>Placement And Size</summary>{styleKeys.map(key=>field('styles',key))}</details><details><summary>Animation</summary>{['animation-duration','animation-delay','animation-timing-function','animation-iteration-count','transform-origin','opacity'].map(key=>field('styles',key))}</details><div className="editor-add-property"><select aria-label="Add visual property" value={property} onChange={event=>setProperty(event.target.value)}>{[['attributes',VISUAL_ATTRIBUTES],['styles',VISUAL_STYLES]].flatMap(([kind,keys])=>keys.map(key=><option key={`${kind}:${key}`} value={`${kind}:${key}`}>{kind} / {key}</option>))}</select><button onClick={()=>{const [kind,key]=property.split(':');edit(selection.selector,kind,{[key]:selection[kind]?.[key]||'0'});}}>Add</button></div></section>:<section className="editor-empty"><MousePointer2 size={24}/><h2>Select An Item</h2><p>Select an object or scenery in the preview, or choose it from the outline. Use the layers icon to select an individual SVG shape.</p></section>}
    {['character','scene','menu'].includes(config.view)&&<details className="editor-avatar"><summary>Preview Character</summary><label>Age<select aria-label="Preview age" value={config.age} onChange={event=>setConfig(current=>({...current,age:event.target.value}))}>{['under3','3to4','5to7','8plus'].map(value=><option key={value}>{value}</option>)}</select></label>{Object.entries(AVATAR_OPTIONS).map(([key,options])=><label key={key}>{key}<select aria-label={`Preview ${key}`} value={config.avatar[key]} onChange={event=>setConfig(current=>({...current,avatar:{...current.avatar,[key]:event.target.value}}))}>{options.map(value=><option key={value}>{value}</option>)}</select></label>)}</details>}</aside></div>
  </main>;
}

export async function mountVisualEditor(root) {
  if (location.pathname === '/__editor/preview') {
    const { EditorPreview } = await import('./EditorPreview');
    root.render(<EditorPreview/>);
  } else root.render(<VisualEditor/>);
}