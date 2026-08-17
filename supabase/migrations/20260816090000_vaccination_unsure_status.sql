-- Lets a parent mark a dose "unsure" (with an optional note) instead of
-- only ever choosing between "given" and untouched. Previously the only
-- write child_vaccinations supported was a full administered record, so
-- there was no way to say "not sure if this happened" or leave a note
-- next to a dose that hasn't been given yet.
--
-- Reuses the existing (child_id, vaccination_id) row rather than adding a
-- parallel table: a dose is either given, unsure, or has no row at all,
-- so the same upsert-on-conflict shape the app already uses for
-- recording a vaccination keeps working for the unsure case too.
alter table child_vaccinations
alter column administered_on
drop not null;

alter table child_vaccinations
add column status text not null default 'given' check (status in ('given', 'unsure'));

-- A "given" row must carry a date; an "unsure" row deliberately doesn't
-- claim one.
alter table child_vaccinations
add constraint child_vaccinations_status_administered_check check (
  status <> 'given'
  or administered_on is not null
);
