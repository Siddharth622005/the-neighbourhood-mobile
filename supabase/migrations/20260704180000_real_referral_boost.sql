-- The UI promises "each neighbour you invite moves you up 10 places" but
-- get_queue_position only ever ranked by created_at — referrals didn't
-- change anything. This makes the promise real: each signup's effective
-- rank is its plain signup-order rank minus 10 per person it referred,
-- with created_at as the tiebreaker for equal effective ranks.
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
           b.base_rank - coalesce(r.referral_count, 0) * 10 as effective_key
    from base b
    left join referrals r on r.id = b.id
  ),
  ranked as (
    select id, row_number() over (order by effective_key asc, created_at asc) as position
    from scored
  )
  select position::int from ranked where id = signup_id;
$$;
