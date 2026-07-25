import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Domain } from "./todaysPlan";

/**
 * Local state for today's four-activity plan: what's done, what's mid-way,
 * and which domains the parent has swapped.
 *
 * Replaces the old single in-progress record, which was keyed by activity
 * title and so could only ever describe one activity at a time.
 *
 * Keyed by DOMAIN, not activity id, because there is exactly one activity
 * per domain per day. That means swapping to the alternate doesn't lose a
 * completion, and completion survives the daily rotation of the pool.
 * Activities still carry a stable `id` for the eventual server-side log,
 * where the specific activity does matter.
 *
 * Still AsyncStorage-only — no backend table exists yet. It resets the
 * moment the calendar day changes, so nothing here needs migrating; when
 * the schema lands this becomes a cache in front of it.
 */
const KEY = "tn.today.v1";

export type TodayState = {
  dateKey: string;
  completed: Domain[];
  /** At most one activity is mid-way at a time. */
  inProgress: { domain: Domain; startedAt: string } | null;
  /** Swap count per domain; rotates that domain's pool. */
  swaps: Partial<Record<Domain, number>>;
};

function todayKey(d: Date = new Date()): string {
  // Local date, not toISOString() — a parent in IST finishing something at
  // 11pm should not have it counted against the next day.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function empty(): TodayState {
  return { dateKey: todayKey(), completed: [], inProgress: null, swaps: {} };
}

export async function getTodayState(): Promise<TodayState> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return empty();
  try {
    const state: TodayState = JSON.parse(raw);
    if (state.dateKey !== todayKey()) return empty();
    return { ...empty(), ...state };
  } catch {
    return empty();
  }
}

async function write(state: TodayState): Promise<TodayState> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
  return state;
}

/** Each mutation returns the next state so callers don't re-read to re-render. */
export async function startActivity(domain: Domain): Promise<TodayState> {
  const state = await getTodayState();
  return write({ ...state, inProgress: { domain, startedAt: new Date().toISOString() } });
}

export async function completeActivity(domain: Domain): Promise<TodayState> {
  const state = await getTodayState();
  return write({
    ...state,
    completed: state.completed.includes(domain) ? state.completed : [...state.completed, domain],
    inProgress: state.inProgress?.domain === domain ? null : state.inProgress,
  });
}

/** Rotates this domain to the next activity in its pool. */
export async function swapDomain(domain: Domain): Promise<TodayState> {
  const state = await getTodayState();
  return write({
    ...state,
    swaps: { ...state.swaps, [domain]: (state.swaps[domain] ?? 0) + 1 },
    // A swap replaces what was started, so the old in-progress no longer applies.
    inProgress: state.inProgress?.domain === domain ? null : state.inProgress,
  });
}
