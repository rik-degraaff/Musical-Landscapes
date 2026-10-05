import React, { useEffect, useRef, useState } from 'react';

function Tree({ x, y, size = 1, stretch = 1, color = '#397b59' }) {
  return <g transform={`translate(${x} ${y}) scale(${size * stretch} ${size})`}>
    <path d="M-7 0 L-4-105 L8-105 L12 0Z" fill="#805a49" />
    <path d="M1-64 L-28-92 M4-82 L31-118" fill="none" stroke="#805a49" strokeWidth="7" />
    <path d="M0-205 C-50-210-64-175-52-151 C-99-123-65-67-25-82 C-5-55 28-63 39-89 C90-84 97-139 56-151 C66-187 31-216 0-205Z" fill={color} />
    <path d="M-32-156 Q-44-191-8-190 M12-122 Q42-111 55-133" fill="none" stroke="#ffffff" strokeOpacity=".13" strokeWidth="12" strokeLinecap="round" />
  </g>;
}

export function LandscapeArt({ scene }) {
  const artRef=useRef(null);
  const [stretch, setStretch] = useState(() => 1440 * window.innerHeight / (900 * window.innerWidth));
  useEffect(() => {
    const resize = () => {
      const bounds=artRef.current.getBoundingClientRect();
      setStretch(1440*bounds.height/(900*bounds.width));
    };
    const observer=new ResizeObserver(resize);
    observer.observe(artRef.current);resize();
    return () => observer.disconnect();
  }, []);
  const night = scene === 'night';
  const pond = scene === 'pond';
  const garden = scene === 'garden';
  const dawn = scene === 'dawn';
  const dusk = scene === 'dusk';
  const palette = dusk ? ['#6c88a0','#efb09a','#87978b','#617f72','#3e685d'] : dawn ? ['#b8b6d5', '#f9c5a0', '#9eaaa1', '#829b7c', '#5c856a'] : night ? ['#232b4d', '#79768e', '#465c66', '#345b58', '#234b47'] : pond ? ['#9edbdc', '#f5eed0', '#8ab6a0', '#659d78', '#4d8965'] : garden ? ['#96d9e7', '#f9e9c9', '#a6c399', '#7fb27e', '#54946b'] : ['#8cd3ed', '#fff0ca', '#a4bf8a', '#85ad65', '#60914c'];
  return <svg ref={artRef} className="landscape-art" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id={`${scene}-sky`} x2="0" y2="1"><stop stopColor={palette[0]} /><stop offset="1" stopColor={palette[1]} /></linearGradient>
      <linearGradient id={`${scene}-ground`} x2=".3" y2="1"><stop stopColor={palette[3]} /><stop offset="1" stopColor={palette[4]} /></linearGradient>
      <linearGradient id={`${scene}-water`} x2="0" y2="1"><stop stopColor="#8bc7cb" /><stop offset="1" stopColor="#468f9b" /></linearGradient>
      <pattern id={`${scene}-grain`} width="37" height="31" patternUnits="userSpaceOnUse"><circle cx="8" cy="6" r=".8" fill="#fff" opacity=".12" /><circle cx="24" cy="20" r=".7" fill="#173d36" opacity=".1" /></pattern>
    </defs>
    <path fill={`url(#${scene}-sky)`} d="M0 0H1440V900H0Z" />
    {night ? <>
      {Array.from({ length: 42 }, (_, index) => <circle key={index} className="sky-star" cx={(index * 173 + 70) % 1400} cy={65 + (index * 67) % 310} r={index % 3 ? 1.7 : 3} fill="#fff5da" style={{ animationDelay: `${index % 5}s` }} />)}
    </> : <>
      {dusk && <g fill="#fff6d8" opacity=".7"><circle cx="210" cy="105" r="2.5"/><circle cx="420" cy="78" r="2"/><circle cx="800" cy="118" r="2.5"/><circle cx="1250" cy="90" r="2"/></g>}
      <g className="scenery-cloud" fill="#fffdf3" opacity=".75"><g transform={`translate(104 184) scale(${stretch} 1)`}><path d="M0 0 C-23-19-5-49 20-45 C35-80 80-72 86-42 C120-51 141-19 121-1Z" /></g><g transform={`translate(710 116) scale(${stretch} 1)`}><path d="M0 0 C-24-15-7-44 16-37 C40-73 83-50 81-33 C117-42 137-16 116 0Z" /></g><g transform={`translate(1290 275) scale(${stretch} 1)`}><path d="M0 0 C-20-24 7-45 24-41 C41-71 81-66 90-32 C130-42 144-12 120 0Z" /></g></g>
      <g fill="none" stroke="#638b93" strokeWidth="3" strokeLinecap="round"><path d="M415 142q10-12 20 0q10-12 20 0 M476 170q8-10 16 0q8-10 16 0" /></g>
    </>}
    <path d="M0 403 Q180 269 370 376 T750 378 T1120 349 T1440 366 V900H0Z" fill={palette[2]} />
    <path d="M0 482 Q220 332 474 463 Q699 521 923 417 T1440 481 V900H0Z" fill={palette[3]} />
    <g opacity=".6">{[0, 80, 148, 1270, 1340, 1440].map((position, index) => <Tree key={position} stretch={stretch} x={position} y={465 + index % 2 * 35} size={0.55 + index % 3 * 0.1} color={night ? '#3e5960' : '#6c9b7a'} />)}</g>
    <path d="M0 577 Q205 502 423 561 T940 532 T1440 559 V900H0Z" fill={`url(#${scene}-ground)`} />
    {!pond && <path d="M915 510 Q1040 623 750 709 Q604 766 641 900 H925 Q803 780 921 725 Q1152 618 945 510Z" fill={night ? '#6e7970' : '#ded4aa'} opacity=".7" />}
    {scene === 'farm' && <>
      <path d="M0 678Q262 580 535 640L331 900H0Z" fill="#adc168" /><path d="M0 730Q226 622 487 675 M0 791Q210 670 433 727 M0 853Q166 749 379 790" stroke="#6e944c" strokeWidth="13" fill="none" />
      <g transform={`translate(1055 448) scale(${stretch} 1)`}><path d="M-118 12H118V154H-118Z" fill="#cc6c59" /><path d="M-143 15L0-108L143 15Z" fill="#764a49" /><path d="M-111 15L0-79L111 15Z" fill="#dd8970" /><path d="M-41 154V58H41V154" fill="#854b43" stroke="#ffe3b9" strokeWidth="7" /><path d="M-37 63L37 150 M37 63L-37 150" stroke="#ffe3b9" strokeWidth="5" /><rect x="-17" y="-31" width="34" height="34" fill="#f3dba2" /><path d="M-110 36H-67 M66 36H110" stroke="#ecb091" strokeWidth="6" /></g>
      <g stroke="#fff0cf" strokeWidth="9" fill="none"><path d="M0 578Q235 537 458 583 M0 607Q235 566 458 612 M1170 587L1440 562 M1170 616L1440 591" />{[24, 91, 158, 225, 292, 359, 426, 1190, 1257, 1324, 1391].map(position => <path key={position} d={`M${position} ${position < 460 ? 550 + Math.abs(230 - position) / 14 : 565}v86`} />)}</g>
      <Tree stretch={stretch} x={95} y={626} size={1.15} color="#428362" />
    </>}
    {dawn && <>
      <path d="M0 605Q350 548 716 588T1440 585 M0 650Q310 601 620 638T1440 643" stroke="#f1e8d4" strokeWidth="16" opacity=".22" fill="none" />
      <g transform={`translate(1050 478) scale(${stretch * 0.8} .8)`}>
        <path d="M-125 20H125V155H-125Z" fill="#d5b997" /><path d="M-150 20L0-85L150 20Z" fill="#8e777b" />
        <path d="M-85 56h53v53h-53Z" fill="#e8d394" stroke="#967d67" strokeWidth="5" /><path d="M30 155V66H88V155Z" fill="#927d6b" />
        <path d="M-116 45H116M-116 123H116" stroke="#b69d84" strokeWidth="4" />
      </g>
      <g stroke="#d9c8a6" strokeWidth="7" fill="none"><path d="M160 665H635M160 698H635" />{[180,260,340,420,500,580,630].map(position => <path key={position} d={`M${position} 640v89`} />)}</g>
      <Tree stretch={stretch} x={120} y={625} size={1.35} color="#507a6a" /><Tree stretch={stretch} x={1340} y={594} size={1.4} color="#728f79" />
      <g fill="#c9d6b4" opacity=".55">{Array.from({ length: 16 }, (_, index) => <ellipse key={index} cx={50 + index * 85} cy={760 + index % 3 * 35} rx="3" ry="2" />)}</g>
    </>}
    {dusk && <>
      <path d="M0 669Q300 581 584 630T1440 604" stroke="#b7c5b0" strokeWidth="8" fill="none" opacity=".35"/>
      <g transform={`translate(1100 512) scale(${stretch * .85} .85)`}>
        <path d="M-84 0H84V111H-84Z" fill="#a59788"/><path d="M-104 4L0-66L104 4Z" fill="#56666a"/>
        <rect x="-55" y="36" width="35" height="34" fill="#f1d19a" stroke="#6a7465" strokeWidth="5"/><path d="M26 111V41h34v70" fill="#62776d"/>
        <path d="M-37 37v32m-16-16h31" stroke="#6a7465" strokeWidth="3"/>
      </g>
      <Tree stretch={stretch} x={100} y={625} size={1.5} color="#355c58"/><Tree stretch={stretch} x={1340} y={607} size={1.3} color="#456b62"/>
      <g stroke="#345b4e" strokeWidth="4" fill="none">{Array.from({length:14},(_,index)=><path key={index} d={`M${90+index*95} 877q-15-32-5-${50+index%3*12}m5 50q12-24 24-30`}/>)}</g>
      {Array.from({length:12},(_,index)=><circle key={index} className="firefly-light" cx={160+index*97} cy={685+(index*37)%150} r="2.5" fill="#f5db94" style={{animationDelay:`${index%4*.7}s`}}/>)}
    </>}
    {garden && <>
      <g transform={`translate(1040 441) scale(${stretch} 1)`}><rect x="-117" y="0" width="234" height="178" rx="5" fill="#f6dcae" /><path d="M-150 12L0-103L150 12Z" fill="#b76f66" /><path d="M-133 9L0-86L133 9" fill="none" stroke="#f4b394" strokeWidth="8" /><rect x="29" y="77" width="53" height="101" rx="24" fill="#68918c" /><circle cx="68" cy="132" r="4" fill="#f7d584" /><rect x="-84" y="47" width="62" height="62" rx="3" fill="#87bfcc" stroke="#fff6dc" strokeWidth="8" /><path d="M-53 49V108 M-82 78H-25" stroke="#fff6dc" strokeWidth="5" /><path d="M-100 118H-5L-13 140H-93Z" fill="#ba7366" /><g fill="#75935f"><circle cx="-82" cy="115" r="14" /><circle cx="-54" cy="114" r="17" /><circle cx="-28" cy="115" r="13" /></g></g>
      <Tree stretch={stretch} x={135} y={611} size={1.6} color="#4a8968" /><Tree stretch={stretch} x={1330} y={594} size={1.35} color="#6e9974" />
      <path d="M230 789Q415 699 576 770L581 820Q386 763 244 838Z" fill="#466d52" />
      {Array.from({ length: 18 }, (_, index) => <g key={index} transform={`translate(${255 + index * 17} ${780 + Math.sin(index) * 18})`}><path d="M0 0v-27m0 14q-15-16-17-1m17-7q15-16 18-4" fill="none" stroke="#40724e" strokeWidth="3" /><circle cy="-29" r="9" fill={['#f3a5a3', '#fff0b0', '#d8b7dd'][index % 3]} /><circle cy="-29" r="3" fill="#dc9955" /></g>)}
    </>}
    {pond && <>
      <path d="M404 579 Q692 525 1052 605 T1310 780 L1440 900 H198 Q260 719 404 579Z" fill="#afc99a" />
      <path d="M426 600 Q698 551 1037 621 T1285 791 L1390 900 H249 Q291 725 426 600Z" fill={`url(#${scene}-water)`} />
      <g className="pond-reflections" stroke="#d1eee2" strokeWidth="4" strokeLinecap="round" opacity=".45"><path d="M480 652h98 M843 684h110 M540 758h127 M1090 803h108 M759 857h143 M1025 730h47 M378 822h59" /></g>
      <g fill="#4f8e69"><ellipse cx="675" cy="787" rx="43" ry="13" /><ellipse cx="1030" cy="717" rx="35" ry="10" /><ellipse cx="1133" cy="846" rx="48" ry="14" /></g>
      <g fill="#f5c2cc"><path d="M659 785q-3-33 16-13q16-27 25 6Z" /><path d="M1017 715q-6-24 12-14q14-20 25 11Z" /></g>
      <Tree stretch={stretch} x={100} y={640} size={1.5} color="#477d65" /><Tree stretch={stretch} x={1345} y={610} size={1.15} color="#577f64" />
      <g stroke="#486f49" strokeWidth="5" fill="none">{[285, 311, 338, 362, 1202, 1231, 1254].map((position, index) => <path key={position} d={`M${position} 742q${index % 2 ? 23 : -20}-35 5-${65 + index % 3 * 18}`} />)}</g>
      <g stroke="#886e4c" strokeWidth="12" strokeLinecap="round"><path d="M290 658v22 M316 640v23 M343 627v24 M1207 635v28 M1259 647v23" /></g>
    </>}
    {night && <>
      <g fill="#283e46">{[80, 164, 250, 1210, 1300, 1400].map((position, index) => <path key={position} d={`M${position} ${310 + index % 2 * 50}l-68 178h40l-61 89h178l-61-89h40Z`} />)}</g>
      <g transform={`translate(1040 485) scale(${stretch} 1)`}><path d="M-115 0H115V159H-115Z" fill="#8d7068" /><path d="M-145 8L0-100L145 8Z" fill="#39454c" /><path d="M-110 29H110 M-110 61H110 M-110 93H110 M-110 125H110" stroke="#72595b" strokeWidth="5" /><rect x="-78" y="48" width="57" height="58" rx="2" fill="#f9d990" stroke="#51464d" strokeWidth="7" /><path d="M-49 49V104 M-77 77H-23" stroke="#51464d" strokeWidth="5" /><path d="M29 159V61Q56 30 83 61V159" fill="#51464d" /><path d="M72-56V-108H96V-36" fill="#72595b" /></g>
      <Tree stretch={stretch} x={190} y={625} size={1.4} color="#294f50" />
      {Array.from({ length: 17 }, (_, index) => <circle key={index} className="firefly-light" cx={90 + index * 76} cy={650 + (index * 59) % 210} r="3" fill="#f4dd8f" style={{ animationDelay: `${index % 4 * 0.6}s` }} />)}
    </>}
    <g fill={night ? '#6c8b76' : '#b7cd83'} opacity=".7">{Array.from({ length: 65 }, (_, index) => <path key={index} d={`M${index * 23} ${820 + (index * 31) % 80}l-4-12l8 9l5-14l-1 17Z`} />)}</g>
    <path fill={`url(#${scene}-grain)`} d="M0 0H1440V900H0Z" />
  </svg>;
}