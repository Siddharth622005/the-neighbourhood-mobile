/**
 * The parent-side domain model: who the parent is right now, what their body
 * needs at this stage, and what the day looks like.
 *
 * LOCAL ONLY. There is no parent table yet, so this is typed demo data with
 * real clinical shape rather than a fake network layer. Everything a screen
 * needs goes through the selector functions at the bottom, so swapping in
 * Supabase later is a change to this file and nothing else.
 *
 * Editorial rule that governs every string here: describe, never grade. No
 * "you missed", no "you're behind", no percentages presented as scores. A
 * parent reading this at 3am should feel accompanied, not audited.
 */

export type PostpartumStage =
  | "pregnancy"
  | "fourth_trimester" // 0–12 weeks
  | "recovering" // 3–6 months
  | "established"; // 6 months+

export type DeliveryType = "vaginal" | "caesarean";
export type FeedingMethod = "breastfeeding" | "mixed" | "formula";
export type DietaryPreference = "omnivore" | "vegetarian" | "vegan";

export type ParentProfile = {
  weeksPostpartum: number;
  stage: PostpartumStage;
  delivery: DeliveryType;
  feeding: FeedingMethod;
  diet: DietaryPreference;
  /** Free-text allergens, matched case-insensitively against ingredients. */
  allergies: string[];
};

/**
 * "two weeks" / "six months" — the phrasing used mid-sentence when telling a
 * parent what's ordinary for where they are. Spelled out rather than
 * numeric, because "at 6 months" reads like a chart and "at six months"
 * reads like a person talking.
 */
const SPELLED = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

export function elapsedPhrase(weeks: number): string {
  if (weeks < 1) return "the first days";
  if (weeks < 9) {
    const w = Math.max(1, Math.round(weeks));
    return `${SPELLED[w] ?? w} week${w === 1 ? "" : "s"}`;
  }
  const months = Math.round(weeks / 4.345);
  if (months >= 12) {
    const years = Math.floor(months / 12);
    return `${SPELLED[years] ?? years} year${years === 1 ? "" : "s"}`;
  }
  return `${SPELLED[months] ?? months} months`;
}

/** "a caesarean" / "birth" — how to name the event in a sentence. */
export function deliveryPhrase(delivery: DeliveryType): string {
  return delivery === "caesarean" ? "a caesarean" : "birth";
}

export function stageFromWeeks(weeks: number): PostpartumStage {
  if (weeks < 0) return "pregnancy";
  if (weeks <= 12) return "fourth_trimester";
  if (weeks <= 26) return "recovering";
  return "established";
}

export const STAGE_LABEL: Record<PostpartumStage, string> = {
  pregnancy: "Pregnancy",
  fourth_trimester: "Fourth trimester",
  recovering: "Recovering",
  established: "Finding your rhythm",
};

/**
 * Until there's a real parent record, the profile is derived from the child's
 * age — which is the one thing the app genuinely knows.
 */
export function deriveProfile(childAgeMonths: number): ParentProfile {
  const weeks = Math.round(childAgeMonths * 4.345);
  return {
    weeksPostpartum: weeks,
    stage: stageFromWeeks(weeks),
    delivery: "caesarean",
    feeding: "breastfeeding",
    diet: "vegetarian",
    allergies: [],
  };
}

/* ------------------------------------------------------------------ */
/* Nutrition                                                           */
/* ------------------------------------------------------------------ */

export type NutrientKey =
  | "protein"
  | "iron"
  | "calcium"
  | "vitamin_d"
  | "omega_3"
  | "folate"
  | "fibre"
  | "hydration";

export type Nutrient = {
  key: NutrientKey;
  label: string;
  unit: string;
  target: number;
  /** How much today's logged meals cover. */
  current: number;
  /** One plain sentence on why this matters at this stage. */
  why: string;
};

/**
 * Targets follow standard postpartum/lactation guidance, adjusted for feeding
 * method and diet. These are educational reference points, not prescriptions —
 * the UI says so wherever they appear.
 */
export function nutrientsFor(profile: ParentProfile): Nutrient[] {
  const lactating = profile.feeding !== "formula";
  const plant = profile.diet === "vegan";

  return [
    {
      key: "protein",
      label: "Protein",
      unit: "g",
      target: lactating ? 71 : 56,
      current: 44,
      why: "Rebuilds tissue and keeps energy steady through broken nights.",
    },
    {
      key: "iron",
      label: "Iron",
      unit: "mg",
      // Plant iron absorbs less readily, so the practical target is higher.
      target: plant ? 32 : lactating ? 9 : 18,
      current: 6,
      why: "Replaces what birth took, and lifts the fog that low iron causes.",
    },
    {
      key: "calcium",
      label: "Calcium",
      unit: "mg",
      target: 1000,
      current: 620,
      why: "Protects your own bone stores while you feed.",
    },
    {
      key: "vitamin_d",
      label: "Vitamin D",
      unit: "IU",
      target: lactating ? 600 : 400,
      current: 200,
      why: "Works with calcium, and most of us are low without noticing.",
    },
    {
      key: "omega_3",
      label: "Omega-3",
      unit: "mg",
      target: 300,
      current: 120,
      why: "Supports mood and your baby's brain if you're feeding.",
    },
    {
      key: "folate",
      label: "Folate",
      unit: "mcg",
      target: lactating ? 500 : 400,
      current: 310,
      why: "Keeps making the new cells recovery depends on.",
    },
    {
      key: "fibre",
      label: "Fibre",
      unit: "g",
      target: 28,
      current: 17,
      why: "Gently sorts out the digestion nobody warns you about.",
    },
  ];
}

export type MealSlot =
  | "breakfast"
  | "morning_snack"
  | "lunch"
  | "afternoon_snack"
  | "dinner";

export const MEAL_SLOTS: { key: MealSlot; label: string; window: string }[] = [
  { key: "breakfast", label: "Breakfast", window: "Morning" },
  { key: "morning_snack", label: "Something small", window: "Mid-morning" },
  { key: "lunch", label: "Lunch", window: "Midday" },
  { key: "afternoon_snack", label: "Something small", window: "Afternoon" },
  { key: "dinner", label: "Dinner", window: "Evening" },
];

export type Meal = {
  id: string;
  slot: MealSlot;
  title: string;
  blurb: string;
  minutes: number;
  /** Nutrients this meal meaningfully contributes. */
  delivers: NutrientKey[];
  ingredients: string[];
  steps: string[];
  diets: DietaryPreference[];
  /** True for meals you can assemble with one hand. */
  oneHanded: boolean;
  logged: boolean;
};

const MEALS: Meal[] = [
  {
    id: "m-oats",
    slot: "breakfast",
    title: "Warm oats, dates and almond butter",
    blurb: "Slow-release energy that holds through a cluster-feed morning.",
    minutes: 6,
    delivers: ["iron", "fibre", "calcium", "protein"],
    ingredients: [
      "Rolled oats",
      "Milk or fortified plant milk",
      "Medjool dates",
      "Almond butter",
      "Cinnamon",
    ],
    steps: [
      "Simmer oats in milk for four minutes.",
      "Stir through chopped dates until they soften.",
      "Top with almond butter and cinnamon.",
    ],
    diets: ["omnivore", "vegetarian", "vegan"],
    oneHanded: true,
    logged: true,
  },
  {
    id: "m-eggs",
    slot: "breakfast",
    title: "Soft eggs on buttered rye",
    blurb: "Protein and choline without standing at the hob for long.",
    minutes: 8,
    delivers: ["protein", "vitamin_d", "folate"],
    ingredients: ["Eggs", "Rye bread", "Butter", "Chives", "Black pepper"],
    steps: [
      "Boil eggs for six and a half minutes.",
      "Toast and butter the rye.",
      "Halve the eggs over the toast, season, scatter chives.",
    ],
    diets: ["omnivore", "vegetarian"],
    oneHanded: false,
    logged: false,
  },
  {
    id: "m-lassi",
    slot: "morning_snack",
    title: "Salted yoghurt lassi",
    blurb: "Replaces the fluid feeding quietly takes. Drink it one-handed.",
    minutes: 2,
    delivers: ["hydration", "calcium", "protein"],
    ingredients: ["Yoghurt", "Cold water", "Salt", "Cumin", "Mint"],
    steps: ["Whisk everything until loose.", "Pour over ice."],
    diets: ["omnivore", "vegetarian"],
    oneHanded: true,
    logged: true,
  },
  {
    id: "m-dal",
    slot: "lunch",
    title: "Everyday dal with spinach and lemon",
    blurb: "Iron and folate in a bowl you can reheat all week.",
    minutes: 25,
    delivers: ["iron", "folate", "protein", "fibre"],
    ingredients: [
      "Red lentils",
      "Spinach",
      "Garlic",
      "Turmeric",
      "Cumin seeds",
      "Lemon",
    ],
    steps: [
      "Simmer lentils with turmeric until collapsing.",
      "Wilt spinach through at the end.",
      "Bloom cumin and garlic in ghee or oil, pour over.",
      "Finish with lemon — it helps the iron absorb.",
    ],
    diets: ["omnivore", "vegetarian", "vegan"],
    oneHanded: true,
    logged: false,
  },
  {
    id: "m-salmon",
    slot: "dinner",
    title: "Roast salmon, greens and lemon potatoes",
    blurb: "The most direct omega-3 there is, on one tray.",
    minutes: 30,
    delivers: ["omega_3", "protein", "vitamin_d"],
    ingredients: ["Salmon fillets", "New potatoes", "Tenderstem", "Lemon", "Olive oil"],
    steps: [
      "Roast potatoes for twenty minutes.",
      "Add salmon and greens, roast eight minutes more.",
      "Squeeze lemon over everything.",
    ],
    diets: ["omnivore"],
    oneHanded: false,
    logged: false,
  },
  {
    id: "m-tofu",
    slot: "dinner",
    title: "Sesame tofu with greens and brown rice",
    blurb: "Calcium-set tofu does the work dairy would.",
    minutes: 22,
    delivers: ["calcium", "protein", "iron", "fibre"],
    ingredients: [
      "Firm tofu",
      "Tahini",
      "Pak choi",
      "Brown rice",
      "Soy sauce",
      "Sesame seeds",
    ],
    steps: [
      "Crisp the tofu in a hot pan.",
      "Steam the greens over the rice for the last five minutes.",
      "Loosen tahini with soy and water, spoon over.",
    ],
    diets: ["omnivore", "vegetarian", "vegan"],
    oneHanded: false,
    logged: false,
  },
  {
    id: "m-trail",
    slot: "afternoon_snack",
    title: "Pumpkin seeds, walnuts and dried apricots",
    blurb: "Keep a jar wherever you feed. That's the whole recipe.",
    minutes: 1,
    delivers: ["iron", "omega_3", "fibre"],
    ingredients: ["Pumpkin seeds", "Walnuts", "Dried apricots"],
    steps: ["Combine in a jar.", "Leave it where you sit."],
    diets: ["omnivore", "vegetarian", "vegan"],
    oneHanded: true,
    logged: true,
  },
];

/** Meals filtered to the parent's diet and allergies, grouped by slot. */
export function mealsFor(profile: ParentProfile, slot: MealSlot): Meal[] {
  const allergens = profile.allergies.map((a) => a.toLowerCase().trim()).filter(Boolean);
  return MEALS.filter((meal) => {
    if (meal.slot !== slot) return false;
    if (!meal.diets.includes(profile.diet)) return false;
    if (
      allergens.some((allergen) =>
        meal.ingredients.some((i) => i.toLowerCase().includes(allergen))
      )
    ) {
      return false;
    }
    return true;
  });
}

/** Everything not already in the kitchen, for the meals planned today. */
export function groceriesFor(profile: ParentProfile): string[] {
  const planned = MEAL_SLOTS.flatMap(({ key }) => mealsFor(profile, key).slice(0, 1));
  return Array.from(new Set(planned.flatMap((m) => m.ingredients))).sort();
}

/* ------------------------------------------------------------------ */
/* Today's wellness                                                    */
/* ------------------------------------------------------------------ */

export type Vital = {
  key: "hydration" | "rest" | "nourishment" | "movement" | "mood";
  label: string;
  /** Short, human reading of state — never a score. */
  reading: string;
  /** 0–1, for the quiet arc. Absent when there's nothing to show. */
  fraction?: number;
  detail: string;
};

export function vitalsFor(profile: ParentProfile): Vital[] {
  const lactating = profile.feeding !== "formula";
  return [
    {
      key: "hydration",
      label: "Water",
      reading: lactating ? "5 of about 10 glasses" : "5 of about 8 glasses",
      fraction: 0.5,
      detail: "Feeding pulls roughly a litre a day. Keep one within reach.",
    },
    {
      key: "nourishment",
      label: "Eating",
      reading: "Three of five moments",
      fraction: 0.6,
      detail: "Small and often beats three proper meals right now.",
    },
    {
      key: "rest",
      label: "Rest",
      reading: "5h 20m, broken",
      fraction: 0.55,
      detail: "Fragmented sleep is normal here. Naps count fully.",
    },
    {
      key: "movement",
      label: "Movement",
      reading: "A short walk",
      fraction: 0.35,
      detail: `Gentle is the goal at ${elapsedPhrase(profile.weeksPostpartum)} after ${deliveryPhrase(profile.delivery)}.`,
    },
    {
      key: "mood",
      label: "Mood",
      reading: "Steady, tired",
      detail: "You logged this yesterday too. That's worth noticing.",
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Postpartum care library                                             */
/* ------------------------------------------------------------------ */

export type CareArea =
  | "physical"
  | "mental"
  | "sleep"
  | "feeding"
  | "nutrition"
  | "relationships";

export type CareTopic = {
  slug: string;
  area: CareArea;
  title: string;
  blurb: string;
  minutes: number;
  /** Shown on the topic screen, in order. */
  sections: { heading: string; body: string }[];
  /** When to stop reading and call someone. */
  seekHelp?: string[];
};

export const CARE_AREAS: {
  key: CareArea;
  label: string;
  blurb: string;
}[] = [
  { key: "physical", label: "Physical recovery", blurb: "Healing, pelvic floor, moving again." },
  { key: "mental", label: "Mental health", blurb: "Mood, stress, and when to reach out." },
  { key: "sleep", label: "Sleep", blurb: "Recovering rest in a broken-night season." },
  { key: "feeding", label: "Feeding", blurb: "Latch, supply, and common snags." },
  { key: "nutrition", label: "Nutrition", blurb: "What your body is asking for." },
  { key: "relationships", label: "Relationships", blurb: "Partners, work, and the balance." },
];

export const CARE_TOPICS: CareTopic[] = [
  {
    slug: "caesarean-healing",
    area: "physical",
    title: "How a caesarean scar heals",
    blurb: "What the first year actually looks like, week by week.",
    minutes: 5,
    sections: [
      {
        heading: "The timeline nobody gives you",
        body: "The outer wound closes in about two weeks. The deeper layers take three to six months, and the scar keeps softening and fading for a full year or more. Tightness at six months is ordinary, not a setback.",
      },
      {
        heading: "Numbness and tugging",
        body: "The nerves cut during surgery regrow slowly, so numbness above the scar, pins and needles, or a tugging feeling when you stretch are all expected. Most of it settles, though a narrow band of altered sensation can stay permanently.",
      },
      {
        heading: "Scar massage",
        body: "Once fully closed and cleared by your doctor — usually around six weeks — gentle massage helps the layers glide. Two minutes, small circles, firm enough to move the skin but never enough to hurt.",
      },
    ],
    seekHelp: [
      "Spreading redness, heat, or discharge from the scar",
      "A fever above 38°C",
      "Pain that is getting worse rather than better",
    ],
  },
  {
    slug: "pelvic-floor",
    area: "physical",
    title: "Pelvic floor, without the mystery",
    blurb: "What it does, how to find it, and what progress feels like.",
    minutes: 4,
    sections: [
      {
        heading: "Finding the right muscles",
        body: "Imagine stopping wind, then gently lifting that feeling up and in. Your stomach, thighs and buttocks should stay relaxed. If everything clenches at once, you've recruited too much — start smaller.",
      },
      {
        heading: "Both halves matter",
        body: "Squeezing is only half of it. A pelvic floor that cannot fully release is as much of a problem as a weak one. Let go completely between each lift and give it as long as the squeeze.",
      },
      {
        heading: "A realistic week",
        body: "Three sets of eight, most days, attached to something you already do — feeding, kettle boiling, red lights. Changes usually show up somewhere between six and twelve weeks.",
      },
    ],
    seekHelp: [
      "Leaking that isn't improving after three months of consistent work",
      "A feeling of heaviness or bulging in the vagina",
      "Pain during sex",
    ],
  },
  {
    slug: "baby-blues-or-more",
    area: "mental",
    title: "Baby blues, or something more",
    blurb: "How to tell the difference, honestly and without alarm.",
    minutes: 6,
    sections: [
      {
        heading: "Baby blues",
        body: "Tearfulness, sensitivity and mood swings that start in the first week and settle by about two weeks. Up to eight in ten parents experience it. It lifts on its own.",
      },
      {
        heading: "Postnatal depression",
        body: "Low mood, loss of interest, or hopelessness that lasts beyond two weeks or begins later in the first year. It affects roughly one in ten parents and responds well to treatment. It is not a failure of love or effort.",
      },
      {
        heading: "Anxiety, which gets missed",
        body: "Racing thoughts, checking the baby compulsively, intrusive images of harm coming to them. Frightening, common, and very treatable. Intrusive thoughts are not intentions.",
      },
    ],
    seekHelp: [
      "Low mood or anxiety lasting more than two weeks",
      "Feeling unable to care for yourself or your baby",
      "Any thought of harming yourself or your baby — contact your doctor or emergency services now",
    ],
  },
  {
    slug: "sleep-when-broken",
    area: "sleep",
    title: "Recovering rest when nights are broken",
    blurb: "What actually helps when eight hours isn't available.",
    minutes: 4,
    sections: [
      {
        heading: "Protect the first stretch",
        body: "The deepest, most restorative sleep comes early in the night. If someone can cover one feed, make it the late-evening one, and go to bed at the same time as your baby does.",
      },
      {
        heading: "Naps are real sleep",
        body: "A twenty-minute nap measurably restores alertness. Ninety minutes gets you a full cycle and you wake more easily than at sixty. Set an alarm and let the tidying wait.",
      },
      {
        heading: "Light does the resetting",
        body: "Ten minutes of daylight within an hour of waking anchors your body clock harder than any evening routine. Take it outside with the pram if that's what's possible.",
      },
    ],
  },
  {
    slug: "milk-supply",
    area: "feeding",
    title: "Milk supply, and what actually affects it",
    blurb: "Separating the real levers from the noise.",
    minutes: 5,
    sections: [
      {
        heading: "Removal drives production",
        body: "Supply responds to how often and how well milk is removed, far more than to anything you eat or drink. Frequent, effective feeding is the lever. Most other advice is downstream of this one.",
      },
      {
        heading: "Signs it's going well",
        body: "Six or more heavy nappies a day, steady weight gain, and swallowing you can hear. Softer breasts and shorter feeds after the early weeks usually mean efficiency, not decline.",
      },
      {
        heading: "What genuinely helps",
        body: "Enough food and fluid for you, rest where you can find it, and a good latch. If feeding hurts, that's a latch question and worth a lactation consultant rather than endurance.",
      },
    ],
    seekHelp: [
      "Feeding that is painful rather than just unfamiliar",
      "Fewer than six wet nappies a day",
      "A hard, red, painful area on the breast with flu-like symptoms",
    ],
  },
  {
    slug: "returning-to-work",
    area: "relationships",
    title: "Going back to work",
    blurb: "The practical and the emotional, both of which are real.",
    minutes: 5,
    sections: [
      {
        heading: "Start before you start",
        body: "A trial run of the whole morning — childcare drop-off included — a week or two ahead turns an unknown into a logistics problem you've already solved once.",
      },
      {
        heading: "If you're expressing",
        body: "You're entitled to somewhere private and somewhere cold to store milk. Put the pumping slots in your calendar as meetings before your diary fills around them.",
      },
      {
        heading: "The feelings are not a verdict",
        body: "Relief and grief usually arrive together, often in the same hour. Neither one is evidence about whether you've made the right choice.",
      },
    ],
  },
];

export function topicsForArea(area: CareArea): CareTopic[] {
  return CARE_TOPICS.filter((t) => t.area === area);
}

export function topicBySlug(slug: string): CareTopic | undefined {
  return CARE_TOPICS.find((t) => t.slug === slug);
}

/* ------------------------------------------------------------------ */
/* The bridge between modes                                            */
/* ------------------------------------------------------------------ */

export type Bridge = {
  /** What the child just did, or is about to. */
  childMoment: string;
  /** What that makes possible for the parent. */
  parentOffer: string;
  detail: string;
  minutes: number;
};

/**
 * The product's whole thesis in one object: the child's routine is the
 * scaffolding for the parent's care. Surfaced in BOTH modes, so neither half
 * feels like a separate app.
 */
export function bridgesFor(profile: ParentProfile): Bridge[] {
  const bridges: Bridge[] = [
    {
      childMoment: "Tummy time",
      parentOffer: "Open your chest while you're down there",
      detail:
        "You're already on the floor at their level. Two minutes of thoracic opening undoes some of the feeding hunch.",
      minutes: 2,
    },
    {
      childMoment: "Nap started",
      parentOffer: "Eat something that isn't standing up",
      detail: "The dal is in the fridge. Sit for it — digestion works better than you'd think.",
      minutes: 10,
    },
    {
      childMoment: "Feed finished",
      parentOffer: "Refill your glass before you put them down",
      detail: "This is the single easiest habit to attach to something you already do every day.",
      minutes: 1,
    },
  ];
  if (profile.delivery === "caesarean" && profile.weeksPostpartum >= 12) {
    bridges.push({
      childMoment: "Bedtime done",
      parentOffer: "Two minutes of scar massage",
      detail: "You're past twelve weeks. Small circles, firm but never sore.",
      minutes: 2,
    });
  }
  return bridges;
}
