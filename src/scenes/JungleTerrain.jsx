import React from 'react';
import { ART } from '../data/artStyle';

export const JUNGLE_SKIES = {
  'jungle-clearing': ['#88cacc', '#f5e5b7'],
  'jungle-river': ['#76b7c6', '#cce1c8'],
  'jungle-canopy': ['#879db4', '#f4d39d'],
  'jungle-waterfall': ['#84bed4', '#dbe6c4'],
  'jungle-night': ['#282e4c', '#67758a'],
  'jungle-moonlit': ['#1e3044', '#5b8589'],
  'jungle-dawn': ['#a1adc5', '#f4d9b4'],
};

const LAND = {
  'jungle-clearing': {ridge:'#95aea0', forest:'#709a7e', ground:'#91ad72', shrub:'#618862', stem:'#66836a', tip:'#8da879'},
  'jungle-river': {ridge:'#90b3aa', forest:'#689b86', ground:'#89a583', shrub:'#5e8974', stem:'#5c8172', tip:'#92ad93'},
  'jungle-canopy': {ridge:'#a1aa7c', forest:'#708f63', ground:'#8da174', shrub:'#5d7e5e', stem:'#627c57', tip:'#9eac74'},
  'jungle-waterfall': {ridge:'#9ab9ac', forest:'#729c85', ground:'#91a982', shrub:'#648971', stem:'#63846e', tip:'#8eaa81'},
  'jungle-night': {ridge:'#495772', forest:'#405f67', ground:'#46756b', shrub:'#38605a', stem:'#4c7570', tip:'#658784'},
  'jungle-moonlit': {ridge:'#47646e', forest:'#3c6163', ground:'#426c64', shrub:'#365b58', stem:'#53766e', tip:'#71958a'},
  'jungle-dawn': {ridge:'#aab8a5', forest:'#94ad92', ground:'#a0ac87', shrub:'#739179', stem:'#738a74', tip:'#9db095'},
};

function isAfterDark(scene) {
  return scene === 'jungle-night' || scene === 'jungle-moonlit';
}

function ForestRims({ colors, dawn }) {
  return <g transform={dawn ? 'translate(0 34)' : undefined}>
    <path data-name="Jungle ridge" fill={colors.ridge} d="M0 402Q122 378 193 321Q254 269 336 311Q420 351 504 328Q570 306 637 347Q743 414 819 364Q913 301 1003 327Q1101 354 1184 289Q1285 237 1440 336V665H0Z" />
    <path data-name="Distant rainforest" fill={colors.forest} d="M0 414Q28 369 70 396Q91 356 147 384Q201 361 241 409Q279 383 326 410Q349 389 380 413Q414 389 448 423Q510 406 557 449Q605 430 654 459Q685 436 735 456Q768 421 822 443Q879 396 921 420Q949 375 1003 403Q1034 371 1077 393Q1118 341 1176 371Q1217 337 1259 361Q1301 332 1340 353Q1396 300 1440 340V710H0Z" />
  </g>;
}

function Palm({ transform, leaf, stem }) {
  return <g transform={transform} fill={leaf}>
    <path fill={stem} d="M-11 0Q13-77 3-145H14Q25-70 3 0Z" />
    <path d="M8-141Q-32-180-88-136Q-42-153-32-128Q-15-137 8-141Q-42-134-62-99Q-25-115 8-141Q-7-183-43-195Q-23-167 8-141Q19-190 57-184Q30-164 8-141Q55-173 93-138Q57-149 8-141Q56-146 73-106Q45-125 8-141Z" />
  </g>;
}

function JungleUnderstory({ colors, stretch, night }) {
  return <g data-name="Jungle understory">
    <path fill={colors.shrub} d="M0 753Q28 696 93 730Q133 719 167 765Q203 766 233 802Q125 786 107 852Q64 827 0 866ZM1440 742Q1406 708 1366 738Q1306 710 1287 774Q1236 758 1210 803Q1283 784 1331 843Q1388 830 1440 877Z" />
    {[[67,851,1],[145,841,.68],[1358,869,1.13],[1411,820,.77]].map(([x,y,scale])=><g key={x} transform={`translate(${x} ${y}) scale(${stretch * scale} ${scale})`}>
      <path fill={colors.tip} d="M1 1Q-21-31-44-25Q-44-3 1 1Q-13-45-40-57Q-50-39-29-20L1 1Q3-55-19-81Q-34-60-14-31L1 1Q24-49 44-54Q57-33 21-20L1 1Q37-24 63-14Q57 6 1 1Z" />
      <path fill="none" stroke={colors.stem} strokeWidth="3" strokeLinecap="round" d="M0 2L-19-58M0 1L38-36M0 1l43-12M0 1l-28-40" />
      {!night && <path fill={ART.coral} d="M1-32Q11-55 28-61Q28-44 1-32Q13-70 31-74Q29-57 1-32Z" />}
    </g>)}
  </g>;
}

function ClearingFloor({ colors, stretch }) {
  return <>
    <path data-name="Jungle clearing" fill={colors.ground} d="M0 576Q166 517 368 558Q540 578 700 527Q879 473 1059 533Q1253 581 1440 521V900H0Z" />
    <path fill="#a5b67e" d="M204 701Q388 612 591 648Q789 702 963 635Q1160 571 1440 654V900H0V791Z" />
    <path data-name="Clearing trail" fill="#dacc9e" d="M1168 579Q1140 623 1217 696Q1284 755 1174 806L1034 900H1298Q1379 770 1268 699Q1177 637 1185 580Z" />
    <path fill="none" stroke="#eef1c5" strokeWidth="8" strokeLinecap="round" opacity=".46" d="M303 712q101-33 217-26m380 28q55-28 140-27m-416 107q65 13 124 8" />
    <Palm transform={`translate(1352 620) scale(${stretch * 1.4} 1.4)`} leaf="#628969" stem="#75875f" />
    <Palm transform={`translate(78 592) scale(${stretch * .98} .98)`} leaf={colors.shrub} stem={colors.stem} />
  </>;
}

function RiverFloor({ colors }) {
  return <>
    <path data-name="Jungle riverbank" fill={colors.ground} d="M0 578Q205 523 392 543Q532 570 703 541Q908 492 1098 530Q1317 573 1440 526V900H0Z" />
    <path fill="#adb898" d="M606 568C712 633 829 702 740 768Q691 807 748 900H1295Q1226 818 1302 768Q1353 718 1440 732V620Q1269 605 1104 622Q783 638 606 568Z" />
    <path data-name="River sandbar" fill="#c4b89a" d="M526 548C611 593 781 626 760 684C743 736 629 791 752 900H0V769Q98 683 354 632Q505 594 526 548Z" />
    <path data-name="Jungle river" fill="url(#jungle-water)" d="M497 544C583 591 755 622 732 679C710 727 600 791 704 900H0V801Q96 698 343 644Q490 611 497 544Z" />
    <g data-name="River stones">
      <path fill="#889c82" d="M435 573q33-51 65-43q20 2 49 42q-31 20-114 1Zm151 61q18-35 47-26q20 7 32 26q-24 16-79 0ZM392 664q18-29 50-30q24 6 43 24q-19 20-93 6Z" />
      <path fill="none" stroke="#bbc8a5" strokeWidth="6" strokeLinecap="round" opacity=".64" d="M453 561q22-12 62-4m87 71q22-11 41 0m-232 28q25-14 51-5" />
    </g>
    <g data-name="Jungle river reflections" className="pond-reflections" fill="none" stroke="#d1e5d3" strokeWidth="5" strokeLinecap="round" opacity=".48">
      <path d="M456 582h65m-158 95h105m48-40h89m-98 164h97m-412 27h105m-221 39h88m282 10h112" />
    </g>
    <g fill="#78936e" opacity=".66"><path d="M817 747q10-48-10-74q35 12 24 67q26-47 52-45q-18 38-66 52ZM1093 792q-9-44-33-47q11 36 33 47q11-41 43-53q-6 28-43 53Z" /></g>
  </>;
}

function WaterfallFloor({ colors, stretch }) {
  return <>
    <path data-name="Waterfall clearing" fill={colors.ground} d="M0 605Q198 533 376 563Q545 590 746 568Q937 525 1130 565Q1294 603 1440 547V900H0Z" />
    <g data-name="Rainforest rock shelves" transform="translate(-165)">
      <path fill="#759589" d="M320 557Q362 526 411 456L490 442L552 399L666 408L728 380L815 400L871 446L935 460Q982 494 1003 562L1053 640L406 631Z" />
      <path fill="#597c72" d="M360 577L450 537L500 480L629 470L711 429L792 444L855 500L939 516L991 574L1041 630Q753 659 405 630Z" />
      <path fill="none" stroke="#9bb49b" strokeWidth="9" strokeLinecap="round" opacity=".72" d="M400 551l71-21l28-29m-48 91l86-10m282-106l49 38l53 9m-59 68l87-5" />
      <path fill="#88a78b" d="M431 472q33-25 60-23l33-18q15 36-41 53L418 492Zm377-61q52 8 78 51l49 18q-38 17-86-10Z" />
    </g>
    <path data-name="Waterfall basin" fill="url(#jungle-water)" d="M405 610Q490 565 672 580Q869 592 940 635Q1008 677 947 758Q926 811 708 844Q602 845 559 900H0V857Q159 783 282 767Q450 753 328 710Q278 679 405 610Z" />
    <g data-name="Jungle waterfall" transform="translate(-165)">
      <path fill="#b9d9ce" d="M624 418Q669 418 718 401Q751 417 797 429Q768 488 798 536L779 570Q783 598 825 627Q775 646 687 637Q610 645 574 623Q615 600 615 563L602 527Q635 482 624 418Z" />
      <path fill="#94c3bd" d="M667 415Q684 445 654 505Q645 537 667 556Q649 600 617 628L657 635Q719 592 700 552Q682 526 714 476Q729 451 722 404Z" />
      <path fill="none" stroke="#eaf0d6" strokeWidth="7" strokeLinecap="round" opacity=".83" d="M640 437q10 43-16 77m76-58q-17 46-20 68m70-80q-12 50 7 81m-102 48q0 30-22 44m108-50q-1 27 23 52" />
      <path data-name="Waterfall spray" fill="none" stroke="#e4efda" strokeWidth="6" strokeLinecap="round" opacity=".62" d="M568 640q103 39 270 7m-315-9q16 13 36 11m266 13q28 2 50-13m-242 50h128" />
    </g>
    <path data-name="Basin reflections" className="pond-reflections" fill="none" stroke="#e4efda" strokeWidth="6" strokeLinecap="round" opacity=".62" d="M448 720h83m195 39h104m-449 63h88m387-106h41" />
    <path data-name="Iguana shoreline" fill="#afad8a" d="M192 799Q298 758 389 769Q440 759 505 778Q527 796 479 812Q386 808 305 829Q248 844 192 847L109 860Q126 829 192 799Z" />
    <path data-name="Shore rock" fill="#8c9d84" d="M359 794q28-32 63-22q16-3 36 20q-58 13-99 2Z" />
    <Palm transform={`translate(1300 640) scale(${stretch * 1.05} 1.05)`} leaf={colors.shrub} stem={colors.stem} />
  </>;
}

function CanopyFloor({ colors, stretch }) {
  return <>
    <g data-name="Upper canopy" fill="#6c8b62">
      <path d="M0 315Q53 269 129 295Q151 259 204 270Q276 250 305 308Q378 304 404 355Q346 378 245 363Q193 391 141 370Q51 418 0 380Z" />
      <path d="M990 351Q1051 292 1111 313Q1144 258 1210 275Q1269 239 1312 273Q1398 249 1440 278V389Q1341 408 1273 370Q1207 393 1153 357Q1037 394 990 351Z" />
    </g>
    <path data-name="High rainforest trunks" fill="#6f7f60" d="M143 308Q152 433 102 547L138 579Q194 463 177 304ZM1299 289Q1270 428 1317 549L1359 531Q1311 402 1331 285Z" />
    <g data-name="Canopy footbridge" fill="none" strokeLinecap="round">
      <path stroke="#627955" strokeWidth="8" d="M177 439Q723 621 1285 421" />
      <path stroke="#b6ab7a" strokeWidth="9" d="M173 405Q727 583 1285 386" />
      <path stroke="#b6ab7a" strokeWidth="4" d="M239 425l-2 34m90-7l-2 33m106-12l-2 35m122-15l-2 34m126-26v34m127-37l1 36m124-49v33m108-56l3 32m104-59l3 33m86-59l3 33" />
    </g>
    <path data-name="Canopy glade" fill={colors.ground} d="M0 570Q200 529 360 592Q524 613 722 571Q932 518 1120 566Q1294 591 1440 538V900H0Z" />
    <path fill="#a3ac78" d="M195 758Q335 648 557 683Q749 710 884 653Q1022 605 1200 651Q1367 680 1440 671V900H131Q77 817 195 758Z" />
    <path fill="none" stroke="#c6cc95" strokeWidth="8" strokeLinecap="round" opacity=".45" d="M95 690q113-39 219-17m446 0q43-11 107-12m-409 132q71-20 135-17" />
    <Palm transform={`translate(1240 677) scale(${stretch * .83} .83)`} leaf={colors.shrub} stem={colors.stem} />
    <g data-name="Canopy wildflowers" transform={`translate(946 756) scale(${stretch} 1)`}>
      <path fill="none" stroke={ART.leafShade} strokeWidth="4" strokeLinecap="round" d="M0 14L-19-14M1 11q2-12 12-28M-24 18l-12-15m62 13L38 4" />
      <path fill={ART.coral} d="M-24-9q-15-6-9-16q11-7 18 10q6-8 11-3q-3 10-20 9Zm34-5q-3-12 8-17q11 4 3 16q9-2 12 3q-12 8-23-2Z" />
    </g>
  </>;
}

function NightFloor({ colors }) {
  return <>
    <path data-name="Moonlit jungle banks" fill={colors.ground} d="M0 557Q212 465 408 526Q576 587 724 534Q906 481 1083 553Q1279 596 1440 505V900H0Z" />
    <path data-name="Moonlit creek" fill="#628891" d="M540 540Q671 564 745 629Q805 674 687 739Q616 779 821 900H449Q366 798 483 720Q644 623 540 540Z" />
    <path fill="none" stroke="#8daaad" strokeWidth="7" strokeLinecap="round" opacity=".54" d="M574 652h92m-141 74h53m-43 62h90m-92 66h83m57 29h59" />
    <g data-name="Moonlit leaves" fill={colors.tip} opacity=".62">
      <path d="M276 700Q194 668 193 621Q258 633 276 700Q289 640 343 643Q326 685 276 700ZM1110 623Q1047 601 1032 558Q1098 565 1110 623Q1120 556 1170 573Q1155 608 1110 623Z" />
      <path d="M1281 749Q1226 714 1227 673Q1276 689 1281 749Q1293 699 1342 702Q1334 736 1281 749Z" />
    </g>
    <g data-name="Firefly lights" fill="#e9d59a" opacity=".58">
      {[[109,641],[251,741],[347,580],[409,681],[878,687],[1002,598],[1156,701],[1325,575]].map(([x,y],index)=><circle key={x} className="firefly-light" cx={x} cy={y} r={index%3===0?4:2.5} style={{animationDelay:`${index%4 * .55}s`}} />)}
    </g>
  </>;
}

function MoonlitFloor({ colors, stretch }) {
  return <>
    <path data-name="Moonlit jungle grove" fill={colors.ground} d="M0 542Q217 478 381 530Q555 597 744 555Q951 498 1129 543Q1308 591 1440 520V900H0Z" />
    <path data-name="Moonlit stream" fill="#608d93" d="M831 537Q773 557 801 585Q856 628 730 668Q586 712 611 756Q642 801 879 900H469Q410 838 354 782Q299 724 493 674Q655 633 717 600Q766 575 778 546Z" />
    <path fill="none" stroke="#afc3b1" strokeWidth="7" strokeLinecap="round" opacity=".45" d="M735 606h34m-136 52q42-5 72-14m-227 86q58-24 105-26m-171 84q46 13 79 12m72 53l91 19" />
    <g data-name="Moonlit roots" transform={`translate(204 694) scale(${stretch * 1.14} 1.14)`}>
      <path fill="#617a70" d="M-71 69Q-36 21-39-30Q-29-59-50-136L-27-155Q7-103-2-49Q8-113 32-150L57-141Q25-67 28-22Q34 28 85 60Q65 59 54 53Q24 20 9 12Q14 43 4 71Q-7 53-14 30Q-32 56-71 69Z" />
      <path fill="#43665a" d="M-103-124Q-105-171-61-177Q-30-208 14-190Q49-203 67-174Q121-168 122-126Q91-109 69-124Q44-109 16-131Q-20-105-53-124Q-80-109-103-124Z" />
      <path fill="none" stroke="#89a08b" strokeWidth="5" strokeLinecap="round" opacity=".65" d="M-23-92q19 80-12 126m61-104q-10 51 10 90" />
    </g>
    <path data-name="Moonlit meadow" fill="#577e6c" d="M878 770Q968 721 1076 739Q1189 722 1301 797Q1256 846 1146 846Q1001 839 878 770Z" opacity=".68" />
    <g fill="#7d9790">
      <path d="M714 813q-25-21-54-12q-22-3-36 12q47 14 90 0Zm88-179q-18-16-40-17q-8 1-22 13q36 12 62 4Zm-404 104q-22-27-52-19q-15 3-25 16q46 14 77 3Z" />
    </g>
  </>;
}

function DawnFloor({ colors, stretch }) {
  return <>
    <g data-name="Rainforest dawn mist" fill="none" stroke="#e8e4cc" strokeLinecap="round">
      <path strokeWidth="30" opacity=".5" d="M-20 454Q173 473 385 444Q549 422 757 458Q1009 479 1450 423" />
      <path strokeWidth="24" opacity=".38" d="M92 508Q268 524 517 496Q715 482 848 506Q1096 538 1457 473" />
    </g>
    <path data-name="Misty dawn marsh" fill={colors.ground} d="M0 598Q156 542 337 571Q535 598 734 559Q963 516 1118 568Q1267 610 1440 541V900H0Z" />
    <path data-name="Dawn marsh water" fill="#8fb5ae" d="M475 623Q640 565 842 626Q936 654 892 693Q829 725 756 738Q676 764 692 817Q653 859 517 860Q368 857 336 801Q294 746 365 688Q425 639 475 623Z" />
    <path fill="#b5bf91" d="M856 709Q973 648 1088 686Q1269 730 1440 688V900H624Q663 840 739 793Q748 753 856 709Z" />
    <path fill="none" stroke="#dbe6c9" strokeWidth="7" strokeLinecap="round" opacity=".54" d="M500 655h147m78 19h93m-430 63h142m-19 85h88" />
    <g data-name="Hummingbird flowers" transform={`translate(1033 694) scale(${stretch} 1)`}>
      <path fill="none" stroke={colors.stem} strokeWidth="5" strokeLinecap="round" d="M17 26Q9 3 19-37m-10 57q-10-36-28-40m37 43q14-30 29-35" />
      <path fill={colors.tip} d="M12 18Q-14 3-15-7Q7-3 12 18Zm9 3q15-21 35-20q-5 17-35 20Z" />
      <path fill={ART.coral} d="M19-31Q3-43 16-49Q25-53 38-45Q31-31 19-31ZM-17-17q-22 1-21-13q13-5 23 7Z" />
      <path fill={ART.gold} d="M47-9q4-14 20-9q4 9-24 13Z" />
    </g>
  </>;
}

export function JungleTerrain({ scene, stretch }) {
  const colors = LAND[scene];
  return <g data-name="Jungle terrain">
    <defs>
      <linearGradient id="jungle-water" x2=".22" y2="1"><stop stopColor="#a2caca"/><stop offset="1" stopColor="#558f9a"/></linearGradient>
    </defs>
    <ForestRims colors={colors} dawn={scene === 'jungle-dawn'} />
    {scene === 'jungle-clearing' && <ClearingFloor colors={colors} stretch={stretch} />}
    {scene === 'jungle-river' && <RiverFloor colors={colors} />}
    {scene === 'jungle-canopy' && <CanopyFloor colors={colors} stretch={stretch} />}
    {scene === 'jungle-waterfall' && <WaterfallFloor colors={colors} stretch={stretch} />}
    {scene === 'jungle-night' && <NightFloor colors={colors} />}
    {scene === 'jungle-moonlit' && <MoonlitFloor colors={colors} stretch={stretch} />}
    {scene === 'jungle-dawn' && <DawnFloor colors={colors} stretch={stretch} />}
    <JungleUnderstory colors={colors} stretch={stretch} night={isAfterDark(scene)} />
  </g>;
}

export function JungleTree({ x, y, size, stretch, scene }) {
  const side = x < 720 ? 'left' : 'right';
  const direction = side === 'left' ? 1 : -1;
  const colors = LAND[scene];
  const bark = isAfterDark(scene) ? '#656c66' : '#898063';
  return <g data-habitat-tree={side} data-name={`Jungle tree ${side}`} transform={`translate(${x} ${y}) scale(${size * stretch * direction} ${size})`}>
    <path fill={bark} d="M-28 4Q-9-20-8-75L-14-162H9L14-81Q12-31 33 5L7-2L-4 9L-12 0Z" />
    <path fill="none" stroke={bark} strokeWidth="10" strokeLinecap="round" d="M3-97Q-12-125-42-141M4-110L31-150" />
    <path fill={colors.shrub} d="M-117-133Q-125-174-75-188Q-60-222-17-213Q21-239 56-207Q105-209 108-171Q140-148 108-122Q77-96 48-118Q12-97-21-123Q-51-110-74-128Q-100-116-117-133Z" />
    <path fill={colors.forest} d="M-108-151Q-107-181-74-185Q-56-216-18-199Q23-225 57-201Q95-198 98-176Q74-189 52-164Q15-191-18-169Q-52-189-74-161Q-93-172-108-151Z" />
    {scene === 'jungle-canopy' && <path fill="none" stroke={colors.tip} strokeWidth="4" strokeLinecap="round" opacity=".78" d="M-72-144q-22 49-1 91q7 15 2 24M-48-126q-15 58 9 67q13 5 17-6" />}
    <path data-name="Perch branch" fill="none" stroke={bark} strokeWidth="8" strokeLinecap="round" d="M2-78Q19-57 34-57Q47-56 61-61" />
    <path fill={colors.forest} d="M55-60Q78-87 91-78Q90-61 55-60Q83-67 97-58Q87-45 55-60Z" />
  </g>;
}
