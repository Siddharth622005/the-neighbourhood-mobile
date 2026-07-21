import { computeAge } from "./childAge";
import type { Child } from "./AuthProvider";

/**
 * A single, right-for-this-child activity for Today's Plan. This is a
 * deterministic placeholder for the eventual AI Copilot (PRD 5.3): it
 * still honours the child's age band and their top goal so the card feels
 * chosen, not random. One card, one reason, materials from the kitchen.
 */
export type Activity = {
  title: string;
  why: string;
  durationMins: number;
  materials: string;
};

type Template = {
  goal: string;
  younger: Activity; // under ~2.5 years
  older: Activity;
};

const TEMPLATES: Template[] = [
  {
    goal: "Curiosity",
    younger: {
      title: "The mystery bag",
      why: "You said curiosity matters right now — this is ten quiet minutes of it.",
      durationMins: 10,
      materials: "A cloth bag and 3 everyday objects",
    },
    older: {
      title: "What floats, what sinks?",
      why: "You said curiosity matters right now — let them predict, then find out.",
      durationMins: 15,
      materials: "A bowl of water and a few small objects",
    },
  },
  {
    goal: "Communication",
    younger: {
      title: "Name-and-point",
      why: "You're building communication — naming what they point to turns gestures into words.",
      durationMins: 10,
      materials: "Just the two of you and the room you're in",
    },
    older: {
      title: "Tell me the story back",
      why: "You're building communication — retelling grows memory and language together.",
      durationMins: 15,
      materials: "A favourite picture book",
    },
  },
  {
    goal: "Focus",
    younger: {
      title: "One-bowl sorting",
      why: "You chose focus — sorting is the earliest form of staying with one thing.",
      durationMins: 10,
      materials: "A bowl and two kinds of spoons",
    },
    older: {
      title: "Build it, then rebuild it",
      why: "You chose focus — rebuilding the same tower stretches attention gently.",
      durationMins: 15,
      materials: "Blocks, cups, or anything stackable",
    },
  },
];

const DEFAULT: Activity = {
  title: "Ten minutes, fully theirs",
  why: "Nothing planned today — just follow what they're drawn to, and notice.",
  durationMins: 10,
  materials: "Whatever's already within reach",
};

export function activityForChild(child: Child): Activity {
  const age = computeAge(child.date_of_birth);
  const isOlder = (age?.totalMonths ?? 24) >= 30;
  const topGoal = child.goals?.[0];
  const t = TEMPLATES.find((x) => x.goal === topGoal);
  if (!t) return DEFAULT;
  return isOlder ? t.older : t.younger;
}
