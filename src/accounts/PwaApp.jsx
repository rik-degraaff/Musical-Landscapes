import React,{useEffect,useState} from 'react';
import App from '../App.jsx';
import {EditionContext} from '../components/EditionContext.js';
import {FULL_EDITION,TRIAL_CATALOG} from '../utils/editions.js';
import {useMembership} from './useMembership.js';
import {MembershipDialog} from './MembershipDialog.jsx';

const inviteKey='farmjam-pending-invite-v1';

function readArrival() {
  const url=new URL(window.location.href);
  const received=new URLSearchParams(url.hash.slice(1)).get('invite');
  const checkout=url.searchParams.get('checkout');
  if(received!==null)url.hash='';
  if(checkout)url.searchParams.delete('checkout');
  if(received!==null||checkout)window.history.replaceState(null,'',url);
  let invite=/^[a-f0-9]{64}$/.test(received??'')?received:null;
  try {
    if(invite)window.sessionStorage.setItem(inviteKey,invite);
    else invite=window.sessionStorage.getItem(inviteKey);
  } catch { /* The invitation remains usable for this page. */ }
  return {invite,checkout};
}

export function PwaApp() {
  const [arrival]=useState(readArrival);
  const [invite,setInvite]=useState(arrival.invite);
  const [open,setOpen]=useState(Boolean(arrival.invite||arrival.checkout));
  useEffect(()=>{
    const onInvite=()=>{
      if(!new URLSearchParams(window.location.hash.slice(1)).has('invite'))return;
      const next=readArrival();
      if(next.invite){setInvite(next.invite);setOpen(true);}
    };
    window.addEventListener('hashchange',onInvite);
    return ()=>window.removeEventListener('hashchange',onInvite);
  },[]);
  const membership=useMembership(arrival.checkout==='complete');
  const trial=!membership.unlocked;
  const edition={
    ...FULL_EDITION,trial,catalog:trial?TRIAL_CATALOG:FULL_EDITION.catalog,membershipOpen:open,
    openMembership:()=>{window.dispatchEvent(new Event('farmjam-input-reset'));setOpen(true);},
  };
  function clearInvite() {
    setInvite(null);
    try {window.sessionStorage.removeItem(inviteKey);} catch { /* The page has cleared its copy. */ }
  }
  return <EditionContext.Provider value={edition}>
    <App key={trial?'trial':'full'}/>
    {open&&<MembershipDialog membership={membership} invite={invite} onInviteCleared={clearInvite} checkout={arrival.checkout} onClose={()=>setOpen(false)}/>}
  </EditionContext.Provider>;
}
