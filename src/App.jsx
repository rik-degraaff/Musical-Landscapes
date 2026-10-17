import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import { INSTRUMENTS,INSTRUMENT_SLOTS } from './utils/music';
import { Instrument } from './components/Instrument';
import { Mixer } from './components/Mixer';
import { StartScreen } from './components/StartScreen';
import { Scene, SCENES } from './scenes/Scene';
import { AudioEngine } from './audio/AudioEngine';
import {SettingsButton} from './components/GameButtons';
import { YoungMusician } from './components/YoungMusician';
import { PerformancePanel } from './components/PerformancePanel';
import { slidePosition } from './utils/performance';
import './components/controls.css';
import { LandscapeGuard, requestLandscape } from './components/LandscapeGuard';
import {Metronome} from './components/Metronome';
import {PracticeRoom} from './components/PracticeRoom';
import {ParentGuide} from './components/ParentGuide';
import {ChildEditor} from './components/ChildEditor';
import {CaregiverHelp,HelpButton} from './components/CaregiverHelp';
import {editChild,normalizeChild,removeChild} from './utils/children';
import {useAppUpdates} from './components/useAppUpdates.js';
import {createFamilyStorage,recoverFamilySnapshot} from './utils/familyStorage.js';
import {defaultSettings,resetSoundMix} from './utils/settings.js';
import {createCaregiverStorage,normalizeFamiliarity} from './utils/caregiverSettings.js';
import savedVisuals from './data/visual-overrides.json';
import {instrumentHome} from './utils/responsiveVisuals.js';
import {GuideReader} from './components/Guides';
import {useLearning} from './components/useLearning';
import {GUIDES,childLearning,guideStatus,nextHint,updateHint} from './utils/learning';
import {useLearningClock} from './components/useLearningClock';
import {LearningBeacon,LearningHint} from './components/LearningHint';
import {useInstallation} from './components/useInstallation';

function initialInstruments(selected, preview = false) {
  const size = {width:window.innerWidth,height:window.innerHeight};
  return Object.fromEntries(Object.entries(INSTRUMENTS).map(([name,value])=>{
    const home = {...value,...(selected.includes(name)?INSTRUMENT_SLOTS[selected.indexOf(name)]:{})};
    return [name,{...(preview?home:instrumentHome(savedVisuals,name,home,size)),active:false}];
  }));
}

export default function App({developmentPreview}={}) {
  const audioRef = useRef(developmentPreview?.audio ?? null);
  const [started,setStarted] = useState(Boolean(developmentPreview)&&developmentPreview.playing!==false);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState(null);
  const [sceneIndex,setSceneIndex] = useState(developmentPreview?.sceneIndex ?? 0);
  const [genre,setGenre] = useState('folk');
  const [performanceRoot,setPerformanceRoot] = useState(SCENES[0].root);
  const [harmonyPlan,setHarmonyPlan] = useState(null);
  const weatherPlanRef=useRef(null);
  const practiceActive=useRef(false);
  const [mixer,setMixer] = useState(false);
  const [metronomeOpen,setMetronomeOpen] = useState(false);
  const [practice,setPractice]=useState(null);
  const [parentGuide,setParentGuide]=useState(false);
  const [editingId,setEditingId]=useState(null);
  const [help,setHelp]=useState(null);
  const [guideView,setGuideView]=useState(null);
  const [hintView,setHintView]=useState(null);
  const learning=useLearning(Boolean(developmentPreview));
  const installation=useInstallation();
  const [storage]=useState(()=>developmentPreview ? {saveSnapshot:()=>({ok:true}),saveLegacySettings:()=>({ok:true})} : createFamilyStorage());
  const [initial]=useState(()=>developmentPreview ? { family: { children: [developmentPreview.child], selectedId: developmentPreview.child.id }, settings: developmentPreview.child.settings, saveError: false } : storage.load());
  const [caregiverStorage]=useState(()=>createCaregiverStorage(developmentPreview?()=>({getItem:()=>null,setItem(){}}):undefined));
  const [initialCaregiver]=useState(()=>caregiverStorage.load(initial.family.children.find(child=>child.id===initial.family.selectedId)?.profile.parent));
  const [familiarity,setFamiliarity]=useState(initialCaregiver.familiarity);
  const [familiarityEstablished,setFamiliarityEstablished]=useState(initialCaregiver.established||initial.family.children.length>0);
  const [caregiverSaveError,setCaregiverSaveError]=useState(Boolean(initialCaregiver.error));
  const caregiverEdited=useRef(false);
  const [saveError,setSaveError]=useState(Boolean(initial.saveError));
  const saveWarning=saveError||caregiverSaveError||learning.error;
  const storageReadFailed=useRef(Boolean(initial.saveError));
  const [family,setFamily]=useState(initial.family);
  const selectedChild=family.children.find(child=>child.id===family.selectedId)??null;
  const [settings,setSettings] = useState(initial.settings);
  const [sceneVolume,setSceneVolume] = useState(-4);
  const mixerTap = useRef(null);
  const [instruments,setInstruments] = useState(()=>initialInstruments(settings.selected,Boolean(developmentPreview)));
  const stateRef = useRef(instruments);
  const drag = useRef(null);
  const startInProgress = useRef(false);
  const worldRef = useRef(null);
  const equippedRef = useRef(null);
  const [equipped,setEquipped] = useState(null);
  const [hasEquipped,setHasEquipped]=useState(false);
  const [hasPracticed,setHasPracticed]=useState(false);
  const [dragging,setDragging] = useState(null);
  const [nearChild,setNearChild] = useState(false);
  const startupState=useRef({settings,sceneIndex});
  const mounted=useRef(false);
  const activeLandscape=started&&!loading&&!mixer&&!metronomeOpen&&!practice&&!parentGuide&&!editingId&&!help&&!guideView&&!developmentPreview;
  const learningActive=activeLandscape&&!hintView;
  const suggestion=nextHint(learning.state,selectedChild);
  useEffect(()=>{if(selectedChild&&!childLearning(learning.state,selectedChild.id).enabled)setHintView(null);},[learning.state,selectedChild]);
  useLearningClock({active:activeLandscape,childId:selectedChild?.id,change:learning.change});
  useEffect(()=>{
    if(learningActive&&suggestion&&!childLearning(learning.state,selectedChild.id).hints[suggestion.id]?.suggested){
      learning.change(state=>updateHint(state,selectedChild.id,suggestion.id,{suggested:true}));
    }
  },[learningActive,suggestion,learning.state,selectedChild,learning.change]);
  useAppUpdates({started,loading,parentGuide:parentGuide||mixer||Boolean(guideView)||Boolean(hintView)||Boolean(editingId)||Boolean(help)||saveWarning});

  function discovered(id,coached=false) {
    if(!started||!selectedChild||developmentPreview)return;
    if(!coached&&hintView?.id===id&&['equip','practice'].includes(id))return;
    learning.change(state=>childLearning(state,selectedChild.id).hints[id]?.completed?state:updateHint(state,selectedChild.id,id,{completed:true}));
    if(['tap','landscape','weather'].includes(id))setHintView(current=>current?.id===id?null:current);
  }

  useEffect(()=>{ stateRef.current=instruments; },[instruments]);
  useLayoutEffect(()=>{startupState.current={settings,sceneIndex,genre};},[settings,sceneIndex,genre]);
  useEffect(()=>{mounted.current=true;return ()=>{mounted.current=false;audioRef.current?.dispose();};},[]);
  useEffect(()=>{if(developmentPreview)setSceneIndex(developmentPreview.sceneIndex);},[developmentPreview?.sceneIndex]);
  useEffect(()=>{
    if(!developmentPreview&&!initial.saveError&&!storage.saveLegacySettings(initial.settings).ok)setSaveError(true);
  },[storage,initial]);
  useEffect(()=>{
    if(!initialCaregiver.established&&!initialCaregiver.error&&!initial.saveError&&initial.family.children.length>0){
      caregiverEdited.current=true;
      setCaregiverSaveError(!caregiverStorage.save(initialCaregiver.familiarity).ok);
    }
  },[caregiverStorage,initialCaregiver,initial]);
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
      engine.onHarmonyChange=plan=>{if(mounted.current&&audioRef.current===engine&&!practiceActive.current){if(plan)weatherPlanRef.current=plan;setHarmonyPlan(plan);}};
      engine.onActiveChange=(name,active)=>{
          if(!mounted.current||audioRef.current!==engine)return;
          const next={...stateRef.current,[name]:{...stateRef.current[name],active}};
          stateRef.current=next;setInstruments(next);
      };
      await engine.init();
      if(!mounted.current||audioRef.current!==engine)return;
      engine.updatePerformanceSettings(startupState.current.settings.instruments);
      engine.setGenre(startupState.current.genre);
      engine.setSceneKey(SCENES[startupState.current.sceneIndex].root);
      setPerformanceRoot(engine.playbackRoot);
      setHarmonyPlan(engine.harmonyPlan??null);
      weatherPlanRef.current=engine.harmonyPlan??null;
      setStarted(true);
    }
    catch(e) { if(mounted.current){console.error(e);setError('The sound engine could not start. Try tapping play again.');} }
    finally { startInProgress.current=false;if(mounted.current)setLoading(false); }
  }

  function toggle(name) {
    if(!started) return;
    discovered('tap');
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

  function restoreSound() {
    const reset=resetSoundMix(stateRef.current);
    stateRef.current=reset.instruments;setInstruments(reset.instruments);
    audioRef.current?.setVolumes(reset.volumes);
    changeSceneVolume(reset.sceneVolume);
  }

  function arrangeSelection(next) {
    const changed=next.selected.some((name,index)=>name!==settings.selected[index]);
    if(changed) {
      if(equippedRef.current&&!next.selected.includes(equippedRef.current))equip(null);
      for(const name of settings.selected)if(!next.selected.includes(name))audioRef.current?.setInstrumentActive(name,false);
      const positions={...stateRef.current};
      next.selected.forEach((name,index)=>{if(settings.selected[index]!==name){
        const fallback=INSTRUMENT_SLOTS[index];
        const home=developmentPreview?fallback:instrumentHome(savedVisuals,name,fallback,{width:window.innerWidth,height:window.innerHeight});
        positions[name]={...positions[name],...home};
      }});
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
    updateFamiliarity(child.profile.parent);
    setParentGuide(false);return true;
  }

  function updateFamiliarity(value) {
    const next=normalizeFamiliarity(value);
    caregiverEdited.current=true;setFamiliarity(next);setFamiliarityEstablished(true);
    setCaregiverSaveError(!caregiverStorage.save(next).ok);
  }

  function retrySave() {
    if(learning.error)learning.retry();
    if(caregiverSaveError){
      const recovered=caregiverStorage.load(familiarity);
      if(recovered.error){setCaregiverSaveError(true);return;}
      if(caregiverEdited.current)setCaregiverSaveError(!caregiverStorage.save(familiarity).ok);
      else {setFamiliarity(recovered.familiarity);setFamiliarityEstablished(recovered.established);setCaregiverSaveError(false);}
    }
    if(storageReadFailed.current){
      const recovered=storage.load();
      if(recovered.saveError){setSaveError(true);return;}
      const snapshot=recoverFamilySnapshot(initial,{family,settings},recovered);
      storageReadFailed.current=false;
      if(!caregiverEdited.current&&!initialCaregiver.established){
        const legacy=snapshot.family.children.find(child=>child.id===snapshot.family.selectedId)?.profile.parent;
        const recoveredCaregiver=caregiverStorage.load(legacy);
        if(!recoveredCaregiver.error){
          setFamiliarity(recoveredCaregiver.familiarity);
          setFamiliarityEstablished(recoveredCaregiver.established||snapshot.family.children.length>0);
          if(!recoveredCaregiver.established&&snapshot.family.children.length>0){
            caregiverEdited.current=true;
            setCaregiverSaveError(!caregiverStorage.save(recoveredCaregiver.familiarity).ok);
          }
        }
      }
      if(started)arrangeSelection(snapshot.settings);
      setFamily(snapshot.family);setSettings(snapshot.settings);
      if(!started){const next=initialInstruments(snapshot.settings.selected);stateRef.current=next;setInstruments(next);}
      setSaveError(!storage.saveSnapshot(snapshot).ok);
      return;
    }
    setSaveError(!storage.saveSnapshot({family,settings}).ok);
  }

  function saveFamily(nextFamily) {
    if(!nextFamily)return false;
    const nextSettings=nextFamily.children.find(child=>child.id===nextFamily.selectedId)?.settings??defaultSettings();
    if(!storage.saveProfileSnapshot({family:nextFamily,settings:nextSettings}).ok){setSaveError(true);return false;}
    const removed=family.children.filter(child=>!nextFamily.children.some(next=>next.id===child.id)).map(child=>child.id);
    if(removed.length)learning.change(state=>({...state,children:Object.fromEntries(Object.entries(state.children).filter(([id])=>!removed.includes(id)))}));
    setSaveError(false);setFamily(nextFamily);setSettings(nextSettings);
    const next=initialInstruments(nextSettings.selected);stateRef.current=next;setInstruments(next);
    return true;
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
    if(name)discovered('equip');
    if(name)setHasEquipped(true);
    const previous=equippedRef.current;
    equippedRef.current=name;setEquipped(name);
    audioRef.current.setManualInstrument(name);
    if(previous&&previous!==name&&resetPrevious) {
      const fallback=INSTRUMENT_SLOTS[settings.selected.indexOf(previous)]??INSTRUMENTS[previous];
      const home=developmentPreview?fallback:instrumentHome(savedVisuals,previous,fallback,{width:window.innerWidth,height:window.innerHeight});
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
    const others=[...worldRef.current.querySelectorAll('.instrument,.interactive-object,#young-musician,.celestial-control[data-settled="true"]'),...document.querySelectorAll('.mixer-button,.metronome-mini,.caregiver-help-corner')];
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
    discovered('landscape');
    setSceneIndex(i=>{ const next=(i+1)%SCENES.length; audioRef.current?.setSceneKey(SCENES[next].root); return next; });
  }

  function changeGenre(next) {
    if(next===genre)return;
    discovered('weather');
    setGenre(next);
    audioRef.current?.setGenre(next);
  }

  const audiblePlan=started?(audioRef.current?.harmonyPlan??weatherPlanRef.current):null;
  const audibleGenre=audiblePlan?.genre??(started&&audioRef.current?.genreTransition?.to===genre?audioRef.current.genreTransition.from:genre);
  const weatherTransition=audiblePlan&&audioRef.current?.genreTransition?.to===audiblePlan.genre?{from:audioRef.current.genreTransition.from,progress:audiblePlan.genreBlend??0}:null;

  function enterPractice(playback){discovered('practice');if(playback)audioRef.current.setInstrumentActive(playback.name,playback.active);practiceActive.current=true;setHarmonyPlan(null);drag.current=null;setDragging(null);setNearChild(false);setMixer(false);setMetronomeOpen(false);setHasPracticed(true);setPractice(equippedRef.current??settings.selected[0]);}

  function returnToMenu() {
    practiceActive.current=false;setHarmonyPlan(null);
    weatherPlanRef.current=null;
    window.dispatchEvent(new Event('farmjam-input-reset'));
    audioRef.current?.dispose();audioRef.current=null;
    drag.current=null;equippedRef.current=null;mixerTap.current=null;
    setEquipped(null);setDragging(null);setNearChild(false);setPractice(null);
    setHasEquipped(false);setHasPracticed(false);
    setMixer(false);setMetronomeOpen(false);setHintView(null);setStarted(false);setSceneIndex(0);setError(null);
    const next=initialInstruments(settings.selected);stateRef.current=next;setInstruments(next);
  }

  return <main className={`app-shell ${equipped?'manual-open':''}`}>
    <div className="landscape-world" ref={worldRef} inert={mixer||Boolean(practice)}>
    <Scene sceneIndex={sceneIndex} playing={started} audio={audioRef.current} genre={audibleGenre} genreTransition={weatherTransition} onGenreChange={()=>changeGenre(genre==='folk'?'jazz':'folk')} onRotate={rotateScene} onCelestialSettled={()=>{if(started)for(const name of Object.keys(INSTRUMENTS))settle(name);}}/>
    {started&&<YoungMusician child={selectedChild} equipped={equipped?INSTRUMENTS[equipped].label:null} accepting={nearChild} onPractice={enterPractice}/>}
    <div className="instrument-layer">
      {settings.selected.map(name=>{const i=instruments[name];return <Instrument key={name} name={name} label={i.label} x={i.x} y={i.y} active={i.active} equipped={equipped===name} sliding={dragging!==name} onEquip={()=>equip(name)} onToggle={toggle}
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerCancel}/>;}) }
    </div>
    </div>

    <div className="top-bar" inert={mixer||Boolean(practice)} aria-hidden={mixer||Boolean(practice)}>
      {started && <SettingsButton open={mixer} onClick={activateMixer}/>}
    </div>

    {mixer && <Mixer playing={started} child={selectedChild} learning={learning.state} onLearning={learning.change} onGuide={setGuideView} familiarity={familiarity} onFamiliarity={updateFamiliarity} onHelp={()=>setHelp({topic:'settings',instrument:equipped})} saveError={saveWarning} onRetrySave={retrySave} instruments={instruments} onVolume={volume} sceneVolume={sceneVolume} onSceneVolume={changeSceneVolume} onRestoreSound={restoreSound} settings={settings} onSettings={updateSettings} onMenu={returnToMenu} onClose={()=>{setMixer(false);mixerTap.current=null;}}/>}
    {started&&<Metronome audio={audioRef.current} open={metronomeOpen} disabled={mixer||Boolean(practice)} onOpen={()=>setMetronomeOpen(true)} onClose={()=>setMetronomeOpen(false)}/>}

    {equipped&&!practice&&<PerformancePanel key={equipped} name={equipped} audio={audioRef.current} root={performanceRoot} options={settings.instruments[equipped]} settingsOpen={mixer} harmonyPlan={harmonyPlan} onClose={()=>equip(null)}/>}
    {practice&&<PracticeRoom child={selectedChild} audio={audioRef.current} initialInstrument={practice} settings={settings} root={SCENES[sceneIndex].root} onHelp={(instrument,practiceStage)=>setHelp({topic:'practice',instrument,practiceStage})} onClose={()=>{practiceActive.current=false;setHarmonyPlan(null);setPractice(null);}}/>}

    {!started && <StartScreen inert={mixer||parentGuide||Boolean(editingId)} onSettings={()=>setMixer(true)} unreadGuides={GUIDES.filter(guide=>guideStatus(learning.state,guide)!=='Read').length} saveError={saveWarning&&!mixer} onRetrySave={retrySave} children={family.children} selectedId={family.selectedId} loading={loading} error={error} onStart={start} onSelect={selectChild} onEdit={setEditingId} onAdd={()=>setParentGuide(true)}/>}
    {!started&&parentGuide&&<ParentGuide learning={learning.state} onGuide={setGuideView} familiarity={familiarity} familiarityEstablished={familiarityEstablished} settings={settings} onComplete={addChild} onClose={()=>setParentGuide(false)}/>}
    {!started&&editingId&&<ChildEditor child={family.children.find(child=>child.id===editingId)} onSave={draft=>saveFamily(editChild(family,editingId,draft))} onDelete={()=>saveFamily(removeChild(family,editingId))} onClose={()=>setEditingId(null)}/>}
    {!mixer&&!practice&&!parentGuide&&!editingId&&!loading&&<HelpButton className="caregiver-help-corner" onOpen={()=>{window.dispatchEvent(new Event('farmjam-input-reset'));setHelp({topic:started?(equipped?'instruments':'landscape'):'menu',instrument:equipped});}}/>}
    {learningActive&&suggestion&&childLearning(learning.state,selectedChild.id).hints[suggestion.id]?.suggested&&<LearningBeacon hint={suggestion} onOpen={()=>{setHintView(suggestion);learning.change(state=>updateHint(state,selectedChild.id,suggestion.id,{seen:true,dismissed:false}));}}/>}
    {hintView&&<LearningHint hint={hintView} instruments={settings.selected} equipped={equipped} practice={practice} suspended={!started||loading||mixer||metronomeOpen||parentGuide||Boolean(editingId)||Boolean(help)||Boolean(guideView)} onComplete={id=>{discovered(id,true);setHintView(null);}} onClose={()=>{learning.change(state=>updateHint(state,selectedChild.id,hintView.id,{dismissed:true}));setHintView(null);}}/>}
    {help&&<CaregiverHelp {...help} child={selectedChild} instruments={started&&!practice?settings.selected:null} onEquip={name=>{setHelp(null);setMixer(false);equip(name);}} onPractice={()=>{setHelp(null);setMixer(false);enterPractice();}} onGuides={setGuideView} discovery={started&&help.topic!=='practice'?{hasEquipped,hasPracticed}:null} familiarity={familiarity} onClose={()=>setHelp(null)}/>}
    {guideView&&<GuideReader id={guideView} child={selectedChild} saveError={learning.error} onRetry={learning.retry} installation={installation} learning={learning.state} familiarity={familiarity} onOpen={setGuideView} onRead={guide=>learning.change(state=>({...state,guides:{...state.guides,[guide.id]:Math.max(state.guides[guide.id]??0,guide.version)}}))} onClose={()=>setGuideView(null)}/>}
    <LandscapeGuard/>
  </main>;
}
