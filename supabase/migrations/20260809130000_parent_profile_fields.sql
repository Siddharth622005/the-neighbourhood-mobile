-- The parent's own facts, collected once during main onboarding and used
-- to personalise Home/You/Copilot from the very first screen — see
-- lib/parentCare.ts. These replace the old local-only, AsyncStorage-backed
-- "Recovery Profile" (asked on first visit to the You tab, never synced),
-- which is retired in this change. Storing them on `profiles` alongside
-- `parent_name` makes the profiles row the one source of truth for who
-- this parent is, the same way `children.date_of_birth` is the one source
-- of truth for the child's age.
--
-- `relationship` already existed but was never read or written by the app
-- (comment said "Mother | Father | Guardian | Grandparent"). Its accepted
-- values are standardised here to the lowercase mother/father/
-- prefer_not_to_say already used everywhere else in the app (see
-- lib/parentCare.ts ParentRole) — no migration of existing data is needed
-- since no code ever wrote to this column.
comment on column profiles.relationship is
  'Parent role: mother | father | prefer_not_to_say. Drives Parent Care personalisation.';

alter table profiles
  add column birth_method text, -- vaginal | caesarean | prefer_not_to_say
  add column feeding_method text; -- exclusive | combination | formula | prefer_not_to_say
