import React from 'react';
import {AGE_SIZES,normalizeAvatar} from '../utils/children';

export function ChildAvatar({avatar,age='5to7',className='',...props}) {
  const look=normalizeAvatar(avatar);
  const bodySize=AGE_SIZES[age]??AGE_SIZES['5to7'];
  const outline='#354743';
  const attributes=Object.fromEntries(Object.entries(look).map(([key,value])=>[`data-avatar-${key.replace(/[A-Z]/g,letter=>`-${letter.toLowerCase()}`)}`,value]));
  return <svg viewBox="0 0 130 170" xmlns="http://www.w3.org/2000/svg" className={`child-avatar ${className}`} role="img" aria-label="Child avatar" data-age={age} {...attributes} {...props}>
    <ellipse cx="65" cy={79+83*bodySize} rx={25*bodySize} ry="4" fill="#354743" opacity=".13"/>
    {look.hair==='ponytail'&&<path d="M88 29C118 20 123 58 101 78L93 68C105 55 105 42 90 42Z" fill={look.hairColor} stroke={outline} strokeWidth="2"/>}
    {look.hair==='bob'&&<path d="M33 47C29 8 96 8 98 46L100 79Q84 89 65 77Q45 89 29 78Z" fill={look.hairColor} stroke={outline} strokeWidth="2"/>}
    <g transform={`translate(65 78) scale(${bodySize}) translate(-65 -78)`} stroke={outline} strokeWidth="2" strokeLinejoin="round">
      <path d="M57 71V85Q65 94 73 85V71" fill={look.skin}/>
      <path d="M44 90Q31 97 27 123Q26 132 32 132Q37 132 38 125L48 105M86 90Q99 97 103 123Q104 132 98 132Q93 132 92 125L82 105" fill={look.skin}/>
      <path d="M47 120L48 151Q53 156 59 151L61 125M69 125L71 151Q77 156 82 151L83 120" fill={look.skin}/>
      {look.bottom==='trousers'&&<><path d="M45 115H85L82 151H71L65 126L59 151H48Z" fill={look.bottomPrimary}/><path d="M46 118H84M49 147H59M71 147H81" fill="none" stroke={look.bottomSecondary} strokeWidth="5"/><path d="M65 119V127" fill="none"/></>}
      {look.bottom==='shorts'&&<><path d="M45 115H85L83 137H70L65 126L60 137H47Z" fill={look.bottomPrimary}/><path d="M48 134H59M71 134H82M47 119H83" stroke={look.bottomSecondary} strokeWidth="4"/></>}
      {look.bottom==='skirt'&&<><path d="M47 114H83L94 140Q65 149 36 140Z" fill={look.bottomPrimary}/><path d="M40 137Q65 144 90 137M55 121L52 136M75 121L78 136" fill="none" stroke={look.bottomSecondary} strokeWidth="4"/></>}
      {look.top==='tee'&&<><path d="M55 82L43 86L34 102L45 109L49 101L47 119Q65 124 83 119L81 101L85 109L96 102L87 86L75 82Q65 92 55 82Z" fill={look.topPrimary}/><path d="M55 83Q65 95 75 83M38 102L45 106M85 106L92 102" stroke={look.topSecondary} strokeWidth="4" fill="none"/><path d="M59 104L65 98L71 104L65 110Z" fill={look.topSecondary} stroke="none"/></>}
      {look.top==='sweater'&&<><path d="M55 82L42 87Q32 100 29 122L39 125L49 102L47 121H83L81 102L91 125L101 122Q98 100 88 87L75 82Z" fill={look.topPrimary}/><path d="M54 84Q65 93 76 84M48 117H82M31 120L39 122M91 122L99 120M50 103H80" stroke={look.topSecondary} strokeWidth="5" fill="none"/></>}
      {look.top==='overalls'&&<><path d="M55 82L43 86L34 102L45 109L49 101L47 120H83L81 101L85 109L96 102L87 86L75 82Q65 92 55 82Z" fill={look.topSecondary}/><path d="M50 86H57V100H73V86H80V120H50Z" fill={look.topPrimary}/><path d="M58 104H72V111Q65 118 58 111Z" fill={look.topSecondary}/><circle cx="54" cy="98" r="2" fill={look.topSecondary} stroke="none"/><circle cx="76" cy="98" r="2" fill={look.topSecondary} stroke="none"/></>}
      <path d="M47 150Q53 154 59 150L60 159H43Q40 154 47 150ZM71 150Q77 154 83 150Q90 154 87 159H70Z" fill="#fcf6e5"/>
      <path d="M44 157H59M71 157H86" stroke={look.bottomSecondary} strokeWidth="3"/>
    </g>
    <g stroke={outline} strokeWidth="2" strokeLinejoin="round">
      <ellipse cx="35" cy="52" rx="6" ry="9" fill={look.skin}/><ellipse cx="95" cy="52" rx="6" ry="9" fill={look.skin}/>
      <path d="M35 39Q35 17 65 17Q95 17 95 39V54Q94 78 65 81Q36 78 35 54Z" fill={look.skin}/>
      {look.hair==='short'&&<path d="M34 47L32 32Q34 13 57 12Q77 7 94 26L97 45L88 35L82 31Q66 41 49 30L40 46Z" fill={look.hairColor}/>}
      {look.hair==='bob'&&<path d="M34 49L33 32Q39 12 65 14Q94 14 97 37L94 54L86 40L82 29Q66 41 42 35L40 51Z" fill={look.hairColor}/>}
      {look.hair==='curls'&&<path d="M33 49Q23 42 31 34Q22 24 35 20Q32 10 45 13Q48 3 59 10Q68 1 77 11Q91 7 92 20Q105 21 100 34Q110 44 96 50L88 36Q78 39 73 30Q62 39 54 30Q43 40 38 37Z" fill={look.hairColor}/>}
      {look.hair==='ponytail'&&<><path d="M34 47L32 32Q37 12 65 13Q92 14 97 35L95 47L88 38Q66 37 55 26L41 40Z" fill={look.hairColor}/><path d="M96 29L100 37" stroke={look.topSecondary} strokeWidth="5"/></>}
      <path d="M46 48Q51 45 56 48M74 48Q79 45 84 48" stroke={look.hairColor} fill="none" strokeLinecap="round"/>
      <ellipse cx="51" cy="55" rx="3.6" ry="4.6" fill={look.eyes} stroke="none"/><ellipse cx="79" cy="55" rx="3.6" ry="4.6" fill={look.eyes} stroke="none"/>
      <circle cx="52" cy="54" r="1.2" fill="#fff" stroke="none"/><circle cx="80" cy="54" r="1.2" fill="#fff" stroke="none"/>
      <path d="M64 56L62 62H66" fill="none" opacity=".4" strokeLinecap="round"/>
      <ellipse cx="44" cy="64" rx="5" ry="2.5" fill="#d47b78" opacity=".35" stroke="none"/><ellipse cx="86" cy="64" rx="5" ry="2.5" fill="#d47b78" opacity=".35" stroke="none"/>
      <path d="M57 68Q65 75 73 68" fill="none" strokeLinecap="round"/>
    </g>
  </svg>;
}

export default ChildAvatar;