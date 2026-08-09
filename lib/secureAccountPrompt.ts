import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "tn.securePrompt.v1";

/**
 * Whether we've already asked this device to attach an email.
 *
 * Asked exactly once, and never again — the row in Profile carries the
 * message from then on. A prompt that reappears after "not now" stops
 * being a safety net and becomes nagging, and this one fires right after
 * a parent records something they care about, which is precisely the
 * moment not to be annoying.
 */
export async function hasAskedToSecure(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === "1";
  } catch {
    // Storage unavailable: treat as already asked. Skipping the prompt is
    // a smaller harm than showing it on every single milestone.
    return true;
  }
}

export async function markAskedToSecure(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, "1");
  } catch {
    // Non-fatal; worst case the prompt appears once more.
  }
}
