-- Widen activities' age resolution from 7 bands to 28, and give activities
-- room for a real duration range and real instructions.
--
-- Driven by content/activity_library.csv (1,149 activities), which is
-- staged in 3-month bands instead of the original 7 coarse ones. milestones
-- and vaccination_schedule keep using the original 7 values untouched —
-- this migration only ADDS enum labels, it never removes or renumbers the
-- ones milestones already relies on.
--
-- Split into its own migration, separate from the one that uses these
-- values (20260726092000_seed_content.sql, regenerated after this), because
-- Postgres won't let a newly-added enum value be referenced inside the same
-- transaction that added it.
--
-- Naming mirrors the existing m0_3 / y3_5 convention: mA_B = A to B months;
-- yY_M = the 3-month window starting at Y years, M months. m0_3 and m4_6
-- already exist from the original 7 and are reused as-is — the CSV's first
-- two bands happen to be identically sized.
alter type age_band
add value if not exists 'm7_9';

alter type age_band
add value if not exists 'm10_12';

alter type age_band
add value if not exists 'm13_15';

alter type age_band
add value if not exists 'm16_18';

alter type age_band
add value if not exists 'm19_21';

alter type age_band
add value if not exists 'm22_24';

alter type age_band
add value if not exists 'm25_27';

alter type age_band
add value if not exists 'm28_30';

alter type age_band
add value if not exists 'm31_33';

alter type age_band
add value if not exists 'm34_36';

alter type age_band
add value if not exists 'y3_0';

alter type age_band
add value if not exists 'y3_3';

alter type age_band
add value if not exists 'y3_6';

alter type age_band
add value if not exists 'y3_9';

alter type age_band
add value if not exists 'y4_0';

alter type age_band
add value if not exists 'y4_3';

alter type age_band
add value if not exists 'y4_6';

alter type age_band
add value if not exists 'y4_9';

alter type age_band
add value if not exists 'y5_0';

alter type age_band
add value if not exists 'y5_3';

alter type age_band
add value if not exists 'y5_6';

alter type age_band
add value if not exists 'y5_9';

alter type age_band
add value if not exists 'y6_0';

alter type age_band
add value if not exists 'y6_3';

alter type age_band
add value if not exists 'y6_6';

alter type age_band
add value if not exists 'y6_9';

-- The CSV gives a duration RANGE ("5–10") or "Ongoing", not a single
-- number. duration_minutes stays as a representative value (the range's
-- midpoint; null for "Ongoing", since there's no meaningful single number)
-- for anything that sorts or does arithmetic on it; duration_label carries
-- the real string for display.
alter table activities
add column if not exists duration_label text;

alter table activities
alter column duration_minutes
drop not null;

alter table activities
drop constraint if exists activities_duration_minutes_check;

alter table activities
add constraint activities_duration_minutes_check check (
  duration_minutes is null
  or duration_minutes > 0
);

-- "How To Do It" from the CSV lands here — this column existed already,
-- reserved for exactly this ("long-form steps; not yet authored").
comment on column activities.instructions is 'Long-form steps, from the CSV''s "How To Do It" column.';

comment on column activities.duration_label is 'Original duration text from the source content (e.g. "5–10" or "Ongoing"); duration_minutes is a derived representative number, not the source of truth.';
