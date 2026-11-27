import {AVAILABLE_INSTRUMENTS} from './music.js';
import {normalizeSettings} from './settings.js';

export const TRIAL_INSTRUMENTS=Object.freeze(['piano','drums','ukulele','melody']);
export const TRIAL_PHRASES=3;
export const TRIAL_SETTINGS_KEY='farmjam-trial-v1';
export const TRIAL_SCENES=Object.freeze(['farm','night']);
export const TRIAL_LABELS=TRIAL_INSTRUMENTS.map(id=>AVAILABLE_INSTRUMENTS[id].label);
export const FULL_ADDITIONS=Object.entries(AVAILABLE_INSTRUMENTS)
  .filter(([id])=>!TRIAL_INSTRUMENTS.includes(id)).map(([,value])=>value.label);
export const TRIAL_CATALOG=Object.freeze(Object.fromEntries(TRIAL_INSTRUMENTS.map(id=>[id,AVAILABLE_INSTRUMENTS[id]])));
export const FULL_EDITION=Object.freeze({trial:false,catalog:AVAILABLE_INSTRUMENTS});
export const editionAllowsTravel=trial=>!trial;

export function trialComplexity(age) {
  return age==='8plus'?1:.35;
}

export function trialSettings(age,saved) {
  const normalized=normalizeSettings(saved);
  return {
    selected:TRIAL_INSTRUMENTS,
    instruments:Object.fromEntries(TRIAL_INSTRUMENTS.map(id=>[id,{
      ...normalized.instruments[id],
      complexity:saved?.instruments?.[id]?.complexity===undefined?trialComplexity(age):normalized.instruments[id].complexity,
    }])),
  };
}

export const TRIAL_DESCRIPTION='Play this free trial for as long as you like. It has no ads.';
export const TRIAL_CONTENT=`Play ${TRIAL_LABELS.join(', ')} in Morning (Sunny Farm) and Early Night (Sleepy Night) with Folk music. Farm Practice includes ${TRIAL_PHRASES} phrases per instrument, with unlimited replays. Set one age range for this device.`;
export const FULL_CONTENT=`Unlock ${FULL_ADDITIONS.join(', ')}, Jazz, Rock and Samba, seven times of day per environment, bicycle trips between the Farm and Jungle, the complete practice library, and separate child profiles. Choose any six instruments for each child’s landscape.`;
