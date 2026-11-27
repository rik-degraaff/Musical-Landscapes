const encoder=new TextEncoder();
const hex=bytes=>Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,'0')).join('');

export const inviteToken=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
export const hashToken=async value=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
export const validInvite=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
export const recipientHash=(token,email)=>hashToken(`${token}:${email.trim().toLowerCase()}`);

export function constantTimeEqual(first,second) {
  if(first.length!==second.length)return false;
  let difference=0;
  for(let index=0;index<first.length;index++)difference|=first.charCodeAt(index)^second.charCodeAt(index);
  return difference===0;
}

export async function stripeSignatureValid(payload,header,secret,now=Date.now()) {
  if(!header||!secret)return false;
  const fields=header.split(',').map(field=>field.trim().split('='));
  const timestamp=fields.find(([name])=>name==='t')?.[1];
  if(!/^\d+$/.test(timestamp??'')||Math.abs(Math.floor(now/1000)-Number(timestamp))>300)return false;
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const expected=hex(await crypto.subtle.sign('HMAC',key,encoder.encode(`${timestamp}.${payload}`)));
  return fields.some(([name,value])=>name==='v1'&&typeof value==='string'&&constantTimeEqual(expected,value));
}
