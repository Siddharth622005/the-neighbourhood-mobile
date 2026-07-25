import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Child } from "./AuthProvider";

/**
 * The family, stored on this device.
 *
 * With auth off (see authMode.ts) this is the ONLY store — there is no
 * session, so RLS blocks every write to parents/children. With auth back
 * on it becomes a cache that the server fetch overwrites, which is why
 * AuthProvider always prefers server data when a session exists.
 *
 * Per-device and per-browser by definition: two phones are two families,
 * and clearing site data starts over. That's acceptable for testing and
 * is exactly what turning auth back on fixes.
 */
const KEY = "tn.localFamily.v1";

export type LocalFamily = {
  parentName: string;
  child: Child;
};

export async function getLocalFamily(): Promise<LocalFamily | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed: LocalFamily = JSON.parse(raw);
    // A half-written record is worse than none — it would strand the app
    // on Home with no child to plan for.
    if (!parsed?.child?.date_of_birth || !parsed?.child?.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveLocalFamily(family: LocalFamily): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(family));
}

export async function clearLocalFamily(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

/** Builds the Child shape from what onboarding collects. */
export function childFromDraft(name: string, dateOfBirth: string): Child {
  return {
    // Local-only id. The server assigns the real one once auth is back.
    id: Date.now(),
    name,
    date_of_birth: dateOfBirth,
    // Learned from usage over time, never asked for in a form.
    interests: [],
    goals: [],
  };
}
