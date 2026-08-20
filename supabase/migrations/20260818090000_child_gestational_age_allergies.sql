-- Two per-child facts that previously had nowhere to live, both of which
-- were being silently assumed rather than asked.
--
-- gestational_weeks
--   Weeks of gestation at birth. Until now every child was implicitly
--   treated as full term, so a baby born at 30 weeks was assessed against
--   their chronological age on the milestone checklist that
--   app/onboarding/first-run.tsx shows immediately after setup — meaning a
--   preterm parent's very first screen marked them "not yet" on
--   essentially everything. Corrected age (see lib/childAge.ts) fixes
--   that, and it needs this column to exist.
--
--   Stored as the answer, not a flag: 40 means "born on time" (asked and
--   answered), a lower number means preterm, and NULL means never asked —
--   a distinction the UI needs so it doesn't re-prompt a parent who
--   already said full term. Correction is 40 minus this value, applied
--   only below 37 weeks and only until the second birthday.
--
--   Deliberately NOT on `profiles`: unlike birth_method (which describes
--   the birthing parent's own body and is stored once per parent), this
--   describes one specific child, and siblings differ.
--
-- allergies
--   The CHILD's allergens, mirroring the shape of profiles.allergies
--   (20260811090000_parent_diet_allergies.sql) but a genuinely separate
--   fact — that column is the parent's own, used to filter the parent's
--   meals in lib/parentCare.ts. The Kid Meal Planner had no allergy
--   filtering at all and said as much in its CareNote; this is what lets
--   it actually leave things out.
alter table children
  add column gestational_weeks int
    check (gestational_weeks is null or gestational_weeks between 22 and 42),
  add column allergies text[] not null default '{}';

comment on column children.gestational_weeks is
  'Weeks of gestation at birth: 40 = full term, lower = preterm, NULL = never asked. Drives corrected age for milestones only — vaccination schedules stay on chronological age.';
comment on column children.allergies is
  'The child''s own allergens, lowercased free text. Meals containing a matching ingredient are filtered out of the Kid Meal Planner. Separate from profiles.allergies, which is the parent''s.';
