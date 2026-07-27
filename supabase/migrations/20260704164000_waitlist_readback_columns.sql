-- Both waitlist dialogs do `insert(...).select("id, created_at")` to read
-- back the new row's id for the position/referral RPCs. PostgREST needs a
-- SELECT policy to allow that read-back, but we don't want a blanket
-- SELECT policy to expose name/phone/email. Postgres supports column-level
-- privileges, so we grant SELECT only on the non-PII columns and rely on
-- that (not the row policy) to keep contact details private.
drop policy if exists "can read back own insert" on waitlist;

create policy "can read back own insert" on waitlist
  for select
  to anon, authenticated
  using (true);

revoke select on waitlist from anon, authenticated;
grant select (id, created_at, referred_by) on waitlist to anon, authenticated;
