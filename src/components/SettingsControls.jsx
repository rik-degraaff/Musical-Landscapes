import React,{useId} from 'react';
import {Hand,Sprout,Layers,Sparkles,Tag,AudioLines,Trees} from 'lucide-react';
import {InstrumentArt} from './InstrumentArt';
import {INSTRUMENTS} from '../utils/music';

export function InstrumentSlots({selected,instruments=INSTRUMENTS,onSelect}) {
  return <div className="instrument-slots">{selected.map((name,index)=><label key={index} className="settings-instrument"><i className="settings-art slot-art" aria-hidden="true"><InstrumentArt type={name}/></i><span className="slot-number">{index+1}</span><select aria-label={`Instrument slot ${index+1}`} value={name} onChange={event=>onSelect(index,event.target.value)}>{Object.entries(instruments).map(([id,instrument])=><option value={id} key={id}>{instrument.label}</option>)}</select></label>)}</div>;
}

export function ComplexityControl({value,onChange}) {
  const group=useId();
  return <fieldset className="equipped-complexity"><legend><Hand size={16}/>Equipped complexity</legend><div className="complexity-segments">{[['Simple',.35,Sprout],['Standard',1,Layers],['Advanced',1.5,Sparkles]].map(([label,level,Icon])=><label className={`complexity-${label.toLowerCase()}`} key={label}><input type="radio" name={group} value={level} checked={value===level} onChange={()=>onChange(level)}/><span><Icon size={18}/>{label}</span></label>)}</div></fieldset>;
}

export function DisplayControls({options,instrument,onChange}) {
  return <><label className="settings-check"><input type="checkbox" checked={options.noteLabels} onChange={event=>onChange('noteLabels',event.target.checked)}/><Tag size={16}/>Show note and control labels</label><label className="settings-check"><input type="checkbox" checked={options.playbackNotes} onChange={event=>onChange('playbackNotes',event.target.checked)}/><AudioLines size={16}/>Show playback note names</label>{options.complexity>.5&&<label className="settings-check"><input type="checkbox" checked={options.harmonyHints!=='off'} onChange={event=>onChange('harmonyHints',event.target.checked?'notes':'off')}/><Sparkles size={16}/>Highlight upcoming harmony</label>}{options.complexity>1&&options.harmonyHints!=='off'&&<label className="settings-check"><input type="checkbox" checked={options.harmonyHints==='name'} onChange={event=>onChange('harmonyHints',event.target.checked?'name':'notes')}/><Tag size={16}/>Show next chord name</label>}{['guitar','ukulele'].includes(instrument)&&<label className="settings-check"><input type="checkbox" checked={options.fingeringCharts} onChange={event=>onChange('fingeringCharts',event.target.checked)}/><Hand size={16}/>Show chord fingering charts</label>}</>;
}

export function VolumeControl({name,label,value,onChange,scenery=false}) {
  return <label className={`settings-volume ${scenery?'scenery-mixer-row':`volume-${name}`}`}><span>{scenery?<Trees size={16}/>:<i className="settings-art" aria-hidden="true"><InstrumentArt type={name}/></i>}{label}<output>{value<=-60?'Muted':`${value} dB`}</output></span><input aria-label={`${label} volume`} type="range" min={scenery?-60:-24} max={scenery?0:6} step="1" value={value} onChange={event=>onChange(event.target.value)}/></label>;
}

export function HintToggle({enabled,onChange}) {
  return <label className="settings-check"><input type="checkbox" checked={enabled} onChange={event=>onChange(event.target.checked)}/>Offer learning hints</label>;
}
