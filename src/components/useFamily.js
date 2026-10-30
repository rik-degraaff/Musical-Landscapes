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
  const acknowledged=useRef({family:initial.family,settings:initial.settings});
  const pendingChild=useRef(null);

  useEffect(()=>{
    if(storage&&!initial.saveError&&!storage.saveLegacySettings(initial.settings).ok)setError(true);
  },[storage,initial]);

  function save(next,profileEdit=false) {
    const result=storage?storage.saveMergedSnapshot(acknowledged.current,next,profileEdit):{ok:true,snapshot:next,acknowledged:next};
    // The family write can succeed before its compatibility mirror fails. Do
    // not replay an already-saved field over a newer tab's edit on Retry.
    if(result.acknowledged)acknowledged.current=result.acknowledged;
    setError(!result.ok);
    return result;
  }

  function updateSettings(settings) {
    const family={...snapshot.family,children:snapshot.family.children.map(child=>
      child.id===snapshot.family.selectedId?{...child,settings}:child)};
    const next={family,settings};
    // Settings and selection remain usable in this session even if storage fails.
    const result=save(next);setSnapshot(result.snapshot);
    return result.snapshot;
  }

  function selectChild(id) {
    const child=snapshot.family.children.find(value=>value.id===id);
    if(!child)return null;
    const next={family:{...snapshot.family,selectedId:id},settings:child.settings};
    const result=save(next);setSnapshot(result.snapshot);
    return result.snapshot;
  }

  function addChild(draft) {
    if(!pendingChild.current)pendingChild.current={id:crypto.randomUUID()};
    const child=normalizeChild({...draft,id:pendingChild.current.id});
    if(!child)return null;
    const next={family:{children:[...snapshot.family.children,child],selectedId:child.id},settings:child.settings};
    // Creation and profile edits commit to the UI only after a successful save.
    const result=save(next);
    if(!result.ok)return null;
    pendingChild.current=null;
    setSnapshot(result.snapshot);
    return result.snapshot;
  }

  function cancelChildSetup() {
    // Retries share an ID only within one setup. A canceled, partially saved
    // creation must not become the identity of a later, different child.
    pendingChild.current=null;
  }

  function saveFamily(family) {
    if(!family)return null;
    const next={family,settings:family.children.find(child=>child.id===family.selectedId)?.settings??defaultSettings()};
    const result=save(next,true);
    if(!result.ok)return null;
    setSnapshot(result.snapshot);
    return result.snapshot;
  }

  function retry() {
    let next=snapshot;
    const recovered=readFailed.current;
    if(recovered) {
      const loaded=storage.load();
      if(loaded.saveError){setError(true);return null;}
      next=recoverFamilySnapshot(initial,snapshot,loaded);
      acknowledged.current={family:loaded.family,settings:loaded.settings};
      readFailed.current=false;
    }
    const result=save(next);
    setSnapshot(result.snapshot);
    return {snapshot:result.snapshot,recovered:recovered||JSON.stringify(result.snapshot)!==JSON.stringify(snapshot)};
  }

  return {...snapshot,selectedChild:snapshot.family.children.find(child=>child.id===snapshot.family.selectedId)??null,
    initial,error,updateSettings,selectChild,addChild,cancelChildSetup,saveFamily,retry};
}
