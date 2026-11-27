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

const ANIMALS = {
  macaw: Macaw, tapir: Tapir, toucan: Toucan, morpho: Morpho,
  riverTurtle: RiverTurtle, heron: Heron, crocodile: Crocodile, capybara: Capybara,
  sloth: Sloth, monkey: Monkey, treeFrog: TreeFrog, kinkajou: Kinkajou, firefly: Firefly,
  iguana: Iguana, pangolin: Pangolin, hummingbird: Hummingbird,
};

export function JungleAnimalArt({ type }) {
  const Animal = ANIMALS[type];
  return Animal ? <g className="jungle-animal-art"><Animal /></g> : null;
}
