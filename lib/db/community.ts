import { CommunityTopic, Discussion, Reply } from "./communityTypes";
import { MOCK_DISCUSSIONS, MOCK_REPLIES } from "./communityMockData";

let discussionsStore: Discussion[] = [...MOCK_DISCUSSIONS];
let repliesStore: Record<string, Reply[]> = { ...MOCK_REPLIES };

/**
 * Returns community discussions personalized for a child's age in months.
 * Optionally filtered by topic.
 */
export async function getDiscussionsForAge(
  ageMonths: number,
  topicFilter?: CommunityTopic | "all"
): Promise<Discussion[]> {
  // Simulate quick local promise resolve
  await new Promise((resolve) => setTimeout(resolve, 50));

  return discussionsStore
    .filter((disc) => {
      // Topic check
      if (topicFilter && topicFilter !== "all" && disc.topic !== topicFilter) {
        return false;
      }
      // Stage relevance range check (expanded window for broader discussions)
      const windowMin = Math.max(0, ageMonths - 8);
      const windowMax = ageMonths + 8;
      
      const fitsWindow =
        disc.age_relevance_min <= windowMax && disc.age_relevance_max >= windowMin;

      return fitsWindow;
    })
    .sort((a, b) => (b.expert_reply ? 1 : 0) - (a.expert_reply ? 1 : 0)); // Expert replied threads slightly elevated
}

export async function getDiscussionById(id: string): Promise<{
  discussion: Discussion;
  replies: Reply[];
} | null> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  const discussion = discussionsStore.find((d) => d.id === id);
  if (!discussion) return null;

  const replies = repliesStore[id] ?? [];
  return { discussion, replies };
}

export async function createDiscussion(input: {
  question: string;
  topic?: CommunityTopic;
  childAgeMonths: number;
  parentInitial: string;
}): Promise<Discussion> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const inferredTopic: CommunityTopic = input.topic ?? inferTopic(input.question);
  const newDisc: Discussion = {
    id: `disc-${Date.now()}`,
    topic: inferredTopic,
    title: input.question.length > 80 ? input.question.slice(0, 80) + "…" : input.question,
    body: input.question,
    author_initial: input.parentInitial || "P",
    author_child_age_months: input.childAgeMonths,
    reply_count: 0,
    expert_reply: null,
    created_at: "Just now",
    age_relevance_min: Math.max(0, input.childAgeMonths - 6),
    age_relevance_max: input.childAgeMonths + 6,
    saved: false,
  };

  discussionsStore = [newDisc, ...discussionsStore];
  return newDisc;
}

export async function addReply(input: {
  discussionId: string;
  body: string;
  parentInitial: string;
  childAgeMonths: number;
}): Promise<Reply> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const newReply: Reply = {
    id: `reply-${Date.now()}`,
    discussion_id: input.discussionId,
    author_initial: input.parentInitial || "P",
    author_child_age_months: input.childAgeMonths,
    body: input.body,
    is_expert: false,
    created_at: "Just now",
  };

  if (!repliesStore[input.discussionId]) {
    repliesStore[input.discussionId] = [];
  }
  repliesStore[input.discussionId].push(newReply);

  // Update reply count in discussion
  const disc = discussionsStore.find((d) => d.id === input.discussionId);
  if (disc) {
    disc.reply_count += 1;
  }

  return newReply;
}

export async function toggleSaveDiscussion(discussionId: string): Promise<boolean> {
  const disc = discussionsStore.find((d) => d.id === discussionId);
  if (disc) {
    disc.saved = !disc.saved;
    return disc.saved;
  }
  return false;
}

function inferTopic(text: string): CommunityTopic {
  const lower = text.toLowerCase();
  if (lower.includes("sleep") || lower.includes("nap") || lower.includes("night")) return "sleep";
  if (lower.includes("eat") || lower.includes("food") || lower.includes("milk") || lower.includes("wean")) return "feeding";
  if (lower.includes("fever") || lower.includes("sick") || lower.includes("doctor")) return "health";
  if (lower.includes("vax") || lower.includes("vaccin")) return "vaccinations";
  if (lower.includes("tantrum") || lower.includes("cry") || lower.includes("behaviour")) return "behaviour";
  if (lower.includes("walk") || lower.includes("point") || lower.includes("talk")) return "milestones";
  if (lower.includes("play") || lower.includes("toy") || lower.includes("game")) return "play";
  return "development";
}
