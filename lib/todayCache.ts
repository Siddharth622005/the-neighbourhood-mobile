import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DailyPlan, Domain } from "./db/types";

/**
 * A CACHE, not the source of truth.
 *
 * Replaces lib/todayState.ts, which owned today's state outright. The
 * database owns it now; this exists for two reasons only:
 *
 *   1. Home renders instantly on open, before the network answers.
 *   2. Tapping "done" in a weak-signal moment updates the screen at once
 *      and syncs behind the scenes. A parent should never watch a spinner
 *      because they finished an activity with their child.
 *
 * Conflict rule: the SERVER WINS. Anything here is provisional and is
 * overwritten by the next successful fetch. `pendingCompletions` is the
 * one thing that survives that — it's writes we haven't managed to send
 * yet, so it's cleared only once the server has acknowledged them.
 */
/**
 * One slot per child, not a single shared slot — Home's multi-child pager
 * mounts every child's useTodaysPlan at once (see TodayActivitiesPager in
 * app/(tabs)/home.tsx), not lazily on swipe, so a single global key meant
 * two children's concurrent reads/writes raced over the same slot: one
 * child's cache write could clobber another's queued-but-unsynced
 * completion, or a child's cold-start paint could momentarily race against
 * a write mid-flight for a different child.
 */
const KEY = (childId: string) => `tn.today.cache.v1.${childId}`;

export type TodayCache = {
  /** Family-local date this cache describes. */
  planDate: string;
  childId: string;
  plan: DailyPlan | null;
  /** Domains the server has confirmed complete. */
  completed: Domain[];
  /** Completions written locally but not yet acknowledged by the server. */
  pendingCompletions: { domain: Domain; activityId: string; at: string }[];
  /** Domains started locally but not yet acknowledged. */
  pendingStarts: { domain: Domain; activityId: string }[];
};

function empty(childId: string, planDate: string): TodayCache {
  return {
    planDate,
    childId,
    plan: null,
    completed: [],
    pendingCompletions: [],
    pendingStarts: [],
  };
}

/**
 * Reads the cache, but only if it's for the same child AND the same day.
 * A stale day must never render as today's plan — that's exactly the
 * "reopening shows the wrong thing" failure the persisted plan exists to
 * prevent.
 */
export async function readCache(
  childId: string,
  planDate: string
): Promise<TodayCache | null> {
  const raw = await AsyncStorage.getItem(KEY(childId));
  if (!raw) return null;
  try {
    const cache: TodayCache = JSON.parse(raw);
    if (cache.childId !== childId || cache.planDate !== planDate) return null;
    return cache;
  } catch {
    return null;
  }
}

export async function writeCache(cache: TodayCache): Promise<void> {
  await AsyncStorage.setItem(KEY(cache.childId), JSON.stringify(cache));
}

/** Replaces cached server state, preserving anything not yet synced. */
export async function reconcile(
  childId: string,
  planDate: string,
  plan: DailyPlan,
  completed: Domain[]
): Promise<TodayCache> {
  const existing = await readCache(childId, planDate);
  const next: TodayCache = {
    ...empty(childId, planDate),
    plan,
    completed,
    // Drop anything the server now confirms — it's no longer pending.
    pendingCompletions: (existing?.pendingCompletions ?? []).filter(
      (p) => !completed.includes(p.domain)
    ),
    pendingStarts: existing?.pendingStarts ?? [],
  };
  await writeCache(next);
  return next;
}

/** Records a completion locally, before the network has been asked. */
export async function queueCompletion(
  childId: string,
  planDate: string,
  domain: Domain,
  activityId: string
): Promise<TodayCache> {
  const cache = (await readCache(childId, planDate)) ?? empty(childId, planDate);
  if (
    !cache.completed.includes(domain) &&
    !cache.pendingCompletions.some((p) => p.domain === domain)
  ) {
    cache.pendingCompletions.push({
      domain,
      activityId,
      at: new Date().toISOString(),
    });
  }
  await writeCache(cache);
  return cache;
}

export async function queueStart(
  childId: string,
  planDate: string,
  domain: Domain,
  activityId: string
): Promise<TodayCache> {
  const cache = (await readCache(childId, planDate)) ?? empty(childId, planDate);
  if (!cache.pendingStarts.some((p) => p.domain === domain)) {
    cache.pendingStarts.push({ domain, activityId });
  }
  await writeCache(cache);
  return cache;
}

export async function clearPendingCompletion(
  childId: string,
  planDate: string,
  domain: Domain
): Promise<void> {
  const cache = await readCache(childId, planDate);
  if (!cache) return;
  cache.pendingCompletions = cache.pendingCompletions.filter((p) => p.domain !== domain);
  if (!cache.completed.includes(domain)) cache.completed.push(domain);
  await writeCache(cache);
}

/** Everything the UI should treat as done: confirmed plus not-yet-synced. */
export function effectiveCompleted(cache: TodayCache | null): Domain[] {
  if (!cache) return [];
  return [...new Set([...cache.completed, ...cache.pendingCompletions.map((p) => p.domain)])];
}
