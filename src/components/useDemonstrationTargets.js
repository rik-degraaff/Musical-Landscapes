import {useEffect,useState} from 'react';

export function elementLocation(host,element,x=.5,y=.5) {
  const bounds=host.getBoundingClientRect(),box=element?.getBoundingClientRect();
  if(!box||!bounds.width||!bounds.height)return null;
  return {x:(box.left-bounds.left+box.width*x)/bounds.width*100,y:(box.top-bounds.top+box.height*y)/bounds.height*100};
}

export function cueControl(host,cue) {
  const notes=cue?.notes??[cue?.note];
  return [...host.querySelectorAll('.note-key,.drum-pad,.panflute-pipe')].find(button=>notes.some(note=>note&&(button.getAttribute('aria-label')?.endsWith(` ${note}`)||button.classList.contains(`pad-${note}`))))
    ??host.querySelector('.playable-string,.flute-key-Eb,.trumpet-embouchure');
}

/** Resolve a passive overlay against actual component geometry, including resize. */
export function useDemonstrationTarget(host,selector,cue,revision='',anchorY=.5) {
  const [location,setLocation]=useState({x:50,y:60});
  useEffect(()=>{
    const element=host.current;
    if(!element)return;
    const measure=()=>{const point=elementLocation(element,selector?element.querySelector(selector):cueControl(element,cue),.5,anchorY);if(point)setLocation(point);};
    measure();const observer=new ResizeObserver(measure);observer.observe(element);
    return ()=>observer.disconnect();
  },[host,selector,JSON.stringify(cue),revision,anchorY]);
  return location;
}
