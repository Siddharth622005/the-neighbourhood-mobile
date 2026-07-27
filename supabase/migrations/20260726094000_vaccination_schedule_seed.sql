-- Vaccination schedule — seeded from two sourced documents.
--
--   NIS  = National Immunization Schedule, Government of India (UIP)
--   IAP  = IAP-ACVIP Recommended Immunization Schedule 2023
--          (Indian Pediatrics, Jan 2024), Table I, vaccines for routine use
--
-- Transcribed from those PDFs, not reconstructed from memory. Every row
-- carries its source so any line can be traced back and checked.
--
-- TIERS
--   essential   — in the UIP. Free at government facilities. The baseline.
--   recommended — IAP advises beyond UIP, for broader protection.
--   situational — only for specific geography, risk or medical need.
--
-- WHERE THE TWO DISAGREE
--   PCV and JE appear in the UIP but only in named states/districts, so
--   from a family's point of view they are situational under the
--   government programme. PCV is separately recommended for ALL children
--   by IAP, so it also appears as a recommended row; the notes say so
--   rather than leaving a parent to reconcile two entries.
--
--   The UIP gives MR (measles-rubella) and fractional IPV; IAP gives MMR
--   (adds mumps) and full intramuscular IPV. Both are listed, each in its
--   own tier, because they are genuinely different products.
--
-- NOT A SUBSTITUTE FOR A PAEDIATRICIAN. This is reference material to
-- help a parent keep track, and the UI says so.
insert into
  vaccination_schedule (
    id,
    vaccine_name,
    tier,
    age_label,
    age_days,
    recommended_age_months,
    dose_label,
    notes,
    source
  )
values
  -- ── ESSENTIAL — Universal Immunisation Programme ──────────────────
  ('uip-bcg', 'BCG', 'essential', 'Birth', 0, 0, 'Single dose', 'At birth, or as early as possible up to one year of age.', 'NIS'),
  ('uip-opv-0', 'Oral Polio Vaccine (OPV)', 'essential', 'Birth', 0, 0, 'Zero dose', 'At birth, or as early as possible within the first 15 days.', 'NIS'),
  ('uip-hepb-birth', 'Hepatitis B', 'essential', 'Birth', 0, 0, 'Birth dose', 'Within 24 hours of birth.', 'NIS'),
  ('uip-opv-1', 'Oral Polio Vaccine (OPV)', 'essential', '6 weeks', 42, 1, '1st dose', null, 'NIS'),
  ('uip-penta-1', 'Pentavalent', 'essential', '6 weeks', 42, 1, '1st dose', 'Diphtheria, pertussis, tetanus, hepatitis B and Hib in one injection.', 'NIS'),
  ('uip-rvv-1', 'Rotavirus (RVV)', 'essential', '6 weeks', 42, 1, '1st dose', null, 'NIS'),
  ('uip-fipv-1', 'Fractional IPV (fIPV)', 'essential', '6 weeks', 42, 1, '1st dose', null, 'NIS'),
  ('uip-opv-2', 'Oral Polio Vaccine (OPV)', 'essential', '10 weeks', 70, 2, '2nd dose', null, 'NIS'),
  ('uip-penta-2', 'Pentavalent', 'essential', '10 weeks', 70, 2, '2nd dose', null, 'NIS'),
  ('uip-rvv-2', 'Rotavirus (RVV)', 'essential', '10 weeks', 70, 2, '2nd dose', null, 'NIS'),
  ('uip-opv-3', 'Oral Polio Vaccine (OPV)', 'essential', '14 weeks', 98, 3, '3rd dose', null, 'NIS'),
  ('uip-penta-3', 'Pentavalent', 'essential', '14 weeks', 98, 3, '3rd dose', null, 'NIS'),
  ('uip-rvv-3', 'Rotavirus (RVV)', 'essential', '14 weeks', 98, 3, '3rd dose', null, 'NIS'),
  ('uip-fipv-2', 'Fractional IPV (fIPV)', 'essential', '14 weeks', 98, 3, '2nd dose', null, 'NIS'),
  ('uip-mr-1', 'Measles & Rubella (MR)', 'essential', '9–12 months', 274, 9, '1st dose', null, 'NIS'),
  ('uip-mr-2', 'Measles & Rubella (MR)', 'essential', '16–24 months', 487, 16, '2nd dose', null, 'NIS'),
  ('uip-dpt-b1', 'DPT', 'essential', '16–24 months', 487, 16, 'Booster 1', null, 'NIS'),
  ('uip-opv-b', 'Oral Polio Vaccine (OPV)', 'essential', '16–24 months', 487, 16, 'Booster', null, 'NIS'),
  ('uip-dpt-b2', 'DPT', 'essential', '5–6 years', 1826, 60, 'Booster 2', null, 'NIS'),
  ('uip-td-10', 'Tetanus & adult Diphtheria (Td)', 'essential', '10 years', 3653, 120, 'Single dose', null, 'NIS'),
  ('uip-td-16', 'Tetanus & adult Diphtheria (Td)', 'essential', '16 years', 5844, 192, 'Single dose', null, 'NIS'),
  -- ── SITUATIONAL — in the UIP, but geography-restricted ────────────
  ('uip-pcv-1', 'Pneumococcal Conjugate (PCV)', 'situational', '6 weeks', 42, 1, '1st dose', 'Under the government programme, only in Bihar, Himachal Pradesh, Madhya Pradesh, selected districts of Uttar Pradesh and Rajasthan, and Haryana. IAP recommends PCV for every child — see the Recommended list.', 'NIS'),
  ('uip-pcv-2', 'Pneumococcal Conjugate (PCV)', 'situational', '14 weeks', 98, 3, '2nd dose', 'Selected states and districts only under the government programme.', 'NIS'),
  ('uip-pcv-b', 'Pneumococcal Conjugate (PCV)', 'situational', '9–12 months', 274, 9, 'Booster', 'Selected states and districts only under the government programme.', 'NIS'),
  ('uip-je-1', 'Japanese Encephalitis (JE)', 'situational', '9–12 months', 274, 9, '1st dose', 'Given in endemic districts only.', 'NIS'),
  ('uip-je-2', 'Japanese Encephalitis (JE)', 'situational', '16–24 months', 487, 16, '2nd dose', 'Given in endemic districts only.', 'NIS'),
  -- ── RECOMMENDED — IAP, beyond the UIP ─────────────────────────────
  ('iap-ipv-1', 'Inactivated Polio Vaccine (IPV)', 'recommended', '6 weeks', 42, 1, '1st dose', 'IAP advises full intramuscular IPV where the UIP gives a fractional dose. Often part of a combination vaccine.', 'IAP'),
  ('iap-ipv-2', 'Inactivated Polio Vaccine (IPV)', 'recommended', '10 weeks', 70, 2, '2nd dose', null, 'IAP'),
  ('iap-ipv-3', 'Inactivated Polio Vaccine (IPV)', 'recommended', '14 weeks', 98, 3, '3rd dose', null, 'IAP'),
  ('iap-pcv-1', 'Pneumococcal Conjugate (PCV)', 'recommended', '6 weeks', 42, 1, '1st dose', 'IAP recommends PCV for all children, not only the states the government programme covers.', 'IAP'),
  ('iap-pcv-2', 'Pneumococcal Conjugate (PCV)', 'recommended', '10 weeks', 70, 2, '2nd dose', null, 'IAP'),
  ('iap-pcv-3', 'Pneumococcal Conjugate (PCV)', 'recommended', '14 weeks', 98, 3, '3rd dose', null, 'IAP'),
  ('iap-flu-1', 'Influenza (IIV)', 'recommended', '6 months', 180, 6, '1st dose', 'Two doses four weeks apart, usually before the monsoon.', 'IAP'),
  ('iap-flu-2', 'Influenza (IIV)', 'recommended', '7 months', 210, 7, '2nd dose', 'Then yearly until five years of age.', 'IAP'),
  ('iap-typhoid', 'Typhoid Conjugate', 'recommended', '6–9 months', 210, 7, 'Single dose', 'No booster dose is recommended.', 'IAP'),
  ('iap-mmr-1', 'MMR', 'recommended', '9 months', 274, 9, '1st dose', 'MMR adds mumps protection to the measles-rubella vaccine the UIP gives.', 'IAP'),
  ('iap-hepa-1', 'Hepatitis A', 'recommended', '12 months', 365, 12, '1st dose', 'A single dose for the live attenuated vaccine; the inactivated vaccine needs two.', 'IAP'),
  ('iap-mmr-2', 'MMR', 'recommended', '15 months', 456, 15, '2nd dose', null, 'IAP'),
  ('iap-varicella-1', 'Varicella (Chickenpox)', 'recommended', '15 months', 456, 15, '1st dose', null, 'IAP'),
  ('iap-pcv-b', 'Pneumococcal Conjugate (PCV)', 'recommended', '15 months', 456, 15, 'Booster', null, 'IAP'),
  ('iap-dtp-b1', 'DTwP / DTaP', 'recommended', '16–18 months', 502, 16, 'Booster 1', null, 'IAP'),
  ('iap-hib-b1', 'Hib', 'recommended', '16–18 months', 502, 16, 'Booster 1', null, 'IAP'),
  ('iap-ipv-b1', 'Inactivated Polio Vaccine (IPV)', 'recommended', '16–18 months', 502, 16, 'Booster 1', null, 'IAP'),
  ('iap-hepa-2', 'Hepatitis A', 'recommended', '18–19 months', 563, 18, '2nd dose', 'Only needed for the inactivated vaccine.', 'IAP'),
  ('iap-varicella-2', 'Varicella (Chickenpox)', 'recommended', '18–19 months', 563, 18, '2nd dose', 'Three to six months after the first dose.', 'IAP'),
  ('iap-dtp-b2', 'DTwP / DTaP', 'recommended', '4–6 years', 1643, 54, 'Booster 2', null, 'IAP'),
  ('iap-ipv-b2', 'Inactivated Polio Vaccine (IPV)', 'recommended', '4–6 years', 1643, 54, 'Booster 2', null, 'IAP'),
  ('iap-mmr-3', 'MMR', 'recommended', '4–6 years', 1643, 54, '3rd dose', null, 'IAP'),
  ('iap-hpv-9-14', 'HPV', 'recommended', '9–14 years', 3287, 108, '2 doses', 'Two doses six months apart. Recommended for girls and boys.', 'IAP'),
  ('iap-tdap-10', 'Tdap', 'recommended', '10 years', 3653, 120, 'Single dose', 'Given even if a Tdap dose was received earlier as the second DTP booster.', 'IAP'),
  ('iap-hpv-15-18', 'HPV', 'recommended', '15–18 years', 5479, 180, '3 doses', 'Three doses at 0, 2 and 6 months, if not given earlier.', 'IAP'),
  ('iap-td-16-18', 'Tetanus & adult Diphtheria (Td)', 'recommended', '16–18 years', 5844, 192, 'Single dose', 'Added in the 2023 IAP update.', 'IAP'),
  -- ── SITUATIONAL — IAP, risk-based ─────────────────────────────────
  ('iap-meningococcal', 'Meningococcal Conjugate', 'situational', '9–23 months', 274, 9, 'Varies by brand', 'For children at particular risk, or with ongoing exposure. Schedule depends on the brand; ask your paediatrician.', 'IAP'),
  ('iap-flu-annual', 'Influenza (IIV) — yearly', 'situational', '5 years and older', 1826, 60, 'Yearly', 'IAP advises continuing yearly flu vaccination past five years for children at higher risk of complications.', 'IAP')
on conflict (id) do update
set
  vaccine_name = excluded.vaccine_name,
  tier = excluded.tier,
  age_label = excluded.age_label,
  age_days = excluded.age_days,
  recommended_age_months = excluded.recommended_age_months,
  dose_label = excluded.dose_label,
  notes = excluded.notes,
  source = excluded.source;
