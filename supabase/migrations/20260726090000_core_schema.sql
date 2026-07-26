-- The Neighbourhood — core schema.
--
-- SUPERSEDES the never-applied draft at
-- the-neighbourhood/supabase/migrations/20260713100000_mobile_app_family_schema.sql,
-- which created `parents`/`children`. That file is untracked and was never
-- pushed (verified against the live project: parents/children return
-- PGRST205 "table not found", only `waitlist` exists). DELETE IT before
-- running `supabase db push`, or both it and this migration will apply and
-- you'll end up with `parents` AND `profiles`.
--
-- Shape of the whole thing:
--   global content  — activities, milestones, vaccination_schedule.
--                     Readable by any authenticated user, writable by
--                     nobody through the API. Seeded from the codebase.
--   family data     — profiles, children and everything hanging off a
--                     child. RLS scoped to the owning parent throughout.
--
-- Two rules that shape most of the decisions below:
--   · A child's history must never be rewritten by a content edit, so
--     activity_log snapshots what it recorded (see its comment).
--   · "Today" is a family-local concept, so plan dates are computed from
--     the profile's IANA timezone, never from UTC (see plan_date_for).

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------

-- Ordered to match the plan's presentation order (Cognitive third), which
-- is what Home renders. The website timeline lists Social & Emotional
-- third instead — same four domains, different display order. Postgres
-- enum order defines ORDER BY, so anything sorting by domain gets the
-- app's order for free.
create type domain as enum (
  'motor',
  'communication',
  'cognitive',
  'social_emotional'
);

-- The seven activity bands from lib/todaysPlan.ts, lower bound in months:
--   m0_3 = 0, m4_6 = 4, m7_12 = 7, m13_24 = 13, m25_36 = 25,
--   y3_5 = 37, y5_7 = 61
-- Named so they sort correctly as text and stay readable in raw SQL.
create type age_band as enum (
  'm0_3',
  'm4_6',
  'm7_12',
  'm13_24',
  'm25_36',
  'y3_5',
  'y5_7'
);

-- ---------------------------------------------------------------------
-- Global content — read-only to clients
-- ---------------------------------------------------------------------

create table activities (
  id text primary key, -- slug of the title; stable and readable in logs
  domain domain not null,
  age_band age_band not null,
  title text not null,
  why text not null, -- the one-line rationale shown under the title
  duration_minutes int not null check (duration_minutes > 0),
  materials text not null,
  instructions text, -- long-form steps; not yet authored
  created_at timestamptz not null default now()
);

create index activities_band_domain_idx on activities (age_band, domain);

-- The milestone library.
--
-- age_band exists so milestones can be filtered alongside activities, but
-- it is LOSSY: the source dataset has 15 stages (7–9, 10–12, 12–15, …)
-- against the activity bands' 7, so several stages collapse into one band.
-- typical_age_min_months/max_months carry the real range and are what the
-- timeline should order and group by. Don't use age_band for display.
create table milestones (
  id text primary key,
  domain domain not null,
  age_band age_band not null,
  stage_label text not null, -- e.g. "10–12 months", from the source dataset
  description text not null,
  typical_age_min_months int not null check (typical_age_min_months >= 0),
  typical_age_max_months int not null,
  -- The parent-facing guide from the dataset: what to try, what to watch
  -- for, and when to raise it with a doctor. Kept as jsonb because it's
  -- display content with a stable shape, not something we query into.
  guide jsonb,
  created_at timestamptz not null default now(),
  constraint milestones_age_range_valid check (typical_age_max_months >= typical_age_min_months)
);

create index milestones_age_idx on milestones (typical_age_min_months, domain);

-- EMPTY ON PURPOSE. No vaccination dataset exists in either repo, and an
-- immunisation schedule is not something to reconstruct from memory — a
-- wrong date here has real consequences. Seed from a sourced IAP schedule
-- before the Vaccinations section ships.
create table vaccination_schedule (
  id text primary key,
  vaccine_name text not null,
  recommended_age_months int not null check (recommended_age_months >= 0),
  dose_label text, -- e.g. "1st dose", "booster"
  notes text,
  created_at timestamptz not null default now()
);

create index vaccination_schedule_age_idx on vaccination_schedule (recommended_age_months);

-- ---------------------------------------------------------------------
-- Family data
-- ---------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  parent_name text,
  relationship text, -- Mother | Father | Guardian | Grandparent
  phone text,
  -- IANA zone, captured from the device at signup. Every "today" in the
  -- product is derived from this, so a family in IST rolls over at IST
  -- midnight rather than 05:30 local.
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now()
);

create table children (
  id uuid primary key default gen_random_uuid (),
  parent_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  date_of_birth date not null,
  gender text, -- Boy | Girl | Prefer not to say; nullable by design
  created_at timestamptz not null default now()
);

create index children_parent_idx on children (parent_id);

-- Today's plan, PERSISTED.
--
-- The whole point: reopening the app must show the same four activities.
-- Generation happens once per (child, local date); a swap updates the
-- stored row rather than re-rolling. Without this the recommendation
-- changes under the parent and stops being believable.
--
-- One column per domain rather than a child table: there are always
-- exactly four, one per domain, and that invariant is easier to hold in
-- columns than to enforce across rows.
create table daily_plans (
  id uuid primary key default gen_random_uuid (),
  child_id uuid not null references children (id) on delete cascade,
  plan_date date not null, -- family-local date, via plan_date_for()
  motor_activity_id text references activities (id) on delete set null,
  communication_activity_id text references activities (id) on delete set null,
  cognitive_activity_id text references activities (id) on delete set null,
  social_emotional_activity_id text references activities (id) on delete set null,
  -- Swap counts per domain, so a rotation survives an app restart.
  swaps jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  constraint daily_plans_unique_per_day unique (child_id, plan_date)
);

create index daily_plans_child_date_idx on daily_plans (child_id, plan_date desc);

-- What actually happened.
--
-- SNAPSHOTS its content: domain, title and age_band are stored as columns,
-- not read through activity_id. Editing an activity's title, or retiring
-- it, must never rewrite a child's history or silently change a past
-- report. activity_id stays as a nullable pointer for analytics joins and
-- is deliberately ON DELETE SET NULL — losing the pointer is fine, losing
-- the record is not.
create table activity_log (
  id uuid primary key default gen_random_uuid (),
  child_id uuid not null references children (id) on delete cascade,
  activity_id text references activities (id) on delete set null,
  domain domain not null,
  title text not null,
  age_band age_band not null,
  plan_date date, -- the plan this belonged to, if any
  completed_at timestamptz not null default now(),
  note text,
  -- Storage path, wired later. Column exists now so adding photos doesn't
  -- need a migration against a table that by then holds real history.
  photo_path text
);

create index activity_log_child_time_idx on activity_log (child_id, completed_at desc);

create index activity_log_child_domain_idx on activity_log (child_id, domain, completed_at desc);

create table child_milestones (
  id uuid primary key default gen_random_uuid (),
  child_id uuid not null references children (id) on delete cascade,
  milestone_id text not null references milestones (id) on delete cascade,
  achieved_at date not null default current_date,
  note text,
  created_at timestamptz not null default now(),
  -- A milestone is reached once. Re-marking updates, never duplicates.
  constraint child_milestones_unique unique (child_id, milestone_id)
);

create index child_milestones_child_idx on child_milestones (child_id, achieved_at desc);

create table child_vaccinations (
  id uuid primary key default gen_random_uuid (),
  child_id uuid not null references children (id) on delete cascade,
  vaccination_id text not null references vaccination_schedule (id) on delete cascade,
  administered_on date not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint child_vaccinations_unique unique (child_id, vaccination_id)
);

create index child_vaccinations_child_idx on child_vaccinations (child_id, administered_on desc);

-- Copilot history — child-scoped so answers can be grounded in the right
-- child when multi-child eventually ships.
create table copilot_conversations (
  id uuid primary key default gen_random_uuid (),
  child_id uuid not null references children (id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create index copilot_conversations_child_idx on copilot_conversations (child_id, last_message_at desc);

create table copilot_messages (
  id uuid primary key default gen_random_uuid (),
  conversation_id uuid not null references copilot_conversations (id) on delete cascade,
  role text not null check (role in ('parent', 'copilot')),
  content text not null,
  created_at timestamptz not null default now()
);

create index copilot_messages_conversation_idx on copilot_messages (conversation_id, created_at);

-- ---------------------------------------------------------------------
-- NOT BUILT YET — shape only, deliberately no tables.
--
-- development_kits      (id, name, age_band, description, sort_order)
-- kit_items             (kit_id, activity_id | title, sort_order)
-- child_kits            (child_id, kit_id, started_at, completed_at)
--   Kit content doesn't exist. Progress would derive from activity_log
--   joined to kit_items, so nothing here blocks on the schema.
--
-- products              (id, name, age_band, rationale, url, disclosure)
--   Needs a commercial-disclosure position before it can exist honestly.
--
-- No analytics/event tables: PostHog owns that.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table profiles enable row level security;

alter table children enable row level security;

alter table daily_plans enable row level security;

alter table activity_log enable row level security;

alter table child_milestones enable row level security;

alter table child_vaccinations enable row level security;

alter table copilot_conversations enable row level security;

alter table copilot_messages enable row level security;

alter table activities enable row level security;

alter table milestones enable row level security;

alter table vaccination_schedule enable row level security;

-- Global content: any signed-in user can read, nobody can write through
-- the API. Seeding runs as the service role, which bypasses RLS.
create policy "authenticated read activities" on activities for
select
  to authenticated using (true);

create policy "authenticated read milestones" on milestones for
select
  to authenticated using (true);

create policy "authenticated read vaccination_schedule" on vaccination_schedule for
select
  to authenticated using (true);

-- A parent sees only their own row.
create policy "own profile" on profiles for all to authenticated using (id = auth.uid ())
with
  check (id = auth.uid ());

create policy "own children" on children for all to authenticated using (parent_id = auth.uid ())
with
  check (parent_id = auth.uid ());

-- Everything child-scoped goes through the same ownership test: the child
-- must belong to the caller. Written as EXISTS against children so there's
-- one definition of ownership rather than a denormalised parent_id on
-- every table that could drift out of sync.
create policy "own daily_plans" on daily_plans for all to authenticated using (
  exists (
    select
      1
    from
      children c
    where
      c.id = daily_plans.child_id
      and c.parent_id = auth.uid ()
  )
)
with
  check (
    exists (
      select
        1
      from
        children c
      where
        c.id = daily_plans.child_id
        and c.parent_id = auth.uid ()
    )
  );

create policy "own activity_log" on activity_log for all to authenticated using (
  exists (
    select
      1
    from
      children c
    where
      c.id = activity_log.child_id
      and c.parent_id = auth.uid ()
  )
)
with
  check (
    exists (
      select
        1
      from
        children c
      where
        c.id = activity_log.child_id
        and c.parent_id = auth.uid ()
    )
  );

create policy "own child_milestones" on child_milestones for all to authenticated using (
  exists (
    select
      1
    from
      children c
    where
      c.id = child_milestones.child_id
      and c.parent_id = auth.uid ()
  )
)
with
  check (
    exists (
      select
        1
      from
        children c
      where
        c.id = child_milestones.child_id
        and c.parent_id = auth.uid ()
    )
  );

create policy "own child_vaccinations" on child_vaccinations for all to authenticated using (
  exists (
    select
      1
    from
      children c
    where
      c.id = child_vaccinations.child_id
      and c.parent_id = auth.uid ()
  )
)
with
  check (
    exists (
      select
        1
      from
        children c
      where
        c.id = child_vaccinations.child_id
        and c.parent_id = auth.uid ()
    )
  );

create policy "own copilot_conversations" on copilot_conversations for all to authenticated using (
  exists (
    select
      1
    from
      children c
    where
      c.id = copilot_conversations.child_id
      and c.parent_id = auth.uid ()
  )
)
with
  check (
    exists (
      select
        1
      from
        children c
      where
        c.id = copilot_conversations.child_id
        and c.parent_id = auth.uid ()
    )
  );

-- Messages reach the owner through their conversation.
create policy "own copilot_messages" on copilot_messages for all to authenticated using (
  exists (
    select
      1
    from
      copilot_conversations cc
      join children c on c.id = cc.child_id
    where
      cc.id = copilot_messages.conversation_id
      and c.parent_id = auth.uid ()
  )
)
with
  check (
    exists (
      select
        1
      from
        copilot_conversations cc
        join children c on c.id = cc.child_id
      where
        cc.id = copilot_messages.conversation_id
        and c.parent_id = auth.uid ()
    )
  );

-- ---------------------------------------------------------------------
-- Signup trigger
-- ---------------------------------------------------------------------
-- Create the profile row the moment someone signs up, so the client never
-- has to handle "authenticated but no profile yet" as a race. Carried over
-- from the superseded draft, which had this right.
create or replace function handle_new_user () returns trigger language plpgsql security definer
set
  search_path = public as $$
begin
  insert into public.profiles (id, parent_name)
  values (new.id, new.raw_user_meta_data->>'parent_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users for each row
execute function handle_new_user ();
