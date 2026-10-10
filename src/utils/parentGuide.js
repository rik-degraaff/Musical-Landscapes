export const PARENT_GUIDE_KEY='farmjam-parent-guide-v1';

export function recommendParentSettings(profile,currentSettings) {
  const veryYoung=profile.age==='under3'||profile.age==='3to4';
  const bothNew=profile.music==='new'&&profile.instrument==='new';
  const level=veryYoung||profile.age==='5to7'&&bothNew?'Simple':'Standard';
  const complexity=level==='Simple'?.35:1;
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
  return {level,explanation,settings:{...currentSettings,instruments}};
}

export function saveParentProfile(storage,profile) {
  try {
    storage.setItem(PARENT_GUIDE_KEY,JSON.stringify({age:profile.age,music:profile.music,instrument:profile.instrument,parent:profile.parent}));
    return true;
  } catch {
    return false;
  }
}

export function loadParentProfile(storage) {
  const fallback={age:'5to7',music:'new',instrument:'new',parent:'some'};
  try {
    const saved=JSON.parse(storage.getItem(PARENT_GUIDE_KEY)??'null');
    if(!saved)return fallback;
    return {
      age:['under3','3to4','5to7','8plus'].includes(saved.age)?saved.age:fallback.age,
      music:['new','some','familiar'].includes(saved.music)?saved.music:fallback.music,
      instrument:['new','some','familiar'].includes(saved.instrument)?saved.instrument:fallback.instrument,
      parent:['new','some','confident'].includes(saved.parent)?saved.parent:fallback.parent
    };
  } catch {
    return fallback;
  }
}
