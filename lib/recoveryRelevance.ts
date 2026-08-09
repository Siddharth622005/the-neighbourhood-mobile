/**
 * Whether a postpartum framing still fits this child's age.
 *
 * Postpartum recovery content is relevant for roughly the first year. Asking
 * the parent of a three-year-old how they gave birth is at best noise and at
 * worst intrusive — and the answer would drive a "recovery stage" computed
 * from a birth three years ago, which is meaningless.
 *
 * The window is deliberately generous. Recovery does not end at six weeks,
 * whatever the discharge leaflet says, and feeding questions stay live well
 * past a year for some families. Twelve months is the point where a blanket
 * postpartum framing stops fitting most people.
 */
export const RECOVERY_RELEVANT_MONTHS = 12;

/** True while a postpartum framing still fits this child's age. */
export function isRecoveryRelevant(childAgeMonths: number): boolean {
  return childAgeMonths <= RECOVERY_RELEVANT_MONTHS;
}
