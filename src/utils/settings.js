import {INSTRUMENTS} from './music.js';

export const SETTINGS_KEY='farmjam-settings-v1';
export const COMPLEXITY_PRESETS={Simple:.35,Balanced:1,Expressive:1.5};
export function defaultSettings() {
  return {preset:'Balanced',instruments:Object.fromEntries(Object.keys(INSTRUMENTS).map(name=>[name,{complexity:1,noteLabels:false,playbackNotes:false,fingeringCharts:false,fretDots:false,seventhChords:true}]))};
}
export function normalizeSettings(value) {
  const result=defaultSettings();
  result.preset=value?.preset==='Custom'||Object.hasOwn(COMPLEXITY_PRESETS,value?.preset)?value.preset:'Balanced';
  for(const [name,options] of Object.entries(result.instruments)) {
    const saved=value?.instruments?.[name];
    if(!saved)continue;
    for(const key of ['noteLabels','playbackNotes','fingeringCharts','fretDots','seventhChords'])if(typeof saved[key]==='boolean')options[key]=saved[key];
    if(Number.isFinite(saved.complexity))options.complexity=Math.max(0,Math.min(2,saved.complexity));
  }
  return result;
}
export function loadSettings(storage) {
  try {const saved=storage.getItem(SETTINGS_KEY);return saved?normalizeSettings(JSON.parse(saved)):defaultSettings();}catch{return defaultSettings();}
}
export function applyPreset(settings,preset) {
  return {...settings,preset,instruments:Object.fromEntries(Object.entries(settings.instruments).map(([name,options])=>[name,{...options,complexity:COMPLEXITY_PRESETS[preset],seventhChords:preset!=='Simple'}]))};
}
export function phraseComplexity(value,factor=1) {return Math.max(0,Math.min(1,value*factor));}