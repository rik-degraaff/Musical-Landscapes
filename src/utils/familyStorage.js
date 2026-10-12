import {CHILDREN_KEY,normalizeChild,normalizeChildren} from './children.js';
import {SETTINGS_KEY,defaultSettings,normalizeSettings} from './settings.js';

export function createFamilyStorage(storageProvider=()=>window.localStorage) {
  function load() {
    let storage,saveError=null;
    try {storage=storageProvider();}catch(error){return {family:normalizeChildren(null),settings:defaultSettings(),saveError:error};}
    function read(key) {
      try {return JSON.parse(storage.getItem(key)??'null');}catch(error){saveError??=error;return null;}
    }
    const rawFamily=read(CHILDREN_KEY);
    const family=normalizeChildren(rawFamily);
    const selectedChild=family.children.find(child=>child.id===family.selectedId);
    const rawChild=selectedChild&&rawFamily.children.find(child=>normalizeChild(child)?.id===selectedChild.id);
    const settings=rawChild&&Object.hasOwn(rawChild,'settings')?normalizeSettings(selectedChild.settings):normalizeSettings(read(SETTINGS_KEY));
    if(selectedChild)selectedChild.settings=normalizeSettings(settings);
    return {family,settings,saveError};
  }

  function saveSnapshot({family,settings}) {
    try {
      const normalizedFamily=normalizeChildren(family);
      const selectedChild=normalizedFamily.children.find(child=>child.id===normalizedFamily.selectedId);
      const normalizedSettings=selectedChild?.settings??normalizeSettings(settings);
      const familyJSON=JSON.stringify(normalizedFamily);
      const settingsJSON=JSON.stringify(normalizedSettings);
      const storage=storageProvider();
      storage.setItem(CHILDREN_KEY,familyJSON);
      storage.setItem(SETTINGS_KEY,settingsJSON);
      return {ok:true,error:null};
    } catch(error) {
      return {ok:false,error};
    }
  }

  function saveLegacySettings(settings) {
    try {
      storageProvider().setItem(SETTINGS_KEY,JSON.stringify(normalizeSettings(settings)));
      return {ok:true,error:null};
    } catch(error) {
      return {ok:false,error};
    }
  }

  return {load,saveSnapshot,saveLegacySettings};
}