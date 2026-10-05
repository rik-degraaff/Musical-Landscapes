import React, {useEffect,useRef,useState} from 'react';
import {X,Trees,Volume2,SlidersHorizontal,Eye} from 'lucide-react';
import {COMPLEXITY_PRESETS,applyPreset} from '../utils/settings';
import './settings.css';
import {useDismissible} from './useDismissible';

export function Mixer({instruments,onVolume,sceneVolume,onSceneVolume,onClose,settings,onSettings}) {
  const [tab,setTab]=useState('Sound');
  const [selected,setSelected]=useState('guitar');
  const modal=useRef(null);
  useDismissible(modal,true,onClose);
  useEffect(()=>{
    const previous=document.activeElement;
    modal.current.querySelector('button').focus();
    const keydown=event=>{
      if(event.key!=='Tab')return;
      const elements=[...modal.current.querySelectorAll('button,input,select,[tabindex="0"]')].filter(element=>!element.disabled&&element.tabIndex>=0);
      const first=elements[0],last=elements.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    };
    window.addEventListener('keydown',keydown);
    return ()=>{window.removeEventListener('keydown',keydown);previous?.focus();};
  },[]);
  const options=settings.instruments[selected];
  function change(key,value) {onSettings({...settings,preset:key==='complexity'||key==='seventhChords'?'Custom':settings.preset,instruments:{...settings.instruments,[selected]:{...options,[key]:value}}});}
  const tabs=[['Sound',Volume2],['Playback',SlidersHorizontal],['Display',Eye]];
  return <div className="settings-backdrop">
    <section ref={modal} id="landscape-mixer" className="mixer settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="mixer-head settings-head"><h2 id="settings-title">Settings</h2><button onClick={onClose} aria-label="Close settings" title="Close settings"><X size={20}/></button></div>
      <div className="settings-tabs" role="tablist" aria-label="Settings categories">{tabs.map(([name,Icon],index)=><button key={name} role="tab" id={`settings-tab-${name}`} aria-selected={tab===name} aria-controls="settings-panel" tabIndex={tab===name?0:-1} onClick={()=>setTab(name)} onKeyDown={event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();const next=(index+(event.key==='ArrowRight'?1:2))%3;setTab(tabs[next][0]);event.currentTarget.parentElement.children[next].focus();}}}><Icon size={16}/>{name}</button>)}</div>
      <div id="settings-panel" role="tabpanel" aria-labelledby={`settings-tab-${tab}`} className="settings-content">
        {tab==='Sound'?<div className="sound-settings">
          {Object.entries(instruments).map(([name,instrument])=><label className="settings-volume" key={name}><span>{instrument.label}<output>{instrument.volume} dB</output></span><input aria-label={`${instrument.label} volume`} type="range" min="-24" max="6" step="1" value={instrument.volume} onChange={event=>onVolume(name,event.target.value)}/></label>)}
          <label className="settings-volume scenery-mixer-row"><span><Trees size={16}/>Scenery sounds<output>{sceneVolume<=-60?'Muted':`${sceneVolume} dB`}</output></span><input aria-label="Scenery sounds volume" type="range" min="-60" max="0" step="1" value={sceneVolume} onChange={event=>onSceneVolume(event.target.value)}/></label>
        </div>:<>
          {tab==='Playback'&&<fieldset className="complexity-presets"><legend>Complexity preset</legend>{Object.keys(COMPLEXITY_PRESETS).map(preset=><label key={preset}><input type="radio" name="complexity-preset" checked={settings.preset===preset} onChange={()=>onSettings(applyPreset(settings,preset))}/>{preset}</label>)}</fieldset>}
          <label className="settings-instrument">Instrument<select aria-label="Configure instrument" value={selected} onChange={event=>setSelected(event.target.value)}>{Object.entries(instruments).map(([name,instrument])=><option key={name} value={name}>{instrument.label}</option>)}</select></label>
          {tab==='Playback'?<>
            <label className="settings-volume"><span>Phrase complexity<output>{Math.round(options.complexity*100)}%</output></span><input type="range" aria-label={`${instruments[selected].label} phrase complexity`} min="0" max="2" step="0.05" value={options.complexity} onChange={event=>change('complexity',Number(event.target.value))}/></label>
            {selected==='guitar'&&<label className="settings-check"><input type="checkbox" checked={options.seventhChords} onChange={event=>change('seventhChords',event.target.checked)}/>Include seventh-chord buttons</label>}
          </>:<>
            <label className="settings-check"><input type="checkbox" checked={options.noteLabels} onChange={event=>change('noteLabels',event.target.checked)}/>Show note and control labels</label>
            <label className="settings-check"><input type="checkbox" checked={options.playbackNotes} onChange={event=>change('playbackNotes',event.target.checked)}/>Show playback note names</label>
            {selected==='guitar'&&<><label className="settings-check"><input type="checkbox" checked={options.fingeringCharts} onChange={event=>change('fingeringCharts',event.target.checked)}/>Show chord fingering charts</label><label className="settings-check"><input type="checkbox" checked={options.fretDots} onChange={event=>change('fretDots',event.target.checked)}/>Show detailed fret positions</label></>}
          </>}
        </>}
      </div>
    </section>
  </div>;
}
