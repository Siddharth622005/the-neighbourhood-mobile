import { useCallback, useEffect, useRef, useState } from "react";
import * as activityLog from "./db/activityLog";
import * as plans from "./db/plans";
import type { Activity, DailyPlan, Domain } from "./db/types";
import * as cache from "./todayCache";

/**
 * Owns today's plan: fetch, cache, optimistic writes, background sync.
 *
 * Home stays a rendering concern. Everything about where the data comes
 * from, what's confirmed versus pending, and what to do when the network
 * is unavailable lives here.
 *
 * The rule that shapes it: completing an activity updates the screen
 * immediately and syncs afterwards. A parent who just finished something
 * with their child gets acknowledgement now, not when the request lands.
 */

/** The family-local date, matched to what plan_date_for() computes. */
function localDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export type TodaysPlanState = {
  plan: DailyPlan | null;
  /** Domains to render as done — confirmed and pending together. */
  completed: Domain[];
  /** Domains started but not finished. */
  inProgress: Domain[];
  loading: boolean;
  /** Set only when we have nothing to show; never when the cache carried us. */
  error: string | null;
  /** True while a background sync is in flight. */
  syncing: boolean;
  start: (activity: Activity) => Promise<void>;
  complete: (activity: Activity) => Promise<void>;
  swap: (domain: Domain) => Promise<void>;
};

export function useTodaysPlan(childId: string | null): TodaysPlanState {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [completed, setCompleted] = useState<Domain[]>([]);
  const [inProgress, setInProgress] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const planDate = useRef(localDateKey()).current;
  /** Guards against a slow response landing after the component unmounts. */
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  /** Pushes any completions we recorded locally but never managed to send. */
  const flushPending = useCallback(
    async (id: string) => {
      const c = await cache.readCache(id, planDate);
      if (!c?.pendingCompletions.length) return;
      for (const pending of c.pendingCompletions) {
        try {
          await activityLog.completeActivity(id, pending.activityId);
          await cache.clearPendingCompletion(id, planDate, pending.domain);
        } catch {
          // Still offline. It stays queued and is retried next open.
        }
      }
    },
    [planDate]
  );

  const load = useCallback(async () => {
    if (!childId) return;

    // 1. Cache first, so something real is on screen immediately.
    const cached = await cache.readCache(childId, planDate);
    if (cached?.plan && alive.current) {
      setPlan(cached.plan);
      setCompleted(cache.effectiveCompleted(cached));
      setLoading(false);
    }

    // 2. Then the server, which is the source of truth.
    setSyncing(true);
    try {
      await flushPending(childId);

      const fresh = await plans.getTodaysPlan(childId);
      const entries = await activityLog.getEntriesForDate(childId, fresh.planDate);
      const done = entries.filter((e) => e.completed_at).map((e) => e.domain);
      const started = entries
        .filter((e) => e.started_at && !e.completed_at)
        .map((e) => e.domain);

      const next = await cache.reconcile(childId, fresh.planDate, fresh, done);

      if (alive.current) {
        setPlan(fresh);
        setCompleted(cache.effectiveCompleted(next));
        setInProgress(started);
        setError(null);
      }
    } catch (err) {
      // Only an error if we have nothing to show. If the cache carried us,
      // the parent doesn't need to hear about it.
      if (alive.current && !cached?.plan) {
        setError(
          err instanceof Error ? err.message : "We couldn't load today's plan."
        );
      }
    } finally {
      if (alive.current) {
        setLoading(false);
        setSyncing(false);
      }
    }
  }, [childId, planDate, flushPending]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Optimistic: mark started locally, then tell the server. */
  const start = useCallback(
    async (activity: Activity) => {
      if (!childId) return;
      setInProgress((prev) =>
        prev.includes(activity.domain) ? prev : [...prev, activity.domain]
      );
      await cache.queueStart(childId, planDate, activity.domain, activity.id);
      try {
        await activityLog.startActivity(childId, activity.id);
      } catch {
        // Non-critical: a missed start only costs us the abandonment
        // signal, so it isn't worth interrupting the parent over.
      }
    },
    [childId, planDate]
  );

  /**
   * Optimistic completion. The screen updates first; the write follows.
   * If it fails, the completion stays queued and is retried on next open
   * rather than being lost or shown as an error.
   */
  const complete = useCallback(
    async (activity: Activity) => {
      if (!childId) return;

      setCompleted((prev) =>
        prev.includes(activity.domain) ? prev : [...prev, activity.domain]
      );
      setInProgress((prev) => prev.filter((d) => d !== activity.domain));

      await cache.queueCompletion(childId, planDate, activity.domain, activity.id);

      try {
        await activityLog.completeActivity(childId, activity.id);
        await cache.clearPendingCompletion(childId, planDate, activity.domain);
      } catch {
        // Stays pending; flushPending picks it up.
      }
    },
    [childId, planDate]
  );

  /**
   * Swaps need the server's answer — it decides which activity comes next
   * — so this one does wait. It's a deliberate choice by the parent, not
   * an acknowledgement they're owed instantly.
   */
  const swap = useCallback(
    async (domain: Domain) => {
      if (!childId) return;
      setSyncing(true);
      try {
        const updated = await plans.swapDomain(childId, domain);
        if (alive.current) setPlan(updated);
        await cache.reconcile(childId, planDate, updated, completed);
      } catch {
        // Keep the current activity on screen rather than showing an error
        // — nothing is broken, the swap simply didn't happen.
      } finally {
        if (alive.current) setSyncing(false);
      }
    },
    [childId, planDate, completed]
  );

  return { plan, completed, inProgress, loading, error, syncing, start, complete, swap };
}
