import React from 'react';

export function YoungMusician({ equipped, accepting }) {
  return <div id="young-musician" className={`young-musician ${equipped?'equipped':''} ${accepting?'accepting':''}`} role="img" aria-label={equipped?`Child holding ${equipped}`:'Young musician'}>
    <svg viewBox="0 0 130 170" aria-hidden="true">
      <ellipse cx="65" cy="160" rx="43" ry="7" fill="#294b4226"/>
      <path d="M48 115l-5 35h19l4-31m6-4l4 35h19l-8-37" fill="#4e7e93"/>
      <path d="M39 149h24v12H33q-5-10 6-12m37 0h19q11 2 11 12H76Z" fill="#e1bd6a"/>
      <path d="M42 77q24-13 46 0l9 45H33Z" fill="#de866e"/>
      <path d="M43 85L25 109m62-24l19 24" stroke="#efc298" strokeWidth="13" strokeLinecap="round"/>
      <path d="M59 67v14q7 7 14 0V67" fill="#efc298"/>
      <ellipse cx="66" cy="45" rx="30" ry="33" fill="#f2c99e"/>
      <path d="M37 49Q19 8 59 5q49-11 38 44l-8-21q-21 7-29-5q-4 14-22 17Z" fill="#594946"/>
      <circle cx="53" cy="45" r="3" fill="#484543"/><circle cx="79" cy="45" r="3" fill="#484543"/>
      <path d="M56 59q10 10 20 0" stroke="#a46759" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <ellipse cx="45" cy="55" rx="5" ry="3" fill="#e8a28a"/><ellipse cx="86" cy="55" rx="5" ry="3" fill="#e8a28a"/>
      <path d="M52 87h27v11H52Z" fill="#fff1be"/>
    </svg>
  </div>;
}