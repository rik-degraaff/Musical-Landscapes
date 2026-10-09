import {useEffect,useRef} from 'react';

export function useInputReset(reset) {
  const callback=useRef(reset);callback.current=reset;
  useEffect(()=>{
    const clear=()=>callback.current();
    const hidden=()=>{if(document.hidden)clear();};
    window.addEventListener('blur',clear);
    window.addEventListener('pagehide',clear);
    window.addEventListener('farmjam-input-reset',clear);
    document.addEventListener('visibilitychange',hidden);
    return ()=>{
      window.removeEventListener('blur',clear);
      window.removeEventListener('pagehide',clear);
      window.removeEventListener('farmjam-input-reset',clear);
      document.removeEventListener('visibilitychange',hidden);
    };
  },[]);
}