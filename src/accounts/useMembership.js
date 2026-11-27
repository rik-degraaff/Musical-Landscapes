import {useEffect,useRef,useState} from 'react';
import {createParentAuth,parentSessionKey} from './parentAuth.js';

const accessKey='farmjam-verified-access-v1';
const signedOut={account:null,unlocked:false};

function cachedAccess() {
  try {
    const account=JSON.parse(window.localStorage.getItem(accessKey));
    const session=JSON.parse(window.localStorage.getItem(parentSessionKey));
    return account?.id&&account.id===session?.user?.id&&session.access_token?account:null;
  } catch {return null;}
}

function remember(access) {
  try {
    if(access.unlocked)window.localStorage.setItem(accessKey,JSON.stringify(access.account));
    else window.localStorage.removeItem(accessKey);
  } catch { /* The verified result is still usable in this session. */ }
}

export function useMembership(checkoutReturned) {
  const [auth]=useState(createParentAuth);
  const [state,setState]=useState(()=>{
    const account=auth&&cachedAccess();
    return account?{account,unlocked:true}:signedOut;
  });
  const latest=useRef(state);
  const queue=useRef(Promise.resolve());
  function commit(next,confirmed=false) {
    if(confirmed)remember(next);
    latest.current=next;
    setState(next);
  }
  function run(action) {
    const pending=queue.current.then(action);
    queue.current=pending.catch(()=>{});
    return pending;
  }
  async function invoke(action,fields={}) {
    const {data,error}=await auth.client.functions.invoke('farmjam-access',{body:{action,...fields}});
    if(error)throw error;
    return data;
  }
  async function refresh() {
    const {data,error}=await auth.client.auth.getSession();
    if(error)throw error;
    const user=data.session?.user;
    if(!user){commit(signedOut,true);return false;}
    const account={id:user.id,email:user.email};
    if(latest.current.account?.id!==account.id)commit({account,unlocked:false},true);
    let result;
    try {result=await invoke('status');}
    catch(error) {
      if(error.context?.status===401)commit(signedOut,true);
      throw error;
    }
    const unlocked=result.unlocked===true;
    commit({account,unlocked},true);
    return unlocked;
  }
  useEffect(()=>{
    if(!auth)return;
    let timer,stopped=false;
    const retry=async(attempt=0)=>{
      const unlocked=await run(refresh).catch(()=>false);
      if(!stopped&&checkoutReturned&&!unlocked&&attempt<5)timer=window.setTimeout(()=>retry(attempt+1),2000);
    };
    const check=()=>{if(!document.hidden)run(refresh).catch(()=>{});};
    const onStorage=event=>{if(event.key===accessKey||event.key===null)check();};
    retry();
    document.addEventListener('visibilitychange',check);
    window.addEventListener('online',check);
    window.addEventListener('storage',onStorage);
    return ()=>{
      stopped=true;window.clearTimeout(timer);
      document.removeEventListener('visibilitychange',check);
      window.removeEventListener('online',check);
      window.removeEventListener('storage',onStorage);
    };
  },[auth,checkoutReturned]);

  return {
    ...state,available:Boolean(auth),
    refresh:()=>run(refresh),
    sendCode:email=>run(()=>auth.sendCode(email)),
    confirmCode:(email,code)=>run(async()=>{
      const user=await auth.confirmCode(email,code);
      commit({account:{id:user.id,email:user.email},unlocked:false},true);
      return refresh().catch(()=>false);
    }),
    checkout:()=>run(async()=>{
      const result=await invoke('checkout');
      if(result.unlocked)return await refresh()?'unlocked':'pending';
      if(result.pending)return 'pending';
      const target=new URL(result.url);
      if(target.origin!=='https://checkout.stripe.com')throw new Error('Unexpected checkout destination');
      window.location.assign(target.href);
      return 'redirected';
    }),
    redeem:token=>run(async()=>{
      const result=await invoke('redeem',{token});
      if(!result.unlocked)return false;
      commit({...latest.current,unlocked:true},true);
      return true;
    }),
    signOut:()=>run(async()=>{await auth.client.auth.signOut({scope:'local'});commit(signedOut,true);}),
    deleteAccount:()=>run(async()=>{await auth.deleteAccount();commit(signedOut,true);}),
  };
}
