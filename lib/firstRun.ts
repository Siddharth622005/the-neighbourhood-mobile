import AsyncStorage from "@react-native-async-storage/async-storage";

const FIRST_RUN_COMPLETE_KEY = "tn.firstRun.complete.v1";
const HOME_COACH_COMPLETE_KEY = "tn.homeCoach.complete.v1";

export async function hasCompletedFirstRun(): Promise<boolean> {
  return (await AsyncStorage.getItem(FIRST_RUN_COMPLETE_KEY)) === "true";
}

export async function markFirstRunComplete(): Promise<void> {
  await AsyncStorage.setItem(FIRST_RUN_COMPLETE_KEY, "true");
}

export async function hasCompletedHomeCoach(): Promise<boolean> {
  return (await AsyncStorage.getItem(HOME_COACH_COMPLETE_KEY)) === "true";
}

export async function markHomeCoachComplete(): Promise<void> {
  await AsyncStorage.setItem(HOME_COACH_COMPLETE_KEY, "true");
}
