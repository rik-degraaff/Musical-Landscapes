import React from 'react';

export function ObjectArt({ type }) {
  return <svg viewBox="0 0 160 140" className={`object-art art-${type}`} aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {type === 'moo' && <>
      <ellipse cx="79" cy="127" rx="57" ry="6" fill="#244f3633" /><path d="M37 89v31h12V93m49-4v31h12V89" stroke="#6b5550" strokeWidth="8" /><path d="M119 68q24 8 16 32" stroke="#6b5550" strokeWidth="5" />
      <path d="M30 58q-12 23 1 44h77q18-16 8-39q-38-17-86-5Z" fill="#ffefdc" stroke="#796757" strokeWidth="3" /><path d="M50 57q-10 23 11 24q21-4 20-23 M101 69q-29 8-12 29h20" fill="#595456" />
      <path d="M19 56L9 36L30 42m12-1L55 31L55 57" fill="#d6a7a0" stroke="#796757" strokeWidth="3" /><path d="M23 39l-4-12m23 11l5-12" stroke="#e5cb98" strokeWidth="7" /><path d="M19 43Q33 32 47 43l2 36q-16 17-34-1Z" fill="#ffefdc" stroke="#796757" strokeWidth="3" /><ellipse cx="31" cy="78" rx="21" ry="14" fill="#dfa6a0" /><circle cx="23" cy="77" r="3" fill="#796757" /><circle cx="39" cy="77" r="3" fill="#796757" /><path d="M23 54v3m16-3v3" stroke="#474249" strokeWidth="4" />
    </>}
    {type === 'tractor' && <>
      <path className="tractor-exhaust" d="M106 44q-13-12 1-19q17-10 6-21" stroke="#faf3d3" strokeWidth="11" opacity=".7" /><path d="M27 102V56h46v46" fill="#699aa1" stroke="#355e62" strokeWidth="5" /><path d="M22 51h57" stroke="#e7c67e" strokeWidth="9" /><path d="M77 68h48q14 0 14 17v23H56V89Z" fill="#d67657" stroke="#814f48" strokeWidth="3" /><path d="M105 65V42" stroke="#5e6060" strokeWidth="7" /><path d="M117 80v16m8-16v16m8-13v13" stroke="#8f5046" strokeWidth="3" /><path d="M31 57h37v27H31Z" fill="#c1e1dc" /><g className="tractor-wheel"><circle cx="42" cy="106" r="27" fill="#454e51" /><circle cx="42" cy="106" r="15" fill="#e4ba79" /><path d="M42 94v24m-12-12h24" stroke="#b08758" strokeWidth="4" /></g><g className="tractor-wheel"><circle cx="126" cy="114" r="18" fill="#454e51" /><circle cx="126" cy="114" r="9" fill="#e4ba79" /><path d="M126 108v12m-6-6h12" stroke="#b08758" strokeWidth="3" /></g>
    </>}
    {type === 'water' && <>
      <ellipse cx="91" cy="130" rx="43" ry="7" fill="#8cd3db88" /><path d="M47 132V50q0-11 13-11h30q17 0 17 18v9" stroke="#49787d" strokeWidth="18" /><path d="M48 126V50q0-7 12-7h30q13 0 13 14" stroke="#a9ceca" strokeWidth="7" /><path d="M59 35V23m-17 0h34" stroke="#d59569" strokeWidth="7" /><path d="M93 68h26" stroke="#49787d" strokeWidth="8" /><g className="water-stream" stroke="#bdebf0" strokeWidth="4"><path d="M103 77v44m9-37v34m-17-27v25" /><path d="M93 128l-11-10m30 7l10-12" /></g><path d="M106 80q-11 17 0 17q11 0 0-17Z" fill="#a3ddeb" />
    </>}
    {type === 'bird' && <>
      <path d="M22 99q50-25 107-10" stroke="#8a6853" strokeWidth="8" /><path d="M93 57l26-22l-2 40" fill="#547f97" /><ellipse cx="78" cy="67" rx="35" ry="29" fill="#81b4c8" /><path className="bird-wing" d="M77 57q-1 29 34 27q-12-28-34-27Z" fill="#527f9b" /><circle cx="49" cy="46" r="24" fill="#81b4c8" /><path d="M25 48L9 54L27 60" fill="#e5b369" /><circle cx="42" cy="43" r="4" fill="#384e5b" /><circle cx="43" cy="42" r="1.2" fill="#fff" /><path d="M65 91v12m17-11v10" stroke="#b5855c" strokeWidth="4" /><path d="M30 66q20 20 41 1" fill="#e9cead" />
    </>}
    {type === 'frog' && <>
      <ellipse cx="80" cy="121" rx="60" ry="11" fill="#3a8167" /><path d="M17 116q-7-37 29-35m68 0q36-2 30 35" fill="#699957" stroke="#3f754e" strokeWidth="4" /><ellipse cx="80" cy="86" rx="44" ry="32" fill="#89b966" /><circle cx="51" cy="53" r="20" fill="#89b966" /><circle cx="108" cy="53" r="20" fill="#89b966" /><circle cx="52" cy="51" r="12" fill="#fff5cf" /><circle cx="107" cy="51" r="12" fill="#fff5cf" /><circle cx="54" cy="52" r="6" fill="#334c43" /><circle cx="105" cy="52" r="6" fill="#334c43" /><ellipse className="frog-throat" cx="80" cy="100" rx="23" ry="13" fill="#d5df97" /><path d="M54 75q25 19 51 0" stroke="#3f754e" strokeWidth="3" /><path d="M30 118l-13 8m15-6l-1 12m96-14l13 8m-15-6l1 12" stroke="#699957" strokeWidth="6" />
    </>}
    {type === 'windmill' && <>
      <path d="M51 132L65 58h31l14 74Z" fill="#f5dfb4" stroke="#8c7c65" strokeWidth="3" /><path d="M60 59L81 30L103 59Z" fill="#c48268" /><path d="M75 132v-24q9-12 17 0v24" fill="#857b69" /><g className="windmill-sails" fill="#eec981" stroke="#a68257" strokeWidth="2"><path d="M81 65L53 10L69 4L89 62Z M81 65L137 37L144 54L85 73Z M81 65L108 123L91 129L73 69Z M81 65L24 95L17 77L77 58Z" /><circle cx="81" cy="65" r="8" fill="#ba8265" /></g>
    </>}
    {type === 'bell' && <>
      <path d="M31 19h102m-92 0v18" stroke="#947e6f" strokeWidth="7" /><g className="bell-body"><path d="M79 24v18" stroke="#b6a388" strokeWidth="5" /><path d="M43 99q13-16 13-39q0-23 24-23q25 0 25 23q0 23 13 39Z" fill="#ebbf69" stroke="#ae8050" strokeWidth="3" /><path d="M64 59q0-10 8-13v33" stroke="#ffe2a0" strokeWidth="6" /><path d="M79 102v15" stroke="#8e6746" strokeWidth="7" /><path d="M43 99h75" stroke="#f9d98a" strokeWidth="7" /></g>
    </>}
    {type === 'owl' && <>
      <path d="M20 125h122" stroke="#8e7664" strokeWidth="9" /><path d="M44 50L39 22L67 37 M92 37l27-15l-4 35" fill="#a5968a" /><ellipse cx="79" cy="79" rx="43" ry="45" fill="#a5968a" /><path d="M40 74q8 43 24 35V66m54 8q-8 43-24 35V66" fill="#756e72" /><path d="M79 47q-42-24-40 13q1 36 40 28q39 8 40-28q2-37-40-13Z" fill="#ebd9b9" /><g className="owl-eyes" fill="#4b5159"><circle cx="59" cy="62" r="10" /><circle cx="98" cy="62" r="10" /></g><g fill="#fff9df"><circle cx="61" cy="59" r="3" /><circle cx="100" cy="59" r="3" /></g><path d="M72 75l7 13l8-13" fill="#dca66a" /><path d="M62 119v9m33-9v9" stroke="#dca66a" strokeWidth="5" />
    </>}
  </svg>;
}