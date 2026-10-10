import React,{useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,Clock3,Compass,Download,Heart,Info,Music,Play,Settings2,Users,X} from 'lucide-react';
import {GUIDE_INSTRUMENTS,GUIDE_LEVELS,recommendParentSettings} from '../utils/parentGuide';
import {installationGuide,isInstalled} from '../utils/installation';
import {DEFAULT_AVATAR,normalizeAvatar} from '../utils/children';
import {AvatarDesigner} from './AvatarDesigner';
import './parent-guide.css';

const STEPS=['Welcome','Install FarmJam','Your familiarity','Your child','Your avatar','Music experience','Recommended setup','Instruments','Landscapes and sound','Practice room','Play together'];
const AGE_OPTIONS=[['under3','Under 3'],['3to4','3–4'],['5to7','5–7'],['8plus','8+']];
const EXPERIENCE=[['new','Just starting'],['some','Has tried a little'],['familiar','Already plays or sings']];
const FAMILIARITY=[['new','New to music'],['some','Know a few basics'],['confident','Comfortable with music']];

export function ParentGuide({settings,onComplete,onClose}) {
  const [step,setStep]=useState(0);
  const [profile,setProfile]=useState(()=>({age:'5to7',parent:'some',music:'new',instruments:[]}));
  const [name,setName]=useState('');
  const [avatar,setAvatar]=useState(()=>({...DEFAULT_AVATAR}));
  const [completionError,setCompletionError]=useState('');
  const [completing,setCompleting]=useState(false);
  const [applied,setApplied]=useState(false);
  const [selectedLevel,setSelectedLevel]=useState(null);
  const [installation]=useState(()=>installationGuide(navigator));
  const [installed,setInstalled]=useState(()=>isInstalled({standalone:navigator.standalone,displayMode:window.matchMedia('(display-mode: standalone)').matches}));
  const [installPrompt,setInstallPrompt]=useState(null);
  const [installPending,setInstallPending]=useState(false);
  const [installStatus,setInstallStatus]=useState('');
  const dialog=useRef(null);
  const returnFocus=useRef(document.activeElement===document.body?document.querySelector('.start-help-button'):document.activeElement);
  const closeRef=useRef(onClose);closeRef.current=onClose;
  const recommendation=recommendParentSettings(profile,settings,selectedLevel);
  useEffect(()=>{
    const media=window.matchMedia('(display-mode: standalone)');
    const checkInstalled=()=>setInstalled(isInstalled({standalone:navigator.standalone,displayMode:media.matches}));
    const beforeInstall=event=>{event.preventDefault();setInstallPrompt(event);};
    const didInstall=()=>{setInstalled(true);setInstallPrompt(null);setInstallStatus('FarmJam is installed. Find its icon, then pin it using the steps below.');};
    media.addEventListener('change',checkInstalled);
    window.addEventListener('beforeinstallprompt',beforeInstall);
    window.addEventListener('appinstalled',didInstall);
    return ()=>{media.removeEventListener('change',checkInstalled);window.removeEventListener('beforeinstallprompt',beforeInstall);window.removeEventListener('appinstalled',didInstall);};
  },[]);
  useEffect(()=>{
    const heading=dialog.current?.querySelector('.parent-guide-content h3');
    heading?.setAttribute('tabindex','-1');
    heading?.focus({preventScroll:true});
  },[step]);
  useEffect(()=>{
    const bodyTouchAction=document.body.style.touchAction;
    document.body.style.touchAction='pan-y';
    const previous=returnFocus.current;
    dialog.current?.querySelector('button,select,input')?.focus();
    const keydown=event=>{
      if(event.key==='Escape'){event.preventDefault();closeRef.current();return;}
      if(event.key!=='Tab'||!dialog.current)return;
      const controls=[...dialog.current.querySelectorAll('button:not(:disabled),select,input')].filter(element=>element.getClientRects().length);
      const first=controls[0],last=controls.at(-1);
      if(!controls.includes(document.activeElement)){event.preventDefault();(event.shiftKey?last:first)?.focus();}
      else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    };
    window.addEventListener('keydown',keydown);
    return ()=>{window.removeEventListener('keydown',keydown);document.body.style.touchAction=bodyTouchAction;previous?.focus();};
  },[]);
  function update(key,value){setProfile(current=>({...current,[key]:value,...(key==='music'&&value==='new'?{instruments:[]}:{} )}));setApplied(false);}
  async function finish(){
    const childName=name.trim().slice(0,40);
    if(!childName){setStep(3);return;}
    if(completing)return;
    setCompletionError('');setCompleting(true);
    try {
      const result=await onComplete({name:childName,age:profile.age,avatar:normalizeAvatar(avatar),profile:{...profile,instruments:[...profile.instruments]},settings:recommendation.settings});
      if(result===false){setCompletionError('This child could not be saved on this device. Please try again. Your setup is still here.');return;}
      onClose();
    } catch {
      setCompletionError('This child could not be saved on this device. Please try again. Your setup is still here.');
    } finally {
      setCompleting(false);
    }
  }
  function apply(){setApplied(true);}
  async function install(){
    if(!installPrompt||installPending)return;
    setInstallPending(true);
    try {
      await installPrompt.prompt();
      const result=await installPrompt.userChoice;
      setInstallStatus(result.outcome==='accepted'?'Installation requested. Once it finishes, find FarmJam and pin its icon.':'Installation was not selected. You can keep playing in the browser or use the steps below later.');
    } catch {
      setInstallStatus('The browser could not open installation. Use its menu and the steps below instead.');
    } finally {
      setInstallPrompt(null);setInstallPending(false);
    }
  }
  const parentNote=profile.parent==='new'
    ?'We’ll use everyday language and point out each control as it appears.'
    :profile.parent==='confident'
      ?'We’ll include the musical terms behind the settings so you can explore them together.'
      :'We’ll keep the guidance practical, with a little music vocabulary where it helps.';
  const musicNote=profile.parent==='new'
    ?'A phrase is a short musical idea that repeats. Try copying its rhythm together; there is no need to read notes.'
    :profile.parent==='confident'
      ?'The patterns are short loops. Each landscape transposes them to a new key, so listen for the same idea in a different pitch center.'
      :'Phrases are short repeating patterns. Notice how the same shape can sound different when the landscape changes key.';
  const choice=(field,items,label)=><fieldset className="parent-choices"><legend>{label}</legend><div>{items.map(([value,text])=><label key={value} className={profile[field]===value?'is-selected':''}><input type="radio" name={field} value={value} checked={profile[field]===value} onChange={()=>update(field,value)}/><span>{text}</span></label>)}</div></fieldset>;
  return <div className="parent-guide-backdrop">
    <section ref={dialog} className="parent-guide" role="dialog" aria-modal="true" aria-labelledby="parent-guide-title">
      <header className="parent-guide-head"><div><span className="parent-guide-kicker"><Heart size={15}/> A guide for grown-ups</span><h2 id="parent-guide-title">Add a child</h2></div><button className="parent-guide-close" aria-label="Cancel child setup" title="Cancel child setup" onClick={onClose}><X size={21}/></button></header>
      <div className="parent-guide-progress" aria-label={`Step ${step+1} of ${STEPS.length}`}><div style={{'--guide-progress':`${(step+1)/STEPS.length*100}%`}}/><span>{step+1} / {STEPS.length}</span></div>
      <main className="parent-guide-content" key={step}>
        {step===0&&<section><span className="parent-guide-icon"><Users size={27}/></span><p className="parent-guide-eyebrow">A short orientation for parents and caregivers</p><h3>Make room for curiosity, not a perfect performance.</h3><p>FarmJam is a playful way to listen, explore sounds and try musical ideas together. This guide can suggest a gentle starting point and show where the app’s tools live.</p><p className="parent-guide-note"><Info size={17}/> Your child’s name, avatar and setup answers are stored only in this browser on this device when you finish. A nickname is fine. We ask for an age band, never a birthday; nothing is sent to a server.</p></section>}
        {step===1&&<section><span className="parent-guide-icon"><Download size={27}/></span><p className="parent-guide-eyebrow">{installation.label} setup · optional</p><h3>Give FarmJam a place beside your apps.</h3><p>Installing adds an app icon and, where supported, a separate app window. Pinning keeps that icon easy to find, so you can start together without hunting through browser tabs. Installation is optional; playing in the browser still works.</p>{installed&&<p className="parent-guide-note"><Check size={17}/> FarmJam is already running as an installed app. No need to install again; use the pinning steps below.</p>}<ol className="parent-install-steps">{installation.steps.map(text=><li key={text}>{text}</li>)}</ol>{!installed&&installPrompt&&<button className="parent-apply" onClick={install} disabled={installPending}><Download size={18}/>{installPending?'Opening installation…':'Install FarmJam'}</button>}<p role="status" className="parent-install-status">{installStatus}</p><p className="parent-guide-note"><Info size={17}/> Menus vary by browser version. Use this same website address when switching browsers. Setup answers stay local to each browser or app; they may not carry over when you switch. If installation is unavailable, save a bookmark instead.</p></section>}
        {step===2&&<section><span className="parent-guide-icon"><Compass size={27}/></span><p className="parent-guide-eyebrow">Your comfort level</p><h3>How familiar are you with music?</h3>{choice('parent',FAMILIARITY,'Parent or caregiver familiarity')}<p className="parent-guide-note">{parentNote}</p></section>}
        {step===3&&<section><span className="parent-guide-icon"><Users size={27}/></span><p className="parent-guide-eyebrow">A name and age band</p><h3>Who is joining the band?</h3><label className="parent-child-name" htmlFor="parent-child-name">Child name or nickname<input id="parent-child-name" name="childName" type="text" value={name} onChange={event=>setName(event.target.value)} maxLength={40} required autoComplete="off" aria-describedby="parent-child-name-note"/></label><p id="parent-child-name-note" className="parent-child-name-note">A nickname is fine. Up to 40 characters, stored only on this device.</p><p>Choose the closest age range. This is only used to suggest a starting complexity, not to judge readiness.</p>{choice('age',AGE_OPTIONS,'Child age range')}</section>}
        {step===4&&<section><p className="parent-guide-eyebrow">Their musical companion</p><h3>A look of their own.</h3><AvatarDesigner avatar={avatar} age={profile.age} name={name.trim()} onChange={setAvatar}/></section>}
        {step===5&&<section><span className="parent-guide-icon"><Music size={27}/></span><p className="parent-guide-eyebrow">Their experience</p><h3>How familiar are they with music?</h3>{choice('music',EXPERIENCE,'Music experience')}{['some','familiar'].includes(profile.music)&&<fieldset className="parent-choices parent-instrument-choices"><legend>Which instruments have they tried?</legend><div>{GUIDE_INSTRUMENTS.map(([id,label])=><label key={id} className={profile.instruments.includes(id)?'is-selected':''}><input type="checkbox" checked={profile.instruments.includes(id)} onChange={event=>update('instruments',event.target.checked?[...profile.instruments,id]:profile.instruments.filter(value=>value!==id))}/><span>{label}</span></label>)}</div><p>Choose any that fit, or leave them unchecked. Singing and other instruments count too.</p></fieldset>}<p className="parent-guide-note">Singing, dancing, tapping along or watching someone play all count as musical experience.</p></section>}
        {step===6&&<section><span className="parent-guide-icon"><Settings2 size={27}/></span><p className="parent-guide-eyebrow">A suggested starting setup</p><h3>{recommendation.level} is a good place to begin.</h3><p>{recommendation.explanation}</p><fieldset className="parent-choices"><legend>Starting difficulty for all instruments</legend><div>{Object.keys(GUIDE_LEVELS).map(level=><label key={level} className={recommendation.appliedLevel===level?'is-selected':''}><input type="radio" name="difficulty" checked={recommendation.appliedLevel===level} onChange={()=>{setSelectedLevel(level);setApplied(false);}}/><span>{level}</span></label>)}</div></fieldset><div className="parent-recommendation"><strong>{recommendation.appliedLevel} for all instruments</strong><span>{recommendation.appliedLevel==='Simple'?'Fewer notes and choices, with roomy rhythms.':recommendation.appliedLevel==='Advanced'?'Fuller phrases and more varied note and rhythm choices.':'A little more melodic and rhythmic variety while using the same controls.'}</span><strong>Keep the current six instruments</strong><span>Your selected set stays unchanged; other instruments remain available in Settings.</span><strong>Show note and playback names</strong><span>These labels give you shared words for the sounds without adding extra controls.</span></div><button className="parent-apply" onClick={apply}>{applied?<><Check size={18}/> {recommendation.appliedLevel} settings selected</>:<><Check size={18}/>Use these settings</>}</button><p role="status" className="parent-apply-status">{applied?`${recommendation.appliedLevel} selected for this child. Nothing is saved until you add the child.`:''}</p><p className="parent-guide-note"><Settings2 size={17}/> You can choose a different level now. Later, double-tap the top-right Settings button to change difficulty for each instrument, instrument choices, labels and sound levels.</p><p>{parentNote}</p></section>}
        {step===7&&<section><span className="parent-guide-icon"><Music size={27}/></span><p className="parent-guide-eyebrow">Explore the instruments</p><h3>Start a little band, one sound at a time.</h3><ul className="parent-feature-list"><li><Music/><span><strong>Tap a landscape instrument</strong> to start or stop its repeating part. Listen first, then invite your child to choose the next sound.</span></li><li><Users/><span><strong>Drag an instrument onto your child’s avatar</strong> to open its playable controls. Tap or hold the keys, pads, pipes or strings; drag it away or use the return control to put it down.</span></li></ul><p className="parent-guide-note">{musicNote}</p><p>{parentNote}</p></section>}
        {step===8&&<section><span className="parent-guide-icon"><Compass size={27}/></span><p className="parent-guide-eyebrow">Landscapes and listening</p><h3>Follow the sun and moon through changing keys.</h3><ul className="parent-feature-list"><li><Compass/><span><strong>Tap the sun or moon</strong> to move through the day, two night scenes and dawn. Each stop changes the musical key while active parts stay together.</span></li><li><Clock3/><span><strong>The metronome</strong> sits at bottom left. It keeps a quiet beat; open it for clicks, or move its weight to change tempo.</span></li><li><Settings2/><span><strong>Settings</strong> are behind the top-right button. Double-tap to choose instruments, complexity, labels and sound levels.</span></li></ul><p className="parent-guide-note">{musicNote}</p><p>{parentNote}</p></section>}
        {step===9&&<section><span className="parent-guide-icon"><Users size={27}/></span><p className="parent-guide-eyebrow">Practice together</p><h3>Turn listening into a small musical conversation.</h3><ul className="parent-feature-list"><li><Users/><span><strong>Double-tap your child’s avatar</strong> to enter the practice room. Choose an instrument and phrase; an equipped instrument is selected for you.</span></li><li><Music/><span><strong>Listen</strong> plays the phrase so you can hear it first. <strong>Learn</strong> highlights each complete note or chord and waits until its notes are played. <strong>Rhythm</strong> gives a count-in and repeats the note hints. <strong>Together</strong> adds a soft accompaniment while your child plays. Orange duration bars shrink with the remaining hold time. Next becomes available when the stage is completed; Together ends with Finish.</span></li><li><Play/><span><strong>You can stop, switch or leave at any time.</strong> The door or Escape returns to the landscape.</span></li></ul><p className="parent-guide-note">{musicNote}</p><p>{parentNote} Ask your child what they notice, then trade turns following and leading.</p></section>}
        {step===10&&<section><span className="parent-guide-icon"><Heart size={27}/></span><p className="parent-guide-eyebrow">Keep it human-sized</p><h3>Share the play, then take it off-screen.</h3><ul className="parent-care-list"><li>Sit together when possible. Let your child choose what to hear; copy a rhythm, name a sound, or take turns leading.</li><li>Keep sessions short and responsive. Pause for movement, conversation, outdoor play and rest; stop when attention or enjoyment fades.</li><li>There is no single screen-time amount that fits every family. Follow your pediatrician and local guidance, and be especially selective with screen use for children under 2.</li><li>If enthusiasm sticks, invite them to try a real instrument, borrow one, or meet a patient music teacher. The app is a doorway to musical play, not a replacement for making music together.</li></ul><p className="parent-guide-note"><Info size={17}/> FarmJam has no account or online profile. Adding this child saves their name, avatar and setup locally in this browser, not on a server.</p></section>}
      </main>
      {completionError&&<p className="parent-completion-error" role="alert">{completionError}</p>}
      <footer className="parent-guide-footer"><button className="parent-skip" onClick={onClose}>Cancel setup</button><div>{step>0&&<button className="parent-step-button" aria-label="Previous step" disabled={completing} onClick={()=>setStep(value=>value-1)}><ArrowLeft size={18}/>Back</button>}{step<STEPS.length-1?<button className="parent-step-button is-next" aria-label="Next step" disabled={step===3&&!name.trim()} onClick={()=>setStep(value=>value+1)}>Next<ArrowRight size={18}/></button>:<button className="parent-step-button is-next" disabled={completing} onClick={finish}><Check size={18}/>{completing?'Adding child…':'Add child'}</button>}</div></footer>
    </section>
  </div>;
}
