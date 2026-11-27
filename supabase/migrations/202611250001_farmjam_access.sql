create table public.farmjam_payments (
  payment_intent text primary key,
  parent_id uuid references auth.users(id) on delete set null,
  revoked boolean not null default false
);

create table public.farmjam_invites (
  token_hash text primary key,
  recipient_hash text not null,
  expires_at timestamptz not null default now() + interval '14 days',
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users(id) on delete set null
);

create table public.farmjam_checkout_attempts (
  parent_id uuid primary key references auth.users(id) on delete cascade,
  attempt_id uuid not null default gen_random_uuid(),
  session_id text unique
);

alter table public.farmjam_payments enable row level security;
alter table public.farmjam_invites enable row level security;
alter table public.farmjam_checkout_attempts enable row level security;
revoke all on public.farmjam_payments, public.farmjam_invites, public.farmjam_checkout_attempts from public, anon, authenticated;
grant select, insert, update, delete on public.farmjam_payments, public.farmjam_invites, public.farmjam_checkout_attempts to service_role;
create index farmjam_payments_parent on public.farmjam_payments (parent_id) where not revoked;
create index farmjam_invites_parent on public.farmjam_invites (redeemed_by) where redeemed_by is not null;

create function public.farmjam_has_access(parent uuid)
returns boolean language sql stable set search_path = '' as $$
  select exists(select 1 from public.farmjam_payments where parent_id = parent and not revoked)
      or exists(select 1 from public.farmjam_invites where redeemed_by = parent);
$$;

create function public.farmjam_record_payment(intent text, parent uuid, revoked_event boolean)
returns void language sql security definer set search_path = '' as $$
  insert into public.farmjam_payments as payment (payment_intent, parent_id, revoked)
  values (intent, (select id from auth.users where id = parent for key share), revoked_event)
  on conflict (payment_intent) do update set revoked = payment.revoked or excluded.revoked;
$$;

create function public.farmjam_redeem_invite(invite_hash text, parent uuid, verified_recipient_hash text)
returns boolean language plpgsql set search_path = '' as $$
begin
  update public.farmjam_invites
    set redeemed_at = now(), redeemed_by = parent
    where token_hash = invite_hash and recipient_hash = verified_recipient_hash
      and redeemed_at is null and expires_at > now();
  if found then return true; end if;
  -- A retry after a lost response succeeds for the original recipient only.
  return exists(select 1 from public.farmjam_invites where token_hash = invite_hash and redeemed_by = parent);
end;
$$;

create function public.farmjam_checkout_attempt(parent uuid, expired_attempt uuid)
returns public.farmjam_checkout_attempts language plpgsql set search_path = '' as $$
declare result public.farmjam_checkout_attempts;
begin
  insert into public.farmjam_checkout_attempts(parent_id) values (parent)
  on conflict (parent_id) do nothing;
  update public.farmjam_checkout_attempts set attempt_id = gen_random_uuid(), session_id = null
    where parent_id = parent and attempt_id = expired_attempt;
  select * into result from public.farmjam_checkout_attempts where parent_id = parent;
  return result;
end;
$$;

revoke all on function public.farmjam_has_access(uuid), public.farmjam_record_payment(text,uuid,boolean),
  public.farmjam_redeem_invite(text,uuid,text), public.farmjam_checkout_attempt(uuid,uuid) from public, anon, authenticated;
grant execute on function public.farmjam_has_access(uuid), public.farmjam_record_payment(text,uuid,boolean),
  public.farmjam_redeem_invite(text,uuid,text), public.farmjam_checkout_attempt(uuid,uuid) to service_role;
