import {admin,bearer,publicUrl} from '../_shared/server.ts';
import {constantTimeEqual,hashToken,inviteToken,recipientHash} from '../_shared/security.mjs';

Deno.serve(async request=>{
  if(request.method!=='POST')return new Response(null,{status:405});
  const secret=Deno.env.get('FARMJAM_INVITE_ADMIN_TOKEN');
  if(!secret||secret.length<32||!constantTimeEqual(bearer(request)??'',secret))return new Response(null,{status:401});
  const body=await request.json().catch(()=>null);
  const email=typeof body?.email==='string'?body.email.trim().toLowerCase():'';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return new Response(null,{status:400});
  const linkOnly=body.linkOnly===true;
  const apiKey=Deno.env.get('RESEND_API_KEY');
  const from=Deno.env.get('FARMJAM_INVITE_FROM');
  if(!linkOnly&&(!apiKey||!from))return new Response(null,{status:503});
  try {
    const token=inviteToken();
    const url=`${publicUrl()}/#invite=${token}`;
    const tokenHash=await hashToken(token);
    const {error}=await admin.from('farmjam_invites').insert({token_hash:tokenHash,recipient_hash:await recipientHash(token,email)});
    if(error)throw error;
    const headers={'Cache-Control':'no-store'};
    if(linkOnly)return Response.json({url},{headers});
    const delivery=await fetch('https://api.resend.com/emails',{
      method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':`farmjam-invite/${tokenHash}`},
      body:JSON.stringify({from,to:[email],subject:'Your invitation to unlock FarmJam',text:
        `You’re invited to unlock the full version of FarmJam for free. Open the link and sign in with the email address that received this invitation.\n\n${url}\n\nThe link can be redeemed once and expires in 14 days.`}),
    });
    if(!delivery.ok)return new Response(null,{status:502,headers});
    return Response.json({sent:true},{headers});
  } catch {
    return new Response(null,{status:503});
  }
});
