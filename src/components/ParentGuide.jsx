import React,{useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,Clock3,Compass,Heart,Info,Music,Play,Settings2,Users,X} from 'lucide-react';
import {loadParentProfile,recommendParentSettings,saveParentProfile} from '../utils/parentGuide';
import './parent-guide.css';

const STEPS=['Welcome','Your child','Music experience','Your familiarity','Recommended setup','Instruments','Landscapes and sound','Practice room','Play together'];
const AGE_OPTIONS=[['under3','Under 3'],['3to4','3–4'],['5to7','5–7'],['8plus','8+']];
const EXPERIENCE=[['new','Just starting'],['some','Has tried a little'],['familiar','Already plays or sings']];
const FAMILIARITY=[['new','New to music'],['some','Know a few basics'],['confident','Comfortable with music']];

export function ParentGuide({settings,onApply,onClose}) {
  const [step,setStep]=useState(0);
  const [profile,setProfile]=useState(()=>loadParentProfile(localStorage));
  const [applied,setApplied]=useState(false);
  const dialog=useRef(null);
  const closeRef=useRef(onClose);closeRef.current=onClose;
  const recommendation=recommendParentSettings(profile,settings);
  useEffect(()=>{
    const bodyTouchAction=document.body.style.touchAction;
    document.body.style.touchAction='pan-y';
    const previous=document.activeElement;
    dialog.current?.querySelector('button,select,input')?.focus();
    const keydown=event=>{
      if(event.key==='Escape'){event.preventDefault();closeRef.current();return;}
      if(event.key!=='Tab'||!dialog.current)return;
      const controls=[...dialog.current.querySelectorAll('button:not(:disabled),select,input')].filter(element=>element.getClientRects().length);
      const first=controls[0],last=controls.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    };
    window.addEventListener('keydown',keydown);
    return ()=>{window.removeEventListener('keydown',keydown);document.body.style.touchAction=bodyTouchAction;previous?.focus();};
  },[]);
  function update(key,value){setProfile(current=>({...current,[key]:value}));setApplied(false);}
  function finish(){saveParentProfile(localStorage,profile);onClose();}
  function apply(){onApply(recommendation.settings);saveParentProfile(localStorage,profile);setApplied(true);}
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
      <header className="parent-guide-head"><div><span className="parent-guide-kicker"><Heart size={15}/> A guide for grown-ups</span><h2 id="parent-guide-title">Set up FarmJam together</h2></div><button className="parent-guide-close" aria-label="Close parent guide" title="Close" onClick={onClose}><X size={21}/></button></header>
      <div className="parent-guide-progress" aria-label={`Step ${step+1} of ${STEPS.length}`}><div style={{'--guide-progress':`${(step+1)/STEPS.length*100}%`}}/><span>{step+1} / {STEPS.length}</span></div>
      <main className="parent-guide-content" key={step}>
        {step===0&&<section><span className="parent-guide-icon"><Users size={27}/></span><p className="parent-guide-eyebrow">A short orientation for parents and caregivers</p><h3>Make room for curiosity, not a perfect performance.</h3><p>FarmJam is a playful way to listen, explore sounds and try musical ideas together. This guide can suggest a gentle starting point and show where the app’s tools live.</p><p className="parent-guide-note"><Info size={17}/> Your answers stay on this device. We ask for age bands only, not your child’s name or birthday.</p></section>}
        {step===1&&<section><span className="parent-guide-icon"><Users size={27}/></span><p className="parent-guide-eyebrow">First, an age band</p><h3>How old is your child?</h3><p>Choose the closest range. This is only used to suggest a starting complexity, not to judge readiness.</p>{choice('age',AGE_OPTIONS,'Child age range')}</section>}
        {step===2&&<section><span className="parent-guide-icon"><Music size={27}/></span><p className="parent-guide-eyebrow">Their experience</p><h3>How familiar are they with music and instruments?</h3>{choice('music',EXPERIENCE,'Music experience')}{choice('instrument',EXPERIENCE,'Instrument experience')}<p className="parent-guide-note">Singing, dancing, tapping along or watching someone play all count as musical experience.</p></section>}
        {step===3&&<section><span className="parent-guide-icon"><Compass size={27}/></span><p className="parent-guide-eyebrow">Your comfort level</p><h3>How familiar are you with music?</h3>{choice('parent',FAMILIARITY,'Parent or caregiver familiarity')}<p className="parent-guide-note">{parentNote}</p></section>}
        {step===4&&<section><span className="parent-guide-icon"><Settings2 size={27}/></span><p className="parent-guide-eyebrow">A suggested starting setup</p><h3>{recommendation.level} is a good place to begin.</h3><p>{recommendation.explanation}</p><div className="parent-recommendation"><strong>{recommendation.level} for all instruments</strong><span>{recommendation.level==='Simple'?'Fewer notes and choices, with roomy rhythms.':'A little more melodic and rhythmic variety while using the same controls.'}</span><strong>Keep the current six instruments</strong><span>The familiar starter set stays selected; other instruments remain available in Settings.</span><strong>Show note and playback names</strong><span>These labels give you shared words for the sounds without adding extra controls.</span></div><button className="parent-apply" onClick={apply}>{applied?<><Check size={18}/> Recommended settings applied</>:<>Use these settings</>}</button><p className="parent-guide-note">{parentNote}</p></section>}
        {step===5&&<section><span className="parent-guide-icon"><Music size={27}/></span><p className="parent-guide-eyebrow">Explore the instruments</p><h3>Start a little band, one sound at a time.</h3><ul className="parent-feature-list"><li><Music/><span><strong>Tap a landscape instrument</strong> to start or stop its repeating part. Listen first, then invite your child to choose the next sound.</span></li><li><Users/><span><strong>Drag an instrument onto the girl</strong> to open its playable controls. Tap or hold the keys, pads, pipes or strings; drag it away or use the return control to put it down.</span></li></ul><p className="parent-guide-note">{musicNote}</p><p>{parentNote}</p></section>}
        {step===6&&<section><span className="parent-guide-icon"><Compass size={27}/></span><p className="parent-guide-eyebrow">Landscapes and listening</p><h3>Follow the sun and moon through changing keys.</h3><ul className="parent-feature-list"><li><Compass/><span><strong>Tap the sun or moon</strong> to move through the day, two night scenes and dawn. Each stop changes the musical key while active parts stay together.</span></li><li><Clock3/><span><strong>The metronome</strong> sits at bottom left. It keeps a quiet beat; open it for clicks, or move its weight to change tempo.</span></li><li><Settings2/><span><strong>Settings</strong> are behind the top-right menu. Double-tap to choose instruments, complexity, labels and sound levels.</span></li></ul><p className="parent-guide-note">{musicNote}</p><p>{parentNote}</p></section>}
        {step===7&&<section><span className="parent-guide-icon"><Users size={27}/></span><p className="parent-guide-eyebrow">Practice together</p><h3>Turn listening into a small musical conversation.</h3><ul className="parent-feature-list"><li><span><strong>Double-tap the girl</strong> to enter the practice room. Choose an instrument and phrase; an equipped instrument is selected for you.</span></li><li><span><strong>Learn</strong> waits for one correct note at a time. <strong>Rhythm</strong> gives a count-in and repeats the note hints. <strong>Together</strong> adds a soft accompaniment that changes phrases while your child plays.</span></li><li><span><strong>You can stop, switch or leave at any time.</strong> The door or Escape returns to the landscape.</span></li></ul><p className="parent-guide-note">{musicNote}</p><p>{parentNote} Ask your child what they notice, then trade turns following and leading.</p></section>}
        {step===8&&<section><span className="parent-guide-icon"><Heart size={27}/></span><p className="parent-guide-eyebrow">Keep it human-sized</p><h3>Share the play, then take it off-screen.</h3><ul className="parent-care-list"><li>Sit together when possible. Let your child choose what to hear; copy a rhythm, name a sound, or take turns leading.</li><li>Keep sessions short and responsive. Pause for movement, conversation, outdoor play and rest; stop when attention or enjoyment fades.</li><li>There is no single screen-time amount that fits every family. Follow your pediatrician and local guidance, and be especially selective with screen use for children under 2.</li><li>If enthusiasm sticks, invite them to try a real instrument, borrow one, or meet a patient music teacher. The app is a doorway to musical play, not a replacement for making music together.</li></ul><p className="parent-guide-note"><Info size={17}/> FarmJam has no account or online profile for these setup answers. They are stored locally in this browser.</p></section>}
      </main>
      <footer className="parent-guide-footer"><button className="parent-skip" onClick={onClose}>Skip guide</button><div>{step>0&&<button className="parent-step-button" aria-label="Previous step" onClick={()=>setStep(value=>value-1)}><ArrowLeft size={18}/>Back</button>}{step<STEPS.length-1?<button className="parent-step-button is-next" aria-label="Next step" onClick={()=>setStep(value=>value+1)}>Next<ArrowRight size={18}/></button>:<button className="parent-step-button is-next" onClick={finish}><Play size={18}/>Ready to play</button>}</div></footer>
    </section>
  </div>;
}
