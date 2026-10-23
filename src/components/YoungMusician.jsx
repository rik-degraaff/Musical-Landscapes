import React,{useEffect,useRef} from 'react';
import {ChildAvatar} from './ChildAvatar';
import {AGE_SIZES,DEFAULT_AVATAR} from '../utils/children';

export function YoungMusicianArt({child}={}) {
  return <ChildAvatar avatar={child?.avatar??DEFAULT_AVATAR} age={child?.age??'5to7'}/>;
}

export function YoungMusician({ child,equipped, accepting,onPractice }) {
  const previous=useRef(null);
  const element=useRef(null);
  const practiceAction=useRef(onPractice);practiceAction.current=onPractice;
  useEffect(()=>{
    const pointers=new Map();
    const inside=event=>{const node=element.current;if(!node||node.closest('[inert]')||event.target.closest('dialog[open]'))return false;const instrument=event.target.closest('.instrument');if(instrument)return instrument.classList.contains('equipped-instrument');const box=node.getBoundingClientRect();return event.clientX>=box.left&&event.clientX<=box.right&&event.clientY>=box.top&&event.clientY<=box.bottom;};
    const down=event=>{if(event.button===0&&inside(event)){const instrument=event.target.closest('.equipped-instrument');pointers.set(event.pointerId,{x:event.clientX,y:event.clientY,time:performance.now(),playback:instrument?{name:instrument.id.slice(11),active:instrument.getAttribute('aria-pressed')==='true'}:null});}else previous.current=null;};
    const up=event=>{
      const start=pointers.get(event.pointerId);pointers.delete(event.pointerId);if(!start)return;
      const now=performance.now();
      if(!inside(event)||now-start.time>500||Math.hypot(event.clientX-start.x,event.clientY-start.y)>12){previous.current=null;return;}
      if(previous.current&&now-previous.current.time<450&&Math.hypot(event.clientX-previous.current.x,event.clientY-previous.current.y)<24){
        const playback=previous.current.playback;previous.current=null;event.preventDefault();event.stopImmediatePropagation();practiceAction.current?.(playback);
      }else{
        previous.current={time:now,x:event.clientX,y:event.clientY,playback:start.playback};
      }
    };
    const cancel=event=>{pointers.delete(event.pointerId);previous.current=null;};
    document.addEventListener('pointerdown',down,true);document.addEventListener('pointerup',up,true);document.addEventListener('pointercancel',cancel,true);
    return ()=>{document.removeEventListener('pointerdown',down,true);document.removeEventListener('pointerup',up,true);document.removeEventListener('pointercancel',cancel,true);};
  },[]);
  return <div ref={element} id="young-musician" data-child-name={child?.name} style={{scale:AGE_SIZES[child?.age]??1}} className={`young-musician ${equipped?'equipped':''} ${accepting?'accepting':''}`} role="button" tabIndex={0} aria-label={equipped?`Practice with ${equipped}`:'Enter practice room'} title="Double-tap to practice" onKeyDown={event=>{if(!event.repeat&&['Enter',' '].includes(event.key)){event.preventDefault();onPractice?.();}}}>
    <YoungMusicianArt child={child}/>
  </div>;
}