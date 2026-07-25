/** Age math shared across onboarding and the dashboard. */

export type ChildAge = {
  totalMonths: number;
  years: number;
  months: number;
  /** "2 years, 3 months" / "7 months" / "3 weeks" — human, never a date. */
  label: string;
};

export function computeAge(dateOfBirth: string, now: Date = new Date()): ChildAge | null {
  const dob = new Date(dateOfBirth + "T00:00:00");
  if (isNaN(dob.getTime())) return null;

  let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  if (now.getDate() < dob.getDate()) months -= 1;
  if (months < 0) months = 0;

  const years = Math.floor(months / 12);
  const rem = months % 12;

  let label: string;
  if (months === 0) {
    const days = Math.max(0, Math.round((now.getTime() - dob.getTime()) / 86400000));
    const weeks = Math.floor(days / 7);
    label = weeks >= 1 ? plural(weeks, "week") : plural(days, "day");
  } else if (years === 0) {
    label = plural(months, "month");
  } else if (rem === 0) {
    label = plural(years, "year");
  } else {
    label = `${plural(years, "year")}, ${plural(rem, "month")}`;
  }

  return { totalMonths: months, years, months: rem, label };
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

/** A warm, non-clinical stage name for the dashboard greeting — never a percentile, just a word. */
export function stageLabel(totalMonths: number): string {
  if (totalMonths <= 3) return "the newborn days";
  if (totalMonths <= 11) return "the infant stage";
  if (totalMonths <= 23) return "the toddler stage";
  if (totalMonths <= 35) return "early exploring";
  if (totalMonths <= 59) return "the preschool years";
  return "the school-age years";
}
