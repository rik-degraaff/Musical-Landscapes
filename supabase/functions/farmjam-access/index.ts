import {admin,browserHeaders,parentUser} from '../_shared/server.ts';
import {checkout} from '../_shared/stripe.ts';
import {hashToken,recipientHash,validInvite} from '../_shared/security.mjs';

Deno.serve(async request=>{
  const headers=browserHeaders(request);
  if(!headers)return new Response(null,{status:403});
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(request.method!=='POST')return new Response(null,{status:405,headers});
  const user=await parentUser(request);
  if(!user)return new Response(null,{status:401,headers});
  const body=await request.json().catch(()=>null);
  try {
    if(body?.action==='redeem'&&validInvite(body.token)){
      const {data,error}=await admin.rpc('farmjam_redeem_invite',{
        invite_hash:await hashToken(body.token),parent:user.id,verified_recipient_hash:await recipientHash(body.token,user.email),
      });
      if(error)throw error;
      return Response.json({unlocked:data===true},{headers});
    }
    if(body?.action!=='status'&&body?.action!=='checkout')return new Response(null,{status:400,headers});
    const {data,error}=await admin.rpc('farmjam_has_access',{parent:user.id});
    if(error)throw error;
    if(body.action==='status'||data)return Response.json({unlocked:data===true},{headers});
    return Response.json(await checkout(user.id,user.email),{headers});
  } catch {
    return new Response(null,{status:503,headers});
  }
});
