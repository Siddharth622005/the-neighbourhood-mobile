-- Ensure the public-insert policy exists and is correctly scoped to the
-- anon role. Idempotent: safe to run even if the policy already exists.
drop policy if exists "public can insert" on waitlist;

create policy "public can insert" on waitlist
  for insert
  to anon, authenticated
  with check (true);
