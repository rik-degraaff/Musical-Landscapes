import React,{useLayoutEffect,useRef,useState} from 'react';

/** Keep the game's viewport and responsive CSS; fit the entire view into its guide.
 * The transformed, contained canvas also traps any fixed-position descendants.
 */
export function ScaledGamePreview({children}) {
  const host=useRef(null);
  const [size,setSize]=useState(null);
  useLayoutEffect(()=>{
    const measure=()=>{
      const box=host.current.getBoundingClientRect();
      const width=window.innerWidth,height=window.innerHeight;
      setSize({width,height,scale:Math.min(box.width/width,box.height/height)});
    };
    measure();const observer=new ResizeObserver(measure);observer.observe(host.current);
    window.addEventListener('resize',measure);
    return ()=>{observer.disconnect();window.removeEventListener('resize',measure);};
  },[]);
  return <div ref={host} className="guide-practice-preview" inert aria-hidden="true">{size&&<div className="app-shell guide-practice-canvas" style={{width:size.width,height:size.height,transform:`translate(-50%,-50%) scale(${size.scale})`}}>{children}</div>}</div>;
}
