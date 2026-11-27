import React from 'react';
import { ART, ART_STROKE } from '../data/artStyle';
import './jungle-art.css';

function Eye({ x, y, r = 4 }) {
  return <g stroke="none">
    <circle cx={x} cy={y} r={r} fill={ART.ink} />
    <circle cx={x+1} cy={y-1.25} r={r*.33} fill={ART.paper} />
  </g>;
}

function Detail({ children, ...props }) {
  return <g strokeWidth={ART_STROKE.detail} {...props}>{children}</g>;
}

function Macaw() {
  return <>
    <path d="M66 78Q58 109 47 127Q44 133 35 134L48 97L37 111L49 79Z" fill={ART.blueShade} />
    <path d="M70 88v9h-7m26-10v10h-8" stroke={ART.goldShade} strokeWidth="3" />
    <path d="M57 50Q53 74 46 91Q76 108 100 82Q111 69 107 48Z" fill={ART.coral} />
    <g className="jungle-macaw-wing">
      <path d="M83 58Q95 72 75 91Q61 105 48 100Q51 71 72 58Z" fill={ART.gold} />
      <path d="M52 84Q67 84 85 71Q85 82 75 91Q61 105 48 100Z" fill={ART.blueShade} />
    </g>
    <g className="jungle-macaw-head">
      <path d="M71 50Q66 21 94 14Q117 9 130 29Q137 46 122 57Q111 69 87 63Z" fill={ART.coral} />
      <path d="M102 29Q114 20 126 31L128 46Q113 57 100 48Q92 39 102 29Z" fill={ART.cream} stroke="none" />
      <path d="M124 27Q147 26 145 46Q144 58 132 60Q136 48 123 43Z" fill={ART.cream} />
      <path d="M124 43Q133 44 138 50Q135 56 132 59Q134 50 124 43Z" fill={ART.brownShade} stroke="none" />
      <Eye x={111} y={35} r={4.5} />
    </g>
  </>;
}

function Tapir() {
  return <>
    <path d="M45 93l-3 31h14l8-30m39 0l7 30h14l-3-31" fill={ART.violetShade} />
    <path d="M141 69q11 1 9 10" stroke={ART.violetShade} strokeWidth="4" />
    <path d="M45 69Q56 43 108 45Q140 45 143 76Q143 109 98 107L55 107Z" fill={ART.violet} />
    <path d="M65 52Q86 43 110 46Q103 71 111 105Q85 112 63 103Q75 77 65 52Z" fill={ART.cream} stroke="none" />
    <path d="M66 99l-5 27H48l1-27m68 0l3 27h-14l-8-21" fill={ART.violet} />
    <Detail stroke={ART.violetShade}><path d="M49 120h12m47 0h11" /></Detail>
    <g className="jungle-tapir-head">
      <path d="M30 50Q19 34 28 34Q39 31 45 50m5-3q3-17 11-18q12 1 2 21" fill={ART.violetShade} />
      <path d="M23 60Q28 45 46 45Q69 42 76 65Q79 89 61 96Q42 102 26 90Q9 91 11 76Q14 67 23 60Z" fill={ART.violet} />
      <path d="M13 78q11 5 18-2m9 11q6 4 12-1" fill="none" strokeWidth={ART_STROKE.detail} />
      <Eye x={36} y={63} r={4.5} />
    </g>
  </>;
}

function Toucan() {
  return <>
    <path d="M70 84Q53 95 43 127Q60 130 78 103Z" fill={ART.violetShade} />
    <path d="M70 104v10h-7m25-9v9h-7" stroke={ART.goldShade} strokeWidth="3" />
    <path d="M65 53Q51 81 61 99Q77 117 99 98Q118 77 113 54Z" fill={ART.violetShade} />
    <path d="M65 68Q83 61 90 72Q88 97 64 100Q53 88 65 68Z" fill={ART.blueShade} />
    <g className="jungle-toucan-head">
      <path d="M70 45Q68 19 91 17Q114 12 125 35Q125 55 113 72Q102 87 84 70Z" fill={ART.violetShade} />
      <path d="M102 35Q120 26 124 38Q126 56 111 68Q96 80 83 66Q85 56 102 35Z" fill={ART.cream} stroke="none" />
      <path d="M116 28Q144 25 152 42Q156 51 150 57Q131 51 117 49Z" fill={ART.gold} />
      <path d="M142 32Q154 37 153 50L150 56L140 54Q144 43 142 32Z" fill={ART.brownShade} stroke="none" />
      <Detail stroke={ART.ink}><path d="M119 43q18-2 30 7" /></Detail>
      <Eye x={106} y={37} r={4.7} />
    </g>
  </>;
}

function Morpho() {
  return <>
    {['left','right'].map((side,index)=><g key={side} transform={index ? 'translate(160) scale(-1 1)' : undefined}>
      <g className="jungle-morpho-wing">
        <path d="M80 66Q56 27 23 19Q9 17 12 34Q16 57 38 74Q18 86 34 104Q50 120 73 99L82 77Z" fill={ART.blueShade} />
        <path d="M77 69Q55 36 22 28Q22 52 45 71Q30 91 43 102Q58 112 75 91Z" fill={ART.blue} stroke="none" />
        <Detail stroke={ART.tealShade}><path d="M74 72Q50 67 34 48m41 33Q59 86 48 96" /></Detail>
        <circle cx="28" cy="36" r="3" fill={ART.cream} stroke="none" />
      </g>
    </g>)}
    <path d="M78 56Q70 43 67 43q-2-3-5-2m20 15q8-13 11-13q2-3 5-2" strokeWidth={ART_STROKE.detail} />
    <path d="M73 61Q80 53 87 61L86 84Q80 100 74 84Z" fill={ART.woodShade} />
    <circle cx="80" cy="59" r="9" fill={ART.wood} /><Eye x={78} y={58} r={3} />
  </>;
}

function RiverTurtle() {
  return <>
    <path d="M50 89q-24-2-32 10q13 8 36 3m39-5q18 15 33 4q-8-9-26-14" fill={ART.leafShade} />
    <path d="M31 93Q31 50 78 47Q117 50 117 94Q103 107 70 105Q44 105 31 93Z" fill={ART.leaf} />
    <path d="M36 91q34 10 72 0l8 5q-14 14-46 10q-22 1-34-10Z" fill={ART.gold} />
    <path d="M56 70l21-12l19 16l-13 17l-22-5Z" fill={ART.leafShade} strokeWidth={ART_STROKE.detail} />
    <Detail stroke={ART.leafShade}><path d="M77 58V49m19 25l16-5M56 70l-16-5m21 21l-7 10m29-5l4 6" /></Detail>
    <g className="jungle-turtle-head">
      <path d="M105 83Q112 76 116 67Q123 52 140 59Q153 66 150 80Q145 95 114 95Z" fill={ART.leaf} />
      <Eye x={137} y={69} />
      <Detail><path d="M135 82q6 3 13-4" /></Detail>
    </g>
  </>;
}

function Heron() {
  return <>
    <path d="M73 94l-8 18l7 11h12m12-30l1 24l-7 9H79" stroke={ART.goldShade} strokeWidth="4" />
    <path d="M86 78Q122 78 141 69Q136 95 101 103Q75 109 52 95Z" fill={ART.blueShade} />
    <path d="M72 85Q38 75 41 59Q42 48 55 41Q67 33 57 27L44 22Q49 9 64 14Q87 21 81 39Q76 49 65 55Q53 64 85 77Q101 82 108 99Q81 112 58 99Z" fill={ART.blue} />
    <path d="M59 44Q50 53 50 61Q49 71 71 83L76 101Q44 99 42 75Q35 57 59 44Z" fill={ART.cream} stroke="none" />
    <path className="jungle-heron-wing" d="M72 83Q98 80 123 83Q102 109 74 101Q66 95 72 83Z" fill={ART.tealShade} />
    <path d="M65 21q11-7 31 3l-15 1l12 4l-21 1Z" fill={ART.violetShade} />
    <path d="M46 23L11 37q24 2 38-6" fill={ART.gold} />
    <Eye x={56} y={24} r={3.8} />
  </>;
}

function Crocodile() {
  return <>
    <path d="M51 88q-25 6-30 22l12 1l13-8l13-4m26-9q19 5 19 19l13-3q4-18-17-21" fill={ART.leafShade} />
    <path d="M85 91Q131 100 150 74Q151 97 130 105Q109 112 80 103Z" fill={ART.leaf} />
    <path d="M87 80l12-17l9 15l10-9l6 11l10-7l5 8" fill={ART.leafShade} />
    <path d="M44 72q29-10 49 1q20 11 25 25q-28 11-64 5q-21-4-23-23Z" fill={ART.leaf} />
    <Detail stroke={ART.leafShade}><path d="M64 80l6-2m7 7l6-2m1 10l6-2m6-3l5 1" /></Detail>
    <g className="jungle-crocodile-head">
      <path d="M65 79Q56 58 44 67Q39 71 37 77L13 78Q4 78 5 89Q5 99 15 101Q32 105 51 100Q68 97 65 79Z" fill={ART.leaf} />
      <path d="M6 91Q28 97 48 89Q48 95 55 98Q36 105 15 101Q8 100 6 91Z" fill={ART.gold} />
      <path d="M22 94l5 7l4-8" fill={ART.cream} strokeWidth={ART_STROKE.detail} />
      <circle cx="13" cy="85" r="2" fill={ART.ink} stroke="none" />
      <Eye x={49} y={77} r={5} />
    </g>
  </>;
}

function Capybara() {
  return <>
    <path d="M45 92l-4 32h15l8-31m40 5l7 26h13l-4-29" fill={ART.brownShade} />
    <path d="M54 61Q71 44 106 51Q140 55 144 80Q148 104 126 110Q98 118 60 106Q43 96 54 61Z" fill={ART.brown} />
    <path d="M48 99l-4 27h16l9-25m49 4l4 21h15l-6-26" fill={ART.brown} />
    <g className="jungle-capybara-head">
      <path d="M42 58Q35 37 47 37Q59 37 55 57m3 0q6-25 15-16q8 7-1 23" fill={ART.brownShade} />
      <path d="M24 64Q38 48 61 53Q84 62 79 84Q73 104 49 107L24 105Q11 101 11 88L15 73Z" fill={ART.wood} />
      <path d="M15 82Q32 82 34 96Q31 104 25 104Q14 102 12 94Z" fill={ART.brownShade} stroke="none" />
      <Detail><path d="M20 92q9 7 17 3" /></Detail>
      <Eye x={46} y={71} r={4.6} />
      <circle cx="19" cy="84" r="2.5" fill={ART.ink} stroke="none" />
    </g>
  </>;
}

function Sloth() {
  return <>
    <path d="M96 69Q92 58 101 45Q105 37 99 26L111 22Q121 40 111 56L108 76Z" fill={ART.brownShade} />
    <path d="M47 64Q73 48 107 61Q130 74 115 100Q103 122 68 116Q40 112 34 91Z" fill={ART.brown} />
    <path d="M57 79Q80 65 103 80Q113 91 105 104Q94 119 70 110Z" fill={ART.wood} stroke="none" />
    <path d="M44 78Q27 61 40 43Q48 33 47 23L59 21Q68 41 55 51Q51 59 64 72M99 98Q119 97 124 81Q130 67 113 65" fill={ART.brown} />
    <path d="M48 25q-4-7-2-9m9 7q-3-7-1-9m47 12q-4-7-2-10m9 8q-1-9 1-10" stroke={ART.goldShade} strokeWidth="3.5" />
    <g className="jungle-sloth-head">
      <path d="M29 82Q29 58 48 55Q68 50 78 68Q93 96 76 109Q60 121 39 106Q28 97 29 82Z" fill={ART.brown} />
      <path d="M37 81Q32 69 44 65Q54 60 59 67Q68 63 74 75Q87 95 73 103Q50 117 37 96Q32 89 37 81Z" fill={ART.cream} stroke="none" />
      <path d="M40 75q14-9 14 0q-4 7-11 13q-6 1-3-13m20-3q6-9 15 3q5 8-1 9q-11-4-14-12" fill={ART.brownShade} stroke="none" />
      <Eye x={47} y={77} r={3.5} /><Eye x={67} y={76} r={3.5} />
      <path d="M52 85q5-3 10 0l-5 5Z" fill={ART.ink} stroke="none" />
      <Detail><path d="M51 94q7 7 15 0" /></Detail>
    </g>
  </>;
}

function Monkey() {
  return <>
    <path className="jungle-monkey-tail" d="M104 103Q147 103 142 75Q139 55 125 62Q117 65 121 75" stroke={ART.brownShade} strokeWidth="8" />
    <path d="M82 79Q73 61 85 53Q101 48 111 66Q125 92 112 111Q99 127 76 112Q61 94 82 79Z" fill={ART.brown} />
    <path d="M84 80Q101 74 109 94Q112 112 98 115Q78 117 76 102Q73 91 84 80Z" fill={ART.cream} stroke="none" />
    <path d="M100 88Q119 84 125 96Q130 106 118 108L110 101m-28 1q-18 9-29-1q-3-6 4-9l15 2" fill={ART.wood} />
    <path d="M89 66Q91 50 80 40Q70 31 74 24Q78 22 84 23Q94 47 103 49Q111 57 103 71" fill={ART.brown} />
    <path d="M75 26q-4-4-2-9q3-3 6 3q1-6 4-5q5 2 3 11Z" fill={ART.wood} />
    <g className="jungle-monkey-head">
      <circle cx="38" cy="61" r="13" fill={ART.wood} /><circle cx="88" cy="55" r="13" fill={ART.wood} />
      <circle cx="38" cy="61" r="5" fill={ART.pink} stroke="none" /><circle cx="88" cy="55" r="5" fill={ART.pink} stroke="none" />
      <path d="M38 66Q32 42 51 36L55 29L65 36Q84 37 89 54Q94 80 72 90Q46 97 38 66Z" fill={ART.brown} />
      <path d="M49 48Q58 42 63 52Q71 39 80 47Q89 55 80 64Q88 72 81 81Q71 91 55 82Q45 76 51 67Q41 54 49 48Z" fill={ART.cream} stroke="none" />
      <Eye x={55} y={55} /><Eye x={73} y={52} />
      <path d="M61 62q4-3 8-1m-10 9q7 8 15-1" strokeWidth={ART_STROKE.detail} />
    </g>
  </>;
}

function TreeFrog() {
  return <>
    <path d="M52 80Q29 72 24 94Q22 106 39 111L49 104m62-24q23-8 28 14q2 12-15 17l-10-7" fill={ART.tealShade} />
    <path d="M44 83Q42 69 49 62Q56 39 78 42Q101 37 112 60Q129 74 115 99Q100 123 78 119Q49 116 44 83Z" fill={ART.leaf} />
    <path className="jungle-treefrog-throat" d="M56 87Q80 100 105 86Q104 111 80 114Q62 112 56 87Z" fill={ART.cream} stroke="none" />
    <path d="M52 95q-4 18-17 29m73-29q4 18 17 29" stroke={ART.leafShade} strokeWidth="6" />
    <path d="M42 119l-13 6m14-6l2 7m72-7l13 6m-14-6l-2 7" stroke={ART.coral} strokeWidth="5" />
    <circle cx="56" cy="57" r="16" fill={ART.leaf} /><circle cx="104" cy="57" r="16" fill={ART.leaf} />
    <circle cx="56" cy="56" r="11" fill={ART.coral} stroke="none" /><circle cx="104" cy="56" r="11" fill={ART.coral} stroke="none" />
    <Eye x={57} y={56} r={6} /><Eye x={103} y={56} r={6} />
    <Detail><path d="M57 78q22 17 46 0" /></Detail>
  </>;
}

function Kinkajou() {
  return <>
    <path className="jungle-kinkajou-tail" d="M101 102Q149 106 145 76Q144 60 129 61Q115 61 117 72" stroke={ART.brownShade} strokeWidth="14" />
    <path d="M51 68Q79 59 94 70Q121 86 110 113L102 124H67L46 108Z" fill={ART.wood} />
    <path d="M59 78Q84 75 95 91Q105 107 92 119Q74 124 63 112Z" fill={ART.cream} stroke="none" />
    <path d="M56 101l-6 22h20m23-21l3 22h18" fill={ART.brown} />
    <g className="jungle-kinkajou-head">
      <circle cx="36" cy="45" r="14" fill={ART.wood} /><circle cx="88" cy="40" r="14" fill={ART.wood} />
      <circle cx="36" cy="45" r="7" fill={ART.pink} stroke="none" /><circle cx="88" cy="40" r="7" fill={ART.pink} stroke="none" />
      <path d="M35 53Q39 34 62 34Q85 33 94 51Q104 76 78 91Q52 104 33 79Q28 68 35 53Z" fill={ART.wood} />
      <path d="M45 69q9-10 21-3q11-9 22 0q6 16-14 23Q55 94 46 80Z" fill={ART.cream} stroke="none" />
      <Eye x={48} y={58} r={5.5} /><Eye x={78} y={55} r={5.5} />
      <path d="M59 69q6-5 14-1l-6 6Z" fill={ART.brownShade} stroke="none" />
      <Detail><path d="M66 74v6m-7-1q7 6 15-2" /></Detail>
    </g>
  </>;
}

function Firefly() {
  return <>
    <g className="jungle-firefly-wings" fill={ART.cream}>
      <path d="M78 64Q47 52 31 24Q23 10 39 18Q74 24 84 57Z" />
      <path d="M84 58Q85 30 110 17Q127 11 125 29Q121 55 89 67Z" />
      <Detail stroke={ART.teal}><path d="M78 56Q61 46 41 26m50 31q15-24 27-32" /></Detail>
    </g>
    <path d="M62 60Q63 38 54 32m25 19Q84 28 94 29" strokeWidth={ART_STROKE.detail} />
    <g className="jungle-firefly-glow">
      <path d="M76 68Q103 59 123 79Q137 94 123 110Q106 128 83 113Q64 99 76 68Z" fill={ART.gold} />
      <path d="M101 75Q122 75 130 94Q125 116 103 117Q111 106 101 75Z" fill={ART.cream} stroke="none" />
    </g>
    <path d="M67 55Q86 48 99 69L102 83Q83 104 68 94Q52 85 67 55Z" fill={ART.leafShade} />
    <circle cx="57" cy="65" r="20" fill={ART.leaf} />
    <Eye x={49} y={63} r={4} /><Eye x={64} y={59} r={4} />
    <Detail><path d="M51 73q7 7 14-2" /></Detail>
    <path d="M77 89l-12 15m26-13l-5 18" strokeWidth={ART_STROKE.detail} />
  </>;
}

function Iguana() {
  return <>
    <path d="M67 97L54 123h15l16-21m15-6l14 22h12l-7-23" fill={ART.leafShade} />
    <path className="jungle-iguana-tail" d="M96 84Q123 98 149 81Q153 101 130 110Q106 119 88 104Z" fill={ART.leaf} />
    <path d="M54 75l10-11l6 9l10-14l5 12l12-8l3 13l13-1l-4 12" fill={ART.leafShade} />
    <path d="M39 81Q68 65 97 76Q117 85 119 101Q103 118 68 108Q45 103 39 81Z" fill={ART.leaf} />
    <path d="M65 98q8 10 3 17l-9 11H44q8-9 8-15L49 98m52 1q12 4 18 20l9 7h-15l-17-16" fill={ART.leaf} />
    <Detail stroke={ART.leafShade}><path d="M64 85l10-3m9 5l10-3m-14 8l11 1" /></Detail>
    <g className="jungle-iguana-head">
      <path d="M48 87Q47 110 32 115Q21 110 22 96Z" fill={ART.gold} />
      <path d="M16 68Q25 57 42 59Q57 61 60 80Q62 99 43 103Q23 102 12 89Q5 78 16 68Z" fill={ART.leaf} />
      <Eye x={31} y={73} r={5} />
      <Detail><path d="M15 83q8 8 18 5" /></Detail>
      <circle cx="15" cy="77" r="2" fill={ART.ink} stroke="none" />
    </g>
  </>;
}

function Pangolin() {
  return <>
    <path d="M49 102l-7 22h16l9-20m22-2l13 22h14l-7-22" fill={ART.brownShade} />
    <path className="jungle-pangolin-tail" d="M98 86Q128 112 151 104Q151 125 124 124Q105 124 85 109Z" fill={ART.wood} />
    <path d="M46 65Q65 46 90 53Q115 57 123 85Q126 107 101 115Q81 123 54 108Q39 96 46 65Z" fill={ART.wood} />
    <Detail stroke={ART.brownShade}>
      <path d="M66 56q-5 12 7 17q12-6 13-19m1 0q0 12 11 17q8-3 9-10M54 68q-1 14 11 18q10-4 10-12m2 1q2 12 14 13q10-5 10-16m1 0q4 12 16 11M61 89q0 13 15 15q9-5 9-13m1 0q5 13 18 13q10-4 11-15m5 3q3 11 16 14m-21-1q2 10 16 13" />
    </Detail>
    <path d="M57 100l-7 26H35q0-11 10-18m58-6l-4 24H85q-2-11 5-17" fill={ART.brown} />
    <g className="jungle-pangolin-head">
      <path d="M34 70Q46 60 57 71Q69 84 56 97Q44 111 28 105Q14 104 8 97Q11 94 20 89Q25 75 34 70Z" fill={ART.brown} />
      <path d="M37 73q-5-9 1-12q6-3 11 9" fill={ART.wood} />
      <Eye x={38} y={84} />
      <Detail><path d="M18 98q8 3 16-1" /></Detail>
    </g>
  </>;
}

function Hummingbird() {
  return <>
    <path d="M66 77Q46 79 26 102L44 104L37 119Q63 107 81 91Z" fill={ART.tealShade} />
    <g className="jungle-hummingbird-wing-far">
      <path d="M68 69Q65 35 90 23Q110 40 88 72Z" fill={ART.blueShade} />
    </g>
    <path d="M54 74Q60 53 86 60Q102 65 108 85Q98 105 74 101Q55 95 54 74Z" fill={ART.teal} />
    <g className="jungle-hummingbird-wing-near">
      <path d="M71 78Q32 73 22 34Q50 28 64 48Q76 60 78 74Z" fill={ART.leafShade} />
      <Detail stroke={ART.teal}><path d="M32 43q14 21 37 29" /></Detail>
    </g>
    <g className="jungle-hummingbird-head">
      <path d="M75 66Q73 41 100 40Q119 42 119 63Q114 90 94 94Q86 79 75 66Z" fill={ART.leaf} />
      <path d="M96 69Q107 69 117 62Q113 83 96 91Z" fill={ART.coral} stroke="none" />
      <path d="M114 53l36-11l-32 18Z" fill={ART.goldShade} />
      <Eye x={103} y={53} r={4.4} />
    </g>
  </>;
}

function Basilisk() {
  return <>
    <path d="M77 75Q97 60 126 80Q140 91 152 77Q150 105 124 98L88 92Z" fill={ART.leafShade} />
    <path d="M44 71Q58 49 92 50L101 76Z" fill={ART.tealShade} />
    <path d="M35 80Q47 63 75 65Q104 67 118 91Q101 109 70 99Q50 100 35 80Z" fill={ART.leaf} />
    <path d="M91 85Q108 93 91 100l-14 8H62l12-8l1-9M43 87l-5 17H23" fill={ART.leafShade} />
    <path d="M18 65Q25 47 49 38L43 62Q56 72 47 84Q30 94 13 83Q5 76 18 65Z" fill={ART.leaf} />
    <path d="M18 80q13 2 20-3" strokeWidth="1.5" /><Eye x={30} y={67} />
  </>;
}

function Kingfisher() {
  return <>
    <path d="M91 84l27 29q-24 7-39-16" fill={ART.blueShade} />
    <path d="M70 101v12h-7m24-11v11h-7" stroke={ART.goldShade} strokeWidth="3" />
    <path d="M54 61Q99 48 110 82Q113 107 81 108Q50 104 47 80Z" fill={ART.coral} />
    <path d="M75 66Q102 58 112 82Q105 103 82 98Q66 85 75 66Z" fill={ART.blueShade} />
    <path d="M53 61L9 69L48 52Z" fill={ART.woodShade} />
    <path d="M45 55Q44 30 74 28L97 31L88 41Q104 61 85 75Q53 90 45 55Z" fill={ART.teal} />
    <path d="M52 64q17-9 37 0q-16 17-31 10Z" fill={ART.cream} stroke="none" />
    <Eye x={62} y={50} />
  </>;
}

function Coati() {
  return <>
    <path d="M97 88Q126 54 128 20Q142 8 148 29Q153 61 122 95Z" fill={ART.wood} />
    <path d="M129 33l17 5m-21 13l17 5m-25 10l17 5" stroke={ART.brownShade} strokeWidth="6" />
    <path d="M50 97l-5 28h14l10-24m27-1l9 25h14l-6-32" fill={ART.brownShade} />
    <path d="M41 77Q74 53 106 65Q130 74 122 100Q111 115 64 106L44 103Z" fill={ART.wood} />
    <path d="M49 96l-8 30H27l7-29m69 2l4 27H92l-8-24" fill={ART.wood} />
    <path d="M32 65Q25 53 34 48Q45 48 48 61Q68 64 65 83Q61 99 39 97L14 105Q5 105 8 94L22 81Q21 72 32 65Z" fill={ART.brown} />
    <path d="M22 83q20-18 34-13q-2 13-18 18Z" fill={ART.cream} stroke="none" />
    <Eye x={42} y={77} /><circle cx="12" cy="97" r="4" fill={ART.ink} stroke="none" />
  </>;
}

function OrchidMantis() {
  return <>
    <path d="M72 92Q42 107 25 91Q27 63 71 71Q31 41 53 31Q81 31 91 67Z" fill={ART.pink} />
    <path d="M75 89Q101 82 117 103L104 115H92m-25-23q-10 23-29 24H29" fill={ART.pink} />
    <path d="M75 99Q67 86 79 66L97 50L107 58L91 76Q91 91 75 99Z" fill={ART.cream} />
    <path d="M87 73Q104 60 116 65Q134 73 123 89Q112 89 115 77l-16 6" fill={ART.pink} />
    <path d="M108 45q5-18 17-22m-29 22q-3-17-14-21" strokeWidth="1.5" />
    <path d="M86 49Q89 35 101 41Q114 36 120 48Q119 60 103 67Q91 63 86 49Z" fill={ART.cream} />
    <Eye x={95} y={49} /><Eye x={110} y={48} />
  </>;
}

function Potoo() {
  return <>
    <path d="M69 91L58 132Q83 129 101 106Z" fill={ART.brownShade} />
    <path d="M76 108v13h-9m24-13v13h-8" stroke={ART.woodShade} strokeWidth="3" />
    <path d="M61 55Q94 43 112 71Q122 100 96 114Q60 125 52 95Z" fill={ART.brown} />
    <path d="M86 62Q112 67 105 97Q99 109 90 111Q77 91 86 62Z" fill={ART.brownShade} />
    <path d="M48 56Q41 31 61 23Q82 13 101 30Q110 34 110 46Q104 65 77 71Q55 75 48 56Z" fill={ART.wood} />
    <path d="M50 51Q76 57 102 45Q90 66 69 63Z" fill={ART.brownShade} />
    <circle cx="70" cy="39" r="10" fill={ART.gold} stroke="none" /><Eye x={70} y={39} r={6} />
    <path d="M55 81l6 4m2 11l8 4m-10-68l-5 3" stroke={ART.cream} strokeWidth="2" />
  </>;
}

function Ocelot() {
  return <>
    <path d="M121 84Q143 84 142 59Q145 47 153 56Q160 87 124 99" fill={ART.goldShade} />
    <path d="M48 95l-8 30h16l11-25m43-3l14 28h13l-9-34" fill={ART.goldShade} />
    <path d="M38 77Q57 57 94 63Q130 64 134 88Q135 112 100 106H56Z" fill={ART.gold} />
    <path d="M56 97l-4 29H35q-4-7 6-14l1-17m62 3l1 28H89l-5-25" fill={ART.gold} />
    <path d="M57 79q9-8 15 2q-5 10-15 4Zm23-8q12-5 14 5q-3 8-13 3Zm27 9q12-6 15 4q-3 10-13 6Zm-35 14q10-7 14 1q-1 10-11 6Z" fill={ART.goldShade} />
    <path d="M18 60Q10 40 22 40Q33 39 36 53Q48 38 55 47Q61 52 54 65Q62 90 37 97Q11 95 11 79Z" fill={ART.gold} />
    <path d="M15 79Q26 72 31 81Q40 74 48 81Q42 96 28 95Q17 93 15 79Z" fill={ART.cream} stroke="none" />
    <Eye x={23} y={70} /><Eye x={43} y={67} /><path d="M26 80l9-1l-4 6Z" fill={ART.ink} />
  </>;
}

function Tarsier() {
  return <>
    <path d="M99 104Q126 126 145 102Q154 92 146 85" stroke={ART.brownShade} strokeWidth="6" />
    <path d="M57 71Q91 61 109 84Q119 110 96 116L102 123H80L72 103L65 117L46 123L34 121L49 102Z" fill={ART.wood} />
    <path d="M55 86Q39 96 38 111l-11 5m46-27q2 14-3 26l-13 6" stroke={ART.woodShade} strokeWidth="5" />
    <circle cx="35" cy="51" r="16" fill={ART.wood} /><circle cx="89" cy="51" r="16" fill={ART.wood} />
    <path d="M32 60Q29 36 59 33Q86 32 93 57Q97 82 71 89Q40 94 32 60Z" fill={ART.brown} />
    <circle cx="50" cy="59" r="13" fill={ART.gold} /><circle cx="75" cy="57" r="13" fill={ART.gold} />
    <Eye x={50} y={59} r={8} /><Eye x={75} y={57} r={8} />
    <path d="M57 75q6 7 14-1" strokeWidth="1.5" />
  </>;
}

function Agouti() {
  return <>
    <path d="M52 101l-7 25H34l4-28m58 4l9 24h16l-5-35" fill={ART.brownShade} />
    <path d="M42 79Q68 71 83 52Q107 35 129 58Q147 84 130 106Q112 121 74 107L45 101Z" fill={ART.wood} />
    <path d="M80 69Q100 43 121 51Q145 68 136 96Q129 72 102 77Z" fill={ART.brown} stroke="none" />
    <path d="M56 97l-7 29H36l6-25m74-18q12 16-4 28l-10 15H89l12-22" fill={ART.wood} />
    <path d="M30 68Q24 53 32 48Q43 48 45 63Q62 66 64 80Q64 96 50 104Q27 114 14 100Q9 89 18 81Z" fill={ART.brown} />
    <path d="M14 95q13 2 19-2" strokeWidth="1.5" /><Eye x={35} y={78} />
  </>;
}

function Colugo() {
  return <>
    <path d="M76 91Q89 116 112 127Q96 94 132 61Q148 43 151 25Q132 31 110 47L66 54Q39 37 14 29Q20 55 42 66Q69 88 49 114Q66 110 76 91Z" fill={ART.brown} />
    <path d="M37 52Q59 62 83 56Q112 54 132 42Q114 68 101 93Q92 76 77 81Q65 88 62 96Q65 70 37 52Z" fill={ART.pink} stroke="none" />
    <path d="M70 51Q63 44 67 34Q72 28 79 36Q90 31 102 37Q111 28 116 36Q120 49 109 56Q105 80 86 78Q67 74 70 51Z" fill={ART.wood} />
    <Eye x={82} y={51} r={5} /><Eye x={103} y={50} r={5} />
    <path d="M89 64q5 4 10-1m-10 26l12 6m-44-30l9 6" strokeWidth="1.5" />
  </>;
}

function Motmot() {
  return <>
    <path d="M91 74q17 18 25 42m-14-44q17 16 29 41" stroke={ART.tealShade} strokeWidth="4" />
    <ellipse cx="119" cy="119" rx="6" ry="11" transform="rotate(-24 119 119)" fill={ART.blue} />
    <ellipse cx="134" cy="116" rx="6" ry="11" transform="rotate(-31 134 116)" fill={ART.blue} />
    <path d="M71 81v10h-9m26-10v10h-8" stroke={ART.woodShade} strokeWidth="3" />
    <path d="M45 60Q60 33 87 48Q119 66 103 84Q78 100 52 83Z" fill={ART.leaf} />
    <path d="M74 60Q94 53 105 76Q94 89 78 82Z" fill={ART.tealShade} />
    <path d="M47 52L14 61L44 42Z" fill={ART.brownShade} />
    <path d="M39 48Q37 21 64 18Q91 17 91 44Q81 62 60 63Q43 62 39 48Z" fill={ART.teal} />
    <path d="M43 45Q63 25 85 40L78 50Q60 44 47 53Z" fill={ART.tealShade} stroke="none" />
    <Eye x={59} y={39} />
  </>;
}

function Peccary() {
  return <>
    <path d="M48 96l-6 29h14l10-27m40 1l10 26h12l-4-33" fill={ART.brownShade} />
    <path d="M41 63Q65 43 109 49Q141 56 145 81Q145 110 105 110H57Z" fill={ART.brownShade} />
    <path d="M62 53Q73 51 83 49Q70 78 82 110H66Q53 90 62 53Z" fill={ART.cream} stroke="none" />
    <path d="M67 101l-7 25H46l4-28m65 5l3 23h-15l-9-22" fill={ART.brown} />
    <path d="M27 63Q22 45 30 42Q42 44 44 58Q51 43 62 47Q70 53 57 68Q70 86 51 99Q36 111 16 101Q3 97 9 85L19 79Z" fill={ART.brown} />
    <ellipse cx="16" cy="90" rx="10" ry="8" fill={ART.pink} />
    <circle cx="13" cy="89" r="2" fill={ART.ink} stroke="none" /><circle cx="20" cy="89" r="2" fill={ART.ink} stroke="none" />
    <Eye x={36} y={73} />
  </>;
}

function Quetzal() {
  return <>
    <path d="M91 63Q121 68 124 99Q127 114 147 122Q129 131 111 116Q100 107 98 90Q103 113 91 133Q81 133 84 126Q93 98 77 86Z" fill={ART.tealShade} />
    <path d="M70 72v14h-8m24-13v13h-8" stroke={ART.goldShade} strokeWidth="3" />
    <path d="M46 57Q67 44 93 48Q112 58 112 79Q90 96 58 81Z" fill={ART.teal} />
    <path d="M53 58Q68 62 77 85Q57 88 48 73Z" fill={ART.coral} stroke="none" />
    <path d="M74 51Q98 48 112 73Q94 85 78 68Z" fill={ART.leafShade} />
    <path d="M48 51L22 47L43 39Z" fill={ART.gold} />
    <path d="M41 47Q35 23 58 19Q69 15 78 22Q66 20 69 25Q92 32 83 50Q72 66 50 57Z" fill={ART.leaf} />
    <Eye x={54} y={38} />
  </>;
}

const ANIMALS = {
  macaw: Macaw, tapir: Tapir, toucan: Toucan, morpho: Morpho,
  riverTurtle: RiverTurtle, heron: Heron, crocodile: Crocodile, capybara: Capybara,
  sloth: Sloth, monkey: Monkey, treeFrog: TreeFrog, kinkajou: Kinkajou, firefly: Firefly,
  iguana: Iguana, pangolin: Pangolin, hummingbird: Hummingbird,
  basilisk: Basilisk, kingfisher: Kingfisher, coati: Coati, orchidMantis: OrchidMantis,
  potoo: Potoo, ocelot: Ocelot, tarsier: Tarsier, agouti: Agouti,
  colugo: Colugo, motmot: Motmot, peccary: Peccary, quetzal: Quetzal,
};

export function JungleAnimalArt({ type }) {
  const Animal = ANIMALS[type];
  return Animal ? <g className="jungle-animal-art"><Animal /></g> : null;
}
