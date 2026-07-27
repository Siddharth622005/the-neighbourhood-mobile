import { supabase, unwrap } from "./client";
import type { ActivityLogEntry, Domain } from "./types";

/**
 * What the child actually did.
 *
 * This table is the learning loop's memory: it feeds domain recency,
 * the Growth timeline, and eventually reports. Rows are content
 * SNAPSHOTS — domain/title/age_band are copied in at write time, so
 * editing or retiring a library activity never rewrites history.
 *
 * A row is created on START and updated on COMPLETE, so a row existing
 * does NOT mean the activity was done. Everything here that reports
 * progress filters on `completed_at`, never on row presence.
 */

/**
 * Records that an activity was started. Idempotent — tapping Start twice
 * keeps the original timestamp.
 */
export async function startActivity(
  childId: string,
  activityId: string
): Promise<ActivityLogEntry> {
  return unwrap<ActivityLogEntry>(
    "activityLog.startActivity",
    await supabase.rpc("start_activity", {
      p_child_id: childId,
      p_activity_id: activityId,
    })
  );
}

/**
 * Records a completion, updating the row Start created. Goes through the
 * RPC so the content snapshot is taken server-side and can't drift from
 * what was actually recommended.
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

/** Completed entries for a family-local date. Excludes merely-started rows. */
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
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: true })
  );
}

/**
 * Which domains are DONE today — the source for Home's "N of 4".
 * Starting an activity must never advance that count.
 */
export async function getCompletedDomainsForDate(
  childId: string,
  planDate: string
): Promise<Domain[]> {
  const rows = await getCompletionsForDate(childId, planDate);
  return [...new Set(rows.map((r) => r.domain))];
}

/** Every row for a date, done or not — for restoring in-progress state. */
export async function getEntriesForDate(
  childId: string,
  planDate: string
): Promise<ActivityLogEntry[]> {
  return unwrap<ActivityLogEntry[]>(
    "activityLog.getEntriesForDate",
    await supabase
      .from("activity_log")
      .select("*")
      .eq("child_id", childId)
      .eq("plan_date", planDate)
  );
}

/** Started and not finished, oldest first — the abandonment signal. */
export async function getAbandoned(
  childId: string,
  limit = 50
): Promise<ActivityLogEntry[]> {
  return unwrap<ActivityLogEntry[]>(
    "activityLog.getAbandoned",
    await supabase
      .from("activity_log")
      .select("*")
      .eq("child_id", childId)
      .not("started_at", "is", null)
      .is("completed_at", null)
      .order("started_at", { ascending: false })
      .limit(limit)
  );
}

/** Recent completed history, newest first — the Growth timeline's source. */
export async function getRecentLog(childId: string, limit = 50): Promise<ActivityLogEntry[]> {
  return unwrap<ActivityLogEntry[]>(
    "activityLog.getRecentLog",
    await supabase
      .from("activity_log")
      .select("*")
      .eq("child_id", childId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(limit)
  );
}

/** Attaches or replaces the parent's note on an entry. */
export async function setNote(entryId: string, note: string | null): Promise<ActivityLogEntry> {
  return unwrap<ActivityLogEntry>(
    "activityLog.setNote",
    await supabase.from("activity_log").update({ note }).eq("id", entryId).select().single()
  );
}
