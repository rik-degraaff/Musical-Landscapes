export const CAREGIVER_SETTINGS_KEY='farmjam-caregiver-settings-v1';

export function normalizeFamiliarity(value) {
  return ['new','some','confident'].includes(value)?value:'some';
}

export function createCaregiverStorage(storageProvider=()=>window.localStorage) {
  let readError=null;
  function load(fallback='some') {
    try {
      const saved=JSON.parse(storageProvider().getItem(CAREGIVER_SETTINGS_KEY)??'null');
      readError=null;
      const established=['new','some','confident'].includes(saved?.familiarity);
      return {familiarity:established?saved.familiarity:normalizeFamiliarity(fallback),established,error:null};
    } catch(error) {
      readError=error;
      return {familiarity:normalizeFamiliarity(fallback),established:false,error};
    }
  }
  function save(familiarity) {
    if(readError)return {ok:false,error:readError};
    try {
      storageProvider().setItem(CAREGIVER_SETTINGS_KEY,JSON.stringify({familiarity:normalizeFamiliarity(familiarity)}));
      return {ok:true,error:null};
    } catch(error) {return {ok:false,error};}
  }
  return {load,save};
}