const [email,option,...extra]=process.argv.slice(2);
const origin=process.env.FARMJAM_SUPABASE_URL;
const token=process.env.FARMJAM_INVITE_ADMIN_TOKEN;
if(!email||(option&&option!=='--link')||extra.length||!origin||!token){
  console.error('Set FARMJAM_SUPABASE_URL and FARMJAM_INVITE_ADMIN_TOKEN, then run npm run invite:send -- parent@example.com [--link].');
  process.exit(1);
}
try {
  const endpoint=new URL('/functions/v1/send-invite',origin);
  if(endpoint.protocol!=='https:')throw new Error('Use the HTTPS Supabase URL.');
  const response=await fetch(endpoint,{
    method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
    body:JSON.stringify({email,linkOnly:option==='--link'}),
  });
  if(!response.ok)throw new Error(`The invitation request failed (${response.status}).`);
  const result=await response.json();
  if(option==='--link')console.log(result.url);
  else console.log('FarmJam invitation sent.');
} catch(error) {
  console.error(error.message);
  process.exitCode=1;
}
