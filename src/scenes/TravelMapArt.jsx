import React from 'react';
import { ChildAvatar } from '../components/ChildAvatar';
import { ART, ART_STROKE } from '../data/artStyle';
import { normalizeAvatar } from '../utils/children';
import './travel-map-art.css';

export const MAP_WIDTH = 900;
export const MAP_HEIGHT = 400;
export const MAP_DESTINATIONS = {
  farm: { x: 198, y: 205 },
  jungle: { x: 702, y: 205 },
};

const paperEdge = 'M21 29 302 12 445 29 605 13 873 28Q886 29 885 41L876 363Q876 374 864 375L604 388 451 373 301 388 27 374Q15 374 15 362L12 42Q12 30 21 29Z';
const farmLane = 'M198 166C195 207 246 244 304 266';
const centralRoad = 'C348 290 368 274 398 263S480 241 520 258S568 275 596 263';
const jungleLane = 'C647 245 702 216 702 174';
export const MAP_ROAD = `M304 266${centralRoad}`;

function FarmLandmark() {
  return <g transform="translate(198 165)">
    <path d="M-128 4C-108-41-62-52-19-38 30-63 83-41 122-1 91 15 58 20 15 15-34 22-99 19-128 4Z" fill="#cdd7ab" />
    <path d="M-126 5C-112-20-73-27-27-13-42 1-64 14-104 16Z" fill="#d9bf7e" />
    <path d="M-118 6Q-98-14-59-10M-108 11Q-90-5-66-5" fill="none" stroke={ART.goldShade} strokeWidth="2" opacity=".65" />
    <path d="M-71 4H-45M-71 11H-45M-67-1v16m16-16v16M50 4H90M50 11H90M55-1v16m15-16v16m15-16v16" fill="none" stroke="#aa9469" strokeWidth="2.5" />
    <path d="M-106-11v-24m0 13-10-9m10 7 10-10" fill="none" stroke={ART.woodShade} strokeWidth="3" />
    <path d="M-124-32C-137-39-126-55-118-55-121-71-98-73-93-60-78-61-72-44-84-37-88-22-110-24-124-32Z" fill={ART.leaf} />
    <path d="M-42 7v-49L0-66 42-42V7Z" fill={ART.coral} stroke={ART.ink} strokeWidth="2" />
    <path d="M-49-39-32-62 0-77 32-62 49-39 39-36 25-54 0-66-25-54-39-36Z" fill={ART.coralShade} stroke={ART.ink} strokeWidth="2" />
    <path d="M-16 7v-30h32V7" fill={ART.woodShade} stroke={ART.cream} strokeWidth="2.5" />
    <path d="m-14-21 28 26m0-26L-14 5" fill="none" stroke={ART.cream} strokeWidth="2" />
    <rect x="-7" y="-53" width="14" height="13" rx="2" fill={ART.gold} stroke={ART.ink} strokeWidth="1.5" />
    <path d="M-32-26h6m52 0h6" fill="none" stroke={ART.cream} strokeWidth="2" />
  </g>;
}

function Palm({ transform }) {
  return <g transform={transform}>
    <path d="M-8 0Q-1-24-2-55L5-55Q8-20 5 0Z" fill={ART.wood} stroke={ART.woodShade} strokeWidth="1.6" />
    <path d="M2-52C-11-67-26-62-38-47-23-52-11-52 2-52 0-64-9-76-26-76-17-82 1-79 4-65 12-81 29-80 36-71 26-72 15-67 8-56 21-66 36-60 44-47 30-53 22-53 8-52 23-46 28-36 25-25 18-36 11-45 3-51Z" fill={ART.leafShade} />
    <path d="M-4-51C-12-50-20-44-22-36-14-41-7-43-1-44Z" fill={ART.leaf} />
  </g>;
}

function JungleLandmark() {
  return <g transform="translate(702 165)">
    <path d="M-126 10C-115-17-90-33-56-32-35-57-4-62 19-44 63-50 103-26 121 5 84 21 46 22 3 19-45 23-93 24-126 10Z" fill="#becfa4" />
    <path d="M38-21C78-15 79 0 59 7 36 16 64 27 103 19 80 37 28 35 26 19 23 3 67 1 38-21Z" fill={ART.teal} />
    <path d="M53-9Q81 1 58 9T67 25" fill="none" stroke={ART.paper} strokeWidth="2" opacity=".55" />
    <path d="M-63 0v-42h8V0Z" fill={ART.woodShade} />
    <path d="M-93-37C-104-57-91-69-78-67-72-85-47-87-41-69-23-73-16-55-24-42-32-27-45-28-59-33-72-22-94-26-93-37Z" fill={ART.leaf} />
    <path d="M-89-40q16 7 30-5 17 11 30-1" fill="none" stroke={ART.leafShade} strokeWidth="2" opacity=".55" />
    <Palm transform="translate(31 11) scale(1.08)" />
    <Palm transform="translate(-19 12) scale(.78)" />
    <path d="M-99 12Q-120 5-116-8-104-7-99 4-100-11-88-13-81-1-97 12M94 11q-11-12-5-21 12 5 10 15 4-14 16-12 2 10-16 18" fill={ART.leafShade} opacity=".8" />
  </g>;
}

export function TravelMapArt({ roadRef, ...props }) {
  return <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true" {...props}>
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d={paperEdge} transform="translate(0 6)" fill={ART.woodShade} opacity=".29" />
      <path d={paperEdge} fill={ART.paper} />
      <path d="M302 12 445 29 451 373 301 388Z" fill="#efe1bf" />
      <path d="M445 29 605 13 604 388 451 373Z" fill="#f8edd2" />
      <path d="M605 13 873 28Q886 29 885 41L876 363Q876 374 864 375L604 388Z" fill="#f3e7c8" />
      <path d="M19 319C123 298 151 294 217 309S335 350 416 320 495 291 560 315 690 345 740 303 821 265 879 273L876 363Q876 374 864 375L604 388 451 373 301 388 27 374Q15 374 15 362Z" fill="#d5d8a7" opacity=".34" />
      <path d="M17 78C58 91 95 54 144 57M18 94C78 108 108 69 161 77M734 58q67 24 107 16M792 226q44-23 85-17M804 241q42-21 73-15" fill="none" stroke="#9eaa7f" strokeWidth="1.6" opacity=".42" />
      <path d="M348 141q22-33 53-27 17-23 47-15 22-10 49 3 20-5 39 22-38-14-79-3-50-5-109 20Z" fill="#d6d8ac" opacity=".58" />
      <path d="M379 139q25-17 48-13m41-3q21-7 41 0" fill="none" stroke="#9eaa7f" strokeWidth="1.7" opacity=".45" />
      <path d="M302 13 301 388m144-359 6 344m154-360-1 375" fill="none" stroke="#a18b65" strokeWidth="2" opacity=".30" />
      <path d="M299 15 298 385m150-355 6 343m148-359-1 372" fill="none" stroke={ART.paper} strokeWidth="2" opacity=".78" />
      <g fill="none">
        <path d={`${farmLane}${centralRoad}${jungleLane}`} stroke="#c1a772" strokeWidth="23" />
        <path d={`${farmLane}${centralRoad}${jungleLane}`} stroke="#e9d19e" strokeWidth="18" />
        <path ref={roadRef} d={MAP_ROAD} stroke="#bb9962" strokeWidth="2" strokeDasharray="5 9" />
      </g>
      <FarmLandmark />
      <JungleLandmark />
      <g transform="translate(78 312)" fill="none" stroke="#a9976b" strokeWidth="1.5" opacity=".75">
        <circle r="24" />
        <path d="M0-32v6m32 26h-6M0 32v-6m-32-26h6" />
        <path d="M8-14 4 6-8 14-4-6Z" fill={ART.cream} />
        <path d="M8-14 4 6-4-6Z" fill={ART.coral} />
      </g>
      <path d="M678 348q20-16 48-13m10-5q22-9 45-7m27 12q26-12 52-8M138 331q38-15 80-1" fill="none" stroke="#a2ad81" strokeWidth="1.7" opacity=".45" />
      <path d={paperEdge} fill="none" stroke="#b39a70" strokeWidth="2" />
    </g>
  </svg>;
}

function BikeWheels() {
  return <>
    <ellipse cx="80" cy="131" rx="70" ry="3" fill={ART.ink} opacity=".14" stroke="none" />
    {[35, 125].map(x => <g key={x} transform={`translate(${x} 106)`}>
      <circle r="22" fill="none" stroke={ART.ink} strokeWidth="4" />
      <circle r="19.5" fill="none" stroke={ART.cream} strokeWidth="2.5" />
      <g className="travel-bike-spokes" fill="none" stroke={ART.softInk} strokeWidth={ART_STROKE.detail}>
        <path d="M0-18V18M-16-9l32 18m0-18-32 18" />
      </g>
      <circle r="3.5" fill={ART.gold} stroke={ART.ink} strokeWidth={ART_STROKE.detail} />
    </g>)}
  </>;
}

function BikeFrame({ parked }) {
  const tubes = 'M35 106 59 76 77 106 35 106M59 76 107 75 77 106M106 73l19 33M59 76l-5-14';
  return <g fill="none" stroke={ART.ink}>
    {parked && <path d="m76 107-10 21h5" strokeWidth="3" />}
    <path d={tubes} strokeWidth="6.5" />
    <path d={tubes} stroke={ART.teal} strokeWidth="4" />
    <path d="M107 74 101 60q-2-8 5-8h9M44 62q10-5 21-2l-1 5H46Z" fill={ART.wood} strokeWidth={ART_STROKE.outline} />
    <path d="M103 53h10" strokeWidth="4" />
    <path d="M115 54c0-7 8-7 8 0Z" fill={ART.gold} strokeWidth={ART_STROKE.detail} />
    <path d="M113 57h29l-5 17h-19Z" fill={ART.wood} strokeWidth={ART_STROKE.outline} />
    <path d="M117 62h21m-19 6h17m-13-9 2 12m9-12-2 12" stroke={ART.woodShade} strokeWidth={ART_STROKE.detail} />
    <circle cx="77" cy="106" r="5.5" fill={ART.gold} strokeWidth={ART_STROKE.detail} />
    <g className="travel-bike-crank" strokeWidth="2.5">
      <path d="m67 97 20 18m-25-18h11m8 18h11" />
    </g>
  </g>;
}

export function BicycleDrawing() {
  return <g strokeLinecap="round" strokeLinejoin="round">
    <BikeWheels />
    <BikeFrame parked />
  </g>;
}

function RiderLeg({ look, far = false }) {
  const leg = far ? 'M59 64 72 79 64 93' : 'M59 65 85 80 82 109';
  const cuff = far ? 'M69 83 64 93' : 'M84 88 82 109';
  const cuffColor = look.bottom === 'shorts' || look.bottom === 'skirt' ? look.skin : look.bottomPrimary;
  const shoe = far
    ? 'M61 91q4 2 7 0l7 4v3H61q-3-2 0-7Z'
    : 'M78 107q4 3 9 1l7 5v3H78q-4-3 0-9Z';
  return <g className={`travel-bike-leg travel-bike-leg--${far ? 'far' : 'near'}`} stroke={ART.ink}>
    <path d={leg} fill="none" strokeWidth={far ? 10 : 12} />
    <path d={leg} fill="none" stroke={look.bottomPrimary} strokeWidth={far ? 7.5 : 9.5} />
    <path d={cuff} fill="none" stroke={cuffColor} strokeWidth={far ? 7.5 : 9.5} />
    <path d={shoe} fill={ART.paper} strokeWidth="1.8" />
    <path d={far ? 'M61 96h12' : 'M79 113h13'} stroke={look.bottomSecondary} strokeWidth="1.6" />
  </g>;
}

function RiderBody({ look }) {
  const sleeve = look.top === 'overalls' ? look.topSecondary : look.topPrimary;
  const arm = look.top === 'tee' || look.top === 'overalls' ? look.skin : sleeve;
  return <g stroke={ART.ink} strokeWidth="2">
    <path d="M80 47q11 4 18 7l10-1" fill="none" strokeWidth="8" />
    <path d="M80 47q11 4 18 7l10-1" fill="none" stroke={arm} strokeWidth="5.5" />
    <path d="M52 63q3-16 15-24l12 3q8 5 4 10l-9 7-9 13q-7 1-13-9Z" fill={look.topPrimary} />
    <path d="M69 40q-1 7 8 10m-23 13 11 6" fill="none" stroke={look.topSecondary} strokeWidth="3" />
    {look.top === 'hoodie' && <path d="M67 39q-12-1-10 7 2 6 12 0Z" fill={look.topSecondary} />}
    {look.top === 'overalls' && <path d="m59 48 4 5 11-7" fill="none" stroke={look.topSecondary} strokeWidth="3" />}
    {look.top === 'cardigan' && <path d="m70 52-8 11" fill="none" stroke={look.topSecondary} strokeWidth="3" />}
    {look.top === 'sweater' && <path d="m62 53 10 7" fill="none" stroke={look.topSecondary} strokeWidth="3" />}
    {look.bottom === 'skirt' && <path d="M52 61q9 5 18 7l-8 12q-11-1-17-8Z" fill={look.bottomPrimary} />}
    <path d="M73 49q8 8 14 13l17-8" fill="none" strokeWidth="10" />
    <path d="M73 49q8 8 14 13l17-8" fill="none" stroke={arm} strokeWidth="7.5" />
    <path d="m73 49 5 5" fill="none" stroke={sleeve} strokeWidth="7.5" />
    <circle cx="106" cy="54" r="4.5" fill={look.skin} />
  </g>;
}

export function BikeRider({ child, travelling, className = '', ...props }) {
  const look = normalizeAvatar(child?.avatar);
  return <svg viewBox="0 0 160 140" aria-hidden="true" className={`travel-bike-rider${travelling ? ' is-travelling' : ''} ${className}`} {...props}>
    <g strokeLinecap="round" strokeLinejoin="round">
      <BikeWheels />
      <RiderLeg look={look} far />
      <BikeFrame />
      <RiderLeg look={look} />
      <RiderBody look={look} />
      <g transform="translate(79 27) rotate(9) scale(.72) translate(-65 -50)">
        <ChildAvatar avatar={look} age={child?.age} className="travel-bike-head" width="130" height="170" aria-hidden="true" />
      </g>
    </g>
  </svg>;
}
