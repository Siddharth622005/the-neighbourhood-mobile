import { supabase, unwrap, unwrapMaybe } from "./client";
import { CommunityTopic, Discussion, ExpertReply, Reply } from "./communityTypes";
import { currentUserId, ensureSession } from "./session";

/**
 * Community, backed by Postgres.
 *
 * This file used to be an in-memory array seeded from communityMockData:
 * nothing anyone posted, saved, reported or blocked survived a refresh,
 * and no two parents ever saw each other's posts. It now reads and writes
 * the community_* tables (see 20260812090000_community_tables.sql).
 *
 * Community is the one deliberately SHARED corner of this product, so the
 * rules differ from the rest of lib/db: any signed-in parent may read
 * every discussion, but may only write their own. That is enforced in RLS,
 * not here, so a bug in this file cannot become a way to edit someone
 * else's post.
 *
 * Three things are filtered client-side rather than in SQL, because each
 * needs a list the caller already has to fetch anyway: authors you have
 * blocked, discussions you have reported, and replies hidden by
 * moderation.
 */

type DiscussionRow = {
  id: string;
  author_id: string | null;
  author_initial: string;
  author_child_age_months: number;
  topic: CommunityTopic;
  title: string;
  body: string;
  age_relevance_min: number;
  age_relevance_max: number;
  is_resolved: boolean;
  created_at: string;
  replies?: ReplyRow[] | null;
  saves?: { user_id: string }[] | null;
};

type ReplyRow = {
  id: string;
  discussion_id?: string;
  author_id: string | null;
  author_initial: string;
  author_child_age_months: number;
  body: string;
  is_expert: boolean;
  expert_name: string | null;
  credential: string | null;
  is_verified: boolean;
  is_hidden: boolean;
  created_at: string;
};

const DISCUSSION_SELECT = `
  id, author_id, author_initial, author_child_age_months, topic, title, body,
  age_relevance_min, age_relevance_max, is_resolved, created_at,
  replies:community_replies (
    id, discussion_id, author_id, author_initial, author_child_age_months, body,
    is_expert, expert_name, credential, is_verified, is_hidden, created_at
  ),
  saves:community_saves ( user_id )
`;

/** "3 hours ago" from a timestamptz. The UI has always shown a relative
 *  string, so the conversion happens here rather than in every screen. */
function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

function toReply(row: ReplyRow, discussionId: string): Reply {
  return {
    id: row.id,
    discussion_id: discussionId,
    author_initial: row.author_initial,
    author_child_age_months: row.author_child_age_months,
    body: row.body,
    is_expert: row.is_expert,
    expert_name: row.expert_name ?? undefined,
    credential: row.credential ?? undefined,
    created_at: timeAgo(row.created_at),
  };
}

function toExpertReply(row: ReplyRow): ExpertReply {
  return {
    id: row.id,
    expert_name: row.expert_name ?? "Expert",
    credential: row.credential ?? "",
    body: row.body,
    created_at: timeAgo(row.created_at),
    is_verified: row.is_verified,
  };
}

function toDiscussion(row: DiscussionRow): Discussion {
  const visibleReplies = (row.replies ?? []).filter((r) => !r.is_hidden);
  const expert = visibleReplies.find((r) => r.is_expert) ?? null;

  return {
    id: row.id,
    author_id: row.author_id,
    topic: row.topic,
    title: row.title,
    body: row.body,
    author_initial: row.author_initial,
    author_child_age_months: row.author_child_age_months,
    // Parent replies only. The expert answer is surfaced separately, and
    // counting it here would make every seeded thread claim one more
    // reply than the detail screen actually lists.
    reply_count: visibleReplies.filter((r) => !r.is_expert).length,
    expert_reply: expert ? toExpertReply(expert) : null,
    created_at: timeAgo(row.created_at),
    age_relevance_min: row.age_relevance_min,
    age_relevance_max: row.age_relevance_max,
    saved: (row.saves ?? []).length > 0,
    is_resolved: row.is_resolved,
  };
}

/** Authors this parent has blocked, and discussions they have reported.
 *  Both come back empty for a signed-out caller rather than throwing. */
async function hiddenForCaller(): Promise<{ authors: Set<string>; discussions: Set<string> }> {
  const userId = await currentUserId();
  if (!userId) return { authors: new Set(), discussions: new Set() };

  const [blocks, reports] = await Promise.all([
    supabase.from("community_blocks").select("blocked_author_id").eq("user_id", userId),
    supabase.from("community_reports").select("discussion_id").eq("reporter_id", userId),
  ]);

  return {
    authors: new Set((blocks.data ?? []).map((b: { blocked_author_id: string }) => b.blocked_author_id)),
    discussions: new Set((reports.data ?? []).map((r: { discussion_id: string }) => r.discussion_id)),
  };
}

/**
 * Discussions relevant to a child's age, optionally filtered by topic.
 *
 * `windowMonths` defaults to a tight stage-relevant band, so a parent's
 * default feed is other parents at roughly the same stage. Pass a large
 * value (the Community screen uses 1200) for "Browse all stages".
 */
export async function getDiscussionsForAge(
  ageMonths: number,
  topicFilter?: CommunityTopic | "all",
  windowMonths = 3
): Promise<Discussion[]> {
  const windowMin = Math.max(0, ageMonths - windowMonths);
  const windowMax = ageMonths + windowMonths;

  let query = supabase
    .from("community_discussions")
    .select(DISCUSSION_SELECT)
    .eq("is_hidden", false)
    .lte("age_relevance_min", windowMax)
    .gte("age_relevance_max", windowMin)
    .order("created_at", { ascending: false });

  if (topicFilter && topicFilter !== "all") {
    query = query.eq("topic", topicFilter);
  }

  const [rows, hidden] = await Promise.all([
    unwrap<DiscussionRow[]>("community.getDiscussionsForAge", await query),
    hiddenForCaller(),
  ]);

  return rows
    .filter((row) => !hidden.discussions.has(row.id))
    .filter((row) => !(row.author_id && hidden.authors.has(row.author_id)))
    .map(toDiscussion)
    // Threads with an expert answer sit slightly higher, same as before.
    .sort((a, b) => (b.expert_reply ? 1 : 0) - (a.expert_reply ? 1 : 0));
}

/**
 * Every discussion this parent has bookmarked, most recently saved first.
 * Not filtered by age/stage or topic — a save is a deliberate "come back
 * to this" action, so unlike the main feed it shouldn't quietly drop out
 * once the child ages past its relevance window.
 */
export async function getSavedDiscussions(): Promise<Discussion[]> {
  const userId = await currentUserId();
  if (!userId) return [];

  const [rows, hidden] = await Promise.all([
    unwrap<{ discussion: (DiscussionRow & { is_hidden: boolean }) | null }[]>(
      "community.getSavedDiscussions",
      await supabase
        .from("community_saves")
        .select(`discussion:community_discussions ( ${DISCUSSION_SELECT}, is_hidden )`)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
    ),
    hiddenForCaller(),
  ]);

  return rows
    .map((r) => r.discussion)
    .filter((d): d is DiscussionRow & { is_hidden: boolean } => !!d && !d.is_hidden)
    .filter((row) => !hidden.discussions.has(row.id))
    .filter((row) => !(row.author_id && hidden.authors.has(row.author_id)))
    .map(toDiscussion);
}

export async function getDiscussionById(
  id: string
): Promise<{ discussion: Discussion; replies: Reply[] } | null> {
  const row = unwrapMaybe<DiscussionRow>(
    "community.getDiscussionById",
    await supabase.from("community_discussions").select(DISCUSSION_SELECT).eq("id", id).maybeSingle()
  );
  if (!row) return null;

  // Parent replies, oldest first. The expert answer is rendered from
  // discussion.expert_reply by the detail screen, so it is excluded here
  // to avoid showing it twice.
  const replies = (row.replies ?? [])
    .filter((r) => !r.is_hidden && !r.is_expert)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((r) => toReply(r, row.id));

  return { discussion: toDiscussion(row), replies };
}

export async function createDiscussion(input: {
  question: string;
  topic?: CommunityTopic;
  childAgeMonths: number;
  parentInitial: string;
}): Promise<Discussion> {
  const userId = await ensureSession();
  const topic: CommunityTopic = input.topic ?? inferTopic(input.question);

  const created = unwrap<DiscussionRow>(
    "community.createDiscussion",
    await supabase
      .from("community_discussions")
      .insert({
        author_id: userId,
        author_initial: input.parentInitial || "P",
        author_child_age_months: input.childAgeMonths,
        topic,
        title:
          input.question.length > 80 ? `${input.question.slice(0, 80)}…` : input.question,
        body: input.question,
        age_relevance_min: Math.max(0, input.childAgeMonths - 6),
        age_relevance_max: input.childAgeMonths + 6,
      })
      .select(DISCUSSION_SELECT)
      .single()
  );

  return toDiscussion(created);
}

export async function addReply(input: {
  discussionId: string;
  body: string;
  parentInitial: string;
  childAgeMonths: number;
}): Promise<Reply> {
  const userId = await ensureSession();

  const created = unwrap<ReplyRow>(
    "community.addReply",
    await supabase
      .from("community_replies")
      .insert({
        discussion_id: input.discussionId,
        author_id: userId,
        author_initial: input.parentInitial || "P",
        author_child_age_months: input.childAgeMonths,
        body: input.body,
      })
      .select()
      .single()
  );

  return toReply(created, input.discussionId);
}

/** Returns the new saved state, so the caller can update one row rather
 *  than reloading the feed. */
export async function toggleSaveDiscussion(discussionId: string): Promise<boolean> {
  const userId = await ensureSession();

  const existing = unwrapMaybe<{ discussion_id: string }>(
    "community.toggleSaveDiscussion",
    await supabase
      .from("community_saves")
      .select("discussion_id")
      .eq("user_id", userId)
      .eq("discussion_id", discussionId)
      .maybeSingle()
  );

  if (existing) {
    await supabase
      .from("community_saves")
      .delete()
      .eq("user_id", userId)
      .eq("discussion_id", discussionId);
    return false;
  }

  await supabase.from("community_saves").insert({ user_id: userId, discussion_id: discussionId });
  return true;
}

/**
 * Marks a discussion resolved or reopens it. Enforced author-only by the
 * "update own discussions" RLS policy — this can't be called for a
 * discussion the caller didn't post.
 */
export async function setDiscussionResolved(discussionId: string, resolved: boolean): Promise<void> {
  const { error } = await supabase
    .from("community_discussions")
    .update({ is_resolved: resolved })
    .eq("id", discussionId);
  if (error) throw error;
}

/**
 * Files a report. The post stays in the table so there is an audit trail
 * for moderation, but drops out of this parent's feed permanently rather
 * than only until the next refresh.
 */
export async function reportDiscussion(discussionId: string, reason?: string): Promise<void> {
  const userId = await ensureSession();
  await supabase
    .from("community_reports")
    .insert({ reporter_id: userId, discussion_id: discussionId, reason: reason ?? null });
}

/**
 * Blocks an author for this parent only.
 *
 * Takes an author id rather than the displayed initial. The old in-memory
 * version matched on the initial, which quietly hid every other parent
 * whose name started with the same letter. Seeded starter content has no
 * author, so blocking it is a no-op.
 */
export async function blockAuthor(authorId: string | null): Promise<void> {
  if (!authorId) return;
  const userId = await ensureSession();
  if (authorId === userId) return;
  await supabase
    .from("community_blocks")
    .upsert(
      { user_id: userId, blocked_author_id: authorId },
      { onConflict: "user_id,blocked_author_id" }
    );
}

function inferTopic(text: string): CommunityTopic {
  const lower = text.toLowerCase();
  if (lower.includes("sleep") || lower.includes("nap") || lower.includes("night")) return "sleep";
  if (
    lower.includes("eat") ||
    lower.includes("food") ||
    lower.includes("milk") ||
    lower.includes("wean")
  )
    return "feeding";
  if (lower.includes("fever") || lower.includes("sick") || lower.includes("doctor")) return "health";
  if (lower.includes("vax") || lower.includes("vaccin")) return "vaccinations";
  if (lower.includes("tantrum") || lower.includes("cry") || lower.includes("behaviour"))
    return "behaviour";
  if (lower.includes("walk") || lower.includes("point") || lower.includes("talk"))
    return "milestones";
  if (lower.includes("play") || lower.includes("toy") || lower.includes("game")) return "play";
  return "development";
}
