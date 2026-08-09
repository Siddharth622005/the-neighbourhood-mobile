/**
 * The Kid Meal Planner — feeding guidance staged to the child's actual
 * developmental readiness, not a generic "toddler nutrition" list.
 *
 * Sibling to lib/parentCare.ts, not part of it: this is the child's feeding
 * story, not the parent's postpartum one. It reuses MEAL_SLOTS from that
 * file because a slot-of-day (breakfast, mid-morning, ...) isn't a
 * postpartum concept — it's just a time of day — but everything else here
 * is its own domain.
 *
 * LOCAL ONLY, same as parentCare.ts and devKit.ts: no meals table yet, so
 * this is typed content with real clinical shape. Selector functions are
 * the only surface screens touch, so moving this to Supabase later is a
 * change to this file alone.
 *
 * Same editorial rule as everywhere else in this app: describe, never
 * grade. A stage is what's typical now, not a checklist a child can fail.
 */

import { MEAL_SLOTS, type MealSlot } from "./parentCare";
import type { RecoveryFeedingMethod } from "./recoveryProfile";

export { MEAL_SLOTS, type MealSlot };

/* ------------------------------------------------------------------ */
/* Stages                                                               */
/* ------------------------------------------------------------------ */

/**
 * A dedicated feeding-stage type, not the app's general AgeBand. Real
 * infant-feeding guidance (WHO / AAP) needs finer granularity across the
 * first year than AgeBand gives (which lumps 7–12 months into one band) —
 * the difference between a purée and a finger food is exactly the kind of
 * distinction this feature exists to make. lib/parentCare.ts sets the
 * precedent: PostpartumStage is already its own type, separate from
 * AgeBand, for the same reason.
 */
export type KidFeedingStage = "m0_6" | "m6_8" | "m8_10" | "m10_12" | "m12_24" | "y2_5";

export const STAGE_LABEL: Record<KidFeedingStage, string> = {
  m0_6: "0–6 months",
  m6_8: "6–8 months",
  m8_10: "8–10 months",
  m10_12: "10–12 months",
  m12_24: "12–24 months",
  y2_5: "2–5 years",
};

export const STAGE_HEADLINE: Record<KidFeedingStage, string> = {
  m0_6: "Milk, exclusively.",
  m6_8: "First tastes.",
  m8_10: "Textures building.",
  m10_12: "Feeding themselves.",
  m12_24: "Joining the table.",
  y2_5: "Building the habits.",
};

export function stageForAgeMonths(ageMonths: number): KidFeedingStage {
  if (ageMonths < 6) return "m0_6";
  if (ageMonths < 8) return "m6_8";
  if (ageMonths < 10) return "m8_10";
  if (ageMonths < 12) return "m10_12";
  if (ageMonths < 24) return "m12_24";
  return "y2_5";
}

const STAGE_ORDER: KidFeedingStage[] = ["m0_6", "m6_8", "m8_10", "m10_12", "m12_24", "y2_5"];

export function nextStage(stage: KidFeedingStage): KidFeedingStage | null {
  const i = STAGE_ORDER.indexOf(stage);
  return i >= 0 && i < STAGE_ORDER.length - 1 ? STAGE_ORDER[i + 1] : null;
}

/**
 * What this stage is, in plain terms, and how it reads depending on how
 * the baby is being fed — reusing the SAME fact already collected for the
 * parent's own Recovery profile (see lib/recoveryProfile.tsx) rather than
 * asking again. Only the first two stages branch on it; feeding method
 * stops being the relevant variable once solids are established.
 */
export function stageDescription(stage: KidFeedingStage, feeding: RecoveryFeedingMethod | ""): string {
  const milk =
    feeding === "formula"
      ? "formula"
      : feeding === "combination"
        ? "breast milk and formula"
        : feeding === "exclusive"
          ? "breast milk"
          : "milk";

  switch (stage) {
    case "m0_6":
      return `${milk[0].toUpperCase()}${milk.slice(1)} is the whole diet right now, and that's exactly right — nothing else is needed, water included. Feeding on cue rather than a clock is normal and healthy at this stage.`;
    case "m6_8":
      return `${milk[0].toUpperCase()}${milk.slice(1)} is still the main event — solids are practice, not replacement. One or two small tastes a day is plenty; most of it will end up on the floor, and that's fine.`;
    case "m8_10":
      return "Solids are becoming a real second source of nutrition alongside milk, which is why texture and iron both start to matter more here.";
    case "m10_12":
      return "Most of what they eat can now look like small versions of family food. Milk is still important, but food is doing more of the nutritional work.";
    case "m12_24":
      return "Whole milk, real meals, and a seat at the table. Appetite will vary wildly day to day — that's a normal toddler pattern, not a feeding problem.";
    case "y2_5":
      return "The food itself matters less now than the habits forming around it: variety, pace, and a calm table that doesn't turn into a negotiation.";
  }
}

/* ------------------------------------------------------------------ */
/* Nutrients                                                           */
/* ------------------------------------------------------------------ */

export type KidNutrientKey =
  | "iron"
  | "zinc"
  | "calcium"
  | "vitamin_d"
  | "protein"
  | "healthy_fats"
  | "fibre"
  | "vitamin_c";

export type KidNutrient = {
  key: KidNutrientKey;
  label: string;
  /** Why it matters AT THIS STAGE specifically — never a generic definition. */
  why: string;
  /** Easy, ordinary sources — not a supplement pitch. */
  sources: string[];
};

/**
 * Deliberately no "current vs target" number here, unlike nutrientsFor in
 * parentCare.ts. That comparison is already an illustrative placeholder
 * even there — openly caveated as a reference point, not measured intake.
 * Presenting a fabricated "6 of 11mg today" for a baby nobody is actually
 * tracking would compound that into something closer to a real claim.
 * What's useful here is why it matters and what delivers it — not a track
 * racing toward a number that was never real.
 */
export function nutrientsForStage(stage: KidFeedingStage): KidNutrient[] {
  const IRON: KidNutrient = {
    key: "iron",
    label: "Iron",
    why: "The iron a baby is born with runs low around six months, right as milk alone stops being enough — this is the single biggest reason solids start when they do.",
    sources: ["Iron-fortified infant cereal", "Puréed meat or lentils", "Beans", "Dark leafy greens"],
  };
  const ZINC: KidNutrient = {
    key: "zinc",
    label: "Zinc",
    why: "Works alongside iron for growth and immune function, and needs the same dietary attention once milk alone isn't covering it.",
    sources: ["Meat", "Lentils and beans", "Yoghurt", "Whole grains"],
  };
  const VITAMIN_D: KidNutrient = {
    key: "vitamin_d",
    label: "Vitamin D",
    why: "Breast milk carries very little of it, which is why a daily drop is commonly recommended for breastfed babies from birth.",
    sources: ["Vitamin D drops", "Fortified formula", "Fortified milk", "Egg yolk"],
  };
  const PROTEIN: KidNutrient = {
    key: "protein",
    label: "Protein",
    why: "Growth at this pace has real building-block requirements — a toddler's tiny stomach needs it in small, frequent amounts rather than one big serving.",
    sources: ["Egg", "Yoghurt", "Lentils and beans", "Soft-cooked meat or fish"],
  };
  const HEALTHY_FATS: KidNutrient = {
    key: "healthy_fats",
    label: "Healthy fats",
    why: "A young child's brain is growing faster than at any later point in life, and it runs substantially on fat — this is not the age for low-fat anything.",
    sources: ["Avocado", "Whole-milk yoghurt", "Ghee or olive oil", "Nut butter, thinned"],
  };
  const CALCIUM: KidNutrient = {
    key: "calcium",
    label: "Calcium",
    why: "Bone density set in early childhood carries forward for life, which is part of why whole milk (not low-fat) is recommended until at least two.",
    sources: ["Whole milk", "Yoghurt", "Paneer or cheese", "Ragi"],
  };
  const FIBRE: KidNutrient = {
    key: "fibre",
    label: "Fibre",
    why: "Supports digestion that's still finding its rhythm, and whole fruits and vegetables build a habit that's far easier to start now than later.",
    sources: ["Whole fruit, not juice", "Vegetables", "Whole grains", "Beans and lentils"],
  };
  const VITAMIN_C: KidNutrient = {
    key: "vitamin_c",
    label: "Vitamin C",
    why: "Eaten in the same meal as an iron-rich food, it roughly doubles how much of that iron actually gets absorbed.",
    sources: ["Citrus", "Tomato", "Bell pepper", "Guava"],
  };

  switch (stage) {
    case "m0_6":
      return [VITAMIN_D, IRON];
    case "m6_8":
      return [IRON, ZINC, VITAMIN_C, VITAMIN_D];
    case "m8_10":
      return [IRON, PROTEIN, HEALTHY_FATS, VITAMIN_C];
    case "m10_12":
      return [IRON, HEALTHY_FATS, CALCIUM, PROTEIN];
    case "m12_24":
      return [CALCIUM, IRON, HEALTHY_FATS, VITAMIN_D];
    case "y2_5":
      return [FIBRE, CALCIUM, IRON, VITAMIN_D];
  }
}

/* ------------------------------------------------------------------ */
/* Feeding tips — the non-food guidance each stage needs                */
/* ------------------------------------------------------------------ */

export type FeedingTip = { title: string; body: string };

export function tipsForStage(stage: KidFeedingStage): FeedingTip[] {
  switch (stage) {
    case "m0_6":
      return [
        {
          title: "Feed on cue, not a clock",
          body: "Hunger cues — rooting, hands to mouth, fussing — are a more reliable guide than a feeding schedule at this age.",
        },
        {
          title: "Watch for readiness, not a date",
          body: "Sitting with support, head control, and real interest in your food matter more than the calendar for deciding when to start solids.",
        },
      ];
    case "m6_8":
      return [
        {
          title: "One new food at a time",
          body: "Waiting two or three days between new foods makes it obvious what caused a reaction, if anything does.",
        },
        {
          title: "The common allergens don't need delaying",
          body: "Current guidance is the opposite of the old advice: introducing peanut, egg and dairy early (from around six months, in age-appropriate form) actually lowers allergy risk. Ask your paediatrician if there's a family history.",
        },
        {
          title: "Let them get messy",
          body: "Touching, squishing and dropping food is how texture gets explored at this age — a food-covered high chair is a sign it's working, not going wrong.",
        },
      ];
    case "m8_10":
      return [
        {
          title: "Lumps are the point, not a mistake",
          body: "Moving from smooth purées to soft lumps by around nine months, even if they gag a little at first, builds the chewing skill finger foods will need soon.",
        },
        {
          title: "Gagging isn't choking",
          body: "A gag pushes food forward and is loud — it's the airway protecting itself and usually resolves alone. Choking is silent. Knowing the difference stops a normal gag from becoming a scare.",
        },
      ];
    case "m10_12":
      return [
        {
          title: "Cut the known choking hazards",
          body: "Whole grapes, nuts, popcorn, and hard raw vegetables are genuine risks at this age. Grapes quartered lengthwise, nuts ground into butter — same food, safe shape.",
        },
        {
          title: "Let them drive the spoon",
          body: "Mess and slowness are the cost of the actual skill being built. Loading a second spoon while they work on their own keeps food going in without taking over.",
        },
      ];
    case "m12_24":
      return [
        {
          title: "Offer, don't pressure",
          body: "Appetite swings hard at this age — a huge lunch and a one-bite dinner in the same day is normal. Repeated calm offering works better than encouragement to finish.",
        },
        {
          title: "Whole milk, not low-fat",
          body: "Unless a doctor has said otherwise, whole milk is recommended until at least two — this is not the age to switch to skim for anyone's sake.",
        },
      ];
    case "y2_5":
      return [
        {
          title: "It can take ten tries, not two",
          body: "A food refused the first few times isn't necessarily disliked — repeated, pressure-free exposure is what usually gets a new food accepted.",
        },
        {
          title: "You decide what and when, they decide how much",
          body: "This is the whole of the division-of-responsibility approach that most paediatric feeding guidance now recommends: you control the menu and the timing, they control their own appetite.",
        },
        {
          title: "A calm table beats a clean plate",
          body: "Screens off, short and unhurried, no bargaining over bites — the atmosphere around eating shapes their relationship with food more than any single meal does.",
        },
      ];
  }
}

/* ------------------------------------------------------------------ */
/* Meals                                                                */
/* ------------------------------------------------------------------ */

export type KidMeal = {
  id: string;
  stage: KidFeedingStage;
  slot: MealSlot;
  title: string;
  blurb: string;
  minutes: number;
  /** The texture progression — the core clinical concept this feature is
   *  built around, with no equivalent in postpartum nutrition. */
  texture: string;
  delivers: KidNutrientKey[];
  ingredients: string[];
  steps: string[];
  /** Only set where genuinely relevant to this specific food/stage. */
  safetyNote?: string;
};

const MEALS: KidMeal[] = [
  /* ---- 6–8 months: first solids, one or two a day ---- */
  {
    id: "k-iron-cereal",
    stage: "m6_8",
    slot: "lunch",
    title: "Iron-fortified cereal, milk-loosened",
    blurb: "The classic first food, for a reason — iron is the priority right now.",
    minutes: 3,
    texture: "Smooth, runny purée",
    delivers: ["iron", "zinc"],
    ingredients: ["Iron-fortified infant cereal", "Breast milk or formula"],
    steps: [
      "Mix a spoonful of cereal with milk until it drips off the spoon rather than holding a shape.",
      "Offer a few small spoonfuls, following their cues for more or done.",
      "Loosen further as needed — thick and sticky is harder to manage than it looks.",
    ],
  },
  {
    id: "k-sweet-potato",
    stage: "m6_8",
    slot: "morning_snack",
    title: "Steamed sweet potato purée",
    blurb: "Naturally sweet, easy to digest, and an easy win for a first vegetable.",
    minutes: 15,
    texture: "Smooth purée",
    delivers: ["vitamin_c"],
    ingredients: ["Sweet potato"],
    steps: [
      "Steam or boil sweet potato until a fork goes through with no resistance.",
      "Mash or blend with a splash of water or milk until smooth.",
      "Cool to lukewarm before offering.",
    ],
  },

  /* ---- 8–10 months: mashed, increasing texture ---- */
  {
    id: "k-lentil-mash",
    stage: "m8_10",
    slot: "breakfast",
    title: "Soft lentil and rice mash",
    blurb: "A real source of iron and protein, mashed rather than blended smooth.",
    minutes: 20,
    texture: "Soft mashed, small lumps",
    delivers: ["iron", "protein"],
    ingredients: ["Red lentils", "Rice", "A little ghee", "Cumin"],
    steps: [
      "Cook lentils and rice together until both fall apart easily.",
      "Mash with a fork rather than blending — leave some texture in.",
      "Stir through a little ghee for both flavour and healthy fat.",
    ],
  },
  {
    id: "k-avocado-egg",
    stage: "m8_10",
    slot: "lunch",
    title: "Mashed avocado and soft egg",
    blurb: "Healthy fat and protein in one bowl, both mashable with a fork.",
    minutes: 8,
    texture: "Soft mashed",
    delivers: ["healthy_fats", "protein"],
    ingredients: ["Avocado", "Egg"],
    steps: [
      "Hard-boil the egg and mash it well, yolk and white together.",
      "Mash ripe avocado separately, then combine.",
      "Loosen with a little milk if it's too thick to move easily on a spoon.",
    ],
  },
  {
    id: "k-veg-mash",
    stage: "m8_10",
    slot: "afternoon_snack",
    title: "Mixed vegetable mash",
    blurb: "Whatever's already cooking for the family, mashed and set aside first.",
    minutes: 15,
    texture: "Soft mashed, small lumps",
    delivers: ["vitamin_c", "iron"],
    ingredients: ["Carrot", "Peas", "Potato"],
    steps: [
      "Steam vegetables until fully soft.",
      "Mash roughly with a fork, leaving some texture.",
      "Set a portion aside unsalted before seasoning the rest for the family.",
    ],
  },

  /* ---- 10–12 months: finger foods, self-feeding ---- */
  {
    id: "k-toast-fingers",
    stage: "m10_12",
    slot: "breakfast",
    title: "Nut butter toast fingers",
    blurb: "A real finger food, cut into strips a small fist can manage.",
    minutes: 5,
    texture: "Soft finger food",
    delivers: ["healthy_fats", "protein"],
    ingredients: ["Soft wholegrain bread", "Smooth nut butter"],
    steps: [
      "Toast bread lightly so it holds together but isn't hard.",
      "Spread a thin, smooth layer of nut butter — thick blobs can stick to the roof of the mouth.",
      "Cut into finger-width strips.",
    ],
    safetyNote: "Use smooth nut butter only, spread thin — never a spoonful on its own.",
  },
  {
    id: "k-soft-veg-sticks",
    stage: "m10_12",
    slot: "lunch",
    title: "Soft-cooked vegetable sticks",
    blurb: "Steamed until it squashes between two fingers — that's the readiness test.",
    minutes: 15,
    texture: "Soft finger food",
    delivers: ["vitamin_c", "fibre"],
    ingredients: ["Carrot", "Broccoli", "Zucchini"],
    steps: [
      "Cut vegetables into stick shapes, thicker than a finger.",
      "Steam until a piece squashes easily between two fingers — this is the actual safety test, not a timer.",
      "Serve warm or at room temperature.",
    ],
  },
  {
    id: "k-mini-cutlets",
    stage: "m10_12",
    slot: "dinner",
    title: "Soft mini vegetable cutlets",
    blurb: "Shaped for small hands, soft enough for early chewing.",
    minutes: 25,
    texture: "Soft finger food",
    delivers: ["iron", "protein"],
    ingredients: ["Mashed potato", "Mixed vegetables", "A little besan or oats"],
    steps: [
      "Mix mashed potato with finely chopped, well-cooked vegetables.",
      "Bind with a spoon of besan or oats, shape into small soft patties.",
      "Pan-cook gently in a little oil until just set — keep the inside soft, not crisp.",
    ],
  },
  {
    id: "k-fruit-fingers",
    stage: "m10_12",
    slot: "afternoon_snack",
    title: "Ripe soft fruit, finger-cut",
    blurb: "Whatever's ripest — banana, papaya, mango, ripe pear.",
    minutes: 3,
    texture: "Soft finger food",
    delivers: ["fibre", "vitamin_c"],
    ingredients: ["Ripe banana or papaya or mango"],
    steps: [
      "Choose fruit soft enough to mash under light pressure.",
      "Cut into finger-length pieces.",
      "For grapes or similar round fruit, always quarter lengthwise rather than serve whole.",
    ],
    safetyNote: "Round fruits (grapes, cherry tomatoes) must be quartered lengthwise, never whole.",
  },

  /* ---- 12–24 months: family meals ---- */
  {
    id: "k-veg-poha",
    stage: "m12_24",
    slot: "breakfast",
    title: "Soft vegetable poha",
    blurb: "A real family breakfast, just chopped a little smaller.",
    minutes: 15,
    texture: "Chopped family food",
    delivers: ["iron", "fibre"],
    ingredients: ["Flattened rice", "Peas", "Carrot", "A little turmeric"],
    steps: [
      "Soak flattened rice until soft, then drain.",
      "Sauté finely chopped vegetables until tender.",
      "Combine with the rice, season lightly, cook through.",
    ],
  },
  {
    id: "k-milk-fruit",
    stage: "m12_24",
    slot: "morning_snack",
    title: "Whole milk with chopped fruit",
    blurb: "Whole milk stays the recommendation here — this isn't the age for low-fat.",
    minutes: 2,
    texture: "Chopped family food",
    delivers: ["calcium", "healthy_fats"],
    ingredients: ["Whole milk", "Any soft fruit"],
    steps: ["Serve milk in an open or straw cup.", "Chop fruit small and soft, serve alongside."],
  },
  {
    id: "k-dal-rice-family",
    stage: "m12_24",
    slot: "lunch",
    title: "Family dal and rice, unsalted portion set aside",
    blurb: "The same lunch everyone's having, just plated before the chilli goes in.",
    minutes: 25,
    texture: "Chopped family food",
    delivers: ["iron", "protein", "fibre"],
    ingredients: ["Lentils", "Rice", "Vegetables", "Mild spices"],
    steps: [
      "Cook the family dal as usual, keeping seasoning mild until near the end.",
      "Set a portion aside before adding chilli or heavy salt.",
      "Serve with soft rice and any well-cooked vegetables from the pot.",
    ],
  },
  {
    id: "k-paneer-cubes",
    stage: "m12_24",
    slot: "afternoon_snack",
    title: "Soft paneer cubes",
    blurb: "Protein and calcium in one easy, mild finger food.",
    minutes: 5,
    texture: "Chopped family food",
    delivers: ["calcium", "protein"],
    ingredients: ["Fresh paneer"],
    steps: [
      "Cut soft, fresh paneer into small cubes.",
      "Serve as-is, or lightly warmed in a pan with no seasoning.",
    ],
  },
  {
    id: "k-khichdi-family",
    stage: "m12_24",
    slot: "dinner",
    title: "Vegetable khichdi",
    blurb: "One-pot, easy to chew, and forgiving of whatever vegetables are around.",
    minutes: 25,
    texture: "Chopped family food",
    delivers: ["iron", "protein", "healthy_fats"],
    ingredients: ["Rice", "Split lentils", "Mixed vegetables", "Ghee"],
    steps: [
      "Cook rice and lentils together with vegetables until soft.",
      "Mash lightly if needed for an easier texture.",
      "Finish with a spoon of ghee.",
    ],
  },

  /* ---- 2–5 years: habits and diversity ---- */
  {
    id: "k-egg-paratha",
    stage: "y2_5",
    slot: "breakfast",
    title: "Soft egg paratha",
    blurb: "Protein wrapped into something they can pick up themselves.",
    minutes: 15,
    texture: "Regular family meal",
    delivers: ["protein", "healthy_fats"],
    ingredients: ["Whole wheat flatbread", "Egg"],
    steps: [
      "Cook a soft flatbread.",
      "Scramble an egg lightly with the flatbread in the pan, or serve alongside.",
      "Cut into strips for easy picking-up.",
    ],
  },
  {
    id: "k-fruit-yoghurt",
    stage: "y2_5",
    slot: "morning_snack",
    title: "Yoghurt with chopped fruit and seeds",
    blurb: "An easy way to layer in calcium, fibre and healthy fat at once.",
    minutes: 3,
    texture: "Regular family meal",
    delivers: ["calcium", "fibre", "healthy_fats"],
    ingredients: ["Whole-milk yoghurt", "Any fruit", "Ground flax or chia"],
    steps: ["Chop fruit small.", "Stir into yoghurt with a pinch of ground seeds."],
  },
  {
    id: "k-rajma-rice",
    stage: "y2_5",
    slot: "lunch",
    title: "Rajma and rice",
    blurb: "A real family plate — the food itself barely differs from an adult portion now.",
    minutes: 30,
    texture: "Regular family meal",
    delivers: ["iron", "fibre", "protein"],
    ingredients: ["Kidney beans", "Rice", "Tomato", "Mild spices"],
    steps: [
      "Cook rajma until soft, keeping spice mild.",
      "Serve over rice.",
      "Offer alongside, not mixed in, if they prefer to see each food separately.",
    ],
  },
  {
    id: "k-veg-sticks-dip",
    stage: "y2_5",
    slot: "afternoon_snack",
    title: "Raw vegetable sticks with hummus",
    blurb: "Repeated, low-pressure exposure to raw vegetables starts paying off here.",
    minutes: 8,
    texture: "Regular family meal",
    delivers: ["fibre", "vitamin_c"],
    ingredients: ["Cucumber", "Carrot", "Bell pepper", "Hummus"],
    steps: [
      "Cut vegetables into easy-to-hold sticks.",
      "Serve with hummus or a mild yoghurt dip for dunking.",
    ],
  },
  {
    id: "k-fish-veg",
    stage: "y2_5",
    slot: "dinner",
    title: "Soft-cooked fish with vegetables",
    blurb: "Omega-3s and protein, deboned and flaked for easy eating.",
    minutes: 20,
    texture: "Regular family meal",
    delivers: ["protein", "healthy_fats"],
    ingredients: ["White fish", "Seasonal vegetables", "Lemon"],
    steps: [
      "Steam or pan-cook fish until it flakes easily.",
      "Check thoroughly for bones before serving.",
      "Serve with soft-cooked vegetables and a squeeze of lemon.",
    ],
    safetyNote: "Check carefully for bones — flake the fish apart before serving, don't assume it's clear.",
  },
];

/** Meals for a stage and slot — usually one, occasionally an alternative. */
export function mealsFor(stage: KidFeedingStage, slot: MealSlot): KidMeal[] {
  return MEALS.filter((m) => m.stage === stage && m.slot === slot);
}

/** Which slots this stage actually uses — the youngest stages don't fill all five. */
export function slotsForStage(stage: KidFeedingStage): typeof MEAL_SLOTS {
  return MEAL_SLOTS.filter((slot) => mealsFor(stage, slot.key).length > 0);
}

/** Everything not already in the kitchen, for this stage's planned meals. */
export function groceriesForStage(stage: KidFeedingStage): string[] {
  const planned = slotsForStage(stage).flatMap(({ key }) => mealsFor(stage, key).slice(0, 1));
  return Array.from(new Set(planned.flatMap((m) => m.ingredients))).sort();
}
