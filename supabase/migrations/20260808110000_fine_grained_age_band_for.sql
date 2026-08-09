-- Repoints age_band_for() at the 28 fine-grained bands added in
-- 20260808100000_widen_activity_bands.sql, now that they exist (a
-- newly-added enum value can't be referenced in the same transaction that
-- added it, which is why this is its own migration rather than folded into
-- that one).
--
-- get_or_create_daily_plan() and swap_plan_domain() both call this and
-- only ever compare its result against activities.age_band, so widening
-- its resolution here is enough to make "today's plan" draw from the new
-- content_library.csv-sourced rows — no change needed to either function.
--
-- Cutoffs are every 3 months (except the first two, which mirror the
-- original 0–3 / 4–6 split) and come directly from
-- content/activity_library.csv's own band boundaries, not a re-derivation.
create or replace function age_band_for (p_dob date, p_on date default current_date) returns age_band language sql immutable as $$
  select case
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 81 then 'y6_9'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 78 then 'y6_6'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 75 then 'y6_3'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 72 then 'y6_0'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 69 then 'y5_9'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 66 then 'y5_6'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 63 then 'y5_3'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 60 then 'y5_0'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 57 then 'y4_9'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 54 then 'y4_6'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 51 then 'y4_3'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 48 then 'y4_0'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 45 then 'y3_9'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 42 then 'y3_6'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 39 then 'y3_3'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 36 then 'y3_0'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 34 then 'm34_36'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 31 then 'm31_33'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 28 then 'm28_30'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 25 then 'm25_27'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 22 then 'm22_24'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 19 then 'm19_21'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 16 then 'm16_18'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 13 then 'm13_15'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 10 then 'm10_12'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 7  then 'm7_9'::age_band
    when (extract(year from age(p_on, p_dob)) * 12
        + extract(month from age(p_on, p_dob)))::int >= 4  then 'm4_6'::age_band
    else 'm0_3'::age_band
  end;
$$;
