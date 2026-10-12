import React,{useEffect} from 'react';
import {noteMidi,trumpetInput} from '../utils/autoplay';
import {fluteInput} from '../utils/wind';

function pitchClass(note) {
  return typeof note==='number'?((note%12)+12)%12:typeof note==='string'&&/^[A-G]#?\d+$/.test(note)?noteMidi(note)%12:null;
}

export function HarmonyHints({hostRef,plan,root,name,profile,options}) {
  const mode=profile.level==='Simple'?'off':options.harmonyHints??'notes';
  const chord=mode!=='off'&&plan?.root===root?plan.nextChord:null;
  const tones=(chord?.tones??[]).map(pitchClass).filter(value=>value!==null);
  const matchingNotes=profile.notes.filter(note=>tones.includes(pitchClass(note)));
  const matchingChord=profile.chords.find(value=>value.name===chord?.name&&value.tones.every(tone=>tones.includes(pitchClass(tone)))&&tones.every(tone=>value.tones.includes(tone)));
  const available=name==='drums'?false:['guitar','ukulele'].includes(name)?Boolean(matchingChord):matchingNotes.length>0;
  useEffect(()=>{
    const host=hostRef.current?.querySelector('.performance-surface');
    if(!host)return;
    const clear=()=>{for(const control of host.querySelectorAll('[data-harmony-hint]')){control.removeAttribute('data-harmony-hint');control.removeAttribute('data-harmony-note');}};
    const mark=(control,note)=>{if(control){control.setAttribute('data-harmony-hint','true');if(note)control.setAttribute('data-harmony-note',note);}};
    const update=()=>{
      clear();
      if(!available)return;
      for(const control of host.querySelectorAll('.note-key,.panflute-pipe,.playable-string')){
        const note=/ ([A-G]#?\d+)$/.exec(control.getAttribute('aria-label')??'')?.[1];
        if(note&&tones.includes(pitchClass(note)))mark(control,note);
      }
      if(matchingChord)for(const control of host.querySelectorAll('.chord-control'))if(control.getAttribute('aria-label')===`Hold ${name} chord ${matchingChord.name}`)mark(control);
      if(name==='flute'){
        const target=matchingNotes.map(fluteInput).find(input=>input&&input.register<profile.fluteRegisters);
        if(target){
          for(const key of target.keys)mark(host.querySelector(`.flute-key-${key}`),target.note);
          mark(host.querySelectorAll('.flute-register-level')[profile.fluteRegisters-1-target.register],target.note);
        }
      }
      if(name==='melody'){
        const target=matchingNotes.map(note=>({note,input:trumpetInput(note)})).find(value=>value.input&&value.input.partial<profile.registers);
        if(target){
          target.input.valves.forEach((held,index)=>{if(held)mark(host.querySelectorAll('.valve-control')[index],target.note);});
          mark(host.querySelectorAll('.lip-segment')[target.input.partial],target.note);
        }
      }
    };
    update();
    const observer=new MutationObserver(update);
    observer.observe(host,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-label']});
    return ()=>{observer.disconnect();clear();};
  },[hostRef,plan,root,name,profile,mode]);
  return available&&mode==='name'&&profile.level==='Advanced'?<output className="harmony-next-name" aria-label="Next chord" role="status" aria-live="polite">Next: {chord.name}</output>:null;
}