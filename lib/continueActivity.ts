import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Tracks whether today's activity was started but not marked done — real
 * local state, not a fabricated demo. No backend table for this exists yet
 * (out of Foundation-phase scope), so it lives in AsyncStorage and clears
 * itself the moment the calendar day changes.
 */
const KEY = "tn.activity.inprogress.v1";

type InProgress = {
  title: string;
  startedAt: string;
  dateKey: string;
};

function todayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export async function markActivityStarted(title: string): Promise<void> {
  const record: InProgress = { title, startedAt: new Date().toISOString(), dateKey: todayKey() };
  await AsyncStorage.setItem(KEY, JSON.stringify(record));
}

export async function markActivityDone(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

export async function getInProgressActivity(): Promise<InProgress | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const record: InProgress = JSON.parse(raw);
    if (record.dateKey !== todayKey()) {
      await AsyncStorage.removeItem(KEY);
      return null;
    }
    return record;
  } catch {
    return null;
  }
}
