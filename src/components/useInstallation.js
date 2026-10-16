import {useEffect,useRef,useState} from 'react';
import {isInstalled} from '../utils/installation';

// The browser may offer installation long before the optional guide is opened.
// Keep its one-use event for this App lifetime; never persist a browser event.
export function useInstallation() {
  const check=()=>isInstalled({standalone:navigator.standalone,displayMode:window.matchMedia('(display-mode: standalone)').matches});
  const [installed,setInstalled]=useState(check);
  const [prompt,setPrompt]=useState(null);
  const [status,setStatus]=useState('');
  const [pending,setPending]=useState(false);
  const busy=useRef(false);
  useEffect(()=>{
    const media=window.matchMedia('(display-mode: standalone)');
    const before=event=>{event.preventDefault();setPrompt(event);};
    const done=()=>{setInstalled(true);setPrompt(null);setStatus('FarmJam is installed.');};
    const mode=()=>setInstalled(check());
    window.addEventListener('beforeinstallprompt',before);window.addEventListener('appinstalled',done);media.addEventListener('change',mode);
    return ()=>{window.removeEventListener('beforeinstallprompt',before);window.removeEventListener('appinstalled',done);media.removeEventListener('change',mode);};
  },[]);
  async function install() {
    if(!prompt||busy.current)return;
    busy.current=true;setPending(true);
    try {await prompt.prompt();const choice=await prompt.userChoice;setStatus(choice.outcome==='accepted'?'Installation requested. Open FarmJam when it finishes.':'You can keep playing in the browser.');}
    catch {setStatus('Use the browser menu and the steps below to install.');}
    finally {setPrompt(null);setPending(false);busy.current=false;}
  }
  return {installed,available:Boolean(prompt),status,pending,install};
}
