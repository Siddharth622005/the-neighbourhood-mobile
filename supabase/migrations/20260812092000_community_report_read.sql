-- Let a parent read back their own reports.
--
-- Without this, reporting a post only removed it from the feed in local
-- state: pull to refresh and the thing you just reported was back. A
-- report that visibly undoes itself reads as broken, and worse, as though
-- nobody received it.
--
-- Reads stay scoped to the reporter, so this exposes nothing about what
-- anyone else has reported. Moderation still runs as the service role.
create policy "read own reports" on community_reports for
select
  to authenticated using (reporter_id = auth.uid ());
