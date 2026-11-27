# PWA release setup

`npm run build` produces the installable FarmJam site in `dist/`. Serve it at the existing HTTPS FarmJam URL. Leave `VITE_FARMJAM_EDITIONS` unset or false for the open launch. Anyone with the link can play the full game, including bicycle travel and the Jungle, without signing in.

When ready to introduce editions, configure and verify the services below, then set `VITE_FARMJAM_EDITIONS=true` in the web host's build environment and rebuild. The app then opens in the unlimited trial. Parents can sign in from **For parents** to pay once or redeem an email invitation. The same parent email carries full access across devices. Child profiles stay in the browser or installed PWA that created them. Set the flag back to false and rebuild to restore open access.

## Set up parent accounts and payments

1. Create or select the Supabase project. Apply `supabase/migrations/` and deploy the `farmjam-access`, `stripe-webhook`, `send-invite`, and `delete-parent` Edge Functions. Enable email sign-in and configure email confirmations and a six-digit OTP template with `{{ .Token }}`. Configure an SMTP sender before inviting external testers. [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates) · [Supabase SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp)
2. Set the public Supabase URL and publishable key in the web host's build environment. Use `.env.example` for their names. Set `FARMJAM_PUBLIC_URL` to the public HTTPS site origin in Supabase. If you use staging or local development, add its exact origins to the comma-separated `PARENT_WEB_ORIGINS` secret. Serve the built `parent-account.html` at `/parent-account.html` and publish privacy and support information on the site.
3. Create a Stripe product with a **one-time price** in test mode. Set `STRIPE_FARMJAM_PRICE_ID` and `STRIPE_SECRET_KEY` as Supabase secrets. Add a Stripe webhook pointing to `https://<project-ref>.supabase.co/functions/v1/stripe-webhook` and set `STRIPE_WEBHOOK_SECRET` to its signing secret. Subscribe to `payment_intent.succeeded`, `checkout.session.async_payment_failed`, `charge.refunded`, and `charge.dispute.closed`. Use live-mode values after testing. [Stripe Checkout](https://docs.stripe.com/payments/checkout) · [Stripe webhooks](https://docs.stripe.com/webhooks)

Stripe hosts checkout. The return URL prompts the app to recheck access. The server grants it after a verified successful payment and removes the grant after a full refund or lost dispute. A redeemed invite is an independent grant. The site displays the price on Stripe Checkout.

## Send a free invitation

Set a strong randomly generated `FARMJAM_INVITE_ADMIN_TOKEN` in Supabase and in the operator’s local environment. Set `FARMJAM_SUPABASE_URL` locally. For automatic email, also set `RESEND_API_KEY` and `FARMJAM_INVITE_FROM` in Supabase using a verified sender domain. Disable click tracking for invitations so the recipient receives the original link. [Resend email API](https://resend.com/docs/api-reference/emails/send-email)

```sh
npm run invite:send -- parent@example.com
```

Pass `--link` after the address to generate a link and share it privately yourself. This works without Resend. Each link expires after 14 days and is bound to the recipient's verified email. Clicking or previewing it leaves it usable until the parent signs in and chooses **Redeem invitation**. Keep the operator token and generated links private. The database stores hashes of the token and recipient binding.

## Validate before publishing

- Run `npm run test:e2e:pwa` with its enabled editions and mock account service. Run `npm run test:production` with its separate open-access `dist-test` bundle to verify offline play and worker updates. Deploy `dist/` from `npm run build`.
- In a connected staging environment, test a successful Stripe test payment, cancel, delayed payment if offered, full refund, and repeated delivery of the same webhook. Verify that a checkout return without a successful event leaves the account in the trial.
- Send a real test invitation, accept it with the intended parent email, and check that a different verified email cannot redeem it. Verify full access on a second device using the same email. Verify an expired or forwarded invite reports that it cannot be used.
- Test the installed PWA on iPhone or iPad and Android, including sign-in, checkout return, cached trial and full play, reconnect, and profile persistence. The website uses the [caregiver guide](caregiver-guide.md) for both editions.
