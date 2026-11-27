import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {hashToken,recipientHash,inviteToken,validInvite,stripeSignatureValid} from '../supabase/functions/_shared/security.mjs';

test('invite tokens are opaque, fixed-length, and bound to the verified email',async()=>{
  const token=inviteToken();
  assert.equal(validInvite(token),true);
  assert.notEqual(token,inviteToken());
  assert.equal(validInvite(`${token}0`),false);
  assert.equal((await hashToken(token)).length,64);
  assert.equal(await recipientHash(token,' Parent@Example.com '),await recipientHash(token,'parent@example.com'));
  assert.notEqual(await recipientHash(token,'other@example.com'),await recipientHash(token,'parent@example.com'));
  assert.notEqual(await recipientHash(token,'parent@example.com'),await recipientHash(inviteToken(),'parent@example.com'));
});

test('Stripe signature verification checks the raw body, secret, and replay window',async()=>{
  const secret='fixture-endpoint-secret';
  const payload='{"type":"payment_intent.succeeded"}';
  const now=Date.parse('2026-11-25T00:00:00Z');
  const timestamp=now/1000;
  const signature=createHmac('sha256',secret).update(`${timestamp}.${payload}`).digest('hex');
  const header=`t=${timestamp},v1=${'0'.repeat(64)},v1=${signature}`;
  assert.equal(await stripeSignatureValid(payload,header,secret,now),true);
  assert.equal(await stripeSignatureValid(`${payload} `,header,secret,now),false);
  assert.equal(await stripeSignatureValid(payload,header,'wrong-secret',now),false);
  assert.equal(await stripeSignatureValid(payload,header,secret,now+301000),false);
  assert.equal(await stripeSignatureValid(payload,null,secret,now),false);
});
