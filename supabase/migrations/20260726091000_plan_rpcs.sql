-- Server-side plan logic.
--
-- Follows the waitlist pattern from the web repo: anything involving a
-- rule the client shouldn't be trusted to hold — here "what is today for
-- this family" and "there is exactly one plan per child per day" — runs
-- as a security definer function rather than as client-side queries.
--
-- The client still reads its own rows directly through RLS for plain
-- fetches; these exist for the operations where a race or a wrong clock
-- would corrupt data.
-- ---------------------------------------------------------------------
-- Family-local "today"
-- ---------------------------------------------------------------------
-- The single definition of a plan date. UTC would roll the plan over at
-- 05:30 for a family in IST — mid-morning, halfway through their day.
-- Everything that writes a plan_date goes through this.
create or replace function plan_date_for (p_child_id uuid) returns date language sql stable security definer
set
  search_path = public as $$
  select (now() at time zone coalesce(p.timezone, 'Asia/Kolkata'))::date
  from children c
  join profiles p on p.id = c.parent_id
  where c.id = p_child_id;
$$;

-- ---------------------------------------------------------------------
-- Age band
-- ---------------------------------------------------------------------
-- Mirrors bandFor() in lib/todaysPlan.ts. Lives here too so the server can
-- pick activities without trusting a band the client computed.
create or replace function age_band_for (p_dob date, p_on date default current_date) returns age_band language sql immutable as $$
  select case
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 61 then 'y5_7'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 37 then 'y3_5'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 25 then 'm25_36'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 13 then 'm13_24'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 7  then 'm7_12'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 4  then 'm4_6'::age_band
    else 'm0_3'::age_band
  end;
$$;

-- ---------------------------------------------------------------------
-- Get or generate today's plan
-- ---------------------------------------------------------------------
-- THE core read. Returns the existing plan when there is one and only
-- generates when there isn't, which is what makes the recommendation
-- stable across app opens.
--
-- Selection matches lib/todaysPlan.ts: one activity per domain from the
-- child's band, rotated by day so it varies between days but never within
-- one. The ON CONFLICT makes two simultaneous cold opens safe — the
-- loser re-reads the winner's row rather than raising.
create or replace function get_or_create_daily_plan (p_child_id uuid) returns daily_plans language plpgsql security definer
set
  search_path = public as $$
declare
  v_owner uuid;
  v_dob date;
  v_date date;
  v_band age_band;
  v_day int;
  v_plan daily_plans;
  v_ids text[];
begin
  -- security definer bypasses RLS, so ownership is checked explicitly.
  select c.parent_id, c.date_of_birth into v_owner, v_dob
  from children c where c.id = p_child_id;

  if v_owner is null then
    raise exception 'child not found';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'not your child';
  end if;

  v_date := plan_date_for(p_child_id);

  select * into v_plan from daily_plans
  where child_id = p_child_id and plan_date = v_date;

  if found then
    return v_plan;
  end if;

  v_band := age_band_for(v_dob, v_date);
  v_day  := (v_date - date '1970-01-01');

  -- One activity per domain: order the band's pool for that domain by id
  -- (stable), then take the day-index'th, wrapping. Same rotation rule the
  -- client used, so a plan generated either side looks identical.
  select array[
    (select a.id from activities a
      where a.age_band = v_band and a.domain = 'motor'
      order by a.id offset (v_day % greatest((select count(*) from activities where age_band = v_band and domain = 'motor'), 1)) limit 1),
    (select a.id from activities a
      where a.age_band = v_band and a.domain = 'communication'
      order by a.id offset (v_day % greatest((select count(*) from activities where age_band = v_band and domain = 'communication'), 1)) limit 1),
    (select a.id from activities a
      where a.age_band = v_band and a.domain = 'cognitive'
      order by a.id offset (v_day % greatest((select count(*) from activities where age_band = v_band and domain = 'cognitive'), 1)) limit 1),
    (select a.id from activities a
      where a.age_band = v_band and a.domain = 'social_emotional'
      order by a.id offset (v_day % greatest((select count(*) from activities where age_band = v_band and domain = 'social_emotional'), 1)) limit 1)
  ] into v_ids;

  insert into daily_plans (
    child_id, plan_date,
    motor_activity_id, communication_activity_id,
    cognitive_activity_id, social_emotional_activity_id
  )
  values (p_child_id, v_date, v_ids[1], v_ids[2], v_ids[3], v_ids[4])
  on conflict (child_id, plan_date) do nothing;

  -- do nothing means another session won the race; read theirs.
  select * into v_plan from daily_plans
  where child_id = p_child_id and plan_date = v_date;

  return v_plan;
end;
$$;

-- ---------------------------------------------------------------------
-- Swap one domain
-- ---------------------------------------------------------------------
-- Advances that domain to the next activity in its band pool and records
-- the swap count, so the choice survives a restart. Stays inside the band
-- by construction — age-appropriateness is never traded for variety.
create or replace function swap_plan_domain (p_child_id uuid, p_domain domain) returns daily_plans language plpgsql security definer
set
  search_path = public as $$
declare
  v_plan daily_plans;
  v_dob date;
  v_band age_band;
  v_count int;
  v_next int;
  v_id text;
  v_day int;
begin
  v_plan := get_or_create_daily_plan(p_child_id); -- also does the ownership check

  select date_of_birth into v_dob from children where id = p_child_id;
  v_band := age_band_for(v_dob, v_plan.plan_date);
  v_day  := (v_plan.plan_date - date '1970-01-01');

  select count(*) into v_count from activities
  where age_band = v_band and domain = p_domain;

  if v_count <= 1 then
    return v_plan; -- nothing to swap to
  end if;

  v_next := coalesce((v_plan.swaps ->> p_domain::text)::int, 0) + 1;

  select a.id into v_id from activities a
  where a.age_band = v_band and a.domain = p_domain
  order by a.id
  offset ((v_day + v_next) % v_count)
  limit 1;

  update daily_plans set
    swaps = v_plan.swaps || jsonb_build_object(p_domain::text, v_next),
    motor_activity_id            = case when p_domain = 'motor'            then v_id else motor_activity_id end,
    communication_activity_id    = case when p_domain = 'communication'    then v_id else communication_activity_id end,
    cognitive_activity_id        = case when p_domain = 'cognitive'        then v_id else cognitive_activity_id end,
    social_emotional_activity_id = case when p_domain = 'social_emotional' then v_id else social_emotional_activity_id end
  where id = v_plan.id
  returning * into v_plan;

  return v_plan;
end;
$$;

-- ---------------------------------------------------------------------
-- Start an activity
-- ---------------------------------------------------------------------
-- Creates the log row at START, with content SNAPSHOTTED from the library
-- at this moment. A row that stays here — started_at set, completed_at
-- null — is an abandonment, which is the signal we want.
--
-- Idempotent: tapping Start twice keeps the ORIGINAL started_at, so the
-- duration we eventually measure is from first attempt, not last tap.
create or replace function start_activity (p_child_id uuid, p_activity_id text) returns activity_log language plpgsql security definer
set
  search_path = public as $$
declare
  v_owner uuid;
  v_row activity_log;
  v_a activities;
begin
  select parent_id into v_owner from children where id = p_child_id;
  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'not your child';
  end if;

  select * into v_a from activities where id = p_activity_id;
  if not found then
    raise exception 'unknown activity %', p_activity_id;
  end if;

  insert into activity_log (
    child_id, activity_id, domain, title, age_band, plan_date, started_at
  )
  values (
    p_child_id, v_a.id, v_a.domain, v_a.title, v_a.age_band,
    plan_date_for(p_child_id), now()
  )
  on conflict (child_id, activity_id, plan_date) do update
    set started_at = coalesce(activity_log.started_at, now())
  returning * into v_row;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------
-- Complete an activity
-- ---------------------------------------------------------------------
-- Updates the row Start created rather than inserting a second one. If
-- there's no row — the parent tapped Done without Start — one is created
-- with started_at left null, which records honestly that it was never
-- started rather than inventing a start time.
create or replace function complete_activity (
  p_child_id uuid,
  p_activity_id text,
  p_note text default null
) returns activity_log language plpgsql security definer
set
  search_path = public as $$
declare
  v_owner uuid;
  v_row activity_log;
  v_a activities;
begin
  select parent_id into v_owner from children where id = p_child_id;
  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'not your child';
  end if;

  select * into v_a from activities where id = p_activity_id;
  if not found then
    raise exception 'unknown activity %', p_activity_id;
  end if;

  insert into activity_log (
    child_id, activity_id, domain, title, age_band, plan_date, completed_at, note
  )
  values (
    p_child_id, v_a.id, v_a.domain, v_a.title, v_a.age_band,
    plan_date_for(p_child_id), now(), p_note
  )
  on conflict (child_id, activity_id, plan_date) do update
    set completed_at = now(),
        -- Don't let a completion with no note wipe one the parent wrote
        -- while the activity was in progress.
        note = coalesce(excluded.note, activity_log.note)
  returning * into v_row;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------
-- Domain recency — the ordering hook
-- ---------------------------------------------------------------------
-- Feeds orderDomains() in lib/todaysPlan.ts, which currently returns a
-- fixed sequence. Least-recently-completed first, never-completed first of
-- all, so the plan self-corrects toward neglected domains without asking
-- the parent anything.
create or replace function domain_recency (p_child_id uuid) returns table (domain domain, last_completed_at timestamptz) language sql stable security definer
set
  search_path = public as $$
  select d.domain, max(l.completed_at) as last_completed_at
  from unnest(enum_range(null::domain)) as d(domain)
  left join activity_log l
    on l.domain = d.domain
   and l.child_id = p_child_id
  where exists (
    select 1 from children c
    where c.id = p_child_id and c.parent_id = auth.uid()
  )
  group by d.domain
  order by max(l.completed_at) asc nulls first;
$$;
