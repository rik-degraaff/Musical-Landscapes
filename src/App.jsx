import React, {useEffect, useMemo, useRef, useState} from 'react';
import { INSTRUMENTS } from './utils/music';
import { Instrument } from './components/Instrument';
import { Mixer } from './components/Mixer';
import { StartScreen } from './components/StartScreen';
import { Scene, SCENES } from './scenes/Scene';
import { AudioEngine } from './audio/AudioEngine';
import { SlidersHorizontal, X } from 'lucide-react';

const initialInstruments = Object.fromEntries(Object.entries(INSTRUMENTS).map(([name,v])=>[name,{...v,active:false}]));

export default function App() {
  const audioRef = useRef(null);
  const [started,setStarted] = useState(false);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState(null);
  const [sceneIndex,setSceneIndex] = useState(0);
  const [mixer,setMixer] = useState(false);
  const [instruments,setInstruments] = useState(initialInstruments);
  const stateRef = useRef(instruments);
  const drag = useRef(null);
  const startInProgress = useRef(false);

  useEffect(()=>{ stateRef.current=instruments; },[instruments]);
  useEffect(()=>()=>audioRef.current?.dispose(),[]);

  const activeCount = useMemo(()=>Object.values(instruments).filter(x=>x.active).length,[instruments]);

  async function start() {
    if(startInProgress.current) return;
    startInProgress.current=true;
    setLoading(true); setError(null);
    try {
      if(!audioRef.current) {
        audioRef.current = new AudioEngine();
      }
      await audioRef.current.init();
      audioRef.current.setSceneKey(SCENES[sceneIndex].root);
      setStarted(true);
    }
    catch(e) { console.error(e); setError('The sound engine could not start. Try tapping play again.'); }
    finally { startInProgress.current=false; setLoading(false); }
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

  function pointerDown(e,name) {
    if(e.pointerType==='mouse' && e.button!==0) return;
    if(drag.current) return;
    const rect=e.currentTarget.getBoundingClientRect();
    drag.current={name,id:e.pointerId,startX:e.clientX,startY:e.clientY,baseX:rect.left+rect.width/2,baseY:rect.top+rect.height/2,moved:false};
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function pointerMove(e,name) {
    const d=drag.current;
    if(!d || d.name!==name || d.id!==e.pointerId) return;
    const dx=e.clientX-d.startX,dy=e.clientY-d.startY;
    if(Math.hypot(dx,dy)>(e.pointerType==='touch'?12:7)) d.moved=true;
    if(!d.moved) return;
    const x=Math.max(5,Math.min(95,(d.baseX+dx)/window.innerWidth*100));
    const y=Math.max(15,Math.min(82,(d.baseY+dy)/window.innerHeight*100));
    const nextState={...stateRef.current,[name]:{...stateRef.current[name],x,y}};
    stateRef.current=nextState; setInstruments(nextState);
  }
  function pointerUp(e,name) {
    const d=drag.current;
    if(!d || d.name!==name || d.id!==e.pointerId) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    if(!d.moved) toggle(name);
    drag.current=null;
  }

  function pointerCancel(e) {
    if(drag.current?.id===e.pointerId) drag.current=null;
  }

  function rotateScene() {
    setSceneIndex(i=>{ const next=(i+1)%SCENES.length; audioRef.current?.setSceneKey(SCENES[next].root); return next; });
  }

  return <main className="app-shell">
    <Scene sceneIndex={sceneIndex} audio={audioRef.current} onRotate={rotateScene}/>

    <div className="top-bar">
      <div className="brand"><span>♪</span><strong>Musical Landscape</strong></div>
      {started && <div className="scene-name">{SCENES[sceneIndex].name}</div>}
      {started && <button className="mixer-button" onClick={()=>setMixer(v=>!v)} aria-label={mixer?'Close mixer':'Open mixer'} title={mixer?'Close mixer':'Open mixer'}>{mixer?<X size={19}/>:<SlidersHorizontal size={19}/>} <span>Mixer</span></button>}
    </div>

    {started && mixer && <Mixer instruments={instruments} onVolume={volume} onClose={()=>setMixer(false)}/>}

    <div className="instrument-layer">
      {Object.entries(instruments).map(([name,i])=><Instrument key={name} name={name} label={i.label} x={i.x} y={i.y} active={i.active} onToggle={toggle}
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerCancel}/>) }
    </div>

    {started && <div className={`status-pill ${activeCount?'has-music':''}`} aria-live="polite">
      <span className="status-light"/>{activeCount ? `${activeCount} ${activeCount===1?'sound':'sounds'} making music` : 'Quiet landscape'}
    </div>}

    {!started && <StartScreen loading={loading} error={error} onStart={start}/>}
  </main>;
}
