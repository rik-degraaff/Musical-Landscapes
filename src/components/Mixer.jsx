import React, {useEffect,useRef,useState} from 'react';
import {X,Trees,Volume2,Music,Settings2,Sprout,Layers,Sparkles,Eye,Tag,AudioLines,Hand,Home,RotateCcw,BookOpen,Users} from 'lucide-react';
import {InstrumentArt} from './InstrumentArt';
import './settings.css';
import {useDismissible} from './useDismissible';
import {SaveStatus} from './SaveStatus';
import {HelpButton} from './CaregiverHelp';
import {CAREGIVER_FAMILIARITY,caregiverHelp} from '../utils/caregiverHelp';
import {GUIDES,HINTS,childLearning,guideStatus,updateChildLearning,updateHint} from '../utils/learning';
import {GuideLibrary} from './Guides';

export function Mixer({instruments,onVolume,sceneVolume,onSceneVolume,onRestoreSound,onClose,onMenu,settings,onSettings,saveError,onRetrySave,familiarity,onFamiliarity,onHelp,playing=true,child,learning,onLearning,onGuide}) {
  const [tab,setTab]=useState(playing?'Sound':'Caregiver');
  const [selected,setSelected]=useState(settings.selected[2]);
  const modal=useRef(null);
  const latest=useRef({settings,onSettings});
  latest.current={settings,onSettings};
  useDismissible(modal,true,onClose);
  useEffect(()=>{
    const previous=document.activeElement;
    modal.current.querySelector('button').focus();
    const keydown=event=>{
      if(event.key!=='Tab')return;
      const elements=[...modal.current.querySelectorAll('button,input,select,summary,[tabindex="0"]')].filter(element=>!element.disabled&&element.tabIndex>=0&&element.getClientRects().length>0&&(!element.closest('details:not([open])')||element.tagName==='SUMMARY'));
      const first=elements[0],last=elements.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    };
    window.addEventListener('keydown',keydown);
    return ()=>{window.removeEventListener('keydown',keydown);previous?.focus();};
  },[]);
  const options=settings.instruments[selected];
  function updateSettings(next) {latest.current.settings=next;latest.current.onSettings(next);}
  function change(key,value) {
    const current=latest.current.settings;
    updateSettings({...current,instruments:{...current.instruments,[selected]:{...current.instruments[selected],[key]:value}}});
  }
  const tabs=[...(playing?[['Sound',Volume2]]:[]),...(child?[['Instruments',Music]]:[]),['Caregiver',Users],['Guides',BookOpen]];
  const progress=learning?childLearning(learning,child?.id):null;
  const unread=learning?GUIDES.filter(guide=>guideStatus(learning,guide)!=='Read').length:0;
  function selectSlot(index,name) {
    const current=latest.current.settings;
    const slots=[...current.selected];
    const other=slots.indexOf(name);
    if(other>=0)slots[other]=slots[index];
    slots[index]=name;
    updateSettings({...current,selected:slots});
  }
  return <div className="settings-backdrop">
    <section ref={modal} id="landscape-mixer" className="mixer settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="mixer-head settings-head"><HelpButton onOpen={onHelp}/><h2 id="settings-title"><Settings2 size={21}/>Settings</h2><button onClick={onClose} aria-label="Close settings" title="Close settings"><X size={20}/></button></div>
      <div className="settings-tabs" role="tablist" aria-label="Settings categories">{tabs.map(([name,Icon],index)=><button key={name} role="tab" id={`settings-tab-${name}`} aria-selected={tab===name} aria-controls="settings-panel" tabIndex={tab===name?0:-1} onClick={()=>setTab(name)} onKeyDown={event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length;setTab(tabs[next][0]);event.currentTarget.parentElement.children[next].focus();}}}><Icon size={16}/>{name}{name==='Guides'&&unread>0&&<span className="guide-status" aria-label={`${unread} unread or updated guides`}>{unread}</span>}</button>)}</div>
      <div id="settings-panel" role="tabpanel" aria-labelledby={`settings-tab-${tab}`} tabIndex={0} className="settings-content">
        {tab==='Sound'?<div className="sound-settings">
          {Object.entries(instruments).map(([name,instrument])=><label className={`settings-volume volume-${name}`} key={name}><span><i className="settings-art" aria-hidden="true"><InstrumentArt type={name}/></i>{instrument.label}<output>{instrument.volume} dB</output></span><input aria-label={`${instrument.label} volume`} type="range" min="-24" max="6" step="1" value={instrument.volume} onChange={event=>onVolume(name,event.target.value)}/></label>)}
          <label className="settings-volume scenery-mixer-row"><span><Trees size={16}/>Scenery sounds<output>{sceneVolume<=-60?'Muted':`${sceneVolume} dB`}</output></span><input aria-label="Scenery sounds volume" type="range" min="-60" max="0" step="1" value={sceneVolume} onChange={event=>onSceneVolume(event.target.value)}/></label>
          <button className="restore-sound" onClick={onRestoreSound} title="Restore sound defaults"><RotateCcw size={16}/>Restore defaults</button>
          <p className="settings-explanation">{familiarity==='confident'?'These dB controls change relative gain, not pitch or tempo. Mix levels last for this play session.':familiarity==='new'?'Move a slider left for quieter sound or right for louder sound. This changes loudness, not the notes or beat. Sound levels last for this play session.':'Balance the band and scenery here. Volume changes loudness, not tempo; the mix lasts for this play session.'}</p>
        </div>:tab==='Instruments'?<>
          <div className="instrument-slots">{settings.selected.map((name,index)=><label key={index} className="settings-instrument"><i className="settings-art slot-art" aria-hidden="true"><InstrumentArt type={name}/></i><span className="slot-number">{index+1}</span><select aria-label={`Instrument slot ${index+1}`} value={name} onChange={event=>selectSlot(index,event.target.value)}>{Object.entries(instruments).map(([id,instrument])=><option value={id} key={id}>{instrument.label}</option>)}</select></label>)}</div>
          <div className="instrument-configuration">
          <label className="settings-instrument configure-instrument"><i className="settings-art configuration-art" aria-hidden="true"><InstrumentArt type={selected}/></i>Configure instrument<select aria-label="Configure instrument" value={selected} onChange={event=>setSelected(event.target.value)}>{Object.entries(instruments).map(([name,instrument])=><option key={name} value={name}>{instrument.label}</option>)}</select></label>
          <fieldset className="equipped-complexity"><legend><Hand size={16}/>Equipped complexity</legend><div className="complexity-segments">{[['Simple',.35,Sprout],['Standard',1,Layers],['Advanced',1.5,Sparkles]].map(([label,value,Icon])=><label className={`complexity-${label.toLowerCase()}`} key={label}><input type="radio" name="equipped-complexity" value={value} checked={options.complexity===value} onChange={()=>change('complexity',value)}/><span><Icon size={18}/>{label}</span></label>)}</div></fieldset>
          <p className="settings-explanation">{caregiverHelp('settings',familiarity).items[0][1]} {caregiverHelp('settings',familiarity).note}</p>
          <details key={selected} className="settings-display-details"><summary><Eye size={16}/>Display details</summary>
            <p className="settings-explanation">{caregiverHelp('settings',familiarity).items[1][1]}</p>
            <label className="settings-check"><input type="checkbox" checked={options.noteLabels} onChange={event=>change('noteLabels',event.target.checked)}/><Tag size={16}/>Show note and control labels</label>
            <label className="settings-check"><input type="checkbox" checked={options.playbackNotes} onChange={event=>change('playbackNotes',event.target.checked)}/><AudioLines size={16}/>Show playback note names</label>
            {options.complexity>.5&&<label className="settings-check"><input type="checkbox" checked={options.harmonyHints!=='off'} onChange={event=>change('harmonyHints',event.target.checked?'notes':'off')}/><Sparkles size={16}/>Highlight upcoming harmony</label>}
            {options.complexity>1&&options.harmonyHints!=='off'&&<label className="settings-check"><input type="checkbox" checked={options.harmonyHints==='name'} onChange={event=>change('harmonyHints',event.target.checked?'name':'notes')}/><Tag size={16}/>Show next chord name</label>}
            {['guitar','ukulele'].includes(selected)&&<label className="settings-check"><input type="checkbox" checked={options.fingeringCharts} onChange={event=>change('fingeringCharts',event.target.checked)}/><Hand size={16}/>Show chord fingering charts</label>}
          </details>
          </div>
        </>:tab==='Guides'?<><p>Read a guide whenever you like. The ? button also offers help for your current screen.</p><GuideLibrary learning={learning} onOpen={onGuide}/></>:<>
          <fieldset className="parent-choices caregiver-familiarity"><legend>Caregiver music familiarity</legend><div>{CAREGIVER_FAMILIARITY.map(([value,label])=><label key={value} className={familiarity===value?'is-selected':''}><input type="radio" name="caregiver-familiarity" checked={familiarity===value} onChange={()=>onFamiliarity(value)}/><span>{label}</span></label>)}</div><p className="settings-explanation">Shared by all children on this device. Changes explanations in help and setup, not the music or complexity.</p></fieldset>
          {child&&progress&&<section className="hint-controls"><h3>Learning hints for {child.name}</h3><label className="settings-check"><input type="checkbox" checked={progress.enabled} onChange={event=>{const enabled=event.target.checked;onLearning(state=>updateChildLearning(state,child.id,value=>({...value,enabled})));}}/>Offer learning hints</label><p className="settings-explanation">Hints appear gradually during play. Tap the learning symbol to see a hand demonstrate on the real controls. Play stays available; stop the hint whenever you like. Suggesting a hint again also makes it available before its usual age or timing.</p>{HINTS.map(hint=><div className="hint-control" key={hint.id}><span>{hint.title} · {progress.hints[hint.id]?.completed?'Discovered':progress.hints[hint.id]?.dismissed?'Dismissed':progress.hints[hint.id]?.suggested?'Available':'Not yet offered'}</span><button className="learning-action" disabled={!progress.enabled} onClick={()=>onLearning(state=>updateHint(state,child.id,hint.id,{suggested:true,seen:false,completed:false,dismissed:false}))}>Suggest {hint.title.toLowerCase()} again</button></div>)}</section>}
        </>}
      </div>
      {saveError&&<SaveStatus onRetry={onRetrySave}/>}
      <footer className="settings-footer"><button onClick={playing?onMenu:onClose} aria-label={playing?'Return to main menu':'Done with settings'}><Home size={18}/>{playing?'Main menu':'Done'}</button></footer>
    </section>
  </div>;
}
