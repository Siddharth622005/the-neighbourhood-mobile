-- The parent's own diet and allergies, alongside role/birth_method/
-- feeding_method on `profiles` — see 20260809130000_parent_profile_fields.sql.
-- Previously hardcoded to "vegetarian" / no allergies for every account
-- (lib/parentCare.ts deriveProfile), so the Nutrition screen's diet chip
-- and any allergy-based meal filtering looked personalised but never
-- actually was. Editable from Profile -> Recovery profile, same as the
-- existing three fields.
alter table profiles
  add column diet text, -- omnivore | vegetarian | vegan
  add column allergies text[] not null default '{}';

comment on column profiles.diet is
  'Parent''s own diet: omnivore | vegetarian | vegan. Drives Nutrition meal filtering.';
comment on column profiles.allergies is
  'Free-text allergen list, lowercased. Meals containing a matching ingredient are filtered out.';
