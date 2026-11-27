import {createClient} from 'npm:@supabase/supabase-js@2.119.2';

export const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{
  auth:{persistSession:false,autoRefreshToken:false},
});

export function publicUrl() {
  const url=new URL(Deno.env.get('FARMJAM_PUBLIC_URL')??'');
  if(url.protocol!=='https:'||url.username||url.password)throw new Error('Set FARMJAM_PUBLIC_URL to the HTTPS site origin');
  return url.origin;
}

export function browserHeaders(request:Request) {
  const origin=request.headers.get('origin');
  const permitted=(Deno.env.get('PARENT_WEB_ORIGINS')??'').split(',').map(value=>value.trim());
  const headers=new Headers({'Cache-Control':'no-store','Vary':'Origin'});
  if(origin) {
    let productionOrigin;
    try {productionOrigin=publicUrl();} catch { /* Local previews can use the explicit allowlist. */ }
    if(origin!==productionOrigin&&!permitted.includes(origin))return null;
    headers.set('Access-Control-Allow-Origin',origin);
  }
  headers.set('Access-Control-Allow-Headers','authorization, apikey, content-type, x-client-info');
  headers.set('Access-Control-Allow-Methods','POST, OPTIONS');
  return headers;
}

export async function parentUser(request:Request) {
  const token=bearer(request);
  if(!token)return null;
  const {data,error}=await admin.auth.getUser(token);
  if(error||!data.user?.email||!data.user.email_confirmed_at)return null;
  return {...data.user,email:data.user.email};
}

export function bearer(request:Request) {
  return request.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1];
}
