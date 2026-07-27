-- Phone numbers are now deduplicated the same way email is: a partial
-- unique index so historic rows with a null phone (from the retired
-- email-only dialog) don't collide, but any new duplicate phone is
-- rejected the same way a duplicate email already is.
create unique index if not exists waitlist_phone_unique
  on waitlist (phone)
  where phone is not null;

-- Referral boost lowered from 10 places to 3 places per referral, to
-- match the new REFERRAL_BOOST in WaitlistDialogV3.jsx.
create or replace function get_queue_position(signup_id bigint)
returns integer
language sql
security definer
set search_path = public
as $$
  with base as (
    select id, created_at,
           row_number() over (order by created_at asc) as base_rank
    from waitlist
  ),
  referrals as (
    select referred_by as id, count(*) as referral_count
    from waitlist
    where referred_by is not null
    group by referred_by
  ),
  scored as (
    select b.id, b.created_at,
           b.base_rank - coalesce(r.referral_count, 0) * 3 as effective_key
    from base b
    left join referrals r on r.id = b.id
  ),
  ranked as (
    select id, row_number() over (order by effective_key asc, created_at asc) as position
    from scored
  )
  select position::int from ranked where id = signup_id;
$$;
