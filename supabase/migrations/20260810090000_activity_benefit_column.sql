-- The developmental "why this matters" for an activity, distinct from
-- `why` (a one-sentence description of what the activity is) and
-- `instructions` (the how-to steps). Optional: not every activity has a
-- genuine rationale sentence in its source content, and a blank column
-- here is preferable to a fabricated one — the UI falls back to a short,
-- honest, per-domain sentence when this is null. See
-- scripts/gen-activity-library-seed.mjs for how it's populated.
alter table activities add column benefit text;
