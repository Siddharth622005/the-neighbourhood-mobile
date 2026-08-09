/**
 * Local progress and registration state for Courses & Workshops.
 *
 * No `course_progress` or `workshop_registrations` table exists yet, so
 * this is mirrored to AsyncStorage the same way recoveryProfile.tsx is —
 * a plain read/write store, not a context, since nothing here needs to be
 * reactive across the whole app the way the recovery profile is. Swapping
 * this for real per-user rows later means changing these functions'
 * bodies, not the call sites: every screen already reads "is this lesson
 * done" / "am I registered" through these, never through AsyncStorage
 * directly.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const COMPLETED_LESSONS_KEY = "tn.learning.completedLessons.v1";
const REGISTERED_WORKSHOPS_KEY = "tn.learning.registeredWorkshops.v1";

type CompletedLessonsMap = Record<string, string[]>; // course slug -> lesson ids

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export async function getCompletedLessons(courseSlug: string): Promise<string[]> {
  const all = await readJson<CompletedLessonsMap>(COMPLETED_LESSONS_KEY, {});
  return all[courseSlug] ?? [];
}

export async function setLessonComplete(
  courseSlug: string,
  lessonId: string,
  complete: boolean,
): Promise<string[]> {
  const all = await readJson<CompletedLessonsMap>(COMPLETED_LESSONS_KEY, {});
  const current = new Set(all[courseSlug] ?? []);
  if (complete) current.add(lessonId);
  else current.delete(lessonId);
  const next = { ...all, [courseSlug]: [...current] };
  await AsyncStorage.setItem(COMPLETED_LESSONS_KEY, JSON.stringify(next)).catch(() => {});
  return next[courseSlug];
}

export async function getRegisteredWorkshops(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(REGISTERED_WORKSHOPS_KEY).catch(() => null);
  return raw ? JSON.parse(raw) : [];
}

export async function setWorkshopRegistered(
  workshopSlug: string,
  registered: boolean,
): Promise<string[]> {
  const current = new Set(await getRegisteredWorkshops());
  if (registered) current.add(workshopSlug);
  else current.delete(workshopSlug);
  const next = [...current];
  await AsyncStorage.setItem(REGISTERED_WORKSHOPS_KEY, JSON.stringify(next)).catch(() => {});
  return next;
}
