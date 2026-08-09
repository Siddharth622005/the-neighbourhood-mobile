import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

/**
 * Whether this screen is the focused one.
 *
 * React Navigation ships `useIsFocused`, but @react-navigation/native is only
 * a transitive dependency of expo-router here — importing it directly would
 * bind us to a package we never declared and that a hoisting change could
 * move. expo-router re-exports `useFocusEffect`, which is enough to derive
 * the same thing.
 *
 * Screens use this to decide whether they may render a Modal: an unfocused
 * screen stays mounted, and a Modal draws above everything regardless of who
 * is on top, so without this a background screen can pin its dialog over the
 * screen the user actually navigated to.
 */
export function useScreenFocus(): boolean {
  const [focused, setFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, [])
  );

  return focused;
}
