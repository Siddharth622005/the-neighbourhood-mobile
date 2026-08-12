-- Community, for real.
--
-- Until now lib/db/community.ts was an in-memory array seeded from
-- communityMockData.ts: nothing a parent posted, saved, reported or
-- blocked survived a page refresh, and no two people ever saw each
-- other's posts. This is the actual backing store.
--
-- Community is the one part of this product that is deliberately SHARED
-- rather than family-scoped, so the RLS shape here is different from
-- everything else in the schema. Every other table answers "is this row
-- mine?". These answer "anyone signed in may read, but you may only
-- write your own."
--
-- Author privacy: we store author_id because ownership and blocking need
-- a stable identity, but the UI only ever renders the initial and the
-- child's age in months. The uuid is opaque on its own, and `profiles`
-- RLS already restricts every row to its owner, so another parent cannot
-- resolve an author_id back to a person.
create table community_discussions (
  id uuid primary key default gen_random_uuid (),
  -- Nullable on purpose: seeded starter discussions have no real account
  -- behind them. A parent's own post always carries their id (enforced by
  -- the insert policy below), so "null" reliably means "seed content".
  author_id uuid references profiles (id) on delete set null,
  author_initial text not null,
  author_child_age_months int not null,
  topic text not null check (
    topic in (
      'sleep', 'feeding', 'play', 'milestones',
      'health', 'vaccinations', 'behaviour', 'development'
    )
  ),
  title text not null,
  body text not null,
  -- The stage band this question is useful to, in months. The feed shows
  -- a parent the discussions whose band overlaps their own child's age.
  age_relevance_min int not null,
  age_relevance_max int not null,
  -- Reported content stays in the table so there is an audit trail, but
  -- drops out of every feed query. A real moderation queue would read
  -- community_reports and flip this.
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index community_discussions_age_idx on community_discussions (age_relevance_min, age_relevance_max);

create index community_discussions_topic_idx on community_discussions (topic);

create index community_discussions_created_idx on community_discussions (created_at desc);

create table community_replies (
  id uuid primary key default gen_random_uuid (),
  discussion_id uuid not null references community_discussions (id) on delete cascade,
  -- Null for seeded expert replies, same reasoning as above.
  author_id uuid references profiles (id) on delete set null,
  author_initial text not null,
  author_child_age_months int not null default 0,
  body text not null,
  is_expert boolean not null default false,
  expert_name text,
  credential text,
  -- Only ever true for a genuinely verified professional. Never set this
  -- for placeholder or demo experts: the badge is a trust claim.
  is_verified boolean not null default false,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index community_replies_discussion_idx on community_replies (discussion_id, created_at);

-- Saves, reports and blocks are all private to the parent who made them.
create table community_saves (
  user_id uuid not null references profiles (id) on delete cascade,
  discussion_id uuid not null references community_discussions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, discussion_id)
);

create table community_reports (
  id uuid primary key default gen_random_uuid (),
  reporter_id uuid not null references profiles (id) on delete cascade,
  discussion_id uuid not null references community_discussions (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now()
);

create index community_reports_discussion_idx on community_reports (discussion_id);

-- Blocking is by author id, not by initial. The previous in-memory
-- version filtered on the displayed initial, which silently hid every
-- other parent whose name happened to start with the same letter.
create table community_blocks (
  user_id uuid not null references profiles (id) on delete cascade,
  blocked_author_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, blocked_author_id)
);

alter table community_discussions enable row level security;

alter table community_replies enable row level security;

alter table community_saves enable row level security;

alter table community_reports enable row level security;

alter table community_blocks enable row level security;

-- Shared read, own-only write.
create policy "read discussions" on community_discussions for
select
  to authenticated using (true);

create policy "insert own discussions" on community_discussions for insert to authenticated
with
  check (author_id = auth.uid ());

create policy "update own discussions" on community_discussions
for update
  to authenticated using (author_id = auth.uid ())
with
  check (author_id = auth.uid ());

create policy "delete own discussions" on community_discussions for delete to authenticated using (author_id = auth.uid ());

create policy "read replies" on community_replies for
select
  to authenticated using (true);

create policy "insert own replies" on community_replies for insert to authenticated
with
  check (author_id = auth.uid ());

create policy "update own replies" on community_replies
for update
  to authenticated using (author_id = auth.uid ())
with
  check (author_id = auth.uid ());

create policy "delete own replies" on community_replies for delete to authenticated using (author_id = auth.uid ());

-- Private to the parent. A nested select of community_saves from a feed
-- query therefore returns only the caller's own save rows, which is what
-- makes the "saved" flag work without a separate round trip.
create policy "own saves" on community_saves for all to authenticated using (user_id = auth.uid ())
with
  check (user_id = auth.uid ());

create policy "own blocks" on community_blocks for all to authenticated using (user_id = auth.uid ())
with
  check (user_id = auth.uid ());

-- Reports are write-only from the client: you may file one, but nobody
-- reads them back through the API. Moderation runs as the service role.
create policy "insert own reports" on community_reports for insert to authenticated
with
  check (reporter_id = auth.uid ());
