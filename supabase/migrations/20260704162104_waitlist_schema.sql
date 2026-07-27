-- The Neighbourhood — Waitlist schema
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).

create table if not exists waitlist (
  id bigint generated always as identity primary key,
  name text,
  phone text,
  email text,
  referred_by bigint references waitlist(id) on delete set null,
  created_at timestamptz not null default now()
);

-- name/phone are nullable at the database level (older routes only ever
-- collected email) but the V3 waitlist dialog requires and sends both.
-- Only email carries a uniqueness constraint — phone numbers are typed by
-- hand and far more error-prone, so we don't want a typo to lock someone
-- out of ever joining; duplicate emails are still rejected.
create unique index if not exists waitlist_email_unique
  on waitlist (email)
  where email is not null;

alter table waitlist enable row level security;

-- Anyone can insert (join the waitlist) but cannot read the table directly,
-- keeping contact details private. Position/referral counts are exposed
-- only via the RPC functions below, which run with definer rights.
create policy "public can insert" on waitlist
  for insert
  with check (true);

-- Returns this signup's rank in the queue (1 = first ever signup).
create or replace function get_queue_position(signup_id bigint)
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::int
  from waitlist
  where created_at <= (select created_at from waitlist where id = signup_id);
$$;

-- Returns how many people this signup has referred.
create or replace function get_referral_count(signup_id bigint)
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::int
  from waitlist
  where referred_by = signup_id;
$$;

-- Returns the total number of signups (for "N families in the village so far").
create or replace function get_total_signups()
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::int from waitlist;
$$;
