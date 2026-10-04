import React, { useId } from 'react';
import './instrument-art.css';

export function InstrumentArt({type}) {
  const id=useId().replace(/:/g,'');
  return <svg className={`instrument-illustration illustration-${type}`} viewBox="0 0 160 125" aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id={`${id}-brass`} x2=".3" y2="1"><stop stopColor="#fff0a0"/><stop offset=".5" stopColor="#dfb756"/><stop offset="1" stopColor="#af8138"/></linearGradient>
      <linearGradient id={`${id}-silver`} x2="0" y2="1"><stop stopColor="#f8faf0"/><stop offset=".45" stopColor="#c3d7ce"/><stop offset="1" stopColor="#759994"/></linearGradient>
      <linearGradient id={`${id}-wood`} x2="1" y2=".2"><stop stopColor="#ce9a60"/><stop offset=".5" stopColor="#f4d49b"/><stop offset="1" stopColor="#b67d46"/></linearGradient>
    </defs>
    {type==='piano'&&<>
      <path d="M34 82v24m92-24v24" stroke="#344b4c" strokeWidth="8"/>
      <path d="M27 36Q44 10 86 14q43 0 49 36l-13 40H27Z" fill="#3d5555" stroke="#2e4345" strokeWidth="3"/>
      <path d="M31 34Q57 19 86 19q28 0 39 22" stroke="#69827c" strokeWidth="3"/>
      <path d="M32 47h98v36H24V56Z" fill="#243e40"/>
      <path d="M34 55h88v28H34Z" fill="#f9f0d9" stroke="#20383a" strokeWidth="2"/>
      {Array.from({length:12},(_,index)=><path key={index} d={`M${34+index*7.35} 56v26`} stroke="#b6bcb0" strokeWidth="1"/>)}
      {[0,1,3,4,5,7,8,10].map(index=><rect key={index} x={38+index*7.35} y="55" width="5" height="17" rx="1" fill="#253d3d"/>)}
      <path d="M32 88h95" stroke="#b7935a" strokeWidth="3"/><path d="M69 93v6m9-6v6m9-6v6" stroke="#c5a063" strokeWidth="3"/>
    </>}
    {type==='drums'&&<>
      <g stroke="#809b95" strokeWidth="3"><path d="M25 34v61l-13 15m13-15l13 15M137 31v64l-13 15m13-15l13 15M50 56v43m62-43v43"/></g>
      <ellipse cx="25" cy="33" rx="22" ry="7" fill={`url(#${id}-brass)`} stroke="#a98b43" strokeWidth="2"/>
      <ellipse cx="137" cy="29" rx="20" ry="7" fill={`url(#${id}-brass)`} stroke="#a98b43" strokeWidth="2"/>
      <path d="M45 43h28v25H45Zm44 0h28v25H89Z" fill="#c87862" stroke="#915b50" strokeWidth="2"/>
      <ellipse cx="59" cy="43" rx="14" ry="7" fill="#f2e7ce" stroke="#8da89b" strokeWidth="3"/><ellipse cx="103" cy="43" rx="14" ry="7" fill="#f2e7ce" stroke="#8da89b" strokeWidth="3"/>
      <path d="M12 66h30v17H12Zm112 0h29v18h-29Z" fill="#bf7b64"/>
      <ellipse cx="27" cy="66" rx="17" ry="8" fill="#f2e7ce" stroke="#8da89b" strokeWidth="3"/><ellipse cx="138" cy="65" rx="17" ry="8" fill="#f2e7ce" stroke="#8da89b" strokeWidth="3"/>
      <circle cx="81" cy="82" r="31" fill="#c3715d" stroke="#81564f" strokeWidth="3"/><circle cx="81" cy="82" r="25" fill="#e9e5d0" stroke="#a1b6a6" strokeWidth="4"/><circle cx="81" cy="82" r="19" fill="#466761"/>
      <path d="M58 105l-8 9m54-9l8 9M75 116h13" stroke="#728c83" strokeWidth="3"/>
      <path d="M64 19l17 23m16-23L81 42" stroke="#e2c795" strokeWidth="3"/>
    </>}
    {type==='guitar'&&<g transform="rotate(18 80 60)">
      <path d="M71 65Q45 53 45 75q0 11 9 15q-16 9-12 25q4 19 35 19q31 0 35-19q4-16-12-25q9-4 9-15q0-22-27-10Z" transform="translate(0 -17)" fill={`url(#${id}-wood)`} stroke="#986e48" strokeWidth="3"/>
      <path d="M72 11h11v67H72Z" fill="#665449" stroke="#a08661" strokeWidth="2"/>
      <path d="M69 4h17v20H69Z" fill="#b1895b" stroke="#8e6d48" strokeWidth="2"/>
      <path d="M67 8h-4m4 6h-4m4 6h-4m25-12h4m-4 6h4m-4 6h4" stroke="#b7c4b6" strokeWidth="3"/>
      {[29,37,45,53,61].map(position=><path key={position} d={`M73 ${position}h9`} stroke="#c2bea4" strokeWidth="1"/>)}
      <circle cx="77" cy="80" r="12" fill="#444d40" stroke="#ab7f50" strokeWidth="3"/><circle cx="77" cy="80" r="14" stroke="#f4d69a" strokeWidth="1"/>
      <path d="M64 104h26" stroke="#775740" strokeWidth="5"/>
      {Array.from({length:6},(_,index)=><path key={index} d={`M${73+index*1.65} 9v94`} stroke="#ece1b9" strokeWidth=".6"/>)}
    </g>}
    {type==='melody'&&<g transform="rotate(-9 80 65)">
      <path d="M19 61H109q14-2 31-20v50q-17-15-31-18H19Z" fill={`url(#${id}-brass)`} stroke="#a58443" strokeWidth="3"/>
      <ellipse cx="140" cy="66" rx="9" ry="25" fill="#94713c" stroke="#f0d88c" strokeWidth="4"/>
      <path d="M48 72v19h55q13 0 13-19" stroke="#a6813f" strokeWidth="10"/><path d="M48 72v19h55q13 0 13-19" stroke="#e9c970" strokeWidth="5"/>
      {[57,73,89].map(position=><g key={position}><path d={`M${position} 44v35`} stroke="#a8bcb0" strokeWidth="8"/><ellipse cx={position} cy="42" rx="7" ry="3" fill="#ecedd7" stroke="#82998c" strokeWidth="2"/></g>)}
      <path d="M19 58H8v13h11" fill="#b7c7b9" stroke="#869c92" strokeWidth="2"/>
    </g>}
    {type==='marimba'&&<>
      <path d="M30 66v40m99-40v40M26 107h11m85 0h12" stroke="#6a7965" strokeWidth="4"/>
      {Array.from({length:9},(_,index)=><g key={index}><path d={`M${25+index*13} 62v${37-index*2}`} stroke="#b39363" strokeWidth="7"/><rect x={18+index*13} y={32+index*2} width="12" height={38-index*2} rx="2" fill={index%2?'#ca9760':'#dcb782'} stroke="#956d46" strokeWidth="1.5"/><circle cx={24+index*13} cy={45+index} r="1.5" fill="#816743"/></g>)}
      <path d="M41 28L63 63m41-37L82 62" stroke="#a8916e" strokeWidth="3"/><circle cx="39" cy="24" r="7" fill="#d48b72"/><circle cx="107" cy="22" r="7" fill="#80a9ad"/>
    </>}
    {type==='flute'&&<g transform="rotate(-14 80 65)">
      <rect x="13" y="60" width="136" height="14" rx="6" fill={`url(#${id}-silver)`} stroke="#72918c" strokeWidth="2"/>
      <path d="M33 60v14m98-14v14m13-14v14" stroke="#6e8f87" strokeWidth="3"/>
      <ellipse cx="24" cy="65" rx="6" ry="3" fill="#476a64"/>
      {[48,62,76,90,104,118].map((position,index)=><g key={position}><path d={`M${position} ${index%2?48:45}v18`} stroke="#71968c" strokeWidth="3"/><ellipse cx={position} cy={index%2?48:45} rx="6" ry="5" fill={`url(#${id}-silver)`} stroke="#70938b" strokeWidth="1.5"/></g>)}
      <path d="M45 78h67m8 0h15" stroke="#adc6b8" strokeWidth="2"/>
    </g>}
  </svg>;
}
