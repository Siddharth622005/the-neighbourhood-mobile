/**
 * Design tokens — matches PRD section 10 exactly, and the same palette
 * already live on the website (warm-taupe / soft-sand / cream / charcoal).
 * Sage is new here: the app's accent/success color, since the web brand
 * never needed a "success" state and the PRD specifically calls for one
 * that isn't the taupe/clay pairing already used for CTAs.
 */
export const colors = {
  warmTaupe: "#8B7355", // primary brand color
  softSand: "#C9A58E", // secondary accents
  cream: "#E8DDD1", // backgrounds
  charcoal: "#2C2C2C", // text and headings
  sage: "#A8B5A4", // accent / success states
  white: "#FFFFFF", // cards and clean space

  // Derived, not in the PRD table, but needed for real UI: muted text,
  // borders, and error state (kept desaturated so it never reads alarming).
  textMuted: "#6B6258",
  border: "rgba(139, 115, 85, 0.18)",
  error: "#B4553F",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
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
  display: 34,
  h1: 28,
  h2: 22,
  h3: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
} as const;
