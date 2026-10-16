import {equippedProfile,difficultyLevel} from './difficulty.js';
import {compositionProfile} from './composition.js';
import {noteMidi} from './autoplay.js';
import {PIANO_NOTES,MARIMBA_NOTES} from './performance.js';

const profileCache=new Map();
const PROFILE_CACHE_LIMIT=96;
const chordInstruments=['piano','guitar','ukulele'];

export function practiceProfile(name,root,options={}) {
  const level=difficultyLevel(options);
  const role=options.role??(name==='drums'?'rhythm':chordInstruments.includes(name)?'accompaniment':'melody');
  const includeMelody=options.includeMelody!==false&&role==='accompaniment'&&chordInstruments.includes(name);
  const key=JSON.stringify([name,root,level,role,includeMelody,options.degree===undefined?'all':options.degree]);
  if(profileCache.has(key)){
    const profile=profileCache.get(key);
    profileCache.delete(key);profileCache.set(key,profile);
    return profile;
  }
  const legacy=equippedProfile(name,root,options);
  const compositionOptions={...options,complexity:level==='Simple'?.35:level==='Standard'?1:1.5,role};
  const motifs=[...compositionProfile(name,root,compositionOptions),...(includeMelody?compositionProfile(name,root,{...compositionOptions,role:'melody'}):[])];
  const phrases=Object.freeze([...legacy.phrases,...motifs]);
  // Event pitches are note names; normalize ordering through MIDI pitch numbers, not string order.
  const played=name==='drums'?[]:motifs.flatMap(phrase=>phrase.events.flatMap(event=>event.notes??[event.note]));
  const fullKeyboard=level==='Advanced'?{piano:PIANO_NOTES,marimba:MARIMBA_NOTES}[name]:undefined;
  const notes=Object.freeze([...new Set([...legacy.notes,...played])].sort((first,second)=>noteMidi(first)-noteMidi(second)));
  const keyboardNotes=fullKeyboard?Object.freeze([...fullKeyboard]):legacy.keyboardNotes;
  const profile=Object.freeze({...legacy,phrases,notes,keyboardNotes});
  profileCache.set(key,profile);
  if(profileCache.size>PROFILE_CACHE_LIMIT)profileCache.delete(profileCache.keys().next().value);
  return profile;
}
