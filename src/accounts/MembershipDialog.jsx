import React,{useState} from 'react';
import {CaregiverDialog} from '../components/CaregiverDialog';
import {TrialInformation} from '../components/TrialInformation';

function adultTask() {
  const numbers=crypto.getRandomValues(new Uint8Array(3));
  return {first:12+numbers[0]%17,second:4+numbers[1]%5,add:11+numbers[2]%13};
}

export function MembershipDialog({membership,onClose,invite,onInviteCleared,checkout}) {
  const [task,setTask]=useState(adultTask);
  const [answer,setAnswer]=useState('');
  const [verified,setVerified]=useState(false);
  const [email,setEmail]=useState('');
  const [code,setCode]=useState('');
  const [codeSent,setCodeSent]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [confirmDelete,setConfirmDelete]=useState(false);
  const accountId=membership.account?.id;

  function verify(event) {
    event.preventDefault();
    if(Number(answer)===task.first*task.second+task.add){setVerified(true);setMessage('');return;}
    setTask(adultTask());setAnswer('');setMessage('Ask a parent to try this new question.');
  }
  async function perform(action,failure) {
    if(busy)return;
    setBusy(true);setMessage('');
    try {setMessage((await action())??'');}
    catch {setMessage(failure);}
    finally {setBusy(false);}
  }
  const send=()=>perform(async()=>{
    await membership.sendCode(email.trim());
    setCode('');setCodeSent(true);
    return 'Check your email for a six-digit code.';
  },'The code could not be sent. Check your email address and connection, then try again.');
  const confirm=()=>perform(async()=>{
    const unlocked=await membership.confirmCode(email.trim(),code);
    setCodeSent(false);setCode('');
    if(unlocked&&!invite)onClose();
  },'That code could not be verified. Request a new code if it has expired.');

  return <CaregiverDialog title="FarmJam for parents" onClose={onClose} footer={<button onClick={onClose}>Done</button>}>
    {!verified?<>
      {invite&&<p>You have an invitation to unlock FarmJam. Continue as a parent to redeem it.</p>}
      <TrialInformation/>
      <form className="membership-form" onSubmit={verify}>
        <label className="membership-field">For a parent: multiply {task.first} by {task.second}, then add {task.add}.
          <input inputMode="numeric" pattern="[0-9]+" value={answer} onChange={event=>setAnswer(event.target.value)} required/>
        </label>
        <div><button className="learning-action" type="submit">Continue as parent</button></div>
      </form>
    </>:!membership.available?<>
      <TrialInformation/>
      <p>Parent sign-in and checkout are unavailable in this build. You can keep playing the free trial.</p>
    </>:!accountId?<>
      <h3>Parent sign-in</h3><p>{invite?'Use the email address that received the invitation.':'Use the same parent email on your devices to access your unlock.'} Child details stay on this device.</p>
      <form className="membership-form" onSubmit={event=>{event.preventDefault();if(codeSent)confirm();else send();}}>
        <label className="membership-field">Parent email<input type="email" autoComplete="email" value={email} disabled={busy||codeSent} onChange={event=>setEmail(event.target.value)} required/></label>
        {codeSent&&<label className="membership-field">Email code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event=>setCode(event.target.value)} disabled={busy} required/></label>}
        <div className="membership-actions"><button className="learning-action" disabled={busy} type="submit">{codeSent?'Sign in':'Email me a code'}</button>
          {codeSent&&<><button className="learning-action" type="button" disabled={busy} onClick={send}>Resend code</button><button className="learning-action" type="button" disabled={busy} onClick={()=>{setCodeSent(false);setMessage('');}}>Change email</button></>}</div>
      </form>
    </>:<>
      <h3>{membership.unlocked?'Full version unlocked':'Unlock FarmJam'}</h3><p>Signed in as {membership.account.email}.</p>
      {!membership.unlocked&&<TrialInformation/>}
      {checkout==='complete'&&!membership.unlocked&&<p>Payment confirmation can take a moment. Check access again if the full version has yet to open.</p>}
      {checkout==='cancelled'&&!membership.unlocked&&<p>Checkout was cancelled. Your free trial is ready whenever you are.</p>}
      <div className="membership-actions">
        {invite&&<>
          <button className="learning-action" disabled={busy} onClick={()=>perform(async()=>{
            if(!await membership.redeem(invite))return 'This invitation has expired, was used, or was sent to another email address.';
            onInviteCleared();onClose();
          },'The invitation could not be checked. Try again while connected.')}>Redeem invitation</button>
          <button className="learning-action" disabled={busy} onClick={onInviteCleared}>Dismiss invitation</button>
        </>}
        {!membership.unlocked&&!invite&&<button className="learning-action" disabled={busy} onClick={()=>perform(async()=>{
          const result=await membership.checkout();
          if(result==='unlocked')onClose();
          if(result==='pending')return 'Payment confirmation is pending. Check access again in a moment.';
        },'Checkout could not open. Try again while connected.')}>Continue to one-time checkout</button>}
        {!membership.unlocked&&<button className="learning-action" disabled={busy} onClick={()=>perform(async()=>{
          if(await membership.refresh()){onClose();return;}
          return 'Full access is unavailable for this email. If you just paid, check again in a moment.';
        },'Access could not be checked. Try again while connected.')}>Check access</button>}
        <button className="learning-action" disabled={busy} onClick={()=>perform(async()=>{await membership.signOut();onClose();},'Could not sign out. Try again.')}>Sign out</button>
        {!confirmDelete&&<button className="learning-action" disabled={busy} onClick={()=>setConfirmDelete(true)}>Delete parent account</button>}
      </div>
      {confirmDelete&&<section><h3>Delete this parent account?</h3><p>This removes your sign-in and full access for this account. To remove local child profiles as well, delete them from the child menu before deleting the account. Keep your payment receipt if you need to contact support.</p>
        <div className="membership-actions"><button className="learning-action" disabled={busy} onClick={()=>perform(async()=>{
          await membership.deleteAccount();onClose();
        },'The account could not be deleted. Try again while connected.')}>Permanently delete account</button><button className="learning-action" disabled={busy} onClick={()=>setConfirmDelete(false)}>Keep account</button></div>
      </section>}
    </>}
    {(busy||message)&&<p role="status">{busy?'Working…':message}</p>}
  </CaregiverDialog>;
}
