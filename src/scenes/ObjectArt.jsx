import React from 'react';
import { ART, ART_STROKE } from '../data/artStyle';
import { VisitorArt } from './VisitorArt';

const Detail = ({ children, ...props }) => <g strokeWidth={ART_STROKE.detail} {...props}>{children}</g>;
const Eye = ({ x, y, r = 3.5 }) => <g stroke="none"><circle cx={x} cy={y} r={r} fill={ART.ink} /><circle cx={x + 1} cy={y - 1} r={r * .3} fill={ART.paper} /></g>;

// All objects share a 160 × 140 illustration space. Perch contact points are
// authored geometry: bird (65,102)/(82,102), owl (62,126)/(95,126).
export function ObjectArt({ type }) {
  return <svg viewBox="0 0 160 140" className={`object-art art-${type}`} aria-hidden="true" fill="none" stroke={ART.ink} strokeWidth={ART_STROKE.outline} strokeLinecap="round" strokeLinejoin="round">
    <VisitorArt type={type} />
    {type === 'bat' && <>
      <g className="bat-wings" fill={ART.violet}>
        <path d="M75 72Q46 26 8 39Q26 52 17 80Q37 64 44 91Q59 72 72 96Z" /><path d="M85 72Q114 26 152 39Q134 52 143 80Q123 64 116 91Q101 72 88 96Z" />
        <Detail stroke={ART.violetShade}><path d="M72 77L24 47m48 32L43 83m45-6l48-30m-48 32l29 4" /></Detail>
      </g>
      <ellipse cx="80" cy="86" rx="16" ry="24" fill={ART.violetShade} />
      <path d="M65 61L61 33L77 50m6 0l16-17l-4 28" fill={ART.violet} />
      <Detail stroke={ART.pink}><path d="M65 48l2-9l6 12m14 0l6-12l-2 9" /></Detail>
      <ellipse cx="80" cy="66" rx="20" ry="18" fill={ART.violet} /><ellipse cx="80" cy="76" rx="10" ry="7" fill={ART.cream} stroke="none" />
      <Eye x={72} y={63} /><Eye x={88} y={63} /><path d="M76 72h8l-4 4Z" fill={ART.ink} stroke="none" /><Detail><path d="M73 81q7 5 14 0" /></Detail>
    </>}
    {type === 'hedgehog' && <>
      <path d="M35 104v20h12m47-20v20h12" stroke={ART.brownShade} strokeWidth="7" />
      <path d="M22 99L14 83L27 80L23 65L38 64L39 48L54 53L66 38L77 48L91 40L96 54L113 53L110 71L121 89L105 108H34Z" fill={ART.brownShade} />
      <Detail stroke={ART.wood}><path d="M35 83l6-13m9 28l8-14m0-16l8-14m7 42l7-14m7-14l7-12" /></Detail>
      <path d="M92 79Q110 64 120 85L148 102Q143 117 116 116H78Q70 96 92 79Z" fill={ART.cream} />
      <circle cx="109" cy="84" r="10" fill={ART.brown} /><circle cx="109" cy="84" r="5" fill={ART.pink} stroke="none" /><Eye x={126} y={96} /><ellipse cx="147" cy="104" rx="6" ry="4" fill={ART.ink} stroke="none" />
    </>}
    {type === 'cricket' && <>
      <path d="M54 89L30 68L18 119m67-30l28-29l24 59M55 105l-7 20h-21m61-20l10 20h24" stroke={ART.leafShade} strokeWidth="5" />
      <ellipse cx="73" cy="92" rx="34" ry="20" fill={ART.leaf} />
      <g className="cricket-wing"><path d="M44 89q21-33 47-7L60 106Z" fill={ART.gold} /><Detail stroke={ART.goldShade}><path d="M51 86l27 5m-23 3l16 5" /></Detail></g>
      <circle cx="106" cy="79" r="17" fill={ART.leaf} /><Eye x={113} y={74} />
      <Detail><path d="M110 62q12-36 27-36m-32 36q-5-32 9-45" /></Detail>
    </>}
    {type === 'airplane' && <>
      {/* The far wing and tailplane share a shallow up-right vanishing direction. */}
      <path d="M66 76L83 41Q85 37 91 38L103 40L88 77Z" fill={ART.goldShade} />
      <path d="M26 78L38 60L51 61L41 82Z" fill={ART.coralShade} />
      <path d="M22 83L15 48Q16 44 22 46L34 51L47 84Z" fill={ART.coral} />
      <path d="M20 83Q77 62 125 76Q144 81 137 94Q134 103 114 102L44 99Z" fill={ART.cream} />
      <path d="M70 74Q75 57 88 58Q102 58 106 75Z" fill={ART.teal} />
      <Detail stroke={ART.tealShade}><path d="M88 59v14" /></Detail>
      {/* Near wing repeats the far wing's taper, foreshortened in the same camera. */}
      <path d="M67 88L43 114Q40 119 47 120L62 121L99 91Z" fill={ART.gold} />
      <path d="M31 89L19 103L33 104L53 93Z" fill={ART.coral} />
      <path d="M122 78v23" stroke={ART.coral} strokeWidth="7" />
      <g className="airplane-propeller"><ellipse cx="141" cy="88" rx="3" ry="25" fill={ART.softInk} stroke="none" /><circle cx="141" cy="88" r="5" fill={ART.tealShade} /></g>
      <Detail stroke={ART.coralShade}><path d="M45 83h13" /></Detail>
    </>}
    {type === 'rooster' && <>
      <path d="M48 87Q2 69 20 31Q48 32 58 72Q22 43 31 20Q65 36 64 82" fill={ART.tealShade} />
      <ellipse cx="78" cy="86" rx="36" ry="30" fill={ART.gold} /><path className="rooster-wing" d="M61 74Q100 68 97 100Q62 107 61 74Z" fill={ART.coral} />
      <path d="M85 74Q92 62 90 44Q88 27 104 29Q123 31 119 53L106 88Z" fill={ART.cream} /><path d="M95 28Q89 12 99 13Q103 3 110 17Q124 5 124 24L117 35Z" fill={ART.coral} />
      <path d="M118 44L140 50L120 58Z" fill={ART.gold} /><Eye x={110} y={40} r={3} /><path d="M110 59Q123 81 104 77Z" fill={ART.coral} />
      <path d="M66 111v15m25-15v15m-27 0H53m13 0h11m12 0H78m11 0h13" stroke={ART.goldShade} strokeWidth="3" />
    </>}
    {type === 'chimes' && <>
      <path d="M25 18H138M80 19v15" stroke={ART.woodShade} strokeWidth="5" /><path d="M49 39Q80 25 111 39" stroke={ART.wood} strokeWidth="7" />
      <g className="chime-tubes">{[51,70,89,108].map((position,index) => <g key={position}><path d={`M${position} 40v${12 + index % 2 * 7}`} strokeWidth={ART_STROKE.detail} /><rect x={position-4} y={52 + index % 2 * 7} width="8" height={35 + index % 3 * 9} rx="3" fill={ART.teal} /></g>)}
      <path d="M80 37v78" strokeWidth={ART_STROKE.detail} /><ellipse cx="80" cy="87" rx="11" ry="4" fill={ART.wood} /><path d="M72 116h16l-3 18h-10Z" fill={ART.gold} /></g>
    </>}
    {type === 'moo' && <>
      <path d="M37 89v34h12V93m49-4v34h12V89" stroke={ART.brownShade} strokeWidth="7" /><path d="M119 68q24 8 16 32" stroke={ART.brownShade} strokeWidth="4" />
      <path d="M30 58q-12 23 1 44h77q18-16 8-39q-38-17-86-5Z" fill={ART.paper} /><path d="M50 57q-10 23 11 24q21-4 20-23 M101 69q-29 8-12 29h20" fill={ART.ink} stroke="none" />
      <path d="M19 56L9 36L30 42m12-1L55 31L55 57" fill={ART.pink} /><path d="M23 39l-4-12m23 11l5-12" stroke={ART.gold} strokeWidth="6" /><path d="M19 43Q33 32 47 43l2 36q-16 17-34-1Z" fill={ART.paper} /><ellipse cx="31" cy="78" rx="21" ry="14" fill={ART.pink} /><circle cx="23" cy="77" r="2.5" fill={ART.ink} stroke="none" /><circle cx="39" cy="77" r="2.5" fill={ART.ink} stroke="none" /><Eye x={23} y={55} r={2.5} /><Eye x={39} y={55} r={2.5} />
    </>}
    {type === 'tractor' && <>
      <path className="tractor-exhaust" d="M106 39q-9-9 1-16q12-7 5-16" stroke={ART.cream} strokeWidth="9" opacity=".7" /><path d="M27 102V56h46v46" fill={ART.teal} /><path d="M22 51h57" stroke={ART.gold} strokeWidth="7" /><path d="M77 68h48q14 0 14 17v23H56V89Z" fill={ART.coral} /><path d="M105 65V42" stroke={ART.ink} strokeWidth="6" /><Detail stroke={ART.coralShade}><path d="M117 80v16m8-16v16m8-13v13" /></Detail><path d="M31 57h37v27H31Z" fill={ART.paper} />
      <g className="tractor-wheel"><circle cx="42" cy="102" r="25" fill={ART.ink} /><circle cx="42" cy="102" r="14" fill={ART.gold} stroke="none" /><Detail stroke={ART.goldShade}><path d="M42 92v20m-10-10h20" /></Detail></g><g className="tractor-wheel"><circle cx="126" cy="110" r="17" fill={ART.ink} /><circle cx="126" cy="110" r="8" fill={ART.gold} stroke="none" /><Detail stroke={ART.goldShade}><path d="M126 105v10m-5-5h10" /></Detail></g>
    </>}
    {type === 'water' && <>
      <path d="M47 127V50q0-11 13-11h30q17 0 17 18v9" stroke={ART.ink} strokeWidth="18" /><path d="M47 127V50q0-11 13-11h30q17 0 17 18v9" stroke={ART.teal} strokeWidth="13" /><path d="M59 35V23m-17 0h34" stroke={ART.coral} strokeWidth="6" /><path d="M96 68h22" stroke={ART.ink} strokeWidth="8" /><path d="M97 68h20" stroke={ART.tealShade} strokeWidth="4" />
    </>}
    {type === 'bird' && <>
      <path d="M93 57l26-22l-2 40" fill={ART.blueShade} /><ellipse cx="78" cy="67" rx="35" ry="29" fill={ART.blue} /><path className="bird-wing" d="M77 57q-1 29 34 27q-12-28-34-27Z" fill={ART.blueShade} /><circle cx="49" cy="46" r="24" fill={ART.blue} /><path d="M25 48L9 54L27 60" fill={ART.gold} /><Eye x={42} y={43} r={4} /><path d="M65 91v11h-7m24-10v10h-7" stroke={ART.goldShade} strokeWidth="3" /><path d="M34 60Q49 70 64 60Q60 68 49 68Q39 68 34 60Z" fill={ART.cream} stroke="none" />
    </>}
    {type === 'frog' && <>
      <path d="M43 81Q14 78 17 113L32 121L47 107Z M117 81Q146 78 143 113L128 121L113 107Z" fill={ART.leafShade} /><ellipse cx="80" cy="86" rx="44" ry="32" fill={ART.leaf} /><circle cx="51" cy="53" r="20" fill={ART.leaf} /><circle cx="108" cy="53" r="20" fill={ART.leaf} /><circle cx="52" cy="51" r="12" fill={ART.cream} stroke="none" /><circle cx="107" cy="51" r="12" fill={ART.cream} stroke="none" /><Eye x={54} y={52} r={6} /><Eye x={105} y={52} r={6} /><ellipse className="frog-throat" cx="80" cy="100" rx="23" ry="13" fill={ART.cream} stroke="none" /><Detail><path d="M54 75q25 19 51 0" /></Detail><path d="M30 118l-13 8m15-6l-1 6m96-8l13 8m-15-6l1 6" stroke={ART.leafShade} strokeWidth="5" />
    </>}
    {type === 'windmill' && <>
      <path d="M51 128L65 58h31l14 70Z" fill={ART.cream} /><path d="M60 59L81 30L103 59Z" fill={ART.coral} /><path d="M75 127v-23q9-12 17 0v23" fill={ART.woodShade} /><g className="windmill-sails" fill={ART.gold}><path d="M81 65L53 10L69 4L89 62Z M81 65L137 37L144 54L85 73Z M81 65L108 123L91 129L73 69Z M81 65L24 95L17 77L77 58Z" /><circle cx="81" cy="65" r="8" fill={ART.coral} /></g>
    </>}
    {type === 'bell' && <>
      <path d="M31 19h102" stroke={ART.woodShade} strokeWidth="6" /><g className="bell-body"><path d="M79 24v18" stroke={ART.wood} strokeWidth="4" /><path d="M43 99q13-16 13-39q0-23 24-23q25 0 25 23q0 23 13 39Z" fill={ART.gold} /><Detail stroke={ART.cream}><path d="M65 59q0-10 8-13v31" /></Detail><path d="M79 102v15" stroke={ART.goldShade} strokeWidth="6" /><path d="M43 99h75" stroke={ART.ink} strokeWidth="6" /><path d="M44 99h73" stroke={ART.goldShade} strokeWidth="3" /></g>
    </>}
    {type === 'owl' && <>
      <path d="M44 50L39 22L67 37 M92 37l27-15l-4 35" fill={ART.brown} /><ellipse cx="79" cy="79" rx="43" ry="45" fill={ART.brown} /><path d="M40 74q8 43 24 35V66m54 8q-8 43-24 35V66" fill={ART.brownShade} /><path d="M79 47q-42-24-40 13q1 36 40 28q39 8 40-28q2-37-40-13Z" fill={ART.cream} /><g className="owl-eyes"><Eye x={59} y={62} r={9} /><Eye x={98} y={62} r={9} /></g><path d="M72 75l7 13l8-13Z" fill={ART.gold} /><path d="M62 119v7h-7m40-7v7h-7" stroke={ART.goldShade} strokeWidth="3" />
    </>}
  </svg>;
}
