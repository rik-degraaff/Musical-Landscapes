import {INSTRUMENTS} from './music.js';

export const PARENT_GUIDE_KEY='farmjam-parent-guide-v1';
export const GUIDE_INSTRUMENTS=Object.entries(INSTRUMENTS).map(([id,{label}])=>[id,label]);
export const GUIDE_LEVELS={Simple:.35,Standard:1,Advanced:1.5};

export function recommendParentSettings(profile,currentSettings,selectedLevel) {
  const veryYoung=profile.age==='under3'||profile.age==='3to4';
  const starting=profile.music==='new'&&!normalizeInstruments(profile.instruments).length;
  const level=veryYoung||profile.age==='5to7'&&starting?'Simple':'Standard';
  const appliedLevel=Object.hasOwn(GUIDE_LEVELS,selectedLevel)?selectedLevel:level;
  const complexity=GUIDE_LEVELS[appliedLevel];
  const instruments=Object.fromEntries(Object.entries(currentSettings.instruments).map(([name,options])=>[name,{
    ...options,
    complexity,
    noteLabels:true,
    playbackNotes:true,
    ...(['guitar','ukulele'].includes(name)?{fingeringCharts:true}:{})
  }]));
  const explanation=level==='Simple'
    ?profile.age==='under3'
      ?'The simplest phrases are the gentlest starting point. For children under 2, prioritize shared real-world play and follow your pediatrician’s screen-use guidance.'
      :'Simple keeps the note choices small and the rhythms roomy. You can move to Standard whenever your child asks for more variety.'
    :profile.parent==='new'
      ?'Standard offers a little more variety while keeping every part playable with the controls already on screen. We’ll use everyday language, and note names are switched on to help you explore together.'
      :'Standard adds a little more rhythmic and melodic variety without adding controls. Note names stay visible so you can talk about the patterns together.';
  return {level,appliedLevel,explanation,settings:{...currentSettings,instruments}};
}

function normalizeInstruments(value) {
  return Array.isArray(value)?[...new Set(value.filter(id=>typeof id==='string'&&Object.hasOwn(INSTRUMENTS,id)))]:[];
}

function normalizeProfile(saved={}) {
  return {
    age:['under3','3to4','5to7','8plus'].includes(saved?.age)?saved.age:'5to7',
    music:['new','some','familiar'].includes(saved?.music)?saved.music:'new',
    instruments:normalizeInstruments(saved?.instruments),
    parent:['new','some','confident'].includes(saved?.parent)?saved.parent:'some'
  };
}

export function saveParentProfile(storage,profile) {
  try {
    storage.setItem(PARENT_GUIDE_KEY,JSON.stringify(normalizeProfile(profile)));
    return true;
  } catch {
    return false;
  }
}

export function loadParentProfile(storage) {
  try {
    const saved=JSON.parse(storage.getItem(PARENT_GUIDE_KEY)??'null');
    return normalizeProfile(saved);
  } catch {
    return normalizeProfile();
  }
}
