import {useRef,useState} from 'react';
import {AGE_SIZES} from '../utils/children.js';
import {TRIAL_SETTINGS_KEY,trialComplexity,trialSettings} from '../utils/editions.js';

function read() {
  try {
    const saved=JSON.parse(window.localStorage.getItem(TRIAL_SETTINGS_KEY));
    const age=Object.hasOwn(AGE_SIZES,saved?.age)?saved.age:null;
    return {age,settings:trialSettings(age,saved?.settings),error:false};
  } catch {
    return {age:null,settings:trialSettings(null),error:true};
  }
}

export function useTrialPreferences(enabled) {
  const [state,setState]=useState(()=>enabled?read():null);
  const latest=useRef(state);
  const unreadable=useRef(state?.error);
  const pending=useRef([]);
  function save(next) {
    let error=unreadable.current;
    if(!error)try {
      window.localStorage.setItem(TRIAL_SETTINGS_KEY,JSON.stringify({age:next.age,settings:next.settings}));
      pending.current=[];
    } catch {error=true;}
    latest.current={...next,error};
    setState(latest.current);
  }
  function setAge(age) {
    if(!Object.hasOwn(AGE_SIZES,age)||age===latest.current.age)return;
    change(current=>{
      const settings=trialSettings(age,current.settings);
      for(const options of Object.values(settings.instruments)){
        if(options.complexity===trialComplexity(current.age))options.complexity=trialComplexity(age);
      }
      return {age,settings};
    });
  }
  function change(update) {
    pending.current.push(update);
    save(update(latest.current));
  }
  function updateSettings(value) {
    const edits=Object.entries(value.instruments).map(([id,options])=>[id,Object.fromEntries(Object.entries(options)
      .filter(([key,item])=>item!==latest.current.settings.instruments[id]?.[key]))]);
    change(current=>{
      const instruments={...current.settings.instruments};
      for(const [id,options] of edits)instruments[id]={...instruments[id],...options};
      return {...current,settings:trialSettings(current.age,{instruments})};
    });
  }
  function retry() {
    if(unreadable.current){
      const recovered=read();
      if(recovered.error)return;
      unreadable.current=false;
      save(pending.current.reduce((current,update)=>update(current),recovered));
    }else if(latest.current.error){
      save(latest.current);
    }
  }
  return enabled?{...state,setAge,updateSettings,retry}:null;
}
