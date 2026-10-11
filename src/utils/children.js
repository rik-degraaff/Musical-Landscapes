import {normalizeSettings} from './settings.js';

export const CHILDREN_KEY='farmjam-children-v1';
export const AGE_SIZES={under3:.72,'3to4':.82,'5to7':.92,'8plus':1};
export const AVATAR_OPTIONS={hair:['short','bob','curls','ponytail','longCurls','longStraight'],top:['tee','sweater','overalls','hoodie','cardigan'],bottom:['trousers','shorts','skirt','joggers','leggings']};
export const CLOTHING_COLORS=['#de866e','#469a93','#687db7','#d3ac4d','#fff1be','#d9eee3','#ecb6c8','#354e64','#4e7e93','#587c58','#946c91','#545766','#e1bd6a','#c5e2d4','#edaa93','#e0d9f0','#b34b58','#f5f1e8','#303239','#66a4c8'];
export const AVATAR_COLORS={skin:['#f2c99e','#dca378','#a96e49','#70452f','#f0d6b5','#dfba86','#bc8b5e','#8c593b'],hair:['#594946','#201f25','#b77b43','#e4c06d','#78513c','#a44832','#d5b391','#797781'],eyes:['#484543','#537b91','#518465','#8b6543','#32291f','#a88a4c','#79878d','#415d80'],topPrimary:CLOTHING_COLORS,topSecondary:CLOTHING_COLORS,bottomPrimary:CLOTHING_COLORS,bottomSecondary:CLOTHING_COLORS};
export const DEFAULT_AVATAR={hair:'short',top:'tee',bottom:'trousers',skin:'#f2c99e',hairColor:'#594946',eyes:'#484543',topPrimary:'#de866e',topSecondary:'#fff1be',bottomPrimary:'#4e7e93',bottomSecondary:'#e1bd6a'};

export function normalizeAvatar(value={}) {
  const avatar={...DEFAULT_AVATAR};
  for(const [key,options] of Object.entries(AVATAR_OPTIONS))if(options.includes(value?.[key]))avatar[key]=value[key];
  for(const [key,options] of Object.entries(AVATAR_COLORS)){
    const field=key==='hair'?'hairColor':key;
    if(options.includes(value?.[field]))avatar[field]=value[field];
  }
  return avatar;
}

export function normalizeChild(value) {
  if(!value||typeof value.id!=='string'||!value.id.trim()||typeof value.name!=='string'||!value.name.trim()||!Object.hasOwn(AGE_SIZES,value.age))return null;
  return {id:value.id.slice(0,100),name:value.name.trim().slice(0,40),age:value.age,avatar:normalizeAvatar(value.avatar),profile:{age:value.age,parent:['new','some','confident'].includes(value.profile?.parent)?value.profile.parent:'some',music:['new','some','familiar'].includes(value.profile?.music)?value.profile.music:'new',instruments:Array.isArray(value.profile?.instruments)?[...new Set(value.profile.instruments.filter(id=>['piano','guitar','ukulele','flute','melody','drums','marimba','panflute'].includes(id)))]:[]},settings:normalizeSettings(value.settings)};
}

export function normalizeChildren(value) {
  const seen=new Set();
  const children=(Array.isArray(value?.children)?value.children:[]).map(normalizeChild).filter(child=>{if(!child||seen.has(child.id))return false;seen.add(child.id);return true;});
  return {children,selectedId:children.some(child=>child.id===value?.selectedId)?value.selectedId:children[0]?.id??null};
}

export function loadChildren(storage) {
  try{return normalizeChildren(JSON.parse(storage.getItem(CHILDREN_KEY)??'null'));}catch{return {children:[],selectedId:null};}
}

export function saveChildren(storage,value) {
  try{storage.setItem(CHILDREN_KEY,JSON.stringify(normalizeChildren(value)));return true;}catch{return false;}
}