import {admin,browserHeaders,parentUser} from '../_shared/server.ts';

Deno.serve(async request=>{
  const headers=browserHeaders(request);
  if(!headers)return new Response(null,{status:403});

  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(request.method!=='POST')return new Response(null,{status:405,headers});
  const user=await parentUser(request);
  if(!user)return new Response(null,{status:401,headers});
  const body=await request.json().catch(()=>null);
  if(body?.confirm!==true)return new Response(null,{status:400,headers});
  const {error:deleteError}=await admin.auth.admin.deleteUser(user.id);
  if(deleteError)return new Response(null,{status:500,headers});

  return new Response(null,{status:204,headers});
});
