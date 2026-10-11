import React from 'react';
import {Copy} from 'lucide-react';
import {AVATAR_OPTIONS,AVATAR_COLORS,normalizeAvatar} from '../utils/children';
import {ChildAvatar} from './ChildAvatar';
import './avatar.css';

const STYLE_LABELS={short:'Short',bob:'Bob',curls:'Curls',ponytail:'Ponytail',longCurls:'Long curls',longStraight:'Long straight',tee:'T-shirt',sweater:'Sweater',overalls:'Overalls',hoodie:'Hoodie',cardigan:'Cardigan',trousers:'Trousers',shorts:'Shorts',skirt:'Skirt',joggers:'Joggers',leggings:'Leggings'};
const CLOTHING_LABELS=['Coral','Teal','Blue','Ochre','Butter','Mint','Rose','Ink','Denim','Moss','Plum','Graphite','Gold','Seafoam','Peach','Lilac','Berry','Ivory','Black','Sky'];
const COLOR_LABELS={skin:['Light','Warm','Tan','Deep','Light golden','Golden beige','Warm brown','Rich brown'],hair:['Chestnut','Black','Auburn','Golden','Brown','Copper','Sandy','Silver'],eyes:['Charcoal','Blue','Green','Brown','Dark brown','Hazel','Grey','Deep blue'],topPrimary:CLOTHING_LABELS,topSecondary:CLOTHING_LABELS,bottomPrimary:CLOTHING_LABELS,bottomSecondary:CLOTHING_LABELS};

export function AvatarDesigner({avatar,age='5to7',onChange,name=''}) {
  const look=normalizeAvatar(avatar);
  const update=(field,value)=>onChange({...look,[field]:value});
  const styles=(field,label)=><fieldset className="avatar-style-options"><legend>{label}</legend><div>{AVATAR_OPTIONS[field].map(value=><label key={value} className={look[field]===value?'is-selected':''}><input type="radio" name={`avatar-${field}`} value={value} checked={look[field]===value} onChange={()=>update(field,value)}/><ChildAvatar avatar={{...look,[field]:value}} age={age} aria-hidden="true" role="presentation"/><span>{STYLE_LABELS[value]}</span></label>)}</div></fieldset>;
  const palette=(key,label)=>{
    const field=key==='hair'?'hairColor':key;
    return <fieldset className="avatar-palette"><legend>{label}</legend><div>{AVATAR_COLORS[key].map((color,index)=><label key={color} className={look[field]===color?'is-selected':''} style={{'--swatch':color}} title={`${label}: ${COLOR_LABELS[key][index]}`}><input type="radio" name={`avatar-${field}`} value={color} aria-label={`${label}: ${COLOR_LABELS[key][index]}`} checked={look[field]===color} onChange={()=>update(field,color)}/><span aria-hidden="true"/></label>)}</div></fieldset>;
  };
  return <div className="avatar-designer">
    <div className="avatar-live-preview"><ChildAvatar avatar={look} age={age} aria-label={name?`${name}'s avatar`:'Child avatar preview'}/>{name&&<strong>{name}</strong>}</div>
    <div className="avatar-designer-options">
      {styles('hair','Hair style')}
      <div className="avatar-palette-row">{palette('hair','Hair color')}{palette('eyes','Eye color')}{palette('skin','Skin tone')}</div>
      {styles('top','Top style')}
      <div className="avatar-palette-row">{palette('topPrimary','Top primary color')}{palette('topSecondary','Top secondary color')}</div>
      {styles('bottom','Bottom style')}
      <button type="button" className="avatar-match-colors" title="Match both bottom colors to the top" onClick={()=>onChange({...look,bottomPrimary:look.topPrimary,bottomSecondary:look.topSecondary})}><Copy size={16}/>Match top colors</button>
      <div className="avatar-palette-row">{palette('bottomPrimary','Bottom primary color')}{palette('bottomSecondary','Bottom secondary color')}</div>
    </div>
  </div>;
}

export default AvatarDesigner;