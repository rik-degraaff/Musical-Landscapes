export const fixtureOrigin='https://auth-fixture.farmjam.invalid';
export const fixtureParent={id:'8a7b3ee2-734f-4a02-a80b-57b8c9bf7aa3',email:'parent@example.test'};
export const fixtureSession=()=>({
  access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,
  expires_in:3600,token_type:'bearer',user:fixtureParent,
});

export async function mockParentService(context,access) {
  await context.route(`${fixtureOrigin}/**`,async route=>{
    const request=route.request();
    const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info, x-supabase-api-version','Access-Control-Allow-Methods':'POST, OPTIONS'};
    if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
    const path=new URL(request.url()).pathname;
    if(path.endsWith('/otp'))return route.fulfill({json:{},headers});
    if(path.endsWith('/verify'))return route.fulfill({json:fixtureSession(),headers});
    if(path.endsWith('/farmjam-access'))return route.fulfill({json:await access(request.postDataJSON()),headers});
    return route.fulfill({status:404,headers});
  });
}
