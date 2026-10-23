import React from 'react';
import {ART} from '../data/artStyle';

const cloudPaths=[
  'M0 0 C-23-19-5-49 20-45 C35-80 80-72 86-42 C120-51 141-19 121-1Z',
  'M0 0 C-24-15-7-44 16-37 C40-73 83-50 81-33 C117-42 137-16 116 0Z',
  'M0 0 C-20-24 7-45 24-41 C41-71 81-66 90-32 C130-42 144-12 120 0Z',
];


/** The landscape cloud path, with its original transform and attributes. */
export function CloudShape({index=0,x=0,y=0,stretch=1,scale=1,opacity=1}) {
  return <g className={`scenery-cloud-shape cloud-${index+1}`} style={{display:opacity>.08?undefined:'none'}} transform={`translate(${x} ${y}) scale(${stretch*scale} ${scale})`} opacity={opacity}><path d={cloudPaths[index]}/></g>;
}

/** Pure celestial artwork; the scene continues to own time and placement. */
export function CelestialArtwork({moon=false,radius=30,x=0,y=0,stretch=1,opacity=1,dusk=false,dawn=false}) {
  return <g className={`celestial-art ${moon ? 'is-moon' : 'is-sun'}`} transform={`translate(${x} ${y})`} opacity={opacity}>
      <g transform={`scale(${stretch} 1)`}>
        <circle className="celestial-halo" r={radius * 1.12} fill={ART.cream} opacity=".18" />
        {moon ? <g className="celestial-pulse"><path d={`M${radius * .52} ${-radius * .9} A${radius} ${radius} 0 1 0 ${radius * .74} ${radius * .55} A${radius * .78} ${radius * .78} 0 0 1 ${radius * .52} ${-radius * .9}Z`} fill={ART.cream} /></g> : <g className="celestial-pulse"><circle r={radius} fill={dusk ? ART.pink : dawn ? ART.cream : ART.gold} /></g>}
      </g>
    </g>;
}
