export const COMMUNITY_TOPICS = [
  "sleep",
  "feeding",
  "play",
  "milestones",
  "health",
  "vaccinations",
  "behaviour",
  "development",
] as const;

export type CommunityTopic = (typeof COMMUNITY_TOPICS)[number];

export const TOPIC_LABEL: Record<CommunityTopic, string> = {
  sleep: "Sleep",
  feeding: "Feeding",
  play: "Play & Activities",
  milestones: "Milestones",
  health: "Health",
  vaccinations: "Vaccinations",
  behaviour: "Behaviour",
  development: "Development",
};

export type ExpertReply = {
  id: string;
  expert_name: string;
  credential: string; // e.g. "Pediatrician", "Child Psychologist", "Nutritionist", "Occupational Therapist"
  avatar_color?: string;
  body: string;
  created_at: string;
  /** True only for a genuinely verified professional — never set for
   *  demo/placeholder experts. Absent or false shows no badge. */
  is_verified?: boolean;
};

export type Reply = {
  id: string;
  discussion_id: string;
  author_initial: string;
  author_child_age_months: number;
  body: string;
  is_expert: boolean;
  expert_name?: string;
  credential?: string;
  created_at: string;
};

export type Discussion = {
  id: string;
  topic: CommunityTopic;
  title: string;
  body: string;
  author_initial: string;
  author_child_age_months: number;
  reply_count: number;
  expert_reply: ExpertReply | null;
  created_at: string;
  age_relevance_min: number; // months
  age_relevance_max: number; // months
  saved?: boolean;
};
