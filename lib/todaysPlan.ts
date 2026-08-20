import { developmentalAgeMonths } from "./childAge";
import type { Child } from "./AuthProvider";

/**
 * SUPERSEDED as a content source: the `activities` table is now seeded from
 * content/activity_library.csv (1,149 activities) via
 * scripts/gen-activity-library-seed.mjs, not from the 56 activities below.
 * Nothing at runtime imports this file — get_or_create_daily_plan() reads
 * the DB directly (see lib/db/plans.ts) — so it's kept as a historical
 * record of the original content rather than deleted outright.
 *
 * Today's plan — four activities a day, one per developmental domain.
 *
 * COLD START IS THE DEFAULT PATH, not a fallback. Onboarding collects only
 * name, date of birth and gender, so on day one the ONLY real signal is
 * age in months. Selection is therefore age-band first: every child gets a
 * genuinely age-appropriate plan from the very first open, with no "tell
 * us more" form standing in the way.
 *
 * The plan is valid whenever the parent opens the app. Nothing here is
 * tied to time of day — there is no "morning activity", and opening at
 * 9pm must not imply anything was missed.
 *
 * Deterministic: the same child on the same day gets the same four
 * activities. Which one of a domain's pool is chosen rotates by day, so
 * the plan moves without ever being random within a day.
 */

/**
 * The four domains, in the fixed order the plan is presented in.
 *
 * Same four the milestone timeline and development reports use, so a
 * completed activity can be attributed to the same axis a milestone sits
 * on. NOTE: the timeline lists these as Motor / Communication / Social &
 * Emotional / Cognitive; the plan deliberately orders Cognitive third to
 * match the brief. Same set, different presentation order — worth
 * reconciling when reports start joining the two.
 */
export const DOMAINS = ["Motor", "Communication", "Cognitive", "Social & Emotional"] as const;

export type Domain = (typeof DOMAINS)[number];

export type Activity = {
  /** Stable across a title edit only if the title is unchanged — see slug(). */
  id: string;
  domain: Domain;
  title: string;
  why: string;
  durationMins: number;
  /** Kept short: Home renders this on one line, no wrapping. */
  materials: string;
};

type RawActivity = Omit<Activity, "id">;

type Band = {
  /** Inclusive lower bound, in months. */
  from: number;
  label: string;
  activities: Activity[];
};

type RawBand = { from: number; label: string; activities: RawActivity[] };

/**
 * Every band carries at least two activities per domain, so a swap can
 * always stay inside the band — age-appropriateness is never traded for
 * variety.
 */
const RAW_BANDS: RawBand[] = [
  {
    from: 0,
    label: "0–3 months",
    activities: [
      {
        domain: "Motor",
        title: "Tummy time, little and often",
        why: "A few short spells beat one long one. This is how neck and shoulder strength starts.",
        durationMins: 5,
        materials: "A blanket on the floor",
      },
      {
        domain: "Motor",
        title: "Let them grip your finger",
        why: "The grasp reflex is their first piece of control. Your finger gives it something to practise on.",
        durationMins: 5,
        materials: "Just your hand",
      },
      {
        domain: "Communication",
        title: "Talk them through it",
        why: "Narrating what you're doing bathes them in the rhythm of speech long before the words land.",
        durationMins: 5,
        materials: "Whatever you're already doing",
      },
      {
        domain: "Communication",
        title: "Wait after you speak",
        why: "Leaving a gap teaches them conversation has turns, even if theirs is only a wriggle.",
        durationMins: 5,
        materials: "Nothing at all",
      },
      {
        domain: "Cognitive",
        title: "Follow the slow object",
        why: "Tracking something across their view is the first visual skill they build.",
        durationMins: 5,
        materials: "A soft toy, or your face",
      },
      {
        domain: "Cognitive",
        title: "Light and shadow",
        why: "Contrast is most of what they can see right now. Slow changes in light genuinely hold them.",
        durationMins: 5,
        materials: "A window and a curtain",
      },
      {
        domain: "Social & Emotional",
        title: "Face to face, close up",
        why: "At this age they focus about 30cm away. Roughly the distance to your face while feeding.",
        durationMins: 5,
        materials: "Just the two of you",
      },
      {
        domain: "Social & Emotional",
        title: "Answer every cry",
        why: "Responding consistently is how they learn the world is safe. You cannot spoil a newborn.",
        durationMins: 5,
        materials: "Only your attention",
      },
    ],
  },
  {
    from: 4,
    label: "4–6 months",
    activities: [
      {
        domain: "Motor",
        title: "Reach for it",
        why: "Holding a toy just within reach turns a swipe into a deliberate grab.",
        durationMins: 10,
        materials: "A rattle or soft toy",
      },
      {
        domain: "Motor",
        title: "Roll with a little help",
        why: "A gentle hand at the hip shows them the movement their body is already trying to find.",
        durationMins: 10,
        materials: "A flat, soft surface",
      },
      {
        domain: "Communication",
        title: "Copy their sounds back",
        why: "Echoing their babble teaches turn-taking. The shape of conversation before the words arrive.",
        durationMins: 10,
        materials: "Nothing at all",
      },
      {
        domain: "Communication",
        title: "Sing the same song daily",
        why: "Repetition is what makes language stick. The same song each day gives them something to predict.",
        durationMins: 10,
        materials: "Your voice, however it sounds",
      },
      {
        domain: "Cognitive",
        title: "Two textures, one hand",
        why: "Something soft, then something crinkly, builds the sense of touch they'll learn everything else with.",
        durationMins: 10,
        materials: "A muslin cloth and paper",
      },
      {
        domain: "Cognitive",
        title: "Mirror time",
        why: "They won't know it's them yet, but a face that moves when they move is worth studying.",
        durationMins: 10,
        materials: "Any mirror",
      },
      {
        domain: "Social & Emotional",
        title: "Exaggerate your face",
        why: "Big, slow expressions are readable to them now, and copying yours is their first social skill.",
        durationMins: 10,
        materials: "Just the two of you",
      },
      {
        domain: "Social & Emotional",
        title: "Let them lead the game",
        why: "Pausing when they look away and resuming when they return teaches them their signals matter.",
        durationMins: 10,
        materials: "Nothing at all",
      },
    ],
  },
  {
    from: 7,
    label: "7–12 months",
    activities: [
      {
        domain: "Motor",
        title: "Cruising along the sofa",
        why: "Furniture at chest height gives them something to pull along while their legs get confident.",
        durationMins: 10,
        materials: "A low sofa or table",
      },
      {
        domain: "Motor",
        title: "Pincer practice with snacks",
        why: "Picking up small pieces trains the finger-and-thumb grip they'll one day write with.",
        durationMins: 10,
        materials: "Soft finger food",
      },
      {
        domain: "Communication",
        title: "Name what they point at",
        why: "They're pointing before they're speaking. Naming it turns the gesture into a word.",
        durationMins: 10,
        materials: "The room you're in",
      },
      {
        domain: "Communication",
        title: "Wave, clap, repeat",
        why: "Gestures come before speech. Every wave they copy is a word forming.",
        durationMins: 10,
        materials: "Just your hands",
      },
      {
        domain: "Cognitive",
        title: "Peek-a-boo, three ways",
        why: "Object permanence is clicking into place right now. This is that idea, as a game.",
        durationMins: 10,
        materials: "A scarf and your hands",
      },
      {
        domain: "Cognitive",
        title: "In and out of the box",
        why: "Emptying and filling the same container is real research into how space works.",
        durationMins: 10,
        materials: "A box and safe objects",
      },
      {
        domain: "Social & Emotional",
        title: "Stay in sight, move away slowly",
        why: "Short, visible separations build the trust that you always come back.",
        durationMins: 10,
        materials: "Your own home",
      },
      {
        domain: "Social & Emotional",
        title: "Name what they're feeling",
        why: "Putting a word to a wobble is how feelings become manageable later on.",
        durationMins: 5,
        materials: "Only your attention",
      },
    ],
  },
  {
    from: 13,
    label: "13–24 months",
    activities: [
      {
        domain: "Motor",
        title: "One-bowl sorting",
        why: "Sorting is the earliest form of staying with one thing, the beginning of focus.",
        durationMins: 10,
        materials: "A bowl and two spoons",
      },
      {
        domain: "Motor",
        title: "Push something heavy",
        why: "Pushing a loaded basket builds the whole-body strength that walking still needs.",
        durationMins: 10,
        materials: "A basket with books in it",
      },
      {
        domain: "Communication",
        title: "Give them the word they're reaching for",
        why: "Answering the gesture with the word closes the gap between wanting and asking.",
        durationMins: 10,
        materials: "The room you're in",
      },
      {
        domain: "Communication",
        title: "Two-word echo",
        why: "When they say one word, hand back two. That's the next step, offered rather than demanded.",
        durationMins: 10,
        materials: "Nothing at all",
      },
      {
        domain: "Cognitive",
        title: "The mystery bag",
        why: "Reaching in without looking makes them predict before they see, ten quiet minutes of curiosity.",
        durationMins: 10,
        materials: "A bag and 3 objects",
      },
      {
        domain: "Cognitive",
        title: "Which cup is it under?",
        why: "Hiding something in plain sight lets them hold an idea in mind and then act on it.",
        durationMins: 10,
        materials: "Two cups and a small toy",
      },
      {
        domain: "Social & Emotional",
        title: "Let them help with a real job",
        why: "Carrying something to the bin is small, real, and theirs. Usefulness is a feeling they can have now.",
        durationMins: 10,
        materials: "Whatever you're doing",
      },
      {
        domain: "Social & Emotional",
        title: "Name the big feeling, then wait",
        why: "Naming a tantrum without rushing to fix it teaches them feelings pass on their own.",
        durationMins: 10,
        materials: "Only your patience",
      },
    ],
  },
  {
    from: 25,
    label: "25–36 months",
    activities: [
      {
        domain: "Motor",
        title: "Build it, then rebuild it",
        why: "Rebuilding the same tower stretches attention gently, without it feeling like a test.",
        durationMins: 15,
        materials: "Anything stackable",
      },
      {
        domain: "Motor",
        title: "Balance along a line",
        why: "A line on the floor turns walking into a challenge they can feel themselves getting better at.",
        durationMins: 15,
        materials: "A strip of tape",
      },
      {
        domain: "Communication",
        title: "Tell me the story back",
        why: "Retelling a familiar book grows memory and language at the same time.",
        durationMins: 15,
        materials: "A favourite picture book",
      },
      {
        domain: "Communication",
        title: "The 'and then?' game",
        why: "One extra question at a time stretches a two-word answer into a sentence.",
        durationMins: 15,
        materials: "Nothing, a walk works",
      },
      {
        domain: "Cognitive",
        title: "Sort by one thing",
        why: "Choosing a single rule (all the red ones)is the start of real categorising.",
        durationMins: 15,
        materials: "Socks, blocks, or buttons",
      },
      {
        domain: "Cognitive",
        title: "What's missing?",
        why: "Taking one object from a small group asks them to hold a picture in their head.",
        durationMins: 15,
        materials: "Three familiar objects",
      },
      {
        domain: "Social & Emotional",
        title: "Take turns on purpose",
        why: "Waiting is hard now. Short, obvious turns make it practisable rather than punishing.",
        durationMins: 15,
        materials: "Any one toy",
      },
      {
        domain: "Social & Emotional",
        title: "Offer two real choices",
        why: "Two options you can both live with gives them control without opening up the whole day.",
        durationMins: 10,
        materials: "Whatever you're deciding",
      },
    ],
  },
  {
    from: 37,
    label: "3–5 years",
    activities: [
      {
        domain: "Motor",
        title: "Hop, then hop further",
        why: "One foot at a time is a balance problem they can now solve, and enjoy solving.",
        durationMins: 15,
        materials: "A bit of open floor",
      },
      {
        domain: "Motor",
        title: "Cut along the line",
        why: "Scissors ask each hand to do a different job at once. Harder than it looks, and worth practising.",
        durationMins: 15,
        materials: "Safety scissors, old paper",
      },
      {
        domain: "Communication",
        title: "The question game",
        why: "Letting them ask you the questions flips the usual direction and stretches how they build ideas.",
        durationMins: 15,
        materials: "Nothing, a walk works",
      },
      {
        domain: "Communication",
        title: "Tell it in order",
        why: "Retelling their day in sequence is where storytelling and memory meet.",
        durationMins: 15,
        materials: "The day you've just had",
      },
      {
        domain: "Cognitive",
        title: "What floats, what sinks?",
        why: "They're old enough to guess before they test. That's the beginning of real reasoning.",
        durationMins: 15,
        materials: "A bowl of water, small things",
      },
      {
        domain: "Cognitive",
        title: "Sort it two different ways",
        why: "The same objects grouped by colour, then by size, shows them a rule is a choice.",
        durationMins: 15,
        materials: "Buttons, blocks, or leaves",
      },
      {
        domain: "Social & Emotional",
        title: "How do you think they felt?",
        why: "Asking about a character's feelings is the safest possible practice for reading real ones.",
        durationMins: 15,
        materials: "Any picture book",
      },
      {
        domain: "Social & Emotional",
        title: "Make the rule together",
        why: "A rule they helped write is one they can hold themselves to.",
        durationMins: 15,
        materials: "Paper and a pen",
      },
    ],
  },
  {
    from: 61,
    label: "5–7 years",
    activities: [
      {
        domain: "Motor",
        title: "Skip, gallop, then swap",
        why: "Switching between patterns mid-go is coordination and attention working together.",
        durationMins: 15,
        materials: "A bit of open space",
      },
      {
        domain: "Motor",
        title: "Throw and catch, stepping back",
        why: "Moving one step further apart each time makes the challenge theirs to set.",
        durationMins: 15,
        materials: "Any soft ball",
      },
      {
        domain: "Communication",
        title: "Teach me something",
        why: "Explaining something they know well is how understanding gets consolidated.",
        durationMins: 15,
        materials: "Whatever they're into",
      },
      {
        domain: "Communication",
        title: "Explain it to someone younger",
        why: "Simplifying an idea for a smaller child is the hardest, most useful kind of explaining.",
        durationMins: 15,
        materials: "A sibling, cousin, or toy",
      },
      {
        domain: "Cognitive",
        title: "Plan tomorrow together",
        why: "Thinking a day ahead is real executive function practice, and it costs nothing.",
        durationMins: 15,
        materials: "Paper and a pen",
      },
      {
        domain: "Cognitive",
        title: "What would happen if…?",
        why: "Following a made-up change to its consequences is reasoning without a right answer.",
        durationMins: 15,
        materials: "Nothing at all",
      },
      {
        domain: "Social & Emotional",
        title: "What would you do?",
        why: "Talking through a tricky moment before it happens gives them something to reach for when it does.",
        durationMins: 15,
        materials: "A moment from their week",
      },
      {
        domain: "Social & Emotional",
        title: "Notice someone else's day",
        why: "Asking who had a hard day turns empathy from a feeling into a habit.",
        durationMins: 15,
        materials: "Dinner, or the walk home",
      },
    ],
  },
];

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const BANDS: Band[] = RAW_BANDS.map((band) => ({
  ...band,
  activities: band.activities.map((a) => ({ ...a, id: slug(a.title) })),
}));

if (__DEV__) {
  // Two guarantees the rest of this file assumes. Both are content
  // mistakes rather than logic ones, so they're caught at load in dev
  // instead of surfacing as a missing card months later.
  const ids = new Set<string>();
  for (const band of BANDS) {
    for (const a of band.activities) {
      if (ids.has(a.id)) console.warn(`[todaysPlan] duplicate activity id "${a.id}", titles must be unique`);
      ids.add(a.id);
    }
    for (const domain of DOMAINS) {
      const count = band.activities.filter((a) => a.domain === domain).length;
      if (count < 2) {
        console.warn(
          `[todaysPlan] band ${band.label} has ${count} "${domain}" activities. Needs 2 so a swap can stay in band`
        );
      }
    }
  }
}

/** The band a given age in months falls into. Always resolves. */
function bandFor(totalMonths: number): Band {
  let match = BANDS[0];
  for (const band of BANDS) {
    if (totalMonths >= band.from) match = band;
  }
  return match;
}

/**
 * Corrected where prematurity applies. Activities are pitched at a
 * developmental band (see bandFor), so a preterm baby handed activities
 * for their chronological age gets ones they can't yet do — which reads
 * as failure rather than as a mismatched suggestion.
 */
function ageInMonths(child: Child): number {
  return developmentalAgeMonths(child);
}

/** Whole days since epoch — stable within a calendar day, local time. */
function dayIndex(date: Date): number {
  return Math.floor(
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 86_400_000
  );
}

/**
 * Signals that will eventually decide which domain leads the plan.
 *
 * HOOK, NOT YET IMPLEMENTED. The intent: order by which domain has gone
 * longest without a completed activity, so a parent who keeps skipping
 * Communication quietly gets it offered first, and the plan self-corrects
 * without ever asking them anything or telling them they're behind.
 */
export type DomainSignals = {
  /** ISO timestamp of the last completed activity, per domain. */
  lastCompletedAt?: Partial<Record<Domain, string>>;
};

/**
 * The order the four domains are presented in.
 *
 * Fixed for now. When `signals` starts being passed, sort by least-recent
 * `lastCompletedAt` (never-completed domains first) and everything
 * downstream — the plan array, the progress segments, the collapsed rows —
 * follows automatically, because they all read this order.
 */
export function orderDomains(_signals?: DomainSignals): Domain[] {
  return [...DOMAINS];
}

/** Every activity in this child's band for one domain, in authored order. */
function poolFor(child: Child, domain: Domain): Activity[] {
  return bandFor(ageInMonths(child)).activities.filter((a) => a.domain === domain);
}

/**
 * Today's four activities, one per domain, in `orderDomains` order.
 *
 * `swaps` carries how many times the parent has swapped each domain; the
 * offset rotates through that domain's pool. Because the pool is filtered
 * to the child's band first, a swap can never leave the band.
 */
export function planForChild(
  child: Child,
  opts?: { date?: Date; swaps?: Partial<Record<Domain, number>>; signals?: DomainSignals }
): Activity[] {
  const day = dayIndex(opts?.date ?? new Date());
  return orderDomains(opts?.signals).map((domain) => {
    const pool = poolFor(child, domain);
    const offset = opts?.swaps?.[domain] ?? 0;
    return pool[(day + offset) % pool.length];
  });
}

/** How many alternatives exist for a domain — 1 means the swap control is pointless. */
export function poolSize(child: Child, domain: Domain): number {
  return poolFor(child, domain).length;
}
