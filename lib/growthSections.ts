/**
 * The five sections that live inside Growth — the single source of truth
 * for both the Growth landing list and the Stack's screen registration,
 * so the two can never drift out of sync.
 *
 * None of these is a tab, and none gets a top-level route. They are all
 * exactly one tap from the Growth landing screen (two from Home), which
 * is the depth budget the IA allows.
 *
 * This list is age-invariant: a 2-week-old and a 7-year-old see the same
 * five rows in the same order. Age changes what's INSIDE a section —
 * vaccination entries thin out, milestone density drops, kit
 * recommendations advance — never which sections exist.
 */
export type GrowthSection = {
  /** Route segment under app/(tabs)/growth/ */
  slug: "milestones" | "guide" | "kit" | "vaccinations" | "reports" | "products";
  title: string;
  /** One line, shown under the title on the Growth landing list. */
  blurb: string;
};

export const GROWTH_SECTIONS: GrowthSection[] = [
  {
    slug: "milestones",
    title: "Milestones",
    blurb: "What's typical now, what's coming, and what they've already done.",
  },
  {
    slug: "guide",
    title: "The Guide",
    blurb: "Expert-backed articles, videos, and calm parenting explainers.",
  },
  {
    slug: "kit",
    title: "Development kit",
    blurb: "The kit they're on, how far through it you are, and what's next.",
  },
  {
    slug: "vaccinations",
    title: "Vaccinations",
    blurb: "The schedule, what's been given, and what's due.",
  },
  {
    slug: "reports",
    title: "Reports",
    blurb: "Quiet weekly and monthly summaries of how things are going.",
  },
  {
    slug: "products",
    title: "Product guide",
    blurb: "A short, curated list — things worth having at this age.",
  },
];

export const growthHref = (slug: GrowthSection["slug"]) => `/growth/${slug}` as const;
