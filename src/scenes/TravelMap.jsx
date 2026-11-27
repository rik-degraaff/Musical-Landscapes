import React,{useLayoutEffect,useRef,useState} from 'react';
import {X} from 'lucide-react';
import {ENVIRONMENTS,HOME_ENVIRONMENT} from '../data/environments';
import {BikeRider,MAP_DESTINATIONS,MAP_HEIGHT,MAP_WIDTH,TravelMapArt} from './TravelMapArt';
import './travel-map.css';

const RIDE_TIME=1550;
const FOLD_TIME=440;

export function TravelMap({child,environment,onDepart,onArrive,onClose}) {
  const [origin]=useState(environment);
  const [phase,setPhase]=useState('opening');
  const [destination,setDestination]=useState(null);
  const dialog=useRef(null);
  const closeButton=useRef(null);
  const road=useRef(null);
  const rider=useRef(null);
  const actions=useRef(null);
  actions.current={onArrive,onClose};

  useLayoutEffect(()=>{
    const element=dialog.current;
    element.showModal();
    closeButton.current.focus({preventScroll:true});
    return ()=>element.close();
  },[]);

  useLayoutEffect(()=>{
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    if(phase==='opening'||phase==='closing'){
      const finish=()=>phase==='opening'?setPhase('ready'):actions.current.onClose();
      const timeout=window.setTimeout(finish,motion.matches?0:FOLD_TIME);
      return ()=>window.clearTimeout(timeout);
    }
  },[phase]);

  useLayoutEffect(()=>{
    const path=road.current;
    const marker=rider.current;
    const length=path.getTotalLength();
    const forward=origin===HOME_ENVIRONMENT;
    const place=progress=>{
      const point=path.getPointAtLength(length*(forward?progress:1-progress));
      marker.style.left=`${point.x/MAP_WIDTH*100}%`;
      marker.style.top=`${point.y/MAP_HEIGHT*100}%`;
    };
    if(phase==='opening'){place(0);return;}
    if(phase!=='riding')return;
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    const start=performance.now();
    let frame;
    const advance=now=>{
      const progress=motion.matches?1:Math.min(1,(now-start)/RIDE_TIME);
      place(progress*progress*(3-2*progress));
      if(progress<1)frame=requestAnimationFrame(advance);
      else {
        setPhase('closing');
        actions.current.onArrive(destination);
      }
    };
    frame=requestAnimationFrame(advance);
    return ()=>cancelAnimationFrame(frame);
  },[phase,origin,destination]);

  function depart(id) {
    if(phase!=='ready'||id===origin)return;
    onDepart();
    setDestination(id);
    setPhase('riding');
  }

  const close=()=>setPhase('closing');
  const moving=phase==='riding';
  return <dialog ref={dialog} className="travel-map-dialog" aria-labelledby="travel-map-title" data-phase={phase}
    onCancel={event=>{event.preventDefault();close();}}>
    <div className="travel-map-paper" style={{'--fold-time':`${FOLD_TIME}ms`,'--map-aspect':MAP_WIDTH/MAP_HEIGHT}}>
      <div className="travel-map-sheet" aria-hidden="true">
        {[0,1,2].map(panel=><div className="travel-map-fold" key={panel} style={{'--panel':panel}}>
          <TravelMapArt roadRef={panel===1?road:undefined}/>
        </div>)}
      </div>
      <div className="travel-map-content">
        <h2 id="travel-map-title">Travel map</h2>
        <button ref={closeButton} type="button" className="travel-map-close" aria-label="Close travel map" onClick={close}><X size={24}/></button>
        {Object.entries(MAP_DESTINATIONS).map(([id,{x,y}])=><button type="button" className="travel-map-place" key={id}
          style={{left:`${x/MAP_WIDTH*100}%`,top:`${y/MAP_HEIGHT*100}%`}}
          aria-current={id===environment?'location':undefined} aria-disabled={id===origin||phase!=='ready'}
          onClick={()=>depart(id)}><span>{ENVIRONMENTS[id].name}</span></button>)}
        <div ref={rider} className="travel-map-rider" data-direction={origin===HOME_ENVIRONMENT?'right':'left'} aria-hidden="true">
          <BikeRider child={child} travelling={moving}/>
        </div>
        <p className="travel-map-caption" role="status">{moving?`Riding to the ${ENVIRONMENTS[destination].name}…`:phase==='closing'&&environment!==origin?`Arrived at the ${ENVIRONMENTS[environment].name}`:'Choose where to ride'}</p>
      </div>
    </div>
  </dialog>;
}
