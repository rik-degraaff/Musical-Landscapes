import React from 'react';
import {ART} from '../data/artStyle';

export function PracticeRoomArt() {
  return (
    <svg className="practice-room-art" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 0H1440V900H0Z" fill={ART.teal} />
      <path d="M0 0H1440V132L720 46 0 132Z" fill={ART.tealShade} />
      <path d="M0 132L720 46 1440 132V728H0Z" fill={ART.cream} />
      <path d="M0 132L172 112V728H0ZM1268 112L1440 132V728H1268Z" fill={ART.teal} />
      <g fill="none" stroke={ART.paper} strokeWidth="3">
        {[226, 342, 458, 574, 690, 806, 922, 1038, 1154].map(position => (
          <path key={position} d={`M${position} 114V727`} />
        ))}
        <path d="M12 244H158M12 402H158M12 560H158M1282 244H1428M1282 402H1428M1282 560H1428" />
      </g>
      <path d="M0 728H1440V900H0Z" fill={ART.wood} />
      <path d="M0 728H1440V750H0Z" fill={ART.tealShade} />
      <g fill="none" stroke={ART.woodShade} strokeWidth="3">
        <path d="M0 790H1440M0 842H1440M0 894H1440M220 750L106 900M478 750L424 900M720 750V900M962 750L1016 900M1220 750L1334 900" />
      </g>
      <g fill={ART.wood} stroke={ART.woodShade} strokeWidth="3" strokeLinejoin="round">
        <path d="M0 78L720 0 1440 78V111L720 36 0 111Z" />
        <path d="M153 92H185V748H153ZM1255 92H1287V748H1255Z" />
        <path d="M0 188H1440V218H0Z" />
        <path d="M181 211L291 316 274 334 181 250ZM1258 211L1148 316 1165 334 1258 250Z" />
      </g>
      <g fill="none" stroke={ART.gold} strokeWidth="4" strokeLinecap="round">
        <path d="M18 91L710 17M735 19L1422 91M162 121V687M1265 128V685M24 198H1400M197 239L270 310M1245 239L1171 310" />
      </g>
      <g strokeLinejoin="round">
        <path d="M1063 273H1237V514H1063Z" fill={ART.tealShade} />
        <path d="M1049 256H1223V496H1049Z" fill={ART.coral} stroke={ART.coralShade} strokeWidth="5" />
        <path d="M1066 275H1206V477H1066Z" fill={ART.blue} />
        <circle cx="1170" cy="311" r="23" fill={ART.gold} />
        <path d="M1080 318q-10-15 5-22q8-15 21-4q19-4 21 14q9 11-2 12Z" fill={ART.paper} />
        <path d="M1066 404q39-40 82-19q31-24 58-3V477H1066Z" fill={ART.leaf} />
        <path d="M1066 439q78-46 140-15V477H1066Z" fill={ART.leafShade} />
        <g stroke={ART.cream} strokeWidth="4" fill="none">
          <path d="M1066 445H1206M1066 459H1206M1083 432V472M1114 432V472M1145 432V472M1176 432V472" />
        </g>
        <path d="M1136 275V477M1066 365H1206" stroke={ART.cream} strokeWidth="7" />
        <path d="M1040 496H1232V513H1040Z" fill={ART.coral} stroke={ART.coralShade} strokeWidth="3" />
        <path d="M1057 261H1216M1055 503H1220" fill="none" stroke={ART.pink} strokeWidth="4" />
      </g>
      <g transform="translate(222 546)" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="49" cy="203" rx="64" ry="9" fill={ART.ink} opacity=".10" />
        <path d="M49 93V179M49 171L6 201M49 171L91 201" fill="none" stroke={ART.tealShade} strokeWidth="7" />
        <path d="M0 0H103L115 88H-12Z" fill={ART.tealShade} stroke={ART.ink} strokeWidth="4" />
        <path d="M11 11H91L99 70H3Z" fill={ART.paper} />
        <g stroke={ART.softInk} strokeWidth="2" fill="none">
          <path d="M16 27H82M14 34H84M13 41H85M12 48H86M11 55H87" />
        </g>
        <path d="M39 24V49q-14-4-13 4q2 8 13 1V29l20-5v21q-12-3-12 5q2 8 12 1V18Z" fill={ART.tealShade} />
        <path d="M-15 87H118" stroke={ART.tealShade} strokeWidth="8" />
      </g>
      <g strokeLinejoin="round">
        <ellipse cx="1168" cy="788" rx="97" ry="13" fill={ART.ink} opacity=".10" />
        <path d="M1081 756q9-33 53-31l71 5q40 3 48 37q-83 32-172-11Z" fill={ART.coral} stroke={ART.coralShade} strokeWidth="3" />
        <path d="M1081 756q87 25 172 11l-4 16q-91 24-164-10Z" fill={ART.coralShade} />
        <path d="M1115 721q2-28 37-27l63 6q32 5 32 30q-59 26-132-9Z" fill={ART.gold} stroke={ART.goldShade} strokeWidth="3" />
        <path d="M1130 717q39 13 97 6M1101 754q65 15 131 10" fill="none" stroke={ART.cream} strokeWidth="3" />
      </g>
      <g transform="translate(71 641)" strokeLinecap="round">
        <path d="M0 44H52L44 106H9Z" fill={ART.coral} stroke={ART.coralShade} strokeWidth="3" />
        <path d="M26 48V-22M26 19Q0-11-4 8q3 23 30 20M26 1Q49-29 57-10q1 23-31 29" fill={ART.leaf} stroke={ART.leafShade} strokeWidth="4" />
        <path d="M4 51H48" stroke={ART.pink} strokeWidth="4" />
      </g>
      <g fill={ART.cream} stroke={ART.tealShade} strokeWidth="3">
        <path d="M359 293H419V349H359Z" />
        <path d="M365 298L413 343M413 298L365 343" stroke={ART.coral} strokeWidth="4" />
      </g>
    </svg>
  );
}