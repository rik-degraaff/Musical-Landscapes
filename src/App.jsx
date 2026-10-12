import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import { INSTRUMENTS,INSTRUMENT_SLOTS } from './utils/music';
import { Instrument } from './components/Instrument';
import { Mixer } from './components/Mixer';
import { StartScreen } from './components/StartScreen';
import { Scene, SCENES } from './scenes/Scene';
import { AudioEngine } from './audio/AudioEngine';
import { Menu, X } from 'lucide-react';
import { YoungMusician } from './components/YoungMusician';
import { PerformancePanel } from './components/PerformancePanel';
import { slidePosition } from './utils/performance';
import './components/controls.css';
import { LandscapeGuard, requestLandscape } from './components/LandscapeGuard';
import {Metronome} from './components/Metronome';
import {PracticeRoom} from './components/PracticeRoom';
import {ParentGuide} from './components/ParentGuide';
import {normalizeChild} from './utils/children';
import {useAppUpdates} from './components/useAppUpdates.js';
import {createFamilyStorage,recoverFamilySnapshot} from './utils/familyStorage.js';

function initialInstruments(selected) {
  return Object.fromEntries(Object.entries(INSTRUMENTS).map(([name,value])=>[name,{...value,...(selected.includes(name)?INSTRUMENT_SLOTS[selected.indexOf(name)]:{}),active:false}]));
}

export default function App() {
  const audioRef = useRef(null);
  const [started,setStarted] = useState(false);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState(null);
  const [sceneIndex,setSceneIndex] = useState(0);
  const [performanceRoot,setPerformanceRoot] = useState(SCENES[0].root);
  const [mixer,setMixer] = useState(false);
  const [metronomeOpen,setMetronomeOpen] = useState(false);
  const [practice,setPractice]=useState(null);
  const [parentGuide,setParentGuide]=useState(false);
  const [storage]=useState(()=>createFamilyStorage());
  const [initial]=useState(()=>storage.load());
  const [saveError,setSaveError]=useState(Boolean(initial.saveError));
  const storageReadFailed=useRef(Boolean(initial.saveError));
  const [family,setFamily]=useState(initial.family);
  const selectedChild=family.children.find(child=>child.id===family.selectedId)??null;
  const [settings,setSettings] = useState(initial.settings);
  const [sceneVolume,setSceneVolume] = useState(-4);
  const mixerTap = useRef(null);
  const [instruments,setInstruments] = useState(()=>initialInstruments(settings.selected));
  const stateRef = useRef(instruments);
  const drag = useRef(null);
  const startInProgress = useRef(false);
  const worldRef = useRef(null);
  const equippedRef = useRef(null);
  const [equipped,setEquipped] = useState(null);
  const [dragging,setDragging] = useState(null);
  const [nearChild,setNearChild] = useState(false);
  const startupState=useRef({settings,sceneIndex});
  const mounted=useRef(false);
  useAppUpdates({started,loading,parentGuide:parentGuide||saveError});

  useEffect(()=>{ stateRef.current=instruments; },[instruments]);
  useLayoutEffect(()=>{startupState.current={settings,sceneIndex};},[settings,sceneIndex]);
  useEffect(()=>{mounted.current=true;return ()=>{mounted.current=false;audioRef.current?.dispose();};},[]);
  useEffect(()=>{
    if(!initial.saveError&&!storage.saveLegacySettings(initial.settings).ok)setSaveError(true);
  },[storage,initial]);
  useEffect(()=>{
    if(audioRef.current)audioRef.current.updatePerformanceSettings(settings.instruments);
  },[settings]);

  async function start() {
    if(!selectedChild){setParentGuide(true);return;}
    if(startInProgress.current) return;
    requestLandscape();
    startInProgress.current=true;
    setLoading(true); setError(null);
    try {
      if(!audioRef.current)audioRef.current = new AudioEngine();
      const engine=audioRef.current;
      engine.onSceneKeyChange=root=>{if(mounted.current&&audioRef.current===engine)setPerformanceRoot(root);};
      engine.onActiveChange=(name,active)=>{
          if(!mounted.current||audioRef.current!==engine)return;
          const next={...stateRef.current,[name]:{...stateRef.current[name],active}};
          stateRef.current=next;setInstruments(next);
      };
      await engine.init();
      if(!mounted.current||audioRef.current!==engine)return;
      engine.updatePerformanceSettings(startupState.current.settings.instruments);
      engine.setSceneKey(SCENES[startupState.current.sceneIndex].root);
      setPerformanceRoot(engine.playbackRoot);
      setStarted(true);
    }
    catch(e) { if(mounted.current){console.error(e);setError('The sound engine could not start. Try tapping play again.');} }
    finally { startInProgress.current=false;if(mounted.current)setLoading(false); }
  }

  function toggle(name) {
    if(!started) return;
    const next = !stateRef.current[name].active;
    const nextState = {...stateRef.current,[name]:{...stateRef.current[name],active:next}};
    stateRef.current=nextState; setInstruments(nextState);
    audioRef.current.setInstrumentActive(name,next);
  }

  function volume(name,value) {
    const next={...stateRef.current,[name]:{...stateRef.current[name],volume:Number(value)}};
    stateRef.current=next; setInstruments(next);
    audioRef.current.setVolumes({[name]:Number(value)});
  }

  function arrangeSelection(next) {
    const changed=next.selected.some((name,index)=>name!==settings.selected[index]);
    if(changed) {
      if(equippedRef.current&&!next.selected.includes(equippedRef.current))equip(null);
      for(const name of settings.selected)if(!next.selected.includes(name))audioRef.current?.setInstrumentActive(name,false);
      const positions={...stateRef.current};
      next.selected.forEach((name,index)=>{if(settings.selected[index]!==name)positions[name]={...positions[name],...INSTRUMENT_SLOTS[index]};});
      stateRef.current=positions;setInstruments(positions);
    }
  }

  function updateSettings(next) {
    arrangeSelection(next);
    setSettings(next);
    const nextFamily={...family,children:family.children.map(child=>child.id===selectedChild?.id?{...child,settings:next}:child)};
    setSaveError(!storage.saveSnapshot({family:nextFamily,settings:next}).ok);
    setFamily(nextFamily);
  }

  function selectChild(id) {
    const child=family.children.find(value=>value.id===id);if(!child)return;
    const nextFamily={...family,selectedId:id};
    setSaveError(!storage.saveSnapshot({family:nextFamily,settings:child.settings}).ok);
    setFamily(nextFamily);setSettings(child.settings);
    const next=initialInstruments(child.settings.selected);stateRef.current=next;setInstruments(next);
  }

  function addChild(draft) {
    const child=normalizeChild({...draft,id:crypto.randomUUID()});if(!child)return false;
    const nextFamily={children:[...family.children,child],selectedId:child.id};
    if(!storage.saveSnapshot({family:nextFamily,settings:child.settings}).ok){setSaveError(true);return false;}
    setSaveError(false);
    setFamily(nextFamily);setSettings(child.settings);
    const next=initialInstruments(child.settings.selected);stateRef.current=next;setInstruments(next);
    setParentGuide(false);return true;
  }

  function retrySave() {
    if(storageReadFailed.current){
      const recovered=storage.load();
      if(recovered.saveError){setSaveError(true);return;}
      const snapshot=recoverFamilySnapshot(initial,{family,settings},recovered);
      storageReadFailed.current=false;
      if(started)arrangeSelection(snapshot.settings);
      setFamily(snapshot.family);setSettings(snapshot.settings);
      if(!started){const next=initialInstruments(snapshot.settings.selected);stateRef.current=next;setInstruments(next);}
      setSaveError(!storage.saveSnapshot(snapshot).ok);
      return;
    }
    setSaveError(!storage.saveSnapshot({family,settings}).ok);
  }

  function pointerDown(e,name) {
    if(e.pointerType==='mouse' && e.button!==0) return;
    if(drag.current) return;
    const rect=e.currentTarget.getBoundingClientRect();
    drag.current={name,id:e.pointerId,startX:e.clientX,startY:e.clientY,baseX:rect.left+rect.width/2,baseY:rect.top+rect.height/2,moved:false};
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function changeSceneVolume(value) {
    const next = Number(value);
    setSceneVolume(next);
    audioRef.current?.setSceneVolume(next);
  }

  function activateMixer() {
    setMetronomeOpen(false);
    if(mixer) {
      setMixer(false);
      mixerTap.current=null;
      return;
    }
    const now=performance.now();
    if(mixerTap.current!==null && now-mixerTap.current<=450) {
      setMixer(true);
      mixerTap.current=null;
    } else mixerTap.current=now;
  }
  function pointerMove(e,name) {
    const d=drag.current;
    if(!d || d.name!==name || d.id!==e.pointerId) return;
    const dx=e.clientX-d.startX,dy=e.clientY-d.startY;
    if(Math.hypot(dx,dy)>(e.pointerType==='touch'?12:7)) d.moved=true;
    if(!d.moved) return;
    setDragging(name);
    const world=worldRef.current.getBoundingClientRect();
    const x=Math.max(5,Math.min(95,(d.baseX+dx-world.left)/world.width*100));
    const y=Math.max(15,Math.min(90,(d.baseY+dy-world.top)/world.height*100));
    const child=document.getElementById('young-musician').getBoundingClientRect();
    setNearChild(e.clientX>=child.left-20&&e.clientX<=child.right+20&&e.clientY>=child.top-15&&e.clientY<=child.bottom+15);
    const nextState={...stateRef.current,[name]:{...stateRef.current[name],x,y}};
    stateRef.current=nextState; setInstruments(nextState);
  }
  function pointerUp(e,name) {
    const d=drag.current;
    if(!d || d.name!==name || d.id!==e.pointerId) return;
    if(d.moved) {
      const child=document.getElementById('young-musician').getBoundingClientRect();
      const dropped=e.clientX>=child.left-20&&e.clientX<=child.right+20&&e.clientY>=child.top-15&&e.clientY<=child.bottom+15;
      if(dropped) equip(name);
      else {
        if(equippedRef.current===name) equip(null,false);
        requestAnimationFrame(()=>settle(name));
      }
    } else toggle(name);
    drag.current=null;
    setDragging(null);setNearChild(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
  }

  function pointerCancel(e) {
    if(drag.current?.id===e.pointerId) { const name=drag.current.name;drag.current=null;setDragging(null);setNearChild(false);requestAnimationFrame(()=>settle(name)); }
  }

  function equip(name, resetPrevious=true) {
    if(!started) return;
    const previous=equippedRef.current;
    equippedRef.current=name;setEquipped(name);
    audioRef.current.setManualInstrument(name);
    if(previous&&previous!==name&&resetPrevious) {
      const home=INSTRUMENT_SLOTS[settings.selected.indexOf(previous)]??INSTRUMENTS[previous];
      const next={...stateRef.current,[previous]:{...stateRef.current[previous],x:home.x,y:home.y}};
      stateRef.current=next;setInstruments(next);
    }
    requestAnimationFrame(()=>{if(name)attachToChild(name);if(previous&&previous!==name)settle(previous);});
  }

  function attachToChild(name) {
    const world=worldRef.current.getBoundingClientRect();
    const child=document.getElementById('young-musician').getBoundingClientRect();
    const next={...stateRef.current,[name]:{...stateRef.current[name],x:(child.left+child.width/2-world.left)/world.width*100,y:(child.top+child.height*.65-world.top)/world.height*100}};
    stateRef.current=next;setInstruments(next);
  }

  function settle(name) {
    if(equippedRef.current===name) return;
    const world=worldRef.current?.getBoundingClientRect();
    const element=document.getElementById(`instrument-${name}`);
    if(!world||!element)return;
    const rect=element.getBoundingClientRect();
    const artSize=node=>{const art=node.querySelector('.instrument-illustration')?.getBoundingClientRect();return art?.width?{width:art.width,height:art.height}:null;};
    const size=artSize(element)??rect;
    const insetX=(rect.width-size.width)/2,insetY=(rect.height-size.height)/2;
    const others=[...worldRef.current.querySelectorAll('.instrument,.interactive-object,#young-musician,.celestial-control[data-settled="true"]'),...document.querySelectorAll('.mixer-button,.metronome-mini')];
    const obstacles=others.filter(other=>other!==element).map(other=>{
      const bounds=other.getBoundingClientRect();
      const peer=other.id.startsWith('instrument-')?stateRef.current[other.id.slice(11)]:null;
      const peerSize=peer?artSize(other)??bounds:bounds;
      return {x:peer?peer.x/100*world.width:bounds.left+bounds.width/2-world.left,y:peer?peer.y/100*world.height:bounds.top+bounds.height/2-world.top,width:peerSize.width,height:peerSize.height};
    });
    const point=slidePosition({x:stateRef.current[name].x/100*world.width,y:stateRef.current[name].y/100*world.height},size,obstacles,{left:insetX,top:8+insetY,right:world.width-insetX,bottom:world.height-8-insetY},3);
    const next={...stateRef.current,[name]:{...stateRef.current[name],x:point.x/world.width*100,y:point.y/world.height*100}};
    stateRef.current=next;setInstruments(next);
  }

  useLayoutEffect(()=>{
    const layout=()=>requestAnimationFrame(()=>{if(equippedRef.current)attachToChild(equippedRef.current);for(const name of Object.keys(INSTRUMENTS))settle(name);});
    if(started)layout();
    window.addEventListener('resize',layout);
    return ()=>window.removeEventListener('resize',layout);
  },[equipped,sceneIndex,started,settings.selected]);

  function rotateScene() {
    setSceneIndex(i=>{ const next=(i+1)%SCENES.length; audioRef.current?.setSceneKey(SCENES[next].root); return next; });
  }

  function enterPractice(playback){if(playback)audioRef.current.setInstrumentActive(playback.name,playback.active);drag.current=null;setDragging(null);setNearChild(false);setMixer(false);setMetronomeOpen(false);setPractice(equippedRef.current??settings.selected[0]);}

  function returnToMenu() {
    window.dispatchEvent(new Event('farmjam-input-reset'));
    audioRef.current?.dispose();audioRef.current=null;
    drag.current=null;equippedRef.current=null;mixerTap.current=null;
    setEquipped(null);setDragging(null);setNearChild(false);setPractice(null);
    setMixer(false);setMetronomeOpen(false);setStarted(false);setSceneIndex(0);setError(null);
    const next=initialInstruments(settings.selected);stateRef.current=next;setInstruments(next);
  }

  return <main className={`app-shell ${equipped?'manual-open':''}`}>
    <div className="landscape-world" ref={worldRef} inert={mixer||Boolean(practice)}>
    <Scene sceneIndex={sceneIndex} playing={started} audio={audioRef.current} onRotate={rotateScene} onCelestialSettled={()=>{if(started)for(const name of Object.keys(INSTRUMENTS))settle(name);}}/>
    {started&&<YoungMusician child={selectedChild} equipped={equipped?INSTRUMENTS[equipped].label:null} accepting={nearChild} onPractice={enterPractice}/>}
    <div className="instrument-layer">
      {settings.selected.map(name=>{const i=instruments[name];return <Instrument key={name} name={name} label={i.label} x={i.x} y={i.y} active={i.active} equipped={equipped===name} sliding={dragging!==name} onEquip={()=>equip(name)} onToggle={toggle}
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerCancel}/>;}) }
    </div>
    </div>

    <div className="top-bar" inert={mixer||Boolean(practice)} aria-hidden={mixer||Boolean(practice)}>
      {started && <button className="mixer-button" onClick={activateMixer} aria-expanded={mixer} aria-controls="landscape-mixer" aria-label={mixer?'Close settings':'Open settings'} title={mixer?'Close settings':'Double-click or double-tap to open settings'}>{mixer?<X size={22}/>:<Menu size={22}/>}</button>}
    </div>

    {started && mixer && <Mixer saveError={saveError} onRetrySave={retrySave} instruments={instruments} onVolume={volume} sceneVolume={sceneVolume} onSceneVolume={changeSceneVolume} settings={settings} onSettings={updateSettings} onMenu={returnToMenu} onClose={()=>{setMixer(false);mixerTap.current=null;}}/>}
    {started&&<Metronome audio={audioRef.current} open={metronomeOpen} disabled={mixer||Boolean(practice)} onOpen={()=>setMetronomeOpen(true)} onClose={()=>setMetronomeOpen(false)}/>}

    {equipped&&!practice&&<PerformancePanel key={equipped} name={equipped} audio={audioRef.current} root={performanceRoot} options={settings.instruments[equipped]} settingsOpen={mixer} onClose={()=>equip(null)}/>}
    {practice&&<PracticeRoom child={selectedChild} audio={audioRef.current} initialInstrument={practice} settings={settings} root={SCENES[sceneIndex].root} onClose={()=>setPractice(null)}/>}

    {!started && <StartScreen saveError={saveError} onRetrySave={retrySave} children={family.children} selectedId={family.selectedId} loading={loading} error={error} onStart={start} onSelect={selectChild} onAdd={()=>setParentGuide(true)}/>}
    {!started&&parentGuide&&<ParentGuide settings={settings} onComplete={addChild} onClose={()=>setParentGuide(false)}/>}
    <LandscapeGuard/>
  </main>;
}
