import React,{useLayoutEffect,useRef,useState} from 'react';
import {SettingsButton,InstrumentActions} from './GameButtons';
import {InstrumentArt} from './InstrumentArt';
import {NoteParticles} from './NoteParticles';
import {YoungMusicianArt} from './YoungMusician';
import {GuideInstrumentSurface} from './GuideInstrumentSurface';
export {GuideInstrumentSurface} from './GuideInstrumentSurface';
import {GuidePracticePreview} from './GuidePracticePreview';
import {GuideSettingsPreview} from './GuideSettingsPreview';
import {guideOptions,instrumentDemonstration,gestureTrack,GUIDE_DURATION,GUIDE_ACTION_DURATION} from '../utils/guideDemonstrations';
import {cueControl,elementLocation} from './useDemonstrationTargets';
import {MetronomeArtwork} from './MetronomeArtwork';
import {GesturePointer,useGestureTimeline} from './GesturePointer';
import {guideGestureRoute} from '../utils/gestures';
import {CloudShape,CelestialArtwork} from '../scenes/SkyArt';
import {practiceProfile} from '../utils/practiceComposition';
import {INSTRUMENTS} from '../utils/music';
import './practice.css';
import './guide-illustration.css';

function useGuideLocations(host,options) {
  const {kind,instrument,gesture,focus,cue,registers}=options;
  const [measured,setMeasured]=useState(null);
  useLayoutEffect(()=>{
    const element=host.current;
    const measure=()=>{
      const bounds=element.getBoundingClientRect();
      const point=(selector,x=.5,y=.5,last=false)=>{
        const nodes=element.querySelectorAll(selector),node=nodes[last?nodes.length-1:0];
        const box=node?.getBoundingClientRect();
        return box?{x:(box.left-bounds.left+box.width*x)/bounds.width*100,y:(box.top-bounds.top+box.height*y)/bounds.height*100}:null;
      };
      let route=guideGestureRoute(options),secondary=guideGestureRoute({...options,secondary:true});
      if(kind==='band')route.from=point('.guide-band-0')??route.from;
      if(kind==='profile')route.from=point('.guide-avatar',.5,.35)??route.from;
      if(kind==='sun')route.from=point('.celestial-pulse')??route.from;
      if(kind==='weather')route.from=point('.scenery-cloud-shape')??route.from;
      if(kind==='metronome') {route.from=point('.metronome-rail',.5,64/168)??route.from;route.to=point('.metronome-rail',.5,0)??route.to;}
      if(kind==='settings')route.from=point(focus==='selectors'?'.settings-instrument select':focus==='sound'?'.settings-volume input':focus==='display'||focus==='caregiver'?'.settings-check input':gesture==='double-tap'?'.guide-settings-open button':'.complexity-simple')??route.from;
      if(kind==='settings'&&focus==='sound') {route.from=point('.settings-volume input',2/3)??route.from;route.to=point('.settings-volume input',.4)??route.to;}
      if(kind==='equip') {
        const source=element.querySelector('.guide-equip-source');
        route.from={x:7+source.offsetWidth/bounds.width*50,y:23+source.offsetHeight/bounds.height*50};
        route.to=point('.guide-avatar',.5,.5)??route.to;
      }
      if(kind==='surface') {
        const stringed=['guitar','ukulele'].includes(instrument);
        if(gesture==='swipe') {
          const selector=stringed?'.playable-string':'.panflute-pipe';
          route.from=point(selector,stringed?.85:.5,.5)??route.from;
          route.to=point(selector,stringed?.85:.5,.5,true)??route.to;
          if(stringed)secondary.from=point('.chord-control')??secondary.from;
        } else if(instrument==='flute') {
          route.from=point('.flute-key-Eb')??route.from;
          secondary.from=point('.flute-key-L1')??secondary.from;
        } else if(instrument==='melody') {
          route.from=point('.trumpet-embouchure',.5/registers)??route.from;
          secondary.from=point('.valve-control')??secondary.from;
        } else route.from=elementLocation(element,cueControl(element,cue))??route.from;
        if(focus)route.from=point(focus==='exit'?'.return-instrument':'.next-phrase')??route.from;
      }
      if(!['drag','swipe','tempo'].includes(gesture))route.to=route.from;
      secondary.to=secondary.from;
      setMeasured({route,secondary});
    };
    measure();const observer=new ResizeObserver(measure);observer.observe(element);
    return ()=>observer.disconnect();
  },[host,kind,instrument,gesture,focus,registers,JSON.stringify(cue)]);
  return measured??{route:guideGestureRoute(options),secondary:guideGestureRoute({...options,secondary:true})};
}

function Avatar({child,className=''}) {
  return <div className={`guide-avatar ${className}`}><YoungMusicianArt child={child}/></div>;
}

function Sky({weather=false,changed=false}) {
  return <svg className="guide-sky-art" viewBox="0 0 320 180" aria-hidden="true"><path d="M0 0H320V180H0Z" fill={weather?'#b8dce1':changed?'#344e68':'#9bd6eb'}/><CelestialArtwork moon={!weather&&changed} x={weather?270:165} y={weather?35:65} radius={weather?20:33}/>{weather&&<g fill={changed?'#718ba2':'#a4bcca'}><CloudShape x={55} y={94} index={0}/><CloudShape x={172} y={57} index={1} scale={.58}/></g>}<path d="M0 147Q70 115 150 145T320 139V180H0Z" fill="#a4bf8a"/><path d="M0 170Q100 143 194 161T320 154V180H0Z" fill="#85ad65"/></svg>;
}

/** All illustrated objects come from the same artwork and controls as play. */
export function GuideIllustration({kind='band',instrument='piano',child,stage='Listen',focus,gesture,demonstrating=false,speed=1,detail='simple',className=''}) {
  const host=useRef(null);
  const timing=useGestureTimeline({active:demonstrating,gesture,speed,iterations:1,duration:GUIDE_DURATION,resetKey:`${kind}:${instrument}:${stage}:${focus}:${detail}`});
  const options=guideOptions(child,instrument,detail);
  const profile=practiceProfile(instrument,'C',options);
  const elapsed=timing.elapsed*speed;
  const {route,secondary:secondaryRoute}=useGuideLocations(host,{kind,instrument,gesture,focus,cue:profile.phrases[0].events[0],registers:profile.registers});
  const frame=gestureTrack({gesture,elapsed,reduced:timing.reduced,...route,duration:gesture==='double-tap'?3000*speed:GUIDE_ACTION_DURATION});
  const demo=instrumentDemonstration({instrument,elapsed,reduced:timing.reduced,route,secondary:secondaryRoute,profile});
  const surface=kind==='surface'&&!focus;
  const hands=surface?demo.hands:[frame];
  const wind=surface&&['flute','melody'].includes(instrument);
  const hasRoute=['drag','swipe','tempo'].includes(gesture);
  const stringSwipe=gesture==='swipe'&&['guitar','ukulele'].includes(instrument);
  return <div ref={host} className={`guide-illustration guide-art-${kind} guide-instrument-${instrument} ${gesture?`guide-gesture-${gesture}`:''} ${wind?'guide-wind':''} ${stringSwipe?'guide-string-swipe':''} ${demonstrating?'is-demonstrating':''} ${className}`} data-guide-art={kind} aria-hidden="true">
    {['sun','weather'].includes(kind)?<Sky weather={kind==='weather'} changed={elapsed>=GUIDE_ACTION_DURATION*.26}/>:['practice-room','practice-stage'].includes(kind)?<GuidePracticePreview instrument={instrument} child={child} stage={stage} focus={focus} detail={kind==='practice-stage'} elapsed={elapsed} reduced={timing.reduced} options={options}/>:kind==='metronome'?<><MetronomeArtwork tempo={Math.round(104-frame.travel*64)}/><span className="guide-tempo-slower">Slower</span><span className="guide-tempo-faster">Faster</span></>:kind==='settings'?<GuideSettingsPreview instrument={instrument} focus={focus} elapsed={elapsed} progress={frame.travel} opened={gesture!=='double-tap'||elapsed>=1140}/>:kind==='profile'?<><Avatar child={child}/><div className="guide-profile-card"><strong>{child?.name??'Your child'}</strong><span>Avatar · instruments · preferences</span><div className="guide-profile-instruments">{['piano','guitar','drums'].map(type=><InstrumentArt key={type} type={type}/>)}</div></div></>:kind==='together'?<><Avatar child={child} className="guide-together-first"/><Avatar child={child} className="guide-together-second"/><div className="guide-together-instrument"><InstrumentArt type={instrument}/></div><span className="guide-together-turn">Your turn · My turn</span></>:kind==='surface'?<><div className="guide-surface-label">{INSTRUMENTS[instrument].label}</div><GuideInstrumentSurface instrument={instrument} options={options} cue={surface?demo.cue:null} practice={surface}/><div className={`guide-surface-toolbar guide-surface-focus-${focus}`} inert><strong>{INSTRUMENTS[instrument].label}</strong><InstrumentActions/></div></>:kind==='equip'?<><div className="guide-equip-source" style={{left:`${7+frame.x-route.from.x}%`,top:`${23+frame.y-route.from.y}%`,opacity:frame.opacity}}><InstrumentArt type={instrument}/></div><Avatar child={child}/><span className="guide-equip-destination"/></>:<><Avatar child={child}/>{['piano','guitar','drums','flute'].slice(0,child?.age==='8plus'?4:2).map((type,i)=><div className={`guide-band-instrument guide-band-${i}`} key={type}><InstrumentArt type={type}/>{i===0&&<NoteParticles active={elapsed>=GUIDE_ACTION_DURATION*.26}/>}</div>)}</>}
    {kind==='settings'&&gesture==='double-tap'&&<div className="guide-settings-open" inert><SettingsButton open={elapsed>=1140}/></div>}
    {gesture&&!['practice-room','practice-stage'].includes(kind)&&<>{hands.map((hand,index)=><GesturePointer key={index} frame={hand} percent className={`guide-pointer ${index?'guide-second-pointer':''}`}/>)}{hasRoute&&<><svg className="guide-motion-route" viewBox="0 0 100 100" preserveAspectRatio="none"><path d={`M${route.from.x} ${route.from.y}L${route.to.x} ${route.to.y}`}/></svg><span className="guide-motion-cue guide-start" style={{left:`${route.from.x}%`,top:`${route.from.y}%`}}>1</span><span className="guide-motion-cue guide-end" style={{left:`${route.to.x}%`,top:`${route.to.y}%`}}>2</span></>}{gesture==='double-tap'&&<span className="guide-contact-label">1 + 2</span>}{surface&&<span className="guide-action-caption">{demo.caption}</span>}</>}
  </div>;
}
