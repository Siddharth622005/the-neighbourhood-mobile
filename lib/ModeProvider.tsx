import { usePathname } from "expo-router";
import { createContext, useContext, useMemo } from "react";
import { type Mode, type Palette, palettes } from "./theme";

/**
 * Derives which palette a screen should read, purely from its route.
 *
 * There is no user-facing "mode" anymore — Home, Community, Ask, Child and
 * You are five tabs a parent picks between directly, not two shells behind
 * a toggle. What's left of the old Child Mode / Parent Mode split is a
 * visual one: You's screens (and the Care topic reader, which pushes over
 * everything from there) read a cooler, sage-tinted palette instead of the
 * default warm cream, purely as a wayfinding cue — the room changes
 * temperature when you're in your own space. There's no transition
 * ceremony announcing that anymore, no toggle to press; it's just the
 * colour a screen happens to render in, the same way any themed screen
 * would.
 *
 * `Mode` keeps its internal "child"/"parent" names — they're implementation
 * detail (matching palettes.child/palettes.parent in theme.ts), never
 * shown to a user.
 */
function modeForPath(pathname: string): Mode {
  return pathname.startsWith("/you") || pathname.startsWith("/care") ? "parent" : "child";
}

type ModeContextValue = {
  mode: Mode;
  palette: Palette;
  isParent: boolean;
};

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mode = modeForPath(pathname);

  const value = useMemo<ModeContextValue>(
    () => ({ mode, palette: palettes[mode], isParent: mode === "parent" }),
    [mode]
  );

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
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
