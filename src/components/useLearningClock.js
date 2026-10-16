import {useEffect} from 'react';
import {updateChildLearning} from '../utils/learning';

// Measure local play exposure, not wall time between visits. No analytics leave the device.
export function useLearningClock({active,childId,change}) {
  useEffect(()=>{
    if(!active||!childId)return;
    let last=performance.now();
    const landscape=window.matchMedia('(orientation: landscape)');
    const canRun=()=>!document.hidden&&document.hasFocus()&&landscape.matches;
    let running=canRun();
    function sample() {
      const now=performance.now();
      if(running){
        const seconds=Math.max(0,(now-last)/1000);
        change(state=>updateChildLearning(state,childId,child=>({...child,seconds:child.seconds+seconds})));
      }
      last=now;
    }
    const pause=()=>{sample();running=false;};
    const resume=()=>{last=performance.now();running=canRun();};
    const orientation=()=>{sample();resume();};
    const visibility=()=>document.hidden?pause():resume();
    const timer=window.setInterval(sample,5000);
    window.addEventListener('blur',pause);window.addEventListener('focus',resume);document.addEventListener('visibilitychange',visibility);
    landscape.addEventListener('change',orientation);
    return ()=>{sample();clearInterval(timer);window.removeEventListener('blur',pause);window.removeEventListener('focus',resume);document.removeEventListener('visibilitychange',visibility);landscape.removeEventListener('change',orientation);};
  },[active,childId,change]);
}
