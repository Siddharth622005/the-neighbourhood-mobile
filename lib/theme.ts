/**
 * Design tokens — matches PRD section 10 exactly, and the same palette
 * already live on the website (warm-taupe / soft-sand / cream / charcoal).
 * Sage is new here: the app's accent/success color, since the web brand
 * never needed a "success" state and the PRD specifically calls for one
 * that isn't the taupe/clay pairing already used for CTAs.
 */
export const colors = {
  warmTaupe: "#89745B", // primary brand color
  softSand: "#C9A58E", // secondary accents
  cream: "#F3EEE7", // backgrounds
  charcoal: "#2C2C2C", // text and headings
  sage: "#A8B5A4", // accent / success states
  white: "#FFFDFC", // cards and clean space

  // Derived, not in the PRD table, but needed for real UI: muted text,
  // borders, and error state (kept desaturated so it never reads alarming).
  textMuted: "#706A62",
  border: "rgba(96, 79, 60, 0.14)",
  error: "#B4553F",
} as const;

/**
 * The app has two modes, and each one gets a palette rather than a theme
 * switch: Child Mode is the warm cream/taupe brand, Parent Mode shifts the
 * same lightness toward a calm eucalyptus.
 *
 * The shift is deliberately small in VALUE and larger in HUE. Parent Mode
 * must never read as dark mode or as a clinical app — a parent opening it at
 * 3am should feel the room change temperature, not the lights go out. Every
 * key exists in both palettes so a component can read tokens without ever
 * asking which mode it is in.
 */
export type Mode = "child" | "parent";

export type Palette = {
  /** Screen background. */
  bg: string;
  /** Cards and raised surfaces. */
  surface: string;
  /** Recessed fills — progress tracks, quiet chips. */
  surfaceAlt: string;
  /** Primary brand action and eyebrow text. */
  primary: string;
  /** Secondary accents. */
  secondary: string;
  /** Headings and body copy. */
  text: string;
  /** Supporting copy. */
  textMuted: string;
  border: string;
  /** Success / on-track. */
  positive: string;
  /** Kept desaturated — this app never alarms. */
  attention: string;
};

export const palettes: Record<Mode, Palette> = {
  child: {
    bg: "#F3EEE7",
    surface: "#FFFDFC",
    surfaceAlt: "rgba(137, 116, 91, 0.07)",
    primary: "#89745B",
    secondary: "#C9A58E",
    text: "#2C2C2C",
    textMuted: "#706A62",
    border: "rgba(96, 79, 60, 0.14)",
    positive: "#A8B5A4",
    attention: "#B4553F",
  },
  parent: {
    // Same lightness as cream, rotated toward eucalyptus and desaturated.
    bg: "#EBF0EB",
    surface: "#FBFDFB",
    surfaceAlt: "rgba(94, 115, 96, 0.07)",
    primary: "#5E7360",
    secondary: "#9DB0A0",
    // Cooled a touch, never blue-black.
    text: "#242A26",
    textMuted: "#646E66",
    border: "rgba(60, 80, 62, 0.13)",
    positive: "#7C9A80",
    attention: "#A86552",
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

// Inter carries all body/UI text; Playfair Display italic is reserved for
// rare emotional accents, matching how the website uses .v3-serif — never
// for whole paragraphs, only single words or short phrases.
export const fonts = {
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
  serifItalic: "PlayfairDisplay_400Regular_Italic",
} as const;

export const typeScale = {
  display: 32,
  h1: 26,
  h2: 20,
  h3: 17,
  body: 15,
  bodySmall: 13,
  caption: 11,
} as const;
