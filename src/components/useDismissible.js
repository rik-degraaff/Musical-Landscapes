import {useEffect,useRef} from 'react';

export function useDismissible(ref,open,onDismiss) {
  const callback=useRef(onDismiss);callback.current=onDismiss;
  useEffect(()=>{
    if(!open)return;
    const outside=event=>{
      if(ref.current?.contains(event.target))return;
      if(event.button!==0)return;
      const {clientX,clientY}=event;
      const swallowClick=click=>{
        if(Math.hypot(click.clientX-clientX,click.clientY-clientY)<3){click.preventDefault();click.stopImmediatePropagation();}
        window.removeEventListener('click',swallowClick,true);
      };
      window.addEventListener('click',swallowClick,true);
      window.setTimeout(()=>window.removeEventListener('click',swallowClick,true),700);
      event.preventDefault();event.stopImmediatePropagation();callback.current();
    };
    const escape=event=>{if(event.key==='Escape'){event.preventDefault();callback.current();}};
    window.addEventListener('pointerdown',outside,true);
    window.addEventListener('keydown',escape);
    return ()=>{window.removeEventListener('pointerdown',outside,true);window.removeEventListener('keydown',escape);};
  },[open,ref]);
}