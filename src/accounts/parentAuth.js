import {createClient} from '@supabase/supabase-js';

export const parentSessionKey='farmjam-parent-session-v1';

export function createParentAuth() {
  const url=import.meta.env.VITE_SUPABASE_URL;
  const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return null;
  const client=createClient(url,key,{auth:{detectSessionInUrl:false,storageKey:parentSessionKey}});
  return {
    client,
    async sendCode(email,{create=true}={}) {
      const {error}=await client.auth.signInWithOtp({email,options:{shouldCreateUser:create}});
      if(error)throw error;
    },
    async confirmCode(email,token) {
      const {data,error}=await client.auth.verifyOtp({email,token,type:'email'});
      if(error||!data.user)throw error??new Error('No parent account');
      return data.user;
    },
    async deleteAccount() {
      const {error}=await client.functions.invoke('delete-parent',{body:{confirm:true}});
      if(error)throw error;
      await client.auth.signOut({scope:'local'});
    },
  };
}
