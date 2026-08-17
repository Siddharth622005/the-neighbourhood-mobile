-- Lets the parent who posted a discussion mark it resolved. There was
-- previously no way to close out a thread once it had been answered —
-- it just stayed in the feed indefinitely, indistinguishable from an
-- open question.
alter table community_discussions
add column is_resolved boolean not null default false;

-- Already covered by the existing "update own discussions" policy
-- (author_id = auth.uid()), so no new RLS policy is needed here.
