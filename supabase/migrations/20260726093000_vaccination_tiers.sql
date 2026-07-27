-- Vaccination schedule: tiers and precise ages.
--
-- SCHEMA CHANGE, flagged rather than worked around in the client: the
-- three-tier labelling can't be derived from anything already stored, so
-- it needs a column. Additive only — the table is empty.
--
-- A separate migration rather than an edit to 20260726090000, because
-- that one has now been applied to the linked project.
create type vaccine_tier as enum(
  -- India's Universal Immunisation Programme. Free at government
  -- facilities, and the baseline every child is entitled to.
  'essential',
  -- IAP recommends for broader protection, beyond what UIP covers.
  'recommended',
  -- Only for specific risk factors, travel, geography or medical
  -- conditions. Never shown as something a typical child is "missing".
  'situational'
);

alter table vaccination_schedule
add column tier vaccine_tier not null default 'recommended',
-- Display string, because real schedules are ranges ("16–24 months",
-- "9–12 months") that an integer cannot express honestly.
add column age_label text not null default '',
-- Exact sort key in days. The infant series lands at 6/10/14 WEEKS,
-- which rounds to a meaningless 1/2/3 in whole months and sorts wrongly
-- against "9-12 months". recommended_age_months is kept as the coarse
-- bucket for age-band filtering.
add column age_days int not null default 0,
-- Which document this row came from, so a parent (and we) can always
-- trace a recommendation back to its source.
add column source text;

create index vaccination_schedule_tier_age_idx on vaccination_schedule (tier, age_days);

comment on column vaccination_schedule.tier is 'essential = UIP/government; recommended = IAP addition; situational = risk/geography-specific';

comment on column vaccination_schedule.age_days is 'Exact age in days for ordering; age_label is what the parent reads.';
