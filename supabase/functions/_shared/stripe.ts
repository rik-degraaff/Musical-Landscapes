import {admin,publicUrl} from './server.ts';

export const product='farmjam_full';

export async function stripe(path:string,fields?:URLSearchParams,idempotencyKey?:string) {
  const key=Deno.env.get('STRIPE_SECRET_KEY');
  if(!key)throw new Error('Stripe is not configured');
  const headers=new Headers({Authorization:`Bearer ${key}`});
  if(idempotencyKey)headers.set('Idempotency-Key',idempotencyKey);
  const response=await fetch(`https://api.stripe.com/v1/${path}`,{method:fields?'POST':'GET',headers,body:fields});
  if(!response.ok)throw new Error(`Stripe request failed (${response.status})`);
  return response.json();
}

export async function checkout(parent:string,email:string) {
  const price=Deno.env.get('STRIPE_FARMJAM_PRICE_ID');
  if(!price?.startsWith('price_'))throw new Error('Stripe checkout has no price');
  const origin=publicUrl();
  const fields=new URLSearchParams({
    mode:'payment',customer_email:email,
    'line_items[0][price]':price,'line_items[0][quantity]':'1',
    'payment_intent_data[metadata][farmjam_product]':product,
    'payment_intent_data[metadata][farmjam_parent]':parent,
    success_url:`${origin}/?checkout=complete`,cancel_url:`${origin}/?checkout=cancelled`,
  });
  async function attempt(expired_attempt:string|null) {
    const {data,error}=await admin.rpc('farmjam_checkout_attempt',{parent,expired_attempt}).single();
    if(error||!data)throw new Error('Checkout attempt is unavailable');
    return data as {attempt_id:string,session_id:string|null};
  }
  let current=await attempt(null);
  if(current.session_id){
    const existing=await stripe(`checkout/sessions/${current.session_id}`);
    if(existing.status==='open')return {url:existing.url};
    if(existing.status==='complete')return {pending:true};
    if(existing.status!=='expired')throw new Error('Unexpected checkout status');
    current=await attempt(current.attempt_id);
  }
  const session=current.session_id?await stripe(`checkout/sessions/${current.session_id}`)
    :await stripe('checkout/sessions',fields,`farmjam:${current.attempt_id}`);
  if(session.status==='complete')return {pending:true};
  if(!session.url||!session.id)throw new Error('Checkout has no URL');
  const {error}=await admin.from('farmjam_checkout_attempts').update({session_id:session.id})
    .eq('parent_id',parent).eq('attempt_id',current.attempt_id);
  if(error)throw error;
  return {url:session.url};
}
