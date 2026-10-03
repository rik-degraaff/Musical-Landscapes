import React from 'react';
export function InstrumentArt({type}) {
  if(type==='piano') return <div className="piano-art"><div className="piano-lid"/><div className="piano-body"><div className="keys">{Array.from({length:10},(_,i)=><i key={i}/>)}</div><div className="black-keys">{[0,1,3,4,5,7,8].map(i=><b key={i} style={{left:`${8+i*8.5}%`}}/>)}</div></div></div>;
  if(type==='drums') return <div className="drums-art"><i className="drum-big"/><i className="drum-small one"/><i className="drum-small two"/><b className="cymbal"/></div>;
  if(type==='bass') return <div className="bass-art"><div className="bass-neck"/><div className="bass-head"/><div className="bass-body"><i/></div></div>;
  if(type==='melody') return <div className="trumpet-art"><div className="trumpet-tube"/><div className="trumpet-bell"/><div className="trumpet-valves"><i/><i/><i/></div></div>;
  if(type==='marimba') return <div className="marimba-art"><div className="marimba-bars">{Array.from({length:7},(_,i)=><i key={i}/>)}</div><div className="marimba-tubes"><i/><i/><i/><i/></div><b className="marimba-mallet one"/><b className="marimba-mallet two"/></div>;
  return <div className="flute-art"><div className="flute-mouthpiece"/><div className="flute-tube"/><div className="flute-keys">{Array.from({length:6},(_,i)=><i key={i}/>)}</div><div className="flute-joint"/></div>;
}
