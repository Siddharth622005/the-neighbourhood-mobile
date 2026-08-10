import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * Notification foundation — local scheduling only, one use case for now
 * (vaccination due-date reminders). Deliberately not building a push/remote
 * pipeline; this is the minimal piece other reminder types can extend later
 * by calling schedule()/cancel() with their own stable id.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Schedules (or reschedules) a single local notification under a stable id. */
export async function scheduleReminder(id: string, title: string, body: string, date: Date): Promise<void> {
  if (date.getTime() <= Date.now()) return;
  if (!(await ensurePermission())) return;

  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title, body },
    trigger:
      Platform.OS === "android"
        ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: "default" }
        : { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

export async function cancelReminder(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

/** Vaccination reminders: one local notification per upcoming, unrecorded dose. */
export async function scheduleVaccinationReminders(
  childId: string,
  childName: string,
  dateOfBirth: string,
  schedule: { id: string; vaccine_name: string; age_days: number }[],
  recordedIds: Set<string>
): Promise<void> {
  const dob = new Date(dateOfBirth + "T09:00:00").getTime();
  for (const item of schedule) {
    const reminderId = `vaccine-${childId}-${item.id}`;
    if (recordedIds.has(item.id)) {
      await cancelReminder(reminderId);
      continue;
    }
    const dueDate = new Date(dob + item.age_days * 86_400_000);
    await scheduleReminder(
      reminderId,
      `${item.vaccine_name} is due`,
      `${childName}'s ${item.vaccine_name} is due today, based on the recommended schedule.`,
      dueDate
    );
  }
}
