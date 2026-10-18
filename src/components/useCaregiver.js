import {useEffect,useRef,useState} from 'react';
import {createCaregiverStorage,normalizeFamiliarity} from '../utils/caregiverSettings.js';

const legacyFamiliarity=snapshot=>snapshot.family.children.find(child=>child.id===snapshot.family.selectedId)?.profile.parent;

// Caregiver familiarity belongs to the device, independently of child selection.
export function useCaregiver(initialFamily,preview=false) {
  const [storage]=useState(()=>createCaregiverStorage(preview?()=>({getItem:()=>null,setItem(){}}):undefined));
  const [initial]=useState(()=>storage.load(legacyFamiliarity(initialFamily)));
  const [familiarity,setFamiliarity]=useState(initial.familiarity);
  const [established,setEstablished]=useState(initial.established||initialFamily.family.children.length>0);
  const [error,setError]=useState(Boolean(initial.error));
  const edited=useRef(false);
  const knownFamily=useRef(initialFamily);

  useEffect(()=>{
    if(!initial.established&&!initial.error&&!initialFamily.saveError&&initialFamily.family.children.length>0){
      edited.current=true;
      setError(!storage.save(initial.familiarity).ok);
    }
  },[storage,initial,initialFamily]);

  function update(value) {
    const next=normalizeFamiliarity(value);
    edited.current=true;setFamiliarity(next);setEstablished(true);
    setError(!storage.save(next).ok);
  }

  function retry() {
    if(!error)return;
    const fallback=edited.current?familiarity:legacyFamiliarity(knownFamily.current)??familiarity;
    const recovered=storage.load(fallback);
    if(recovered.error){setError(true);return;}
    if(edited.current)setError(!storage.save(familiarity).ok);
    else adoptRecovered(recovered,knownFamily.current.family.children.length>0);
  }

  function recoverFamily(snapshot) {
    // Family reads can recover before this record. Retain its legacy seed for
    // the next caregiver retry even if the read below is still unavailable.
    knownFamily.current=snapshot;
    if(edited.current||initial.established)return;
    const recovered=storage.load(legacyFamiliarity(snapshot));
    if(recovered.error){setError(true);return;}
    adoptRecovered(recovered,snapshot.family.children.length>0);
  }

  function adoptRecovered(recovered,hasChildren) {
    setFamiliarity(recovered.familiarity);setEstablished(recovered.established||hasChildren);
    if(!recovered.established&&hasChildren){
      edited.current=true;
      setError(!storage.save(recovered.familiarity).ok);
    } else setError(false);
  }

  return {familiarity,established,error,update,retry,recoverFamily};
}
