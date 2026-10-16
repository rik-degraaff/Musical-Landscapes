import React,{useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,Heart,Info,X} from 'lucide-react';
import {GUIDE_LEVELS,recommendParentSettings} from '../utils/parentGuide';
import {DEFAULT_AVATAR,normalizeAvatar} from '../utils/children';
import {emptyLearning} from '../utils/learning';
import {AvatarDesigner} from './AvatarDesigner';
import {CaregiverHelp,HelpButton} from './CaregiverHelp';
import {CAREGIVER_FAMILIARITY,CHILD_AGE_OPTIONS} from '../utils/caregiverHelp';
import {GuideLibrary} from './Guides';
import './parent-guide.css';

export function ParentGuide({settings,onComplete,onClose,familiarity='some',familiarityEstablished=false,learning=emptyLearning(),onGuide,developmentPreview}) {
  const preview=import.meta.env.DEV?developmentPreview:null;
  const [steps]=useState(()=>[...(!familiarityEstablished?['familiarity']:[]),'child','avatar','setup','guides']);
  const [step,setStep]=useState(()=>preview?.step===4?steps.indexOf('avatar'):0);
  const [profile,setProfile]=useState(()=>({age:preview?.age??'5to7',parent:familiarity,music:'new',instruments:[]}));
  const [name,setName]=useState(preview?.name??'');
  const [avatar,setAvatar]=useState(()=>({...DEFAULT_AVATAR,...preview?.avatar}));
  const [selectedLevel,setSelectedLevel]=useState(null);
  const [help,setHelp]=useState(false);
  const [completionError,setCompletionError]=useState('');
  const [completing,setCompleting]=useState(false);
  const dialog=useRef(null);
  const previousFocus=useRef(document.activeElement);
  const closeRef=useRef(onClose);closeRef.current=onClose;
  const changePreviewAvatar=useRef(preview?.onAvatarChange);changePreviewAvatar.current=preview?.onAvatarChange;
  useEffect(()=>{changePreviewAvatar.current?.(avatar);},[avatar]);
  useEffect(()=>{if(preview?.avatar)setAvatar(current=>JSON.stringify(current)===JSON.stringify(preview.avatar)?current:preview.avatar);},[preview?.avatar]);
  useEffect(()=>{const heading=dialog.current?.querySelector('.parent-guide-content h3');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});},[step]);
  useEffect(()=>{
    const previousTouch=document.body.style.touchAction;document.body.style.touchAction='pan-y pinch-zoom';
    const keydown=event=>{
      if(event.defaultPrevented||document.querySelector('dialog[open]'))return;
      if(event.key==='Escape'){event.preventDefault();closeRef.current();return;}
      if(event.key!=='Tab')return;
      const controls=[...dialog.current.querySelectorAll('button:not(:disabled),select,input,a[href]')].filter(element=>element.getClientRects().length);
      const first=controls[0],last=controls.at(-1);
      if(!controls.includes(document.activeElement)){event.preventDefault();(event.shiftKey?last:first)?.focus();}
      else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    };
    window.addEventListener('keydown',keydown);
    return ()=>{window.removeEventListener('keydown',keydown);document.body.style.touchAction=previousTouch;previousFocus.current?.isConnected&&previousFocus.current.focus();};
  },[]);
  const recommendation=recommendParentSettings(profile,settings,selectedLevel);
  const current=steps[step];
  async function finish() {
    if(!name.trim()){setStep(steps.indexOf('child'));return;}
    if(completing)return;
    setCompleting(true);setCompletionError('');
    try {
      const result=await onComplete({name:name.trim().slice(0,40),age:profile.age,avatar:normalizeAvatar(avatar),profile:{...profile,instruments:[]},settings:recommendation.settings});
      if(result===false){setCompletionError('This child could not be saved on this device. Please try again. Your setup is still here.');return;}
      onClose();
    }catch {setCompletionError('This child could not be saved on this device. Please try again. Your setup is still here.');}
    finally {setCompleting(false);}
  }
  return <div className="parent-guide-backdrop">
    <section ref={dialog} className="parent-guide" role="dialog" aria-modal="true" aria-labelledby="parent-guide-title">
      <header className="parent-guide-head"><HelpButton onOpen={()=>setHelp(true)}/><div><span className="parent-guide-kicker"><Heart size={15}/>For caregivers</span><h2 id="parent-guide-title">Add a child</h2></div><button className="parent-guide-close" aria-label="Cancel child setup" onClick={onClose}><X size={21}/></button></header>
      <div className="parent-guide-progress" aria-label={`Step ${step+1} of ${steps.length}`}><div style={{'--guide-progress':`${(step+1)/steps.length*100}%`}}/><span>{step+1} / {steps.length}</span></div>
      <main className="parent-guide-content" key={current}>
        {current==='familiarity'&&<section><h3>How familiar are you with music?</h3><p>We'll use this to make explanations comfortable for you. You can change it anytime in Settings → Caregiver.</p><fieldset className="parent-choices"><legend>Caregiver music familiarity</legend><div>{CAREGIVER_FAMILIARITY.map(([value,label])=><label key={value} className={profile.parent===value?'is-selected':''}><input type="radio" name="parent" checked={profile.parent===value} onChange={()=>setProfile({...profile,parent:value})}/><span>{label}</span></label>)}</div></fieldset><p className="parent-guide-note">Shared by all children on this device. Saved when you finish setup; it changes the explanations, not the music.</p></section>}
        {current==='child'&&<section><h3>Who is joining the band?</h3><label className="parent-child-name" htmlFor="parent-child-name">Child name or nickname<input id="parent-child-name" value={name} onChange={event=>setName(event.target.value)} maxLength={40} required autoComplete="off" aria-describedby="parent-child-name-note"/></label><p id="parent-child-name-note" className="parent-child-name-note">A nickname is fine. Up to 40 characters.</p><fieldset className="parent-choices"><legend>Child age range</legend><div>{CHILD_AGE_OPTIONS.map(([value,label])=><label key={value} className={profile.age===value?'is-selected':''}><input type="radio" name="age" checked={profile.age===value} onChange={()=>setProfile({...profile,age:value})}/><span>{label}</span></label>)}</div></fieldset><p>Age suggests a starting complexity and when to offer optional hints. Every feature stays available.</p><p className="parent-guide-note"><Info size={17}/>Name, age band, avatar and choices stay in this browser on this device. No birthday or account is needed. Cancel discards this draft.</p></section>}
        {current==='avatar'&&<section><h3>A look of their own</h3><p>Keep this look or choose another. You can edit it later.</p><AvatarDesigner avatar={avatar} age={profile.age} name={name.trim()} onChange={setAvatar}/></section>}
        {current==='setup'&&<section><h3>{recommendation.level} is a good place to begin.</h3><p>{recommendation.explanation}</p><fieldset className="parent-choices"><legend>Starting complexity for all instruments</legend><div>{Object.keys(GUIDE_LEVELS).map(level=><label key={level} className={recommendation.appliedLevel===level?'is-selected':''}><input type="radio" name="difficulty" checked={recommendation.appliedLevel===level} onChange={()=>setSelectedLevel(level)}/><span>{level}</span></label>)}</div></fieldset><p>Simple offers fewer notes and controls. Standard adds choices. Advanced opens the full range. You can change each instrument later in Settings.</p><p className="parent-guide-note">Your selected six instruments stay available. Note labels and playing highlights help you explore together. These choices are saved only when you add the child.</p></section>}
        {current==='guides'&&<section><h3>Ready to explore</h3><p>Read a guide now, or add your child and play. All guides stay in Settings → Guides, with Unread or New badges when there is something to explore.</p><p className="parent-guide-note">The <strong>?</strong> button is always available for hints about the screen you are using. Optional learning symbols offer a short picture and explanation when your child is ready; choose them whenever you like.</p><GuideLibrary learning={learning} onOpen={onGuide}/></section>}
      </main>
      {completionError&&<p className="parent-completion-error" role="alert">{completionError}</p>}
      <footer className="parent-guide-footer"><button className="parent-skip" onClick={onClose}>Cancel setup</button><div>{step>0&&<button aria-label="Previous step" disabled={completing} onClick={()=>setStep(value=>value-1)}><ArrowLeft size={18}/>Back</button>}{step<steps.length-1?<button className="is-next" aria-label="Next step" disabled={current==='child'&&!name.trim()} onClick={()=>setStep(value=>value+1)}>Next<ArrowRight size={18}/></button>:<button className="is-next" disabled={completing} onClick={finish}><Check size={18}/>{completing?'Adding child…':'Add child'}</button>}</div></footer>
    </section>
    {help&&<CaregiverHelp topic={current==='setup'?'settings':'menu'} familiarity={profile.parent} onGuides={onGuide} onClose={()=>setHelp(false)}/>}
  </div>;
}
