import React from 'react';
import {ART, ART_STROKE} from '../data/artStyle';
import './instrument-art.css';

/** Shared picture-book silhouettes. Playable keys and fingerings live in the real surfaces. */
export function InstrumentArt({type}) {
  return <svg className={`instrument-illustration illustration-${type}`} viewBox="0 0 160 125" aria-hidden="true" fill="none" stroke={ART.ink} strokeWidth={ART_STROKE.outline} strokeLinecap="round" strokeLinejoin="round">
    {type==='piano'&&<>
      <path d="M35 82v25m89-25v25" strokeWidth="7"/>
      <path d="M27 37Q44 13 85 16q42 0 48 35l-12 38H27Z" fill={ART.tealShade}/>
      <path d="M34 35Q58 22 85 23q27 0 36 17" stroke={ART.teal} strokeWidth={ART_STROKE.detail}/>
      <path d="M31 48h98v35H25V57Z" fill={ART.ink}/>
      <path d="M34 55h88v28H34Z" fill={ART.paper}/>
      {Array.from({length:12},(_,index)=><path key={index} d={`M${34+index*7.35} 56v26`} stroke={ART.softInk} strokeWidth="1"/>)}
      {[0,1,3,4,5,7,8,10].map(index=><rect key={index} x={38+index*7.35} y="55" width="5" height="17" rx="1" fill={ART.ink} stroke="none"/>)}
      <path d="M32 88h95" stroke={ART.gold} strokeWidth="3"/><path d="M69 94v6m9-6v6m9-6v6" stroke={ART.goldShade} strokeWidth="3"/>
    </>}
    {type==='drums'&&<>
      <g stroke={ART.softInk} strokeWidth="3"><path d="M25 34v61l-13 15m13-15l13 15M137 31v64l-13 15m13-15l13 15M50 56v43m62-43v43"/></g>
      <ellipse cx="25" cy="33" rx="22" ry="7" fill={ART.gold}/>
      <ellipse cx="137" cy="29" rx="20" ry="7" fill={ART.gold}/>
      <path d="M22 31q3-6 6 0m106-4q3-6 6 0" stroke={ART.goldShade} strokeWidth={ART_STROKE.detail}/>
      <path d="M45 43h28v25H45Zm44 0h28v25H89Z" fill={ART.coral}/>
      <ellipse cx="59" cy="43" rx="14" ry="7" fill={ART.cream}/><ellipse cx="103" cy="43" rx="14" ry="7" fill={ART.cream}/>
      <path d="M12 66h30v17H12Zm112-1h29v19h-29Z" fill={ART.coralShade}/>
      <ellipse cx="27" cy="66" rx="17" ry="8" fill={ART.cream}/><ellipse cx="138" cy="65" rx="17" ry="8" fill={ART.cream}/>
      <circle cx="81" cy="82" r="31" fill={ART.coral}/><circle cx="81" cy="82" r="25" fill={ART.cream} strokeWidth={ART_STROKE.detail}/><circle cx="81" cy="82" r="11" fill={ART.tealShade} stroke="none"/>
      <path d="M58 105l-8 9m54-9l8 9M75 116h13" stroke={ART.softInk} strokeWidth="3"/>
      <path d="M64 19l17 23m16-23L81 42" stroke={ART.woodShade} strokeWidth="3"/>
    </>}
    {type==='guitar'&&<g transform="rotate(18 80 62)">
      <path d="M73 51Q49 41 47 61q-1 10 8 15q-15 8-12 22q4 18 34 18q29 0 33-18q3-14-12-22q9-5 8-15q-2-20-25-10Z" fill={ART.wood}/>
      <path d="M72 12h11v56H72Z" fill={ART.brownShade}/>
      <path d="M69 5h17v21H69Z" fill={ART.woodShade}/>
      <path d="M68 10h-4m4 7h-4m4 7h-4m23-14h4m-4 7h4m-4 7h4" stroke={ART.softInk} strokeWidth="3"/>
      {[32,40,48,56].map(position=><path key={position} d={`M73 ${position}h9`} stroke={ART.cream} strokeWidth="1"/>)}
      <circle cx="77" cy="79" r="13" fill={ART.ink} stroke={ART.gold} strokeWidth="2"/>
      <path d="M64 101h26" stroke={ART.brownShade} strokeWidth="5"/>
      {Array.from({length:6},(_,index)=><path key={index} d={`M${73+index*1.65} 11v90`} stroke={ART.paper} strokeWidth=".65"/>)}
    </g>}
    {type==='ukulele'&&<g transform="rotate(-12 80 63)">
      <path d="M74 62Q57 54 55 69q-1 9 7 14q-13 7-12 18q1 15 30 15q27 0 29-15q1-11-12-18q8-5 7-14q-2-15-18-7Z" fill={ART.gold}/>
      <path d="M74 30h12v43H74Z" fill={ART.brownShade}/>
      <path d="M72 13Q80 10 88 13l-2 20H74Z" fill={ART.wood}/>
      {[18,27].map(position=><g key={position}><path d={`M72 ${position}h-5m21 0h5`} stroke={ART.softInk} strokeWidth="2"/><ellipse cx="66" cy={position} rx="3" ry="2" fill={ART.cream} strokeWidth={ART_STROKE.detail}/><ellipse cx="94" cy={position} rx="3" ry="2" fill={ART.cream} strokeWidth={ART_STROKE.detail}/></g>)}
      {[39,46,53,60,66].map(position=><path key={position} d={`M75 ${position}h10`} stroke={ART.cream} strokeWidth="1"/>)}
      <circle cx="80" cy="83" r="11" fill={ART.ink} stroke={ART.woodShade} strokeWidth="2"/>
      <path d="M69 102h22" stroke={ART.brownShade} strokeWidth="5"/>
      {Array.from({length:4},(_,index)=><path key={index} d={`M${76.5+index*2.3} 16v86`} stroke={ART.paper} strokeWidth=".8"/>)}
      <path d="M75 33h10" stroke={ART.cream} strokeWidth="2"/>
    </g>}
    {type==='melody'&&<g transform="rotate(-9 80 65)">
      <path d="M48 72v19h55q13 0 13-19" strokeWidth="11"/><path d="M48 72v19h55q13 0 13-19" stroke={ART.goldShade} strokeWidth="6"/>
      <path d="M19 61H109q14-2 31-20v50q-17-15-31-18H19Z" fill={ART.gold}/>
      <ellipse cx="140" cy="66" rx="9" ry="25" fill={ART.goldShade}/>
      <path d="M138 49q-6 17 0 34" stroke={ART.cream} strokeWidth={ART_STROKE.detail}/>
      {[57,73,89].map(position=><g key={position}><path d={`M${position} 44v35`} strokeWidth="8"/><path d={`M${position} 44v34`} stroke={ART.teal} strokeWidth="4"/><ellipse cx={position} cy="42" rx="7" ry="3" fill={ART.cream} strokeWidth={ART_STROKE.detail}/></g>)}
      <path d="M19 58H8v13h11" fill={ART.teal}/>
    </g>}
    {type==='marimba'&&<>
      <path d="M30 66v40m99-40v40M26 107h11m85 0h12" strokeWidth="4"/>
      {Array.from({length:9},(_,index)=><g key={index}><path d={`M${25+index*13} 62v${37-index*2}`} stroke={ART.goldShade} strokeWidth="7"/><rect x={18+index*13} y={32+index*2} width="12" height={38-index*2} rx="2" fill={index%2?ART.wood:ART.gold} strokeWidth={ART_STROKE.detail}/><circle cx={24+index*13} cy={45+index} r="1.5" fill={ART.woodShade} stroke="none"/></g>)}
      <path d="M41 28L63 63m41-37L82 62" stroke={ART.woodShade} strokeWidth="3"/><circle cx="39" cy="24" r="7" fill={ART.coral}/><circle cx="107" cy="22" r="7" fill={ART.teal}/>
    </>}
    {type==='flute'&&<g transform="rotate(-14 80 65)">
      <rect x="13" y="60" width="136" height="14" rx="6" fill={ART.teal}/>
      <path d="M19 64h120" stroke={ART.cream} strokeWidth={ART_STROKE.detail}/>
      <path d="M33 60v14m98-14v14m13-14v14" strokeWidth={ART_STROKE.detail}/>
      <ellipse cx="24" cy="65" rx="6" ry="3" fill={ART.ink} stroke="none"/>
      {[48,62,76,90,104,118].map((position,index)=><g key={position}><path d={`M${position} ${index%2?48:45}v18`} strokeWidth="3"/><ellipse cx={position} cy={index%2?48:45} rx="6" ry="5" fill={ART.cream} strokeWidth={ART_STROKE.detail}/></g>)}
      <path d="M45 78h67m8 0h15" stroke={ART.tealShade} strokeWidth="2"/>
    </g>}
    {type==='panflute'&&<g transform="rotate(-6 80 65)">
      {Array.from({length:8},(_,index)=>{
        const left=31+index*12;
        const top=24+Math.abs(index-3.5)*1.2;
        const bottom=109-index*5.5;
        return <g key={index}>
          <path d={`M${left} ${top}Q${left+6} ${top-5} ${left+12} ${top}v${bottom-top-5}q-6 8-12 0Z`} fill={ART.gold} strokeWidth={ART_STROKE.detail}/>
          <ellipse cx={left+6} cy={top} rx="5.5" ry="2.8" fill={ART.brownShade} stroke={ART.cream} strokeWidth={ART_STROKE.detail}/>
          <path d={`M${left+1} ${bottom-8}q5 3 10 0`} stroke={ART.goldShade} strokeWidth={ART_STROKE.detail}/>
        </g>;
      })}
      {[47,61].map(position=><path key={position} d={`M31 ${position}q48 7 96 0v5q-48 7-96 0Z`} fill={ART.woodShade} strokeWidth={ART_STROKE.detail}/>)}
      <path d="M75 50l9 6m0-6l-9 6m4-3l-3 13m3-13l7 11" stroke={ART.cream} strokeWidth="2"/>
    </g>}
  </svg>;
}
