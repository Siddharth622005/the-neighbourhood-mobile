-- Tags each Ask message with the mode/topic it was asked under, so a long
-- single-thread conversation (see copilot_conversations: one running
-- history per child, not per topic) can still surface "recent chats" —
-- the topics a parent has actually asked about, each one a jump-back-in
-- point rather than a separate conversation to find and lose.
--
-- Nullable: only messages sent with a specific context (arrived via an
-- "Ask about X" link, or a topic chip set from a prior recent-chat tap)
-- get tagged. A bare tab tap in general "family" mode tags nothing,
-- because "family" isn't a topic worth resurfacing — it's the default.
alter table copilot_messages
  add column context_mode text check (
    context_mode is null
    or context_mode in ('family', 'child', 'parent')
  ),
  add column context_topic text;

comment on column copilot_messages.context_mode is
  'The Ask mode active when this message was sent (family/child/parent), or NULL if untagged.';
comment on column copilot_messages.context_topic is
  'The topic chip active when this message was sent (e.g. "Discoveries", "Sleep"), or NULL.';
