/**
 * The child's allergens: parsing what a parent typed, and matching it
 * against meal ingredients.
 *
 * Separate from the parent's own allergies (Profile.allergies, filtered in
 * lib/parentCare.ts) because they're a genuinely different fact — a
 * dairy-free mother does not imply a dairy-free toddler. The matching rule
 * is deliberately the same, though: substring, case-insensitive, so
 * "egg" catches "scrambled egg" and "1 egg, beaten".
 *
 * The bias here is toward OVER-matching. A meal wrongly hidden costs a
 * parent one idea; a meal wrongly shown puts an allergen in front of a
 * child. Those are not symmetrical, so nothing here tries to be clever
 * about word boundaries or plurals.
 */

export function parseAllergies(text: string): string[] {
  const seen = new Set<string>();
  return text
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter((a) => {
      if (!a || seen.has(a)) return false;
      seen.add(a);
      return true;
    });
}

export function formatAllergies(allergies: string[] | null | undefined): string {
  return (allergies ?? []).join(", ");
}

/**
 * The first allergen this ingredient list matches, or null. Returns the
 * allergen itself rather than a boolean so the UI can say WHICH one —
 * "contains egg" is actionable in a way "hidden" isn't.
 */
export function matchedAllergen(
  ingredients: string[],
  allergies: string[] | null | undefined
): string | null {
  const list = (allergies ?? []).map((a) => a.toLowerCase().trim()).filter(Boolean);
  if (list.length === 0) return null;
  for (const allergen of list) {
    if (ingredients.some((i) => i.toLowerCase().includes(allergen))) return allergen;
  }
  return null;
}
