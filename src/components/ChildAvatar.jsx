import React from 'react';
import {AGE_SIZES,normalizeAvatar} from '../utils/children';

export function ChildAvatar({avatar,age='5to7',className='',...props}) {
  const look=normalizeAvatar(avatar);
  const bodySize=AGE_SIZES[age]??AGE_SIZES['5to7'];
  const outline='#354743';
  const attributes=Object.fromEntries(Object.entries(look).map(([key,value])=>[`data-avatar-${key.replace(/[A-Z]/g,letter=>`-${letter.toLowerCase()}`)}`,value]));
  return <svg viewBox="0 0 130 170" xmlns="http://www.w3.org/2000/svg" className={`child-avatar ${className}`} role="img" aria-label="Child avatar" data-age={age} {...attributes} {...props}>
    <ellipse data-avatar-region="shadow" cx="65" cy={79+83*bodySize} rx={25*bodySize} ry="4" fill="#354743" opacity=".13"/>
    <g data-avatar-part="hair-back" data-avatar-style={look.hair}>
    {look.hair==='ponytail'&&<path d="M88 29C118 20 123 58 101 78L93 68C105 55 105 42 90 42Z" fill={look.hairColor} stroke={outline} strokeWidth="2"/>}
    {look.hair==='bob'&&<path d="M33 47C29 8 96 8 98 46L100 79Q84 89 65 77Q45 89 29 78Z" fill={look.hairColor} stroke={outline} strokeWidth="2"/>}
    {look.hair==='longCurls'&&<g fill={look.hairColor} stroke={outline} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M32 40Q24 31 32 24Q29 14 42 14Q47 5 58 11Q67 4 77 12Q90 8 94 21Q106 24 99 36Q108 43 102 53Q111 63 103 71Q110 81 101 86Q103 97 91 96Q84 103 76 94Q65 99 54 94Q45 103 37 96Q25 98 28 87Q18 81 26 72Q18 62 25 54Q19 45 32 40Z"/>
      <path d="M31 48Q39 46 35 55Q27 59 32 66Q40 66 35 75Q29 81 37 87M99 48Q91 46 95 55Q103 59 98 66Q90 66 95 75Q101 81 93 87M42 75Q48 81 42 88M88 75Q82 81 88 88" fill="none" opacity=".45"/>
    </g>}
    {look.hair==='longStraight'&&<g fill={look.hairColor} stroke={outline} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M32 42Q30 12 65 12Q100 12 98 42L99 78Q99 96 106 106Q94 114 82 108L77 100Q65 108 53 100L48 108Q36 114 24 106Q31 96 31 78Z"/>
      <path d="M38 47Q34 79 34 99M44 73Q42 94 39 104M92 47Q96 79 96 99M86 73Q88 94 91 104" fill="none" opacity=".4"/>
    </g>}
    </g>
    <g data-avatar-region="body" transform={`translate(65 78) scale(${bodySize}) translate(-65 -78)`} stroke={outline} strokeWidth="2" strokeLinejoin="round">
      <path d="M57 71V85Q65 94 73 85V71" fill={look.skin}/>
      <path d="M44 90Q31 97 27 123Q26 132 32 132Q37 132 38 125L48 105M86 90Q99 97 103 123Q104 132 98 132Q93 132 92 125L82 105" fill={look.skin}/>
      <path d="M47 120L48 151Q53 156 59 151L61 125M69 125L71 151Q77 156 82 151L83 120" fill={look.skin}/>
      <g data-avatar-part="bottom" data-avatar-style={look.bottom}>
      {look.bottom==='trousers'&&<><path d="M45 115H85L82 151H71L65 126L59 151H48Z" fill={look.bottomPrimary}/><path d="M46 118H84M49 147H59M71 147H81" fill="none" stroke={look.bottomSecondary} strokeWidth="5"/><path d="M65 119V127" fill="none"/></>}
      {look.bottom==='shorts'&&<><path d="M45 115H85L83 137H70L65 126L60 137H47Z" fill={look.bottomPrimary}/><path d="M48 134H59M71 134H82M47 119H83" stroke={look.bottomSecondary} strokeWidth="4"/></>}
      {look.bottom==='skirt'&&<><path d="M47 114H83L94 140Q65 149 36 140Z" fill={look.bottomPrimary}/><path d="M40 137Q65 144 90 137M55 121L52 136M75 121L78 136" fill="none" stroke={look.bottomSecondary} strokeWidth="4"/></>}
      {look.bottom==='joggers'&&<>
        <path d="M45 115H85L84 133L81 151H71L68 134L65 126L62 134L59 151H49L46 133Z" fill={look.bottomPrimary}/>
        <path d="M46 118H84M49 147H59M71 147H81" fill="none" stroke={look.bottomSecondary} strokeWidth="5"/>
        <path d="M50 123L49 128M80 123L81 128M65 120V126" fill="none" strokeLinecap="round"/>
        <path d="M62 121L61 125M68 121L69 125" fill="none" stroke={look.bottomSecondary} strokeLinecap="round"/>
      </>}
      {look.bottom==='leggings'&&<>
        <path d="M46 115H84L83 126L82 151H71L69 130L65 124L61 130L59 151H48L47 126Z" fill={look.bottomPrimary}/>
        <path d="M47 118H83M49 136L59 138M71 138L81 136M49 148H59M71 148H81" fill="none" stroke={look.bottomSecondary} strokeWidth="3"/>
        <path d="M65 120V124" fill="none"/>
      </>}
      </g>
      <g data-avatar-part="top" data-avatar-style={look.top}>
      {look.top==='tee'&&<><path d="M55 82L43 86L34 102L45 109L49 101L47 119Q65 124 83 119L81 101L85 109L96 102L87 86L75 82Q65 92 55 82Z" fill={look.topPrimary}/><path d="M55 83Q65 95 75 83M38 102L45 106M85 106L92 102" stroke={look.topSecondary} strokeWidth="4" fill="none"/><path d="M59 104L65 98L71 104L65 110Z" fill={look.topSecondary} stroke="none"/></>}
      {look.top==='sweater'&&<><path d="M55 82L42 87Q32 100 29 122L39 125L49 102L47 121H83L81 102L91 125L101 122Q98 100 88 87L75 82Z" fill={look.topPrimary}/><path d="M54 84Q65 93 76 84M48 117H82M31 120L39 122M91 122L99 120M50 103H80" stroke={look.topSecondary} strokeWidth="5" fill="none"/></>}
      {look.top==='hoodie'&&<>
        <path d="M54 81Q48 76 49 84L42 88Q32 100 29 122L39 125L49 102L47 121H83L81 102L91 125L101 122Q98 100 88 88L81 84Q82 76 76 81Q65 88 54 81Z" fill={look.topPrimary}/>
        <path d="M54 80Q65 88 76 80L81 85Q78 94 65 95Q52 94 49 85Z" fill={look.topSecondary}/>
        <path d="M55 81Q65 91 75 81L72 88Q65 93 58 88Z" fill={look.skin}/>
        <path d="M55 103L51 108V113Q65 118 79 113V108L75 103Z" fill={look.topSecondary}/>
        <path d="M56 105L53 109M74 105L77 109" fill="none" strokeLinecap="round"/>
        <path d="M60 94L59 101M70 94L71 101" fill="none" stroke={look.topSecondary} strokeWidth="3" strokeLinecap="round"/>
        <path d="M48 118H82M31 120L39 122M91 122L99 120" fill="none" stroke={look.topSecondary} strokeWidth="5"/>
      </>}
      {look.top==='cardigan'&&<>
        <path d="M55 82L43 87Q33 100 29 122L39 125L49 102L47 121H83L81 102L91 125L101 122Q97 100 87 87L75 82Q65 91 55 82Z" fill={look.topPrimary}/>
        <path d="M56 83Q65 92 74 83L73 119H57Z" fill={look.topSecondary}/>
        <path d="M56 83L63 99L61 121H47L49 102M74 83L67 99L69 121H83L81 102" fill={look.topPrimary}/>
        <path d="M56 83L63 99L61 121M74 83L67 99L69 121" fill="none" stroke={look.topSecondary} strokeWidth="3"/>
        <path d="M51 109H57V114H51ZM73 109H79V114H73Z" fill={look.topSecondary} strokeWidth="1.5"/>
        <circle cx="68" cy="103" r="1.5" fill={look.topSecondary} stroke="none"/><circle cx="68" cy="110" r="1.5" fill={look.topSecondary} stroke="none"/><circle cx="69" cy="117" r="1.5" fill={look.topSecondary} stroke="none"/>
        <path d="M31 120L39 122M91 122L99 120M48 118H60M70 118H82" fill="none" stroke={look.topSecondary} strokeWidth="5"/>
      </>}
      {look.top==='overalls'&&<><path d="M55 82L43 86L34 102L45 109L49 101L47 120H83L81 101L85 109L96 102L87 86L75 82Q65 92 55 82Z" fill={look.topSecondary}/><path d="M50 86H57V100H73V86H80V120H50Z" fill={look.topPrimary}/><path d="M58 104H72V111Q65 118 58 111Z" fill={look.topSecondary}/><circle cx="54" cy="98" r="2" fill={look.topSecondary} stroke="none"/><circle cx="76" cy="98" r="2" fill={look.topSecondary} stroke="none"/></>}
      </g>
      <path d="M47 150Q53 154 59 150L60 159H43Q40 154 47 150ZM71 150Q77 154 83 150Q90 154 87 159H70Z" fill="#fcf6e5"/>
      <path d="M44 157H59M71 157H86" stroke={look.bottomSecondary} strokeWidth="3"/>
    </g>
    <g data-avatar-region="head" stroke={outline} strokeWidth="2" strokeLinejoin="round">
      <ellipse cx="35" cy="52" rx="6" ry="9" fill={look.skin}/><ellipse cx="95" cy="52" rx="6" ry="9" fill={look.skin}/>
      <path d="M35 39Q35 17 65 17Q95 17 95 39V54Q94 78 65 81Q36 78 35 54Z" fill={look.skin}/>
      <g data-avatar-part="hair-front" data-avatar-style={look.hair}>
      {look.hair==='short'&&<path d="M34 47L32 32Q34 13 57 12Q77 7 94 26L97 45L88 35L82 31Q66 41 49 30L40 46Z" fill={look.hairColor}/>}
      {look.hair==='bob'&&<path d="M34 49L33 32Q39 12 65 14Q94 14 97 37L94 54L86 40L82 29Q66 41 42 35L40 51Z" fill={look.hairColor}/>}
      {look.hair==='curls'&&<path d="M33 49Q23 42 31 34Q22 24 35 20Q32 10 45 13Q48 3 59 10Q68 1 77 11Q91 7 92 20Q105 21 100 34Q110 44 96 50L88 36Q78 39 73 30Q62 39 54 30Q43 40 38 37Z" fill={look.hairColor}/>}
      {look.hair==='longCurls'&&<>
        <path d="M33 48Q25 42 32 34Q26 25 37 21Q35 12 47 14Q51 6 60 12Q70 5 78 14Q91 11 93 23Q104 26 98 36Q105 44 96 49L89 38Q80 42 74 32Q64 41 55 32Q46 41 39 37L38 48Z" fill={look.hairColor}/>
        <path d="M40 25Q47 22 49 29M59 19Q65 16 69 23M80 23Q88 21 89 29" fill="none" opacity=".4" strokeLinecap="round"/>
      </>}
      {look.hair==='longStraight'&&<>
        <path d="M34 49L32 34Q35 12 65 12Q96 13 98 35L96 50L90 46L86 32Q72 39 55 27Q48 36 41 38L40 49Z" fill={look.hairColor}/>
        <path d="M58 19Q73 30 85 29M49 23L40 33" fill="none" opacity=".4" strokeLinecap="round"/>
      </>}
      {look.hair==='ponytail'&&<><path d="M34 47L32 32Q37 12 65 13Q92 14 97 35L95 47L88 38Q66 37 55 26L41 40Z" fill={look.hairColor}/><path d="M96 29L100 37" stroke={look.topSecondary} strokeWidth="5"/></>}
      </g>
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