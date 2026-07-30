import { type Href, usePathname, useRouter } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { type Mode, type Palette, fonts, palettes, typeScale } from "./theme";

/** Where each mode lands when you switch into it. */
export const MODE_HOME: Record<Mode, Href> = {
  child: "/home",
  parent: "/parent/today",
};

/**
 * The URL is the source of truth for which mode you're in.
 *
 * Holding mode in state alongside the route lets the two disagree: anything
 * that navigates without going through the toggle — the guided tour's
 * router.replace, a deep link, a back gesture — would leave the palette
 * describing a shell the user isn't in. Deriving it makes that impossible.
 */
function modeForPath(pathname: string): Mode {
  // /care/* is parent-mode reading that sits at the root so it can push over
  // the whole shell.
  return pathname.startsWith("/parent") || pathname.startsWith("/care")
    ? "parent"
    : "child";
}

const MODE_COPY: Record<Mode, { label: string; caption: string }> = {
  child: { label: "Child", caption: "Back to their day" },
  parent: { label: "You", caption: "Your day, your recovery" },
};

type ModeContextValue = {
  mode: Mode;
  palette: Palette;
  isParent: boolean;
  /** Animates the veil, swaps mode, and navigates to that mode's home. */
  switchTo: (next: Mode) => void;
  toggle: () => void;
};

const ModeContext = createContext<ModeContextValue | null>(null);

/**
 * Owns which mode the app is in, the palette that follows from it, and the
 * transition between the two.
 *
 * The transition is the product here. Switching is a deliberate act — the
 * veil, the mode name, and the settle are what make it read as "changing
 * context" rather than "another screen loaded". It is closer to iOS Focus
 * modes than to a navigation push, so it lives above the navigator instead
 * of inside any one screen.
 */
export function ModeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState<Mode | null>(null);
  const veil = useRef(new Animated.Value(0)).current;
  const switching = useRef(false);

  const mode = modeForPath(pathname);

  const switchTo = useCallback(
    (next: Mode) => {
      if (switching.current || next === modeForPath(pathname)) return;
      switching.current = true;
      setPending(next);

      Animated.timing(veil, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        // Navigation alone flips the mode — modeForPath picks it up.
        router.replace(MODE_HOME[next]);

        // Hold the label just long enough to be read, then clear.
        setTimeout(() => {
          Animated.timing(veil, {
            toValue: 0,
            duration: 380,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }).start(() => {
            setPending(null);
            switching.current = false;
          });
        }, 340);
      });
    },
    [pathname, router, veil]
  );

  const toggle = useCallback(
    () => switchTo(mode === "child" ? "parent" : "child"),
    [mode, switchTo]
  );

  const value = useMemo<ModeContextValue>(
    () => ({
      mode,
      palette: palettes[mode],
      isParent: mode === "parent",
      switchTo,
      toggle,
    }),
    [mode, switchTo, toggle]
  );

  // The veil paints in the mode being entered, so the new palette arrives
  // before the content does.
  const incoming = palettes[pending ?? mode];
  const copy = MODE_COPY[pending ?? mode];

  return (
    <ModeContext.Provider value={value}>
      {children}
      {pending && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.veil,
            { backgroundColor: incoming.bg, opacity: veil },
          ]}
        >
          <Animated.View
            style={{
              opacity: veil,
              transform: [
                {
                  translateY: veil.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            }}
          >
            <View style={styles.veilInner}>
              <Text style={[styles.veilLabel, { color: incoming.primary }]}>
                {copy.label.toUpperCase()}
              </Text>
              <Text style={[styles.veilCaption, { color: incoming.textMuted }]}>
                {copy.caption}
              </Text>
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used inside ModeProvider");
  return ctx;
}

/** Palette-only access, for the many components that don't need the mode. */
export function usePalette() {
  return useMode().palette;
}

const styles = StyleSheet.create({
  veil: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  veilInner: {
    alignItems: "center",
  },
  veilLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 3,
  },
  veilCaption: {
    fontFamily: fonts.serifItalic,
    fontSize: typeScale.h2,
    marginTop: 6,
  },
});
