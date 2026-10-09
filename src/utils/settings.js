import {INSTRUMENTS,DEFAULT_INSTRUMENTS} from './music.js';

export const SETTINGS_KEY='farmjam-settings-v1';
export function defaultSettings() {
  return {selected:[...DEFAULT_INSTRUMENTS],instruments:Object.fromEntries(Object.keys(INSTRUMENTS).map(name=>[name,{complexity:1.5,noteLabels:false,playbackNotes:false,fingeringCharts:false,fretDots:false,seventhChords:true}]))};
}
export function normalizeSettings(value) {
  const result=defaultSettings();
  if(Array.isArray(value?.selected)&&value.selected.length===6&&new Set(value.selected).size===6&&value.selected.every(name=>Object.hasOwn(INSTRUMENTS,name)))result.selected=[...value.selected];
  for(const [name,options] of Object.entries(result.instruments)) {
    const saved=value?.instruments?.[name];
    if(!saved)continue;
    for(const key of ['noteLabels','playbackNotes','fingeringCharts','fretDots','seventhChords'])if(typeof saved[key]==='boolean')options[key]=saved[key];
    if(Number.isFinite(saved.complexity))options.complexity=saved.complexity<=.5?.35:saved.complexity<=1?1:1.5;
  }
  return result;
}
export function loadSettings(storage) {
  try {const saved=storage.getItem(SETTINGS_KEY);return saved?normalizeSettings(JSON.parse(saved)):defaultSettings();}catch{return defaultSettings();}
}
