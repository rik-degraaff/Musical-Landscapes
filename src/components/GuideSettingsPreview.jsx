import React from 'react';
import {InstrumentSlots,ComplexityControl,DisplayControls,VolumeControl,HintToggle} from './SettingsControls';
import {InstrumentArt} from './InstrumentArt';
import {INSTRUMENTS} from '../utils/music';
import {SIMPLE_GUIDE_OPTIONS,GUIDE_ACTION_DURATION} from '../utils/guideDemonstrations';
import './settings.css';

const noop=()=>{};
export function GuideSettingsPreview({instrument,focus,elapsed=0,progress=0,opened=true}) {
  const changed=elapsed>=GUIDE_ACTION_DURATION*.2;
  const selected=['piano','guitar','drums','flute','marimba','panflute'];
  if(focus==='selectors'&&changed)[selected[0],selected[1]]=[selected[1],selected[0]];
  return <div className="guide-settings-preview settings-dialog" style={{opacity:opened?1:.2}} inert>
    {focus==='selectors'?<InstrumentSlots selected={selected} onSelect={noop}/>:focus==='sound'?<div className="sound-settings"><VolumeControl name={instrument} label={INSTRUMENTS[instrument].label} value={Math.round(-4-8*progress)} onChange={noop}/><VolumeControl scenery label="Scenery sounds" value={-4} onChange={noop}/></div>:focus==='display'?<DisplayControls options={{...SIMPLE_GUIDE_OPTIONS,noteLabels:changed}} instrument={instrument} onChange={noop}/>:focus==='caregiver'?<HintToggle enabled={changed} onChange={noop}/>:<><div className="guide-setting-instrument"><InstrumentArt type={instrument}/><strong>{INSTRUMENTS[instrument].label}</strong></div><ComplexityControl value={changed?.35:1} onChange={noop}/></>}
  </div>;
}
