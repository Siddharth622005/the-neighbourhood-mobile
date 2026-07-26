import { supabase, unwrap } from "./client";
import type { ActivityLogEntry, Domain } from "./types";

/**
 * What the child actually did.
 *
 * This table is the learning loop's memory: it feeds domain recency,
 * the Growth timeline, and eventually reports. Rows are content
 * SNAPSHOTS — domain/title/age_band are copied in at write time, so
 * editing or retiring a library activity never rewrites history.
 */

/**
 * Records a completion. Goes through the RPC rather than a direct insert
 * so the snapshot is taken server-side from the activity library and
 * can't drift from what was actually recommended.
 */
export async function completeActivity(
  childId: string,
  activityId: string,
  note?: string
): Promise<ActivityLogEntry> {
  return unwrap<ActivityLogEntry>(
    "activityLog.completeActivity",
    await supabase.rpc("complete_activity", {
      p_child_id: childId,
      p_activity_id: activityId,
      p_note: note ?? null,
    })
  );
}

/** Everything completed on a given family-local date. */
export async function getCompletionsForDate(
  childId: string,
  planDate: string
): Promise<ActivityLogEntry[]> {
  return unwrap<ActivityLogEntry[]>(
    "activityLog.getCompletionsForDate",
    await supabase
      .from("activity_log")
      .select("*")
      .eq("child_id", childId)
      .eq("plan_date", planDate)
      .order("completed_at", { ascending: true })
  );
}

/** Which domains are already done today — what Home's progress reads. */
export async function getCompletedDomainsForDate(
  childId: string,
  planDate: string
): Promise<Domain[]> {
  const rows = await getCompletionsForDate(childId, planDate);
  return [...new Set(rows.map((r) => r.domain))];
}

/** Recent history, newest first — the Growth timeline's source. */
export async function getRecentLog(childId: string, limit = 50): Promise<ActivityLogEntry[]> {
  return unwrap<ActivityLogEntry[]>(
    "activityLog.getRecentLog",
    await supabase
      .from("activity_log")
      .select("*")
      .eq("child_id", childId)
      .order("completed_at", { ascending: false })
      .limit(limit)
  );
}

/** Attaches or replaces the parent's note on a completion. */
export async function setNote(entryId: string, note: string | null): Promise<ActivityLogEntry> {
  return unwrap<ActivityLogEntry>(
    "activityLog.setNote",
    await supabase.from("activity_log").update({ note }).eq("id", entryId).select().single()
  );
}
