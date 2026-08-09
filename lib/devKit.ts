import type { AgeBand } from "./db/types";

/**
 * The development kit, and how it's allowed to appear inside an activity.
 *
 * This is the commercial surface of the product, so the rules matter more
 * than the catalogue:
 *
 *   1. An activity NEVER requires a kit item. Every activity states a
 *      household alternative first, and that alternative is the primary
 *      text. A parent who owns nothing must be able to do all four
 *      activities today.
 *   2. No price, no "buy", no urgency, no badge. The kit is mentioned the
 *      way a friend mentions they have a spare — once, quietly, and only
 *      when it's actually relevant to what you're already doing.
 *   3. Relevance is checked twice: the item must match the activity's
 *      materials AND the child's current age band. A kit item shown for
 *      the wrong stage is an advert; shown for the right one it's help.
 *
 * If a parent never taps through, the feature has still done its job — the
 * activity worked. That's the test for whether this stays non-salesy.
 *
 * LOCAL for now: there is no products/kit table yet (kit.tsx is still a
 * scaffold). Shaped so it can move to Supabase without touching callers.
 */
export type KitItem = {
  slug: string;
  name: string;
  /** Age bands this item is genuinely useful for. */
  bands: AgeBand[];
  /** Lowercase fragments matched against an activity's `materials`. */
  matches: string[];
  /**
   * What a parent almost certainly already owns. Shown FIRST and always —
   * this is the line that keeps the feature honest.
   */
  household: string;
  /** One plain sentence on what the made version adds. Never superlative. */
  whyOurs: string;
};

const KIT: KitItem[] = [
  {
    slug: "contrast-cards",
    name: "High-contrast cards",
    bands: ["m0_3", "m4_6"],
    matches: ["high-contrast", "contrast card", "black and white"],
    household:
      "Any bold black-and-white pattern works — a book cover, or shapes drawn on paper.",
    whyOurs: "Ours are wipe-clean and sized to prop up during tummy time.",
  },
  {
    slug: "textured-squares",
    name: "Textured fabric squares",
    bands: ["m4_6", "m7_12"],
    matches: ["texture", "textured", "muslin", "fabric"],
    household:
      "A muslin, a corduroy cushion cover and a silky scarf give three different textures.",
    whyOurs: "Six textures, all mouth-safe and machine washable.",
  },
  {
    slug: "wooden-rattle",
    name: "Wooden rattle",
    bands: ["m0_3", "m4_6", "m7_12"],
    matches: ["rattle", "shaker"],
    household: "A small container with dry rice inside, taped shut firmly.",
    whyOurs: "Light enough for a four-month-old to hold without dropping on their face.",
  },
  {
    slug: "stacking-cups",
    name: "Stacking cups",
    bands: ["m7_12", "m13_24"],
    matches: ["cups", "stacking", "nesting"],
    household: "Measuring cups or plastic food tubs nest just as well.",
    whyOurs: "Graduated sizes with a lip that small hands can actually grip.",
  },
  {
    slug: "board-book",
    name: "First board book",
    bands: ["m4_6", "m7_12", "m13_24"],
    matches: ["book"],
    household: "Any book you already own — at this age your voice matters more than the pages.",
    whyOurs: "Thick pages that survive being chewed, with one image per spread.",
  },
  {
    slug: "mirror",
    name: "Baby-safe mirror",
    bands: ["m4_6", "m7_12"],
    matches: ["mirror"],
    household: "A wardrobe or bathroom mirror is perfect — just sit together in front of it.",
    whyOurs: "Shatterproof and stands on its own during tummy time.",
  },
  {
    slug: "scarves",
    name: "Play scarves",
    bands: ["m7_12", "m13_24", "m25_36"],
    matches: ["scarf", "scarves"],
    household: "A tea towel or muslin does exactly the same job.",
    whyOurs: "Light enough to float slowly when thrown, which is the bit they love.",
  },
];

/**
 * Kit items relevant to this activity, at this age. Usually returns one or
 * none — that restraint is deliberate. A list of things to buy attached to
 * a free activity is the exact thing this feature must not become.
 */
export function kitItemsFor(materials: string, band: AgeBand): KitItem[] {
  const haystack = materials.toLowerCase();

  // Score by how specific the matched word is. Without this, a generic
  // pattern on an earlier item wins over the exact noun on a later one —
  // which is how "a rattle or soft toy" ended up suggesting fabric squares.
  const scored = KIT.filter((item) => item.bands.includes(band))
    .map((item) => {
      const best = item.matches
        .filter((m) => haystack.includes(m))
        .sort((a, b) => b.length - a.length)[0];
      return best ? { item, score: best.length } : null;
    })
    .filter((x): x is { item: KitItem; score: number } => x !== null)
    .sort((a, b) => b.score - a.score);

  return scored.length ? [scored[0].item] : [];
}

/** Everything appropriate for a stage — for the kit screen itself. */
export function kitForBand(band: AgeBand): KitItem[] {
  return KIT.filter((item) => item.bands.includes(band));
}
