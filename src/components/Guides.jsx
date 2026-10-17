import React,{useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,BookOpen,Check,Download,Play,RotateCcw} from 'lucide-react';
import {GUIDES,guideStatus} from '../utils/learning';
import {guidePages,guidePageNote} from '../utils/guidePages';
import {instrumentHelp} from '../utils/caregiverHelp';
import {INSTRUMENTS} from '../utils/music';
import {installationGuide} from '../utils/installation';
import {CaregiverDialog} from './CaregiverDialog';
import {GuideIllustration} from './GuideIllustration';
import './guides.css';

export function GuideLibrary({learning,onOpen}) {
  return <div className="guide-library">{GUIDES.map(guide=>{
    const status=guideStatus(learning,guide);
    return <article className="guide-card" key={guide.id}>
      <h3>{guide.title}<span className={`guide-status ${status==='Read'?'is-read':''}`}>{status}</span></h3>
      <p>{guide.summary}</p><button onClick={()=>onOpen(guide.id)}><BookOpen size={17}/>Read {guide.title.toLowerCase()}</button>
    </article>;
  })}</div>;
}

function InstallationPage({pageId,installation}) {
  const [deviceGuide]=useState(()=>installationGuide(typeof navigator==='undefined'?{}:navigator));
  const {installed=false,available=false,status='',pending=false,install}=installation??{};
  if(pageId==='install')return <div className="guide-device-instructions">
    {installed&&<p className="guide-install-state"><Check size={17}/>FarmJam is already running as an installed app.</p>}
    <ol className="parent-install-steps">{deviceGuide.steps.map(text=><li key={text}>{text}</li>)}</ol>
    {!installed&&available&&<button className="learning-action" disabled={pending} onClick={install}><Download size={17}/>{pending?'Opening installation…':'Install FarmJam'}</button>}
    {status&&<p role="status">{status}</p>}
    <p><a href={deviceGuide.installUrl} target="_blank" rel="noopener noreferrer">Official installation help for {deviceGuide.label}</a></p>
  </div>;
  if(pageId==='restrict')return <div className="guide-device-instructions">
    <h4>{deviceGuide.restriction.title}</h4>
    <ol className="parent-restriction-steps">{deviceGuide.restriction.steps.map(text=><li key={text}>{text}</li>)}</ol>
    {deviceGuide.restriction.url&&<p><a href={deviceGuide.restriction.url} target="_blank" rel="noopener noreferrer">Official help: {deviceGuide.restriction.title}</a></p>}
    <p><a href={deviceGuide.restriction.searchUrl} target="_blank" rel="noopener noreferrer">Find instructions for {deviceGuide.restriction.title.toLowerCase()}</a></p>
  </div>;
  return null;
}

// Kept for consumers that embed a single topic illustration.
export function TopicDemonstration({topic,child}) {
  const props={instruments:{kind:'equip',gesture:'drag'},practice:{kind:'profile',gesture:'double-tap'},landscape:{kind:'sun',gesture:'tap'}}[topic];
  return props?<GuideIllustration {...props} child={child}/>:null;
}

function GuidePageArt({illustration,child,instrument}) {
  const visual=useRef(null);
  const [replay,setReplay]=useState(0);
  const [detail,setDetail]=useState('simple');
  const [speed,setSpeed]=useState(1);
  const animated=illustration.gesture||['practice-room','practice-stage'].includes(illustration.kind);
  const replayGesture=()=>{
    setReplay(value=>value+1);
    requestAnimationFrame(()=>visual.current?.querySelector('.guide-illustration')?.scrollIntoView({block:'start'}));
  };
  return <figure ref={visual} className="guide-task-visual">
    <GuideIllustration key={replay} {...illustration} instrument={instrument} child={child} detail={detail} speed={speed} demonstrating={replay>0}/>
    {animated&&<div className="guide-demo-controls"><button className="guide-replay" onClick={replayGesture}>{replay?<RotateCcw size={16}/>:<Play size={16}/>}<span>{replay?'Replay gesture':'Show gesture'}</span></button><label>Speed <select aria-label="Demonstration speed" value={speed} onChange={event=>setSpeed(Number(event.target.value))}><option value={1}>Gentle</option><option value={.75}>Slower</option></select></label></div>}
    {['surface','practice-stage'].includes(illustration.kind)&&<label className="guide-demo-detail">Controls <select aria-label="Demonstration controls" value={detail} onChange={event=>setDetail(event.target.value)}><option value="simple">Simple</option>{child&&<option value="child">{child.name}'s controls</option>}</select></label>}
  </figure>;
}

export function GuideReader({id,learning,familiarity,child,onOpen,onRead,onClose,installation,saveError,onRetry}) {
  const guide=GUIDES.find(value=>value.id===id);
  const pages=guidePages(id);
  const [location,setLocation]=useState({id,index:0});
  const [instrument,setInstrument]=useState('piano');
  const heading=useRef(null);
  const index=location.id===id?Math.min(location.index,Math.max(0,pages.length-1)):0;
  const page=pages[index];
  const last=index===pages.length-1;
  const go=next=>setLocation({id,index:next});
  useEffect(()=>{
    const frame=requestAnimationFrame(()=>{
      heading.current?.focus();
      const content=heading.current?.closest('.parent-guide-content');
      if(content)content.scrollTop=0;
    });
    return ()=>cancelAnimationFrame(frame);
  },[id,index]);
  const read=guide&&!saveError&&guideStatus(learning,guide)==='Read';
  const playing=page?.id==='surface'?instrumentHelp(instrument,familiarity):null;
  const illustration=playing?{...page.illustration,gesture:['guitar','ukulele','panflute'].includes(instrument)?'swipe':['flute','melody'].includes(instrument)?'hold':'tap'}:page?.illustration;
  const note=page?guidePageNote(page,familiarity):null;
  return <CaregiverDialog title={guide?.title??'Guides'} onClose={onClose} footer={guide&&page?<div className="guide-reader-footer">
    <button onClick={()=>onOpen('index')}>All guides</button>
    <nav aria-label="Guide pages" className="guide-page-buttons">
      <button disabled={index===0} onClick={()=>go(index-1)}><ArrowLeft size={17}/>Back</button>
      {last?<button className="is-next" disabled={read} onClick={()=>onRead(guide)}><Check size={17}/>{read?'Read':'Mark as read'}</button>:<button className="is-next" onClick={()=>go(index+1)}>Next<ArrowRight size={17}/></button>}
    </nav>
  </div>:<button onClick={onClose}>Close guides</button>}>
    {saveError&&<div className="guide-save-error" role="alert"><p>{typeof saveError==='string'?saveError:'Guide progress could not be saved on this device.'}</p>{onRetry&&<button className="learning-action" onClick={onRetry}>Retry saving</button>}</div>}
    {!guide||!page?<>
      <p className="guide-library-intro" ref={heading} tabIndex={-1}>Choose any guide. You can leave, revisit pages or jump ahead whenever you like. Reading never changes what your child can play.</p>
      <GuideLibrary learning={learning} onOpen={onOpen}/>
    </>:<>
      <div className="guide-page-picker">
        <label htmlFor="guide-page-jump">Page <select id="guide-page-jump" aria-label="Choose a guide page" value={index} onChange={event=>go(Number(event.target.value))}>{pages.map((value,number)=><option key={value.id} value={number}>{number+1}. {value.title}</option>)}</select></label>
        <span>{index+1} of {pages.length}</span>
      </div>
      <p className="guide-page-announcement" role="status" aria-live="polite" aria-atomic="true">{page.title}. Page {index+1} of {pages.length}.</p>
      <section key={`${id}-${page.id}`} className={`guide-task ${page.illustration?'has-illustration':'guide-text-page'}`} data-guide-page={page.id}>
        <div className="guide-task-copy">
          <h3 ref={heading} tabIndex={-1}>{page.title}</h3>
          {page.paragraphs.map(text=><p key={text}>{text}</p>)}
          {playing&&<><label className="guide-instrument-picker">Instrument <select aria-label="Guide instrument" value={instrument} onChange={event=>setInstrument(event.target.value)}>{Object.entries(INSTRUMENTS).map(([name,value])=><option key={name} value={name}>{value.label}</option>)}</select></label><p>{playing.action}</p><p>{playing.note}</p></>}
          {note&&<p className="guide-explanation">{note}</p>}
          {id==='installation'&&<InstallationPage pageId={page.id} installation={installation}/>}
          {id==='together'&&<p>Keep screen use brief and responsive to your child, especially for very young children. Follow your family’s professional guidance.</p>}
          {last&&<p className="guide-read-note">{read?'This guide is marked as read.':'Mark as read saves a reminder for you. You can return to every page at any time.'}</p>}
        </div>
        {illustration&&<GuidePageArt illustration={illustration} instrument={instrument} child={child}/>}
      </section>
    </>}
  </CaregiverDialog>;
}

