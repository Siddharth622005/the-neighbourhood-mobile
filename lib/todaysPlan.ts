import { computeAge } from "./childAge";
import type { Child } from "./AuthProvider";

/**
 * Today's plan — a single right-for-this-child activity.
 *
 * COLD START IS THE DEFAULT PATH, not a fallback. Onboarding collects only
 * name, date of birth and gender, so on day one the ONLY real signal is
 * age in months. Selection is therefore age-band first: every child gets a
 * genuinely age-appropriate activity from the very first open, with no
 * "tell us more" form standing in the way.
 *
 * Learned signals (goals inferred from what actually gets completed, notes,
 * copilot questions) refine WHICH activity inside the band gets picked —
 * they never gate whether a plan exists. That ordering matters: the
 * previous implementation matched on child.goals first, and since
 * onboarding never populates goals, every single child fell through to a
 * generic default. Age was only consulted afterwards, as a younger/older
 * boolean.
 *
 * This stays deterministic for now — same child, same day, same activity.
 * It's a stand-in for the Copilot-generated plan, shaped so that swapping
 * in a real generator doesn't change the call sites.
 */
export type Activity = {
  title: string;
  why: string;
  durationMins: number;
  materials: string;
  /** The developmental thread this activity pulls on. */
  focus: string;
};

/**
 * Age bands, in months, matching the same developmental stages the website
 * timeline uses. Every band has at least two activities so "not feeling
 * this?" always has somewhere to go without leaving the band.
 */
type Band = {
  /** Inclusive lower bound, in months. */
  from: number;
  activities: Activity[];
};

const BANDS: Band[] = [
  {
    from: 0, // 0–3 months
    activities: [
      {
        title: "Face to face, close up",
        why: "At this age they can focus about 30cm away — roughly the distance to your face while feeding.",
        durationMins: 5,
        materials: "Just the two of you",
        focus: "Social & Emotional",
      },
      {
        title: "Tummy time, little and often",
        why: "A few short spells beat one long one. This is how neck and shoulder strength starts.",
        durationMins: 5,
        materials: "A blanket on the floor",
        focus: "Motor",
      },
    ],
  },
  {
    from: 4, // 4–6 months
    activities: [
      {
        title: "Copy their sounds back",
        why: "Echoing their babble teaches turn-taking — the shape of conversation before the words arrive.",
        durationMins: 10,
        materials: "Nothing at all",
        focus: "Communication",
      },
      {
        title: "Two textures, one hand",
        why: "Letting them grab something soft, then something crinkly, builds the sense of touch they'll use to learn everything else.",
        durationMins: 10,
        materials: "A muslin cloth and a paper bag",
        focus: "Cognitive",
      },
    ],
  },
  {
    from: 7, // 7–12 months
    activities: [
      {
        title: "Peek-a-boo, three ways",
        why: "Object permanence is clicking into place right now — this is that idea, as a game.",
        durationMins: 10,
        materials: "A scarf and your hands",
        focus: "Cognitive",
      },
      {
        title: "Name what they point at",
        why: "They're pointing before they're speaking. Naming it turns the gesture into a word.",
        durationMins: 10,
        materials: "The room you're already in",
        focus: "Communication",
      },
    ],
  },
  {
    from: 13, // 13–24 months
    activities: [
      {
        title: "The mystery bag",
        why: "Reaching in without looking makes them predict before they see — ten quiet minutes of curiosity.",
        durationMins: 10,
        materials: "A cloth bag and 3 everyday objects",
        focus: "Cognitive",
      },
      {
        title: "One-bowl sorting",
        why: "Sorting is the earliest form of staying with one thing — the beginning of focus.",
        durationMins: 10,
        materials: "A bowl and two kinds of spoons",
        focus: "Motor",
      },
    ],
  },
  {
    from: 25, // 25–36 months
    activities: [
      {
        title: "Build it, then rebuild it",
        why: "Rebuilding the same tower stretches attention gently, without it feeling like a test.",
        durationMins: 15,
        materials: "Blocks, cups, or anything stackable",
        focus: "Motor",
      },
      {
        title: "Tell me the story back",
        why: "Retelling a familiar book grows memory and language at the same time.",
        durationMins: 15,
        materials: "A favourite picture book",
        focus: "Communication",
      },
    ],
  },
  {
    from: 37, // 3–5 years
    activities: [
      {
        title: "What floats, what sinks?",
        why: "They're old enough to guess before they test — that's the beginning of real reasoning.",
        durationMins: 15,
        materials: "A bowl of water and a few small things",
        focus: "Cognitive",
      },
      {
        title: "The question game",
        why: "Letting them ask you the questions flips the usual direction and stretches how they put ideas together.",
        durationMins: 15,
        materials: "Nothing — a walk works well",
        focus: "Communication",
      },
    ],
  },
  {
    from: 61, // 5–7 years
    activities: [
      {
        title: "Plan tomorrow together",
        why: "Thinking a day ahead is real executive function practice, and it costs nothing.",
        durationMins: 15,
        materials: "Paper and a pen",
        focus: "Cognitive",
      },
      {
        title: "Teach me something",
        why: "Explaining something they know well is how understanding gets consolidated.",
        durationMins: 15,
        materials: "Whatever they're into right now",
        focus: "Communication",
      },
    ],
  },
];

/** The band a given age in months falls into. Always resolves. */
function bandFor(totalMonths: number): Band {
  let match = BANDS[0];
  for (const band of BANDS) {
    if (totalMonths >= band.from) match = band;
  }
  return match;
}

function ageInMonths(child: Child): number {
  return computeAge(child.date_of_birth)?.totalMonths ?? 0;
}

/**
 * Order a band's activities by how well they match what we've learned
 * about this child. With no learned goals — i.e. day one — this is a
 * no-op and the band's own ordering stands.
 */
function rankByLearnedSignals(activities: Activity[], child: Child): Activity[] {
  const goals = child.goals ?? [];
  if (goals.length === 0) return activities;
  return [...activities].sort((a, b) => {
    const aRank = goals.indexOf(a.focus);
    const bRank = goals.indexOf(b.focus);
    // Unmatched focuses sort last, preserving relative order otherwise.
    return (aRank === -1 ? Infinity : aRank) - (bRank === -1 ? Infinity : bRank);
  });
}

export function activityForChild(child: Child): Activity {
  const ranked = rankByLearnedSignals(bandFor(ageInMonths(child)).activities, child);
  return ranked[0];
}

/**
 * A single alternative to today's activity — never a browsable list. The
 * product's whole thesis is "one thing, the right one"; offering a way out
 * when today's pick genuinely doesn't fit is still one decision, not five.
 *
 * The alternative stays inside the same age band, so swapping never costs
 * age-appropriateness.
 */
export function alternateActivityForChild(child: Child, excludeTitle: string): Activity {
  const ranked = rankByLearnedSignals(bandFor(ageInMonths(child)).activities, child);
  return ranked.find((a) => a.title !== excludeTitle) ?? ranked[0];
}
