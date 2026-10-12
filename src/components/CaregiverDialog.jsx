import React,{useEffect,useRef} from 'react';
import {Heart,X} from 'lucide-react';
import './parent-guide.css';
import './caregiver.css';

export function CaregiverDialog({title,onClose,children,footer,confirm=false}) {
  const dialog=useRef(null);
  useEffect(()=>{
    const previous=document.activeElement;
    const bodyTouchAction=document.body.style.touchAction;
    document.body.style.touchAction='pan-y pinch-zoom';
    dialog.current.showModal();
    dialog.current.querySelector('[data-autofocus]')?.focus();
    return ()=>{document.body.style.touchAction=bodyTouchAction;previous?.isConnected&&previous.focus();};
  },[]);
  return <dialog ref={dialog} className="parent-guide caregiver-dialog" role={confirm?'alertdialog':'dialog'} aria-label={title} onCancel={event=>{event.preventDefault();onClose();}} onKeyDown={event=>{event.stopPropagation();if(event.key==='Escape'){event.preventDefault();onClose();}}}>
    <header className="parent-guide-head"><div><span className="parent-guide-kicker"><Heart size={15}/>For caregivers</span><h2>{title}</h2></div><button className="parent-guide-close" aria-label="Close caregiver dialog" title="Close" onClick={onClose}><X size={21}/></button></header>
    <div className="parent-guide-content">{children}</div>
    {footer&&<footer className="parent-guide-footer">{footer}</footer>}
  </dialog>;
}