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
 * NOTE: vaccination_schedule is seeded EMPTY. No sourced dataset exists in
 * the codebase, and an immunisation schedule isn't something to
 * reconstruct from memory. These functions are correct and will simply
 * return nothing until a real IAP schedule is loaded.
 */
export async function getVaccinationSchedule(): Promise<VaccinationScheduleItem[]> {
  return unwrap<VaccinationScheduleItem[]>(
    "growth.getVaccinationSchedule",
    await supabase
      .from("vaccination_schedule")
      .select("*")
      .order("recommended_age_months", { ascending: true })
  );
}

export async function getAdministeredVaccinations(
  childId: string
): Promise<ChildVaccination[]> {
  return unwrap<ChildVaccination[]>(
    "growth.getAdministeredVaccinations",
    await supabase
      .from("child_vaccinations")
      .select("*")
      .eq("child_id", childId)
      .order("administered_on", { ascending: false })
  );
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
          administered_on: input.administeredOn,
          notes: input.notes ?? null,
        },
        { onConflict: "child_id,vaccination_id" }
      )
      .select()
      .single()
  );
}
