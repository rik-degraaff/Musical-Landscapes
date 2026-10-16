import React,{useEffect,useState} from 'react';
import {BookOpen,Check,Download,Info} from 'lucide-react';
import {GUIDES,guideStatus} from '../utils/learning';
import {installationGuide,isInstalled} from '../utils/installation';
import {CaregiverDialog} from './CaregiverDialog';
import {GuideTopic} from './CaregiverHelp';
import {GestureDemo} from './GestureDemo';

export function GuideLibrary({learning,onOpen}) {
  return <div className="guide-library">{GUIDES.map(guide=>{
    const status=guideStatus(learning,guide);
    return <article className="guide-card" key={guide.id}>
      <h3>{guide.title}<span className={`guide-status ${status==='Read'?'is-read':''}`}>{status}</span></h3>
      <p>{guide.summary}</p><button onClick={()=>onOpen(guide.id)}><BookOpen size={17}/>Read {guide.title.toLowerCase()}</button>
    </article>;
  })}</div>;
}

function InstallationGuide() {
  const [guide]=useState(()=>installationGuide(navigator));
  const [installed,setInstalled]=useState(()=>isInstalled({standalone:navigator.standalone,displayMode:window.matchMedia('(display-mode: standalone)').matches}));
  const [prompt,setPrompt]=useState(null),[status,setStatus]=useState(''),[pending,setPending]=useState(false);
  useEffect(()=>{
    const before=event=>{event.preventDefault();setPrompt(event);};
    const done=()=>{setInstalled(true);setPrompt(null);setStatus('FarmJam is installed.');};
    window.addEventListener('beforeinstallprompt',before);window.addEventListener('appinstalled',done);
    return ()=>{window.removeEventListener('beforeinstallprompt',before);window.removeEventListener('appinstalled',done);};
  },[]);
  async function install() {
    if(!prompt||pending)return;
    setPending(true);
    try {await prompt.prompt();const choice=await prompt.userChoice;setStatus(choice.outcome==='accepted'?'Installation requested. Open FarmJam when it finishes.':'You can keep playing in the browser.');}
    catch {setStatus('Use the browser menu and the steps below to install.');}
    finally {setPrompt(null);setPending(false);}
  }
  return <section>
    <h3>Install FarmJam</h3><p>Optional: add an app icon and, where supported, a separate app window. You can also keep playing in the browser.</p>
    {installed&&<p className="parent-guide-note"><Check size={17}/>FarmJam is already running as an installed app.</p>}
    <ol className="parent-install-steps">{guide.steps.map(text=><li key={text}>{text}</li>)}</ol>
    {!installed&&prompt&&<button className="learning-action" disabled={pending} onClick={install}><Download size={17}/>{pending?'Opening installation…':'Install FarmJam'}</button>}
    <p role="status">{status}</p><p><a href={guide.installUrl} target="_blank" rel="noopener noreferrer">Official installation help for {guide.label}</a></p>
    <p className="parent-guide-note"><Info size={17}/>Profiles stay in this browser on this device. Switching browsers or app contexts may not carry them over. A bookmark is an alternative if installation is unavailable.</p>
    <h3>Offline play</h3><p>Let the app finish loading online before using it offline. To check readiness, disconnect and try reloading and playing. Device storage can be cleared by the browser or operating system; it is not a backup.</p>
    <h3>Keep your child in the app</h3><p>Installation and fullscreen do not prevent leaving FarmJam. FarmJam cannot enable device restrictions; a caregiver must configure and test them.</p>
    <h4>{guide.restriction.title}</h4><ol className="parent-restriction-steps">{guide.restriction.steps.map(text=><li key={text}>{text}</li>)}</ol>
    {guide.restriction.url&&<p><a href={guide.restriction.url} target="_blank" rel="noopener noreferrer">Official help: {guide.restriction.title}</a></p>}
    <p><a href={guide.restriction.searchUrl} target="_blank" rel="noopener noreferrer">Find instructions for {guide.restriction.title.toLowerCase()}</a></p>
  </section>;
}

export function TopicDemonstration({topic}) {
  if(topic==='instruments')return <GestureDemo gesture="drag"/>;
  if(topic==='practice')return <GestureDemo gesture="double-tap" target="avatar"/>;
  if(topic==='landscape')return <><GestureDemo target="weather" label="Tap a cloud to change the musical style"/><GestureDemo gesture="tempo" target="metronome"/></>;
  return null;
}

export function GuideReader({id,learning,familiarity,onOpen,onRead,onClose}) {
  const guide=GUIDES.find(value=>value.id===id);
  if(!guide)return <CaregiverDialog title="Guides" onClose={onClose} footer={<button onClick={onClose}>Back</button>}>
    <p>Explore a guide now or return whenever you like. Unread and New badges stay here until you choose Mark as read.</p>
    <GuideLibrary learning={learning} onOpen={onOpen}/>
  </CaregiverDialog>;
  return <CaregiverDialog key={guide.id} title={guide.title} onClose={onClose} footer={<><button onClick={()=>onOpen('index')}>All guides</button><button onClick={()=>{onRead(guide);onOpen('index');}}><Check size={17}/>Mark as read</button></>}>
    {guide.id==='installation'?<InstallationGuide/>:guide.id==='together'?<section><h3>Make music together</h3><ul className="parent-care-list"><li>Let your child choose a sound. Copy a rhythm or take turns leading.</li><li>Try a short musical question and answer. There is no need to read notes.</li><li>Pause when attention or enjoyment fades. Make room for movement, conversation and rest.</li><li>Take a favorite rhythm off screen: clap, sing, or try a real instrument together.</li></ul><p>Be especially selective with screen use for very young children and follow your family's professional guidance.</p></section>:<><GuideTopic topic={guide.id} familiarity={familiarity}/><TopicDemonstration topic={guide.id}/></>}
  </CaregiverDialog>;
}
