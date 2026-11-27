import {admin} from '../_shared/server.ts';
import {product,stripe} from '../_shared/stripe.ts';
import {stripeSignatureValid} from '../_shared/security.mjs';

Deno.serve(async request=>{
  if(request.method!=='POST')return new Response(null,{status:405});
  const payload=await request.text();
  if(!await stripeSignatureValid(payload,request.headers.get('stripe-signature'),Deno.env.get('STRIPE_WEBHOOK_SECRET'))){
    return new Response(null,{status:400});
  }
  const event=JSON.parse(payload);
  const live=/^[sr]k_live_/.test(Deno.env.get('STRIPE_SECRET_KEY')??'');
  if(event.livemode!==live)return new Response(null,{status:400});
  const object=event.data.object;
  if(event.type==='checkout.session.async_payment_failed'){
    const {error}=await admin.from('farmjam_checkout_attempts').delete().eq('session_id',object.id);
    return new Response(null,{status:error?503:204});
  }
  const revoked=(event.type==='charge.refunded'&&object.refunded===true)||(event.type==='charge.dispute.closed'&&object.status==='lost');
  if(event.type!=='payment_intent.succeeded'&&!revoked)return new Response(null,{status:204});
  try {
    const intentId=revoked?object.payment_intent:object.id;
    if(typeof intentId!=='string'||!/^pi_[a-zA-Z0-9_]+$/.test(intentId))return new Response(null,{status:204});
    const intent=revoked?await stripe(`payment_intents/${intentId}`):object;
    const parent=intent.metadata?.farmjam_parent;
    if(intent.metadata?.farmjam_product!==product||!(/^[a-f0-9-]{36}$/i.test(parent??'')))return new Response(null,{status:204});
    const {error}=await admin.rpc('farmjam_record_payment',{intent:intentId,parent,revoked_event:revoked});
    if(error)throw error;
    if(revoked){
      const sessions=await stripe(`checkout/sessions?payment_intent=${intentId}&limit=1`);
      const sessionId=sessions.data[0]?.id;
      if(sessionId){
        const {error:clearError}=await admin.from('farmjam_checkout_attempts').delete().eq('session_id',sessionId);
        if(clearError)throw clearError;
      }
    }
    return new Response(null,{status:204});
  } catch {
    return new Response(null,{status:503});
  }
});
