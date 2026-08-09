/**
 * Courses & Workshops — structured learning content, alongside the short
 * editorial reads in parentCare.ts and the community discussion board.
 *
 * Shaped the same way as communityTypes.ts and parentCare.ts: const-array
 * enums with a label map, flat seed arrays, small selector functions. No
 * backend table exists yet, so this is hand-authored content — swapping it
 * for a real `courses` / `workshops` table later is a data-source change,
 * not a shape change, because the shape already assumes that future: see
 * the optional forward-looking fields called out below.
 */

export const COURSE_CATEGORIES = [
  "sleep",
  "feeding",
  "development",
  "behaviour",
  "wellbeing",
] as const;
export type CourseCategory = (typeof COURSE_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<CourseCategory, string> = {
  sleep: "Sleep",
  feeding: "Feeding",
  development: "Development",
  behaviour: "Behaviour",
  wellbeing: "Wellbeing",
};

export const DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export const DIFFICULTY_LABEL: Record<DifficultyLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const LESSON_TYPES = ["video", "text", "pdf", "quiz"] as const;
export type LessonType = (typeof LESSON_TYPES)[number];

/**
 * One variant per lesson type, keyed by `type` so a new lesson type is an
 * additional union member plus a new case in the lesson viewer — nothing
 * existing has to change shape to make room for it.
 */
export type LessonContent =
  | { type: "video"; videoUrl: string; transcript?: string }
  | { type: "text"; body: string }
  | { type: "pdf"; pdfUrl: string; pages?: number }
  | { type: "quiz"; questions: QuizQuestion[] };

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  /** Index into `options`. */
  correctIndex: number;
};

export type Lesson = {
  id: string;
  title: string;
  durationMinutes: number;
} & LessonContent;

export type Course = {
  slug: string;
  title: string;
  description: string;
  /** Key into a small local icon set — no real asset pipeline yet. */
  thumbnailIcon: CourseCategory;
  category: CourseCategory;
  difficulty: DifficultyLevel;
  lessons: Lesson[];
  /**
   * Forward-looking, unused today: every seed course is free. Flips a
   * course into the future premium tier without a data-shape change.
   */
  premium?: boolean;
  /** Price in the smallest currency unit, only meaningful if `premium`. */
  priceCents?: number;
};

export type WorkshopLocation =
  | { mode: "online"; joinUrl?: string }
  | { mode: "in_person"; venue: string };

export type Workshop = {
  slug: string;
  title: string;
  description: string;
  instructor: { name: string; credential: string };
  /** ISO 8601. */
  startsAt: string;
  durationMinutes: number;
  location: WorkshopLocation;
  /** Forward-looking: undefined today means unlimited / not yet enforced. */
  capacity?: number;
  /** Forward-looking: undefined means free, matching Course.priceCents. */
  priceCents?: number;
};

export function estimatedMinutes(course: Course): number {
  return course.lessons.reduce((sum, l) => sum + l.durationMinutes, 0);
}

/* ------------------------------------------------------------------ */
/* Seed content                                                        */
/* ------------------------------------------------------------------ */

export const COURSES: Course[] = [
  {
    slug: "sleep-foundations",
    title: "Sleep Foundations",
    description:
      "A practical, judgment-free walkthrough of infant sleep — what's typical, what's safe, and what actually helps on hard nights.",
    thumbnailIcon: "sleep",
    category: "sleep",
    difficulty: "beginner",
    lessons: [
      {
        id: "sf-1",
        title: "How infant sleep actually works",
        durationMinutes: 6,
        type: "video",
        videoUrl: "https://example.com/video/sleep-foundations-1",
        transcript:
          "Sleep cycles, why babies wake more than adults, and why that's healthy rather than a problem to solve.",
      },
      {
        id: "sf-2",
        title: "Safe sleep, without the anxiety",
        durationMinutes: 5,
        type: "text",
        body:
          "The handful of choices with real evidence behind them — back to sleep, a firm flat surface, room-sharing without bed-sharing, and avoiding overheating — and why everything beyond that list is optional.",
      },
      {
        id: "sf-3",
        title: "Reading tired signs",
        durationMinutes: 4,
        type: "video",
        videoUrl: "https://example.com/video/sleep-foundations-3",
      },
      {
        id: "sf-4",
        title: "Check your understanding",
        durationMinutes: 3,
        type: "quiz",
        questions: [
          {
            id: "sf-4-q1",
            prompt: "What's the single most evidence-backed sleep position for infants?",
            options: ["On their side", "On their back", "On their front", "Whatever they settle in"],
            correctIndex: 1,
          },
          {
            id: "sf-4-q2",
            prompt: "Room-sharing without bed-sharing is recommended for at least how long?",
            options: ["The first six weeks", "The first six months", "The first year", "It isn't recommended"],
            correctIndex: 1,
          },
        ],
      },
    ],
  },
  {
    slug: "starting-solids",
    title: "Starting Solids, Step by Step",
    description:
      "From first purées to family meals — textures, timing, allergens, and the questions every parent has before that first spoon.",
    thumbnailIcon: "feeding",
    category: "feeding",
    difficulty: "beginner",
    lessons: [
      {
        id: "ss-1",
        title: "Are they ready?",
        durationMinutes: 5,
        type: "text",
        body:
          "The real readiness signs — sitting with support, losing the tongue-thrust reflex, showing interest in food — matter more than hitting six months on the calendar exactly.",
      },
      {
        id: "ss-2",
        title: "Introducing allergens safely",
        durationMinutes: 7,
        type: "video",
        videoUrl: "https://example.com/video/starting-solids-2",
        transcript:
          "Current guidance favours introducing common allergens early and often, one at a time, rather than delaying them.",
      },
      {
        id: "ss-3",
        title: "A one-page first-foods reference",
        durationMinutes: 2,
        type: "pdf",
        pdfUrl: "https://example.com/pdf/first-foods-reference.pdf",
        pages: 1,
      },
      {
        id: "ss-4",
        title: "Textures: what comes next, and when",
        durationMinutes: 5,
        type: "text",
        body:
          "Purées give way to mashed, then soft finger foods — usually across a few months, driven by what your baby handles well rather than a fixed schedule.",
      },
    ],
  },
  {
    slug: "understanding-development",
    title: "Understanding Development in the First Year",
    description:
      "What milestones are actually measuring, the range of normal, and how to tell a genuine flag from ordinary variation.",
    thumbnailIcon: "development",
    category: "development",
    difficulty: "intermediate",
    lessons: [
      {
        id: "ud-1",
        title: "The four domains, briefly",
        durationMinutes: 5,
        type: "video",
        videoUrl: "https://example.com/video/understanding-development-1",
      },
      {
        id: "ud-2",
        title: "Why 'range' matters more than 'age'",
        durationMinutes: 4,
        type: "text",
        body:
          "Most milestones have a normal range spanning several months. A milestone landing late within that range is common, not a diagnosis.",
      },
      {
        id: "ud-3",
        title: "When to mention something to your paediatrician",
        durationMinutes: 4,
        type: "text",
        body:
          "Losing a skill they'd already gained, or missing several milestones across more than one domain at once, are the patterns worth raising — not a single late milestone on its own.",
      },
    ],
  },
  {
    slug: "positive-discipline-basics",
    title: "Positive Discipline Basics",
    description:
      "Boundaries that hold without shame or shouting — for the toddler stage and beyond.",
    thumbnailIcon: "behaviour",
    category: "behaviour",
    difficulty: "intermediate",
    lessons: [
      {
        id: "pd-1",
        title: "Boundaries vs. punishment",
        durationMinutes: 6,
        type: "video",
        videoUrl: "https://example.com/video/positive-discipline-1",
      },
      {
        id: "pd-2",
        title: "Staying calm when they aren't",
        durationMinutes: 5,
        type: "text",
        body:
          "Your own regulation is the model they're learning from in the moment — not the words you use once everyone's calm again.",
      },
      {
        id: "pd-3",
        title: "Consistency without rigidity",
        durationMinutes: 4,
        type: "text",
        body:
          "The same few boundaries held reliably matter more than a long list of rules enforced unevenly.",
      },
      {
        id: "pd-4",
        title: "Check your understanding",
        durationMinutes: 3,
        type: "quiz",
        questions: [
          {
            id: "pd-4-q1",
            prompt: "What matters most for a boundary to actually work over time?",
            options: [
              "How firmly it's stated",
              "Consistency in holding it",
              "How many rules exist",
              "Whether it's explained in detail",
            ],
            correctIndex: 1,
          },
        ],
      },
    ],
  },
  {
    slug: "parent-wellbeing-essentials",
    title: "Parent Wellbeing Essentials",
    description:
      "Practical tools for stress, sleep debt, and the emotional weight of early parenting — for either parent, any stage.",
    thumbnailIcon: "wellbeing",
    category: "wellbeing",
    difficulty: "beginner",
    lessons: [
      {
        id: "pw-1",
        title: "Naming what you're feeling",
        durationMinutes: 4,
        type: "text",
        body:
          "Overwhelm, resentment, grief for your old life alongside love for your new one — all of these are common and none of them mean you're doing it wrong.",
      },
      {
        id: "pw-2",
        title: "Micro-recovery: what actually works in ten minutes",
        durationMinutes: 5,
        type: "video",
        videoUrl: "https://example.com/video/parent-wellbeing-2",
      },
      {
        id: "pw-3",
        title: "Knowing when to ask for more support",
        durationMinutes: 4,
        type: "text",
        body:
          "Low mood or anxiety lasting more than two weeks is worth raising with a GP — asking early is not an overreaction.",
      },
    ],
  },
];

export const WORKSHOPS: Workshop[] = [
  {
    slug: "live-sleep-qa",
    title: "Live Q&A: Surviving the Sleep Regression",
    description:
      "Bring your specific situation — a paediatric sleep consultant takes real questions live for an hour.",
    instructor: { name: "Dr. Meera Nair", credential: "Paediatric Sleep Consultant" },
    startsAt: "2026-08-14T17:00:00.000Z",
    durationMinutes: 60,
    location: { mode: "online", joinUrl: "https://example.com/live/sleep-qa" },
    capacity: 200,
  },
  {
    slug: "starting-solids-workshop",
    title: "Starting Solids: Hands-On Workshop",
    description:
      "A small in-person session covering first purées through finger foods, with tasting samples for the grown-ups.",
    instructor: { name: "Priya Shah", credential: "Paediatric Dietitian" },
    startsAt: "2026-08-22T09:30:00.000Z",
    durationMinutes: 90,
    location: { mode: "in_person", venue: "The Neighbourhood Studio, Bandra West" },
    capacity: 20,
  },
  {
    slug: "toddler-behaviour-clinic",
    title: "Toddler Behaviour Clinic",
    description:
      "Tantrums, boundaries, and what's developmentally normal — an open clinic-style session for parents of 1–3 year olds.",
    instructor: { name: "Arjun Mehta", credential: "Child Psychologist" },
    startsAt: "2026-09-03T18:30:00.000Z",
    durationMinutes: 75,
    location: { mode: "online", joinUrl: "https://example.com/live/toddler-behaviour" },
  },
  {
    slug: "new-parent-wellbeing-circle",
    title: "New Parent Wellbeing Circle",
    description:
      "A guided peer-support circle for parents in the first year — practical tools, held space, and no cameras required.",
    instructor: { name: "Fatima Rizvi", credential: "Perinatal Mental Health Counsellor" },
    startsAt: "2026-08-18T16:00:00.000Z",
    durationMinutes: 60,
    location: { mode: "online", joinUrl: "https://example.com/live/wellbeing-circle" },
    capacity: 15,
  },
];

/* ------------------------------------------------------------------ */
/* Selectors                                                            */
/* ------------------------------------------------------------------ */

export function coursesByCategory(category?: CourseCategory): Course[] {
  if (!category) return COURSES;
  return COURSES.filter((c) => c.category === category);
}

export function courseBySlug(slug: string): Course | undefined {
  return COURSES.find((c) => c.slug === slug);
}

export function lessonById(course: Course, lessonId: string): Lesson | undefined {
  return course.lessons.find((l) => l.id === lessonId);
}

export function upcomingWorkshops(now: Date = new Date()): Workshop[] {
  return WORKSHOPS.filter((w) => new Date(w.startsAt).getTime() >= now.getTime()).sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
}

export function workshopBySlug(slug: string): Workshop | undefined {
  return WORKSHOPS.find((w) => w.slug === slug);
}
