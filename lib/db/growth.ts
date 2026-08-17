import { supabase, unwrap } from "./client";
import type {
  ChildMilestone,
  ChildVaccination,
  Milestone,
  VaccinationScheduleItem,
} from "./types";

/**
 * Milestones and vaccinations — the reference-and-record half of Growth.
 *
 * Milestones are ordered by typical_age_min_months, NOT age_band. The band
 * is a lossy 7-way bucket over a 15-stage dataset (several stages collapse
 * into one band), so it's fine for filtering and wrong for display order.
 */

// --- Milestones -------------------------------------------------------

/** The library around a child's current age, oldest-typical first. */
export async function getMilestonesForAge(
  ageMonths: number,
  windowMonths = 12
): Promise<Milestone[]> {
  return unwrap<Milestone[]>(
    "growth.getMilestonesForAge",
    await supabase
      .from("milestones")
      .select("*")
      .lte("typical_age_min_months", ageMonths + windowMonths)
      .gte("typical_age_max_months", Math.max(0, ageMonths - windowMonths))
      .order("typical_age_min_months", { ascending: true })
      .order("domain", { ascending: true })
  );
}

export async function getAllMilestones(): Promise<Milestone[]> {
  return unwrap<Milestone[]>(
    "growth.getAllMilestones",
    await supabase
      .from("milestones")
      .select("*")
      .order("typical_age_min_months", { ascending: true })
      .order("domain", { ascending: true })
  );
}

export async function getMilestonesForCurrentAge(ageMonths: number): Promise<Milestone[]> {
  return unwrap<Milestone[]>(
    "growth.getMilestonesForCurrentAge",
    await supabase
      .from("milestones")
      .select("*")
      .lte("typical_age_min_months", ageMonths)
      .gte("typical_age_max_months", ageMonths)
      .order("typical_age_min_months", { ascending: true })
      .order("domain", { ascending: true })
  );
}

export async function getAchievedMilestones(childId: string): Promise<ChildMilestone[]> {
  return unwrap<ChildMilestone[]>(
    "growth.getAchievedMilestones",
    await supabase
      .from("child_milestones")
      .select("*")
      .eq("child_id", childId)
      .order("achieved_at", { ascending: false })
  );
}

/**
 * Marks a milestone reached. Upserts on (child_id, milestone_id) so
 * re-marking corrects the date instead of failing on the unique
 * constraint — a parent tapping twice shouldn't see an error.
 */
export async function markMilestoneAchieved(input: {
  childId: string;
  milestoneId: string;
  achievedAt?: string; // YYYY-MM-DD, defaults to today
  note?: string | null;
}): Promise<ChildMilestone> {
  return unwrap<ChildMilestone>(
    "growth.markMilestoneAchieved",
    await supabase
      .from("child_milestones")
      .upsert(
        {
          child_id: input.childId,
          milestone_id: input.milestoneId,
          ...(input.achievedAt ? { achieved_at: input.achievedAt } : {}),
          note: input.note ?? null,
        },
        { onConflict: "child_id,milestone_id" }
      )
      .select()
      .single()
  );
}

export async function unmarkMilestone(childId: string, milestoneId: string): Promise<void> {
  const { error } = await supabase
    .from("child_milestones")
    .delete()
    .eq("child_id", childId)
    .eq("milestone_id", milestoneId);
  if (error) throw error;
}

// --- Vaccinations -----------------------------------------------------

/**
 * The full schedule, earliest first.
 *
 * Ordered by age_days, not recommended_age_months: the infant series
 * lands at 6/10/14 WEEKS, which collapses to a meaningless 1/2/3 in whole
 * months and sorts wrongly against "9–12 months".
 *
 * Seeded from the National Immunization Schedule (UIP) and the IAP-ACVIP
 * 2023 schedule. Each row carries a `tier` and a `source`.
 */
export async function getVaccinationSchedule(): Promise<VaccinationScheduleItem[]> {
  return unwrap<VaccinationScheduleItem[]>(
    "growth.getVaccinationSchedule",
    await supabase
      .from("vaccination_schedule")
      .select("*")
      .order("age_days", { ascending: true })
      .order("vaccine_name", { ascending: true })
  );
}

/** Only rows with status "given" — what reminders and progress counts
 *  should treat as actually done. */
export async function getAdministeredVaccinations(
  childId: string
): Promise<ChildVaccination[]> {
  return unwrap<ChildVaccination[]>(
    "growth.getAdministeredVaccinations",
    await supabase
      .from("child_vaccinations")
      .select("*")
      .eq("child_id", childId)
      .eq("status", "given")
      .order("administered_on", { ascending: false })
  );
}

/** Every record for this child, given and unsure alike — what the
 *  Vaccinations screen itself needs to render notes and the unsure state. */
export async function getVaccinationRecords(childId: string): Promise<ChildVaccination[]> {
  return unwrap<ChildVaccination[]>(
    "growth.getVaccinationRecords",
    await supabase.from("child_vaccinations").select("*").eq("child_id", childId)
  );
}

/** Undoes a recording — a mistaken tap must be correctable. */
export async function removeVaccination(
  childId: string,
  vaccinationId: string
): Promise<void> {
  const { error } = await supabase
    .from("child_vaccinations")
    .delete()
    .eq("child_id", childId)
    .eq("vaccination_id", vaccinationId);
  if (error) throw error;
}

export async function recordVaccination(input: {
  childId: string;
  vaccinationId: string;
  administeredOn: string; // YYYY-MM-DD
  notes?: string | null;
}): Promise<ChildVaccination> {
  return unwrap<ChildVaccination>(
    "growth.recordVaccination",
    await supabase
      .from("child_vaccinations")
      .upsert(
        {
          child_id: input.childId,
          vaccination_id: input.vaccinationId,
          status: "given",
          administered_on: input.administeredOn,
          notes: input.notes ?? null,
        },
        { onConflict: "child_id,vaccination_id" }
      )
      .select()
      .single()
  );
}

/**
 * Flags a dose as unsure whether it happened, with an optional note.
 * Upserts the same row recordVaccination would use, so moving between
 * unsure and given on the same dose just overwrites it rather than
 * leaving two conflicting records.
 */
export async function markVaccinationUnsure(input: {
  childId: string;
  vaccinationId: string;
  note?: string | null;
}): Promise<ChildVaccination> {
  return unwrap<ChildVaccination>(
    "growth.markVaccinationUnsure",
    await supabase
      .from("child_vaccinations")
      .upsert(
        {
          child_id: input.childId,
          vaccination_id: input.vaccinationId,
          status: "unsure",
          administered_on: null,
          notes: input.note ?? null,
        },
        { onConflict: "child_id,vaccination_id" }
      )
      .select()
      .single()
  );
}
