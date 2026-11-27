import {createParentAuth} from './parentAuth.js';

const auth=createParentAuth();
const status=document.querySelector('#parent-status');
const emailForm=document.querySelector('#parent-email');
const codeForm=document.querySelector('#parent-code');
const deleteForm=document.querySelector('#parent-delete');
let email='';
let busy=false;

function bind(form,action,message) {
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(busy)return;
    busy=true;
    const button=form.querySelector('button');
    button.disabled=true;status.textContent='Working…';
    try {status.textContent=await action(new FormData(form));}
    catch {status.textContent=message;}
    finally {button.disabled=false;busy=false;}
  });
}

if(auth){
  emailForm.hidden=false;
  bind(emailForm,async form=>{
    const address=form.get('email').trim();
    // A deletion request never creates a parent account.
    await auth.sendCode(address,{create:false});
    email=address;codeForm.hidden=false;
    codeForm.elements.code.focus();
    return 'Check your email for the six-digit code.';
  },'Could not send a code. Check the address and try again.');
  bind(codeForm,async form=>{
    await auth.confirmCode(email,form.get('code'));
    emailForm.hidden=true;codeForm.hidden=true;deleteForm.hidden=false;
    deleteForm.querySelector('input').focus();
    return 'Email verified. Confirm deletion below.';
  },'That code could not be verified. You can request another code.');
  bind(deleteForm,async()=>{
    await auth.deleteAccount();
    deleteForm.hidden=true;
    return 'Your parent account was deleted.';
  },'Could not delete the account. Try again while connected.');
}else status.textContent='Account deletion is unavailable on this site. You can delete your parent account in FarmJam under Settings → Caregiver.';
