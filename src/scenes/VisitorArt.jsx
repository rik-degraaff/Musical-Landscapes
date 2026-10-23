import React from 'react';
import './visitor-art.css';

function Eye({ cx, cy, radius = 3.5 }) {
  return <g stroke="none">
    <circle cx={cx} cy={cy} r={radius} fill="#303f42" />
    <circle cx={cx + 1} cy={cy - 1} r={radius * .32} fill="#fff9e6" />
  </g>;
}

export function VisitorArt({ type }) {
  switch (type) {
    case 'sheep':
      return <g className="visitor-art visitor-sheep" stroke="#796c72" strokeWidth="2.5">
        <ellipse cx="80" cy="128" rx="57" ry="5" fill="#345c4930" stroke="none" />
        <g className="visitor-sheep-body">
          <path d="M48 100v23h10v-21m40-2v23h10v-25" fill="#bca7ab" />
          <path d="M47 122h13m37 0h13" stroke="#64575f" strokeWidth="6" />
          <path d="M119 78q24-12 19 4q-2 8-14 8" fill="#fff2df" />
          <path d="M35 66q-6-15 9-19q1-15 18-12q10-14 24-4q16-8 26 5q19-3 21 14q16 6 10 22q12 16-2 27q0 16-18 16q-11 13-25 4q-15 8-27-2q-19 3-23-13q-18-5-13-22q-8-9 0-16Z" fill="#f9efdb" />
          <path d="M57 51q-9-1-8 7q2 8 9 4m14-20q-8 2-4 9q4 6 9 0m22-11q-9 0-8 7q1 7 8 5m21 8q-8-4-11 3q-3 8 5 10m-39-7q-8-3-10 5q-1 8 7 8m27 2q-10-5-13 4q-1 8 8 8m30-7q-9-2-9 6q0 7 7 6m-47 9q-7-6-11 1q-3 7 4 9" stroke="#d6c5af" strokeWidth="2" />
          <g className="visitor-sheep-head">
            <path d="M35 58Q14 44 12 59q3 13 23 12m23-13q20-16 22-2q0 14-20 16" fill="#c2a5ac" />
            <path d="M19 60l12 4m33 1l9-6" stroke="#eabcbc" />
            <path d="M32 56q14-11 29 0l2 31q-2 17-16 17q-16 0-19-17Z" fill="#bba7aa" />
            <path d="M29 57q-7-12 5-14q5-9 13-3q9-7 15 3q12 5 2 15q-8 5-16 0q-10 6-19-1Z" fill="#fff4df" />
            <Eye cx={37} cy={74} /><Eye cx={56} cy={74} />
            <ellipse cx="47" cy="90" rx="11" ry="8" fill="#e5c3be" stroke="none" />
            <path d="M43 87h8l-4 4Z" fill="#685760" stroke="none" /><path d="M47 91v3m-5 0q5 5 10 0" fill="none" strokeWidth="1.8" />
          </g>
        </g>
      </g>;
    case 'horse':
      return <g className="visitor-art visitor-horse" stroke="#745d60" strokeWidth="2.5">
        <ellipse cx="79" cy="130" rx="61" ry="5" fill="#345c4930" stroke="none" />
        <g className="visitor-horse-body">
          <path className="visitor-horse-tail" d="M37 65Q8 49 11 92l-5 15q18-1 18-20q-1-17 15-8" fill="#655d73" />
          <path d="M44 96l-5 28h11l8-24m21-1l4 25h11l-3-27" fill="#b7846c" />
          <path d="M38 123h14m30 0h13" stroke="#555462" strokeWidth="7" />
          <path d="M34 71q7-16 44-8l19 10l16-25l19 12l-20 41q-10 11-28 3H45q-17-11-11-33Z" fill="#d5a181" />
          <path d="M57 99l-4 26h12l8-25m27-7l8 32h12l-8-37" fill="#e0b28e" />
          <path d="M53 125h14m40 0h15" stroke="#555462" strokeWidth="7" />
          <path d="M42 75q12-8 28-3m13 9q-2 9-8 12" fill="none" stroke="#eec8a3" strokeWidth="4" />
          <g className="visitor-horse-head">
            <path d="M103 65q-14-24 1-34q18-14 29 6l-12 29Z" fill="#655d73" />
            <path d="M113 34l-4-23q13 3 17 20m3 0l8-18q10 14 1 28" fill="#d5a181" />
            <path d="M116 20l5 12m13-8l-3 10" stroke="#eab6b1" strokeWidth="3" />
            <path d="M113 34q21-14 28 9l-1 16l10 14q3 13-12 17q-15 2-20-11l-11-16Z" fill="#e0b28e" />
            <path d="M124 35q-6 7-4 17l7 18l7-4l-6-17l3-15" fill="#f8e8cb" stroke="none" />
            <path d="M111 34q-11 4-13 19l10-4l-3 15l12-8l-2-14l13-9Z" fill="#655d73" />
            <ellipse cx="138" cy="78" rx="13" ry="10" fill="#edc9ae" />
            <Eye cx={136} cy={52} /><ellipse cx="145" cy="76" rx="2.5" ry="3" fill="#745d60" stroke="none" />
            <path d="M131 83q6 4 11 0m-39-42l7-3" fill="none" strokeWidth="1.8" />
          </g>
        </g>
      </g>;
    case 'bee':
      return <g className="visitor-art visitor-bee" stroke="#736147" strokeWidth="2.5">
        <g className="visitor-bee-flowers">
          <path d="M26 130v-20m107 21l7-24" stroke="#64896b" strokeWidth="3" />
          <path d="M26 121q-15-14-16-3q1 10 16 8m110-3q16-15 17-3q-3 9-19 8" fill="#91b58a" stroke="#64896b" />
          <path d="M25 100q-11-13-14-2q-12 6 0 13q-1 14 12 7q13 6 15-6q13-8 1-14q-4-13-14 2Z" fill="#e8b0bf" stroke="#a76e87" />
          <path d="M138 95q-10-12-14-1q-12 4-2 12q-2 13 11 9q12 8 17-4q12-6 2-14q-3-11-14-2Z" fill="#a9c9df" stroke="#648aa3" />
          <circle cx="24" cy="107" r="6" fill="#efc56c" /><circle cx="137" cy="104" r="6" fill="#efc56c" />
        </g>
        <g className="visitor-bee-body">
          <g className="visitor-bee-wings" fill="#d7eee9" stroke="#749c9c">
            <path d="M74 59Q33 35 41 17q8-15 25 4q13 15 15 37Z" /><path d="M82 56q2-43 24-44q22 5 2 31L86 63Z" />
            <path d="M51 25l26 30m24-31L86 54" fill="none" stroke="#aad0ca" strokeWidth="2" />
          </g>
          <path d="M51 87l-9 17m27-11l-4 15m23-18l12 13m-65-31l-9 5l10 5" fill="none" strokeWidth="3" />
          <ellipse cx="76" cy="76" rx="39" ry="25" fill="#efd078" transform="rotate(-12 76 76)" />
          <path d="M54 56q-7 22 6 42l11 1q-14-24-6-46m14-1q-3 23 11 41l10-5q-14-21-10-35" fill="#645d55" stroke="none" />
          <path d="M48 62l-4 7m33-12l-2 6m22-7l2 7" stroke="#fff0b5" strokeWidth="3" />
          <g className="visitor-bee-head">
            <circle cx="112" cy="63" r="22" fill="#f3d98b" />
            <path d="M103 43q-12-22-18-18m33 17q7-24 16-19" fill="none" strokeWidth="3" /><circle cx="85" cy="25" r="3" fill="#645d55" /><circle cx="134" cy="23" r="3" fill="#645d55" />
            <Eye cx={107} cy={61} /><Eye cx={123} cy={58} />
            <path d="M110 72q7 6 13-2" fill="none" strokeWidth="2" /><ellipse cx="101" cy="69" rx="4" ry="3" fill="#dfa28b" stroke="none" />
          </g>
          <g className="visitor-bee-pollen" fill="#eab556" stroke="#a58549" strokeWidth="1.5"><circle cx="47" cy="105" r="6" /><circle cx="65" cy="108" r="5" /><circle cx="96" cy="102" r="6" /><path d="M44 104h4m14 3h3m-20-11h1m51 4h3" stroke="#fff0b5" /></g>
        </g>
      </g>;
    case 'woodpecker':
      return <g className="visitor-art visitor-woodpecker" stroke="#4e6566" strokeWidth="2.5">
        <ellipse cx="123" cy="132" rx="32" ry="5" fill="#345c4930" stroke="none" />
        <path d="M110 119q-2 10-17 14h22l10-7l8 7h23q-16-7-14-14" fill="#bc9979" stroke="#876e5c" />
        <path d="M97 128q-13-17-21-7q4 13 21 7m49 0q-2-19 12-15q6 11-12 15" fill="#9caf83" stroke="#69846b" strokeWidth="2" />
        <path d="M110 130V14q17-10 32 0v116Z" fill="#bc9979" stroke="#876e5c" />
        <path d="M119 18v22m12-19v40m-10-9v31m13-10v36m-15-18v31" stroke="#92765c" strokeWidth="2" /><ellipse cx="131" cy="51" rx="5" ry="9" fill="#9d7b5f" stroke="#876e5c" /><path d="M129 49q5 2 0 5" fill="none" stroke="#dabb93" />
        <path d="M141 30q17-15 14-27q-18 2-14 27" fill="#9caf83" stroke="#69846b" />
        <g className="visitor-woodpecker-body">
          <path d="M61 92L42 130l25-9l15-27" fill="#4e6566" /><path d="M48 122l18-19" stroke="#b6ccc0" strokeWidth="2" />
          <path d="M62 51q-20 23-11 45q7 15 25 9q26-13 24-41Z" fill="#f4e7cf" />
          <g className="visitor-woodpecker-wing">
            <path d="M62 58q-21 16-13 42q20 9 39-16q-2-20-26-26Z" fill="#526e71" />
            <path d="M55 72l18 1m-20 9l18 1m-18 8l10 1" stroke="#d3e1d8" strokeWidth="3" />
          </g>
          <path d="M67 101l11 1l-9 11l-9-6" fill="#ca7b71" stroke="none" />
          <path d="M88 90l20 2l9-7m-31 14l22 5l8-6m-8-6l9 4m-9 8l9 3" fill="none" stroke="#9f8059" strokeWidth="3" />
          <g className="visitor-woodpecker-head">
            <path d="M62 43L58 20l14 4l8-15l9 14l12 1l-7 23Z" fill="#d17d78" stroke="#925d63" />
            <path d="M65 26l14 9m2-13l8 12" stroke="#edaba0" strokeWidth="2" />
            <path d="M61 42q3-20 26-15q20 6 15 27q-5 17-26 14Z" fill="#526e71" /><path d="M66 43q18-8 34 4l-2 12q-18-9-26 1Z" fill="#f4e7cf" stroke="none" />
            <path d="M99 46l20 5l-19 7Z" fill="#c9ba93" /><Eye cx={88} cy={43} />
            <path d="M78 57l9 3" stroke="#b5c9c1" strokeWidth="2" />
          </g>
          <g className="visitor-woodpecker-chips" stroke="#a18160" strokeWidth="3"><path d="M124 64l4 3m-7 10l4 2m6-8l3-1" /></g>
        </g>
      </g>;
    case 'duck':
      return <g className="visitor-art visitor-duck" stroke="#527c79" strokeWidth="2.5">
        <g className="visitor-duck-ripples" fill="none" stroke="#8cc8c9"><ellipse cx="80" cy="118" rx="62" ry="10" /><path d="M25 130q52 11 106-1m-111-19l-7 3m127 3l8-2" /></g>
        <g className="visitor-duck-body">
          <path d="M48 111l-12 9h22m33-9l-4 11h18" fill="#e5ac68" stroke="#b0865c" />
          <path d="M116 74l29-13l-12 31" fill="#627a91" /><path d="M40 79q35-27 82 0q19 13 3 29q-23 20-64 5q-26-9-21-34Z" fill="#c2b496" />
          <path d="M49 93q8 26 53 18q20-4 28-18q-40 14-81 0Z" fill="#e8d9b8" stroke="none" />
          <g className="visitor-duck-wing">
            <path d="M73 78q34-14 47 16q-22 21-47-2Z" fill="#8c9d9a" /><path d="M88 89l17 10l13-9" fill="#789fb9" stroke="#ecdfbe" strokeWidth="3" />
          </g>
          <g className="visitor-duck-head">
            <path d="M38 50q-5 22 12 39l20-9l-8-28" fill="#76a593" /><circle cx="46" cy="44" r="25" fill="#76a593" /><path d="M29 60q15 11 34 5" stroke="#fff0d5" strokeWidth="5" />
            <path d="M28 45L9 49q-5 10 18 12l13-5Z" fill="#efc174" stroke="#ae875b" /><path d="M12 54h15" stroke="#c59a60" strokeWidth="1.5" />
            <Eye cx={38} cy={39} /><path d="M50 29q9 1 12 8" fill="none" stroke="#a4c6ac" strokeWidth="3" /><ellipse cx="45" cy="51" rx="5" ry="3" fill="#a1bc9d" stroke="none" />
          </g>
        </g>
        <g className="visitor-duck-splash" fill="#bfdfdf" stroke="#75aaaa" strokeWidth="1.5"><path d="M24 95q-7-12-9-1q2 8 9 1Zm114 6q8-15 11-4q0 9-11 4Z" /><circle cx="12" cy="108" r="2" /><circle cx="150" cy="111" r="2" /></g>
      </g>;
    case 'otter':
      return <g className="visitor-art visitor-otter" stroke="#77655b" strokeWidth="2.5">
        <g className="visitor-otter-ripples" stroke="#87bdc4" fill="none"><ellipse cx="82" cy="125" rx="65" ry="8" /><path d="M24 115q11-5 27-2m66 4l19 2" /></g>
        <g className="visitor-otter-body">
          <g className="visitor-otter-tail">
            <path d="M104 99q29 18 42 15q-9 19-34 9l-29-19" fill="#ab8a73" /><path d="M111 115l18 6" stroke="#d2b097" strokeWidth="2" />
          </g>
          <path d="M44 114l-12 5q-8 10 14 10l17-10m36-5l15 8q7 9-16 6l-14-9" fill="#9a7b68" />
          <ellipse cx="77" cy="93" rx="35" ry="34" fill="#b99a7e" /><ellipse cx="76" cy="95" rx="23" ry="27" fill="#ead6b2" stroke="none" />
          <path d="M70 117l4-4l5 4l5-4" fill="none" stroke="#c3a184" strokeWidth="2" />
          <g className="visitor-otter-head">
            <circle cx="48" cy="44" r="11" fill="#b99a7e" /><circle cx="100" cy="44" r="11" fill="#b99a7e" /><circle cx="48" cy="44" r="5" fill="#d8b3a6" stroke="none" /><circle cx="100" cy="44" r="5" fill="#d8b3a6" stroke="none" />
            <path d="M44 54q1-24 30-24q30 0 32 24q8 25-31 27q-39-2-31-27Z" fill="#b99a7e" /><path d="M52 61q8-9 22-2q15-7 23 2q0 18-23 17q-22 1-22-17Z" fill="#f0dfc2" stroke="none" />
            <Eye cx={59} cy={52} /><Eye cx={90} cy={52} /><path d="M69 60q6-4 12 0l-6 6Z" fill="#574d49" stroke="none" />
            <path d="M75 66v4m-8-2q3 7 8 2q5 5 9-2m-27-5l-18-3m17 8l-17 2m52-7l19-3m-18 8l18 2" fill="none" strokeWidth="1.6" />
          </g>
          <path d="M54 85q-15-5-17 8q4 14 24 6m38-14q18-4 18 10q-9 11-24 4" fill="#b99a7e" />
          <path d="M60 94q11-17 29 0l-4 14H66Z" fill="#bad1ce" stroke="#6c9798" /><path d="M64 96l5 8l5-11l6 11l5-8" fill="none" stroke="#e2eeDE" strokeWidth="2" />
          <g className="visitor-otter-paws">
            <path d="M44 91q13-5 17 3q1 9-12 6m57-9q-12-6-17 3q-1 9 12 6" fill="#d0b196" /><path d="M49 94l1 5m5-6l1 5m43-4l-1 5m-5-6l-1 5" strokeWidth="1.5" />
          </g>
        </g>
      </g>;
    case 'cicada':
      return <g className="visitor-art visitor-cicada" stroke="#66744e" strokeWidth="2.5">
        <path d="M14 117q62-15 134-2m-31-4l13-17" stroke="#94785e" strokeWidth="7" /><path d="M132 97q-1-20 20-21q1 18-20 21Z" fill="#a2ba83" stroke="#6f8d66" />
        <g className="visitor-cicada-body">
          <path d="M63 76l-25 18l7 18m50-36l24 19l-7 16m-49-22l-9 29m40-29l9 29" fill="none" strokeWidth="3" />
          <path d="M64 61q15-10 31 0l-4 34l-13 19l-12-19Z" fill="#b5ad70" /><path d="M68 76h23m-22 9h20m-20 9h17m-14 9h10" stroke="#8b8b56" strokeWidth="2" />
          <g className="visitor-cicada-wings" fill="#dce6bc" fillOpacity=".92" stroke="#839b77" strokeWidth="2">
            <path d="M70 61Q22 43 15 77q-4 26 30 32l28-38Z" /><path d="M89 61q48-18 55 16q4 26-30 32L86 71Z" />
            <path d="M68 65L25 88l18 16m25-39L39 61l-14 27m28-13l-8 27m-14-24l19 12m40-25l43 23l-18 16M90 65l29-4l14 27m-28-13l8 27m14-24l-19 12" fill="none" stroke="#a4b58d" strokeWidth="1.5" />
            <path d="M24 94l13 6m87-1l12-6" stroke="#f7f4d5" strokeWidth="3" />
          </g>
          <path d="M59 49q2-15 20-16q19 1 22 16l-10 22H68Z" fill="#9fac77" />
          <path d="M70 37l-7-15m24 15l9-15" fill="none" strokeWidth="2" /><circle cx="63" cy="47" r="8" fill="#d9bd7a" /><circle cx="97" cy="47" r="8" fill="#d9bd7a" /><Eye cx={62} cy={46} radius={4} /><Eye cx={98} cy={46} radius={4} />
          <path d="M75 45h9m-13 9l8 5l9-5m-12 9h7" fill="none" strokeWidth="2" />
        </g>
      </g>;
    case 'balloon':
      return <g className="visitor-art visitor-balloon" stroke="#8d6460" strokeWidth="2.5">
        <g className="visitor-balloon-body">
          <path d="M47 76L62 111m50-35l-14 35" fill="none" stroke="#977d65" /><path d="M65 80l3 31m25-31l-3 31" fill="none" stroke="#cfb78d" strokeWidth="2" />
          <path d="M79 8q-49 0-49 34q0 25 35 46h29q35-22 35-46q0-34-50-34Z" fill="#dc9c94" />
          <path d="M79 8Q48 8 49 42q1 26 20 46h10V8Z" fill="#f3d596" stroke="none" /><path d="M79 8q31 0 30 34q-1 26-20 46H79Z" fill="#8cbabb" stroke="none" />
          <path d="M79 8q-16 18-15 36q1 23 12 44h7q12-24 12-44q0-24-16-36Z" fill="#f5e4bd" stroke="none" />
          <path d="M79 8Q48 8 49 42q1 26 20 46m10-80q31 0 30 34q-1 26-20 46M79 8q-16 18-15 36q1 23 12 44m3-80q16 12 16 36q0 20-12 44" fill="none" strokeWidth="1.7" />
          <path d="M34 36q44 14 92 0m-82 29q34 14 71 0" fill="none" stroke="#fff0cd" strokeWidth="4" />
          <path d="M73 28q3-8 6-14" stroke="#fff9e7" strokeWidth="4" /><path d="M65 88h29" stroke="#a27665" strokeWidth="4" />
          <path className="visitor-balloon-flame" d="M73 104q-5-7 2-13l4-10l5 12q7 7 1 11Z" fill="#edb760" stroke="#c47c62" strokeWidth="1.5" /><path d="M78 102q-3-5 2-11l3 10" fill="#fff0bb" stroke="none" />
          <path d="M60 109h40l-5 23H65Z" fill="#c29d76" stroke="#896e59" /><path d="M63 115h34m-33 7h31m-27-12l3 21m7-21v22m9-22l-2 21m8-21l-3 21" stroke="#e5c598" strokeWidth="1.8" /><path d="M59 109h42" stroke="#896e59" strokeWidth="4" />
        </g>
      </g>;
    case 'fox':
      return <g className="visitor-art visitor-fox" stroke="#886256" strokeWidth="2.5">
        <ellipse cx="80" cy="130" rx="59" ry="5" fill="#45575e30" stroke="none" />
        <g className="visitor-fox-body">
          <path className="visitor-fox-tail" d="M89 91q23 1 36-32q26 21 18 49q-6 26-52 15l-15-13Z" fill="#d79370" /><path className="visitor-fox-tail-tip" d="M125 59q25 20 18 47l-12-6l-4-12l-12-3Z" fill="#f5e1c0" />
          <path d="M49 71q34-15 50 19l8 31H47Z" fill="#d79370" /><path d="M57 76q15-4 20 12l-5 32H48Z" fill="#f3ddbe" stroke="none" />
          <path d="M48 101l-7 27h16l6-26m19-4l5 30h17l-8-29" fill="#b07c65" /><path d="M42 126h15m31 0h16" stroke="#635858" strokeWidth="5" />
          <g className="visitor-fox-head">
            <path d="M33 51L25 15l28 21m30 0l25-21l-5 40" fill="#d79370" /><path d="M33 28l6 18l12-7m40 1l8-13l-2 19" fill="#d2a0a0" stroke="none" />
            <path d="M30 46q28-25 63-9q15 7 15 23L70 85L31 66Z" fill="#d79370" /><path d="M31 54l28 7l10 15l11-15l28-8q-7 25-39 31q-28-7-38-30Z" fill="#f7e6ca" stroke="none" />
            <path d="M59 74q10-6 19 0l-9 9Z" fill="#574e4d" stroke="none" /><Eye cx={49} cy={51} /><Eye cx={88} cy={51} />
            <path d="M69 82v5m-7-1q7 5 14 0m-39-24l9 3m45 0l9-3" fill="none" strokeWidth="1.7" /><path d="M48 40l7-3m27 0l7 3" stroke="#b57b61" strokeWidth="2" />
          </g>
        </g>
      </g>;
    case 'badger':
      return <g className="visitor-art visitor-badger" stroke="#62646a" strokeWidth="2.5">
        <ellipse cx="80" cy="129" rx="60" ry="6" fill="#45575e30" stroke="none" />
        <g className="visitor-badger-leaves" fill="#9ab294" stroke="#6f8b75" strokeWidth="2"><path d="M13 120q-5-18 17-12q-2 14-17 12Zm119 7q-2-22 19-14q-2 16-19 14Z" /><path d="M15 118l10-7m111 12l9-7" /></g>
        <g className="visitor-badger-body">
          <path d="M114 83q27-3 22 16l-18 6" fill="#969b9b" />
          <path d="M39 94l-5 30h18l8-26m34 0l6 26h17l-6-33" fill="#5c626b" /><path d="M36 123l1 5m6-5l1 5m61-5l1 5m6-5l1 5" stroke="#d8d6c3" strokeWidth="2" />
          <path d="M31 75q15-27 56-20q41 9 38 39q-1 26-47 23q-51-1-47-42Z" fill="#a3aaa6" /><path d="M78 62q20 1 30 13m-30-2l21 7m-17 4l21 7m-22 5l17 3" stroke="#c4cac0" strokeWidth="2" />
          <g className="visitor-badger-head">
            <circle cx="34" cy="44" r="12" fill="#727d81" /><circle cx="81" cy="43" r="12" fill="#727d81" /><circle cx="34" cy="44" r="6" fill="#d7b8b3" stroke="none" /><circle cx="81" cy="43" r="6" fill="#d7b8b3" stroke="none" />
            <path d="M28 53q0-22 29-22q27 0 33 23q4 15-30 44q-35-25-32-45Z" fill="#f0e8d5" /><path d="M37 38q12-4 12 8L45 67l11 22q-18-8-22-26Z M73 36q-12-1-11 10l6 20l-7 23q19-12 22-27Z" fill="#56616c" stroke="none" />
            <Eye cx={42} cy={55} /><Eye cx={75} cy={54} /><path d="M53 82q7-6 14 0l-7 8Z" fill="#404e58" stroke="none" /><path d="M60 90v4m-9-2q9 7 17-1m-27-17l-13 1m49-1l13 1" fill="none" strokeWidth="1.5" />
          </g>
        </g>
      </g>;
    case 'moth':
      return <g className="visitor-art visitor-moth" stroke="#618776" strokeWidth="2.5">
        <g className="visitor-moth-wings" fill="#a6cfa2">
          <g className="visitor-moth-wing-left">
            <path d="M76 55Q39 8 11 22q-5 34 19 52q-16 31 12 32l9 25q11-3 4-34l21-20Z" />
            <path d="M71 57Q37 28 18 26q2 24 16 37l26 7Z" fill="#c8dfac" stroke="none" /><path d="M35 82q0 20 12 15l9 31q4-5-2-30l14-19Z" fill="#85bba0" stroke="none" />
            <path d="M14 24q23-5 59 33M30 72l35 4m-32 5l25 5" fill="none" stroke="#8ca586" strokeWidth="2" />
            <ellipse cx="40" cy="53" rx="12" ry="10" fill="#daca8b" stroke="#7a9b87" /><ellipse cx="41" cy="53" rx="7" ry="6" fill="#719d99" stroke="none" /><ellipse cx="42" cy="53" rx="3" ry="4" fill="#465f69" stroke="none" /><circle cx="43" cy="51" r="1.5" fill="#faf0c9" stroke="none" />
            <ellipse cx="44" cy="85" rx="7" ry="5" fill="#daca8b" /><circle cx="44" cy="85" r="2.5" fill="#557b78" stroke="none" />
          </g>
          <g className="visitor-moth-wing-right">
            <path d="M84 55q37-47 65-33q5 34-19 52q16 31-12 32l-9 25q-11-3-4-34L84 77Z" />
            <path d="M89 57q34-29 53-31q-2 24-16 37l-26 7Z" fill="#c8dfac" stroke="none" /><path d="M125 82q0 20-12 15l-9 31q-4-5 2-30L92 79Z" fill="#85bba0" stroke="none" />
            <path d="M146 24q-23-5-59 33m43 15l-35 4m32 5l-25 5" fill="none" stroke="#8ca586" strokeWidth="2" />
            <ellipse cx="120" cy="53" rx="12" ry="10" fill="#daca8b" stroke="#7a9b87" /><ellipse cx="119" cy="53" rx="7" ry="6" fill="#719d99" stroke="none" /><ellipse cx="118" cy="53" rx="3" ry="4" fill="#465f69" stroke="none" /><circle cx="117" cy="51" r="1.5" fill="#faf0c9" stroke="none" />
            <ellipse cx="116" cy="85" rx="7" ry="5" fill="#daca8b" /><circle cx="116" cy="85" r="2.5" fill="#557b78" stroke="none" />
          </g>
        </g>
        <g className="visitor-moth-body">
          <path d="M72 60l-9 10m9-3l-7 15m23-22l9 10m-9-3l7 15" stroke="#9caa7b" strokeWidth="2" />
          <path d="M71 48q9-7 18 0l-1 36l-8 12l-8-12Z" fill="#e5dfb1" /><path d="M75 68h10m-10 9h10m-8 9h6" stroke="#b7bd8c" strokeWidth="2" />
          <path d="M71 41q-13-8-10-23q12 0 17 20m11 3q13-8 10-23q-12 0-17 20" fill="#dbc896" stroke="#a18e76" strokeWidth="2" /><path d="M64 23l8 14m-6-8l7 1m-4 4l7 1m20-12l-8 14m6-8l-7 1m4 4l-7 1" stroke="#f1e2b6" strokeWidth="1.5" />
          <path d="M69 43l4-4l3 2l4-3l4 3l3-2l4 4l-1 10l-5 4H75l-5-4Z" fill="#f3eccc" /><Eye cx={75} cy={46} radius={2.5} /><Eye cx={85} cy={46} radius={2.5} /><path d="M77 52q3 2 6 0" fill="none" strokeWidth="1.5" />
        </g>
      </g>;
    case 'shootingStar':
      return <g className="visitor-art visitor-shooting-star" stroke="#b08162" strokeWidth="2.5">
        <g className="visitor-meteor-body">
          <g className="visitor-meteor-ribbon">
            <path d="M67 88Q48 49 9 18q48 2 88 62Z" fill="#e5a69b" stroke="#ab7378" /><path d="M67 88Q49 63 15 44q42-6 74 41Z" fill="#efce8e" /><path d="M76 91Q60 66 37 52q28 1 49 32" fill="#fff0bb" stroke="none" />
            <path d="M25 25q23 8 41 30m-38-6l17 9" fill="none" stroke="#f9d9b7" strokeWidth="3" />
            <path d="M27 72l-9-6m37-51l8 8m-18 78l-11-5" stroke="#c9b9d0" strokeWidth="3" />
          </g>
          <path d="M105 53l9 24l27 3l-20 19l5 27l-24-13l-24 13l4-27l-19-19l27-4Z" fill="#f5d68f" /><path d="M105 53l-1 25l-20 6l10 9l-3 20l11-10l17 11l-7-17l15-13l-18 1Z" fill="#ffe8ac" stroke="none" />
          <path d="M95 77l7-13" stroke="#fff5d2" strokeWidth="4" /><Eye cx={94} cy={90} radius={4} /><Eye cx={115} cy={90} radius={4} />
          <ellipse cx="88" cy="100" rx="5" ry="3" fill="#dfa49a" stroke="none" /><ellipse cx="122" cy="100" rx="5" ry="3" fill="#dfa49a" stroke="none" /><path d="M98 102q6 8 13 0" fill="none" stroke="#966955" strokeWidth="2.5" />
        </g>
        <g className="visitor-meteor-sparks" fill="#f5dfac" stroke="#aaa1b6" strokeWidth="1.5"><path d="M130 24l3 8l8 3l-8 3l-3 8l-3-8l-8-3l8-3Z M29 110l2 6l6 2l-6 2l-2 6l-2-6l-6-2l6-2Z" /><circle cx="145" cy="59" r="2.5" fill="#ccddd5" /><circle cx="67" cy="16" r="2" fill="#e8bac4" /></g>
      </g>;
    case 'dove':
      return <g className="visitor-art visitor-dove" stroke="#87959d" strokeWidth="2.5">
        <path d="M19 121q59-13 123-4m-21-2l12-14" stroke="#a18b74" strokeWidth="7" /><path d="M131 104q-2-22 21-20q-2 17-21 20Z" fill="#afc29c" stroke="#7c9b7d" /><path d="M136 97l10-8" stroke="#d8e1bb" strokeWidth="2" />
        <g className="visitor-dove-body">
          <path d="M91 82l46 9l-13 12l-26-6l31 14l-14 7l-33-23" fill="#d7dfdc" /><path d="M108 99l16 7" stroke="#aabfc0" strokeWidth="2" />
          <path d="M45 60q26-20 48 4q26 31 2 44q-40 11-60-18Z" fill="#f8f0dd" /><path d="M40 81q-4 22 28 26q15 0 23-6" fill="#e9dfcf" stroke="none" />
          <g className="visitor-dove-wing"><path d="M65 66q27-15 45 28q-10 13-34 4q-12-7-11-32Z" fill="#e2e9e0" /><path d="M75 73l20 22m-21-10l13 15m3-21l13 15" fill="none" stroke="#b9caca" strokeWidth="2" /><path d="M72 70q9-2 14 5" stroke="#fff9e9" strokeWidth="3" /></g>
          <path d="M58 107l-2 11l-9 4m11-4l6 3m14-14v10l9 3m-10-3l-7 4" stroke="#bf9990" strokeWidth="3" />
          <g className="visitor-dove-head">
            <path d="M36 60q-8 21 7 31l20-13l-6-20" fill="#f8f0dd" /><circle cx="44" cy="45" r="23" fill="#f8f0dd" /><path d="M24 45L9 52l17 6Z" fill="#c6a59b" stroke="#957d80" /><Eye cx={37} cy={41} /><path d="M49 29q9 3 11 10" fill="none" stroke="#ffffff" strokeWidth="3" />
            <path d="M38 65q11 4 20-3" stroke="#c9d9d4" strokeWidth="4" /><ellipse cx="43" cy="54" rx="5" ry="3" fill="#e5ccbf" stroke="none" />
          </g>
        </g>
      </g>;
    case 'deer':
      return <g className="visitor-art visitor-deer" stroke="#8a715f" strokeWidth="2.5">
        <ellipse cx="81" cy="130" rx="60" ry="5" fill="#345c4930" stroke="none" />
        <g className="visitor-deer-body">
          <path className="visitor-deer-tail" d="M118 68q22-12 25-1q-7 18-23 16" fill="#ecdbb8" />
          <path d="M61 93l-4 34h9l8-33m34-3l5 36h9l-5-41" fill="#ba9675" /><path d="M57 126h10m47 0h9" stroke="#6d6661" strokeWidth="5" />
          <path d="M52 68q29-18 63-5q23 16 10 37q-26 13-63-1L44 81Z" fill="#d0ab83" /><path d="M63 94q31 14 58-1l-1 10q-28 10-54-3Z" fill="#ead5b2" stroke="none" />
          <path d="M52 91l-8 36h10l10-34m30 1l5 33h10l-6-36" fill="#d0ab83" /><path d="M44 127h11m44 0h11" stroke="#6d6661" strokeWidth="5" />
          <g fill="#f9e6c5" stroke="none"><ellipse cx="73" cy="70" rx="4" ry="3" /><ellipse cx="89" cy="67" rx="4" ry="3" /><ellipse cx="104" cy="70" rx="4" ry="3" /><ellipse cx="67" cy="82" rx="3" ry="2.5" /><ellipse cx="83" cy="80" rx="4" ry="3" /><ellipse cx="99" cy="83" rx="3" ry="2.5" /><ellipse cx="114" cy="81" rx="3" ry="2.5" /></g>
          <path d="M45 46q-7 22-4 44l18 10l9-30l-8-23" fill="#d0ab83" /><path d="M45 63l4 25l7 6l4-20" fill="#efddbc" stroke="none" />
          <g className="visitor-deer-head">
            <g className="visitor-deer-antlers" fill="none" stroke="#a18c77" strokeWidth="3.5"><path d="M44 30L33 16l-1-12m5 16l-13-7l-2-7m12 8l9-8m19 24l9-15V4m-5 18l15-9l3-7m-12 8l-8-7" /></g>
            <g className="visitor-deer-ears" fill="#d0ab83"><path d="M36 37Q8 17 12 39q7 15 26 10m25-12q27-21 24 1q-5 15-25 13" /><path d="M19 34l14 10m34 1l12-11" stroke="#d9aca6" strokeWidth="5" /></g>
            <path d="M35 37q17-13 33 0l-2 29q-3 14-15 16q-16-3-18-17Z" fill="#d0ab83" /><path d="M40 62q10-7 20 0l-2 12q-6 8-15 0Z" fill="#efddbc" stroke="none" />
            <Eye cx={40} cy={50} /><Eye cx={61} cy={50} /><path d="M46 65q5-3 10 0l-5 6Z" fill="#6d5d55" stroke="none" /><path d="M51 71v4m-5-1q5 5 10 0" fill="none" strokeWidth="1.5" /><path d="M48 39l3 5l3-5" stroke="#f5dfbb" strokeWidth="3" />
          </g>
        </g>
      </g>;
    default:
      return null;
  }
}
