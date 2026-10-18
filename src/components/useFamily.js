import {useEffect,useRef,useState} from 'react';
import {normalizeChild} from '../utils/children.js';
import {createFamilyStorage,recoverFamilySnapshot} from '../utils/familyStorage.js';
import {defaultSettings} from '../utils/settings.js';

// Own family persistence here; gameplay only consumes the resulting snapshot.
export function useFamily(developmentPreview) {
  const [storage]=useState(()=>developmentPreview?null:createFamilyStorage());
  const [initial]=useState(()=>developmentPreview?{
    family:{children:[developmentPreview.child],selectedId:developmentPreview.child.id},
    settings:developmentPreview.child.settings,saveError:null,
  }:storage.load());
  const [snapshot,setSnapshot]=useState(()=>({family:initial.family,settings:initial.settings}));
  const [error,setError]=useState(Boolean(initial.saveError));
  const readFailed=useRef(Boolean(initial.saveError));

  useEffect(()=>{
    if(storage&&!initial.saveError&&!storage.saveLegacySettings(initial.settings).ok)setError(true);
  },[storage,initial]);

  function save(next,profileEdit=false) {
    const result=storage?(profileEdit?storage.saveProfileSnapshot(next):storage.saveSnapshot(next)):{ok:true};
    setError(!result.ok);
    return result.ok;
  }

  function updateSettings(settings) {
    const family={...snapshot.family,children:snapshot.family.children.map(child=>
      child.id===snapshot.family.selectedId?{...child,settings}:child)};
    const next={family,settings};
    // Settings and selection remain usable in this session even if storage fails.
    save(next);setSnapshot(next);
  }

  function selectChild(id) {
    const child=snapshot.family.children.find(value=>value.id===id);
    if(!child)return null;
    const next={family:{...snapshot.family,selectedId:id},settings:child.settings};
    save(next);setSnapshot(next);
    return next;
  }

  function addChild(draft) {
    const child=normalizeChild({...draft,id:crypto.randomUUID()});
    if(!child)return null;
    const next={family:{children:[...snapshot.family.children,child],selectedId:child.id},settings:child.settings};
    // Creation and profile edits commit to the UI only after a successful save.
    if(!save(next))return null;
    setSnapshot(next);
    return next;
  }

  function saveFamily(family) {
    if(!family)return null;
    const next={family,settings:family.children.find(child=>child.id===family.selectedId)?.settings??defaultSettings()};
    if(!save(next,true))return null;
    setSnapshot(next);
    return next;
  }

  function retry() {
    let next=snapshot;
    const recovered=readFailed.current;
    if(recovered) {
      const loaded=storage.load();
      if(loaded.saveError){setError(true);return null;}
      next=recoverFamilySnapshot(initial,snapshot,loaded);
      readFailed.current=false;
      setSnapshot(next);
    }
    save(next);
    return {snapshot:next,recovered};
  }

  return {...snapshot,selectedChild:snapshot.family.children.find(child=>child.id===snapshot.family.selectedId)??null,
    initial,error,updateSettings,selectChild,addChild,saveFamily,retry};
}
