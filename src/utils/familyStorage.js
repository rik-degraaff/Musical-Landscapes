import {CHILDREN_KEY,normalizeChild,normalizeChildren} from './children.js';
import {SETTINGS_KEY,defaultSettings,normalizeSettings} from './settings.js';

export function createFamilyStorage(storageProvider=()=>window.localStorage) {
  let loadError=null;
  function load() {
    let storage,saveError=null;
    try {storage=storageProvider();}catch(error){loadError=error;return {family:normalizeChildren(null),settings:defaultSettings(),saveError:error};}
    function read(key) {
      try {return JSON.parse(storage.getItem(key)??'null');}catch(error){saveError??=error;return null;}
    }
    const rawFamily=read(CHILDREN_KEY);
    const family=normalizeChildren(rawFamily);
    const selectedChild=family.children.find(child=>child.id===family.selectedId);
    const rawChild=selectedChild&&rawFamily.children.find(child=>normalizeChild(child)?.id===selectedChild.id);
    const settings=rawChild&&Object.hasOwn(rawChild,'settings')?normalizeSettings(selectedChild.settings):normalizeSettings(read(SETTINGS_KEY));
    if(selectedChild)selectedChild.settings=normalizeSettings(settings);
    loadError=saveError;
    return {family,settings,saveError};
  }

  function saveSnapshot({family,settings},onFamilySaved=()=>{}) {
    if(loadError)return {ok:false,error:loadError};
    try {
      const normalizedFamily=normalizeChildren(family);
      const selectedChild=normalizedFamily.children.find(child=>child.id===normalizedFamily.selectedId);
      const normalizedSettings=selectedChild?.settings??normalizeSettings(settings);
      const familyJSON=JSON.stringify(normalizedFamily);
      const settingsJSON=JSON.stringify(normalizedSettings);
      const storage=storageProvider();
      storage.setItem(CHILDREN_KEY,familyJSON);
      onFamilySaved({family:normalizedFamily,settings:normalizedSettings});
      storage.setItem(SETTINGS_KEY,settingsJSON);
      return {ok:true,error:null};
    } catch(error) {
      return {ok:false,error};
    }
  }

  function saveLegacySettings(settings) {
    if(loadError)return {ok:false,error:loadError};
    try {
      storageProvider().setItem(SETTINGS_KEY,JSON.stringify(normalizeSettings(settings)));
      return {ok:true,error:null};
    } catch(error) {
      return {ok:false,error};
    }
  }

  function saveProfileSnapshot({family,settings},onFamilySaved=()=>{}) {
    if(loadError)return {ok:false,error:loadError};
    let storage,previousSettings,settingsWritten=false;
    try {
      const normalizedFamily=normalizeChildren(family);
      const selectedChild=normalizedFamily.children.find(child=>child.id===normalizedFamily.selectedId);
      const familyJSON=JSON.stringify(normalizedFamily);
      const settingsJSON=JSON.stringify(selectedChild?.settings??normalizeSettings(settings));
      storage=storageProvider();previousSettings=storage.getItem(SETTINGS_KEY);
      // The legacy settings key is written first for older readers; roll it back if the family write fails.
      storage.setItem(SETTINGS_KEY,settingsJSON);settingsWritten=true;
      storage.setItem(CHILDREN_KEY,familyJSON);
      onFamilySaved({family:normalizedFamily,settings:selectedChild?.settings??normalizeSettings(settings)});
      return {ok:true,error:null};
    } catch(error) {
      if(settingsWritten){
        try {if(previousSettings===null)storage.removeItem(SETTINGS_KEY);else storage.setItem(SETTINGS_KEY,previousSettings);}
        catch(rollbackError){return {ok:false,error,rollbackError};}
      }
      return {ok:false,error};
    }
  }

  function saveMergedSnapshot(base,next,profileEdit=false) {
    if(loadError)return {ok:false,error:loadError,snapshot:next,acknowledged:null};
    // Read again at the write boundary: a tab's in-memory family may be older
    // than another tab's completed add, edit or deletion. Failed reads never save.
    const current=structuredClone(next);
    const latest=createFamilyStorage(storageProvider).load();
    if(latest.saveError)return {ok:false,error:latest.saveError,snapshot:next,acknowledged:null};
    const snapshot=mergeFamilySnapshot(base,current,latest,{profileEdit});
    let acknowledged=null;
    const remember=saved=>{acknowledged=saved;};
    const result=profileEdit?saveProfileSnapshot(snapshot,remember):saveSnapshot(snapshot,remember);
    return {...result,snapshot,acknowledged};
  }

  return {load,saveSnapshot,saveLegacySettings,saveProfileSnapshot,saveMergedSnapshot};
}

function recoverUnchangedFields(initial,current,recovered) {
  if(JSON.stringify(initial)===JSON.stringify(current))return recovered;
  // These are normalized records. Ordered instrument selections are one value;
  // object fields can be recovered independently (including instrument options).
  if(!initial||!current||!recovered||typeof current!=='object'||Array.isArray(current))return current;
  return Object.fromEntries(Object.entries(current).map(([key,value])=>[
    key,recoverUnchangedFields(initial[key],value,recovered[key]),
  ]));
}

export function mergeFamilySnapshot(base,current,latest,{profileEdit=false}={}) {
  const previous=new Map(base.family.children.map(child=>[child.id,child]));
  const edited=new Map(current.family.children.map(child=>[child.id,child]));
  const savedIds=new Set(latest.family.children.map(child=>child.id));
  const children=latest.family.children.flatMap(saved=>{
    const before=previous.get(saved.id),local=edited.get(saved.id);
    // Only the explicit profile-edit path can delete a child. Ordinary saves
    // and retries cannot infer a deletion from a stale or uncommitted UI list.
    if(!local)return profileEdit&&before?[]:[saved];
    return [before?recoverUnchangedFields(before,local,saved):saved];
  });
  for(const local of current.family.children){
    // A saved deletion wins over stale edits. Only genuinely new local IDs append.
    if(!previous.has(local.id)&&!savedIds.has(local.id))children.push(local);
  }
  const selectedId=children.some(child=>child.id===current.family.selectedId)?current.family.selectedId
    :children.some(child=>child.id===latest.family.selectedId)?latest.family.selectedId:children[0]?.id??null;
  const settings=children.find(child=>child.id===selectedId)?.settings
    ??recoverUnchangedFields(base.settings,current.settings,latest.settings);
  return {family:{children,selectedId},settings};
}

export function recoverFamilySnapshot(initial,current,recovered) {
  // Recovered storage supplies unchanged data; preserve edits made in memory since the initial load.
  const children=recovered.family.children.map(saved=>{
    const previous=initial.family.children.find(child=>child.id===saved.id);
    const edited=current.family.children.find(child=>child.id===saved.id);
    return previous&&edited?recoverUnchangedFields(previous,edited,saved):saved;
  });
  const selectedId=current.family.selectedId!==initial.family.selectedId&&children.some(child=>child.id===current.family.selectedId)
    ?current.family.selectedId:recovered.family.selectedId;
  const settings=children.find(child=>child.id===selectedId)?.settings??recovered.settings;
  return {family:{children,selectedId},settings};
}
