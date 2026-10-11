import React,{useEffect} from 'react';
import {Check,RotateCcw,Music} from 'lucide-react';

function FeedbackIndicator({item,onExpire}) {
  useEffect(()=>{
    const timer=window.setTimeout(()=>onExpire(item.id),2600);
    return ()=>window.clearTimeout(timer);
  },[item.id,onExpire]);
  const Icon=item.tone==='correct'?Check:RotateCcw;
  return <div className="practice-feedback-float" data-tone={item.tone} data-feedback-id={item.id} style={{left:`${item.x}%`,top:`${item.y}%`,'--feedback-drift':`${item.drift}px`}}>
    <span className="feedback-float-symbol"><Icon size={25}/></span>
    <span className="feedback-float-label">{item.text}</span>
    {item.tone==='correct'&&<Music className="feedback-float-note" size={13}/>}
  </div>;
}

export function PracticeFeedback({items,onExpire}) {
  return <div className="practice-feedback-layer" aria-hidden="true">{items.map(item=><FeedbackIndicator key={item.id} item={item} onExpire={onExpire}/>)}</div>;
}