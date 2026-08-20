import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { FULL_TERM_WEEKS, isPreterm } from "../lib/childAge";
import { colors, fonts, radius, spacing, typeScale } from "../lib/theme";

/**
 * "Was this child born early?" — deliberately NOT its own onboarding screen.
 *
 * It appears inline underneath the date of birth, and only once a date has
 * been picked that puts the child under two years old (the window where
 * correction is still meaningful — see CORRECTION_UNTIL_MONTHS). Most
 * parents therefore never see it at all, which is the whole point: the
 * fact matters enormously to the minority it applies to and not at all to
 * everyone else, so it costs the flow zero screens.
 *
 * The value model has three meaningful states, and callers should preserve
 * all three rather than collapsing them to a boolean:
 *   null            — never answered. No correction, and the question is
 *                     still worth asking again later.
 *   FULL_TERM (40)  — answered "on time". No correction, but answered, so
 *                     nothing should re-prompt.
 *   22..36          — weeks of gestation at birth. Correction applies.
 */

/** 40 weeks — what "born on time" stores. */
export const FULL_TERM_ANSWER = 40;

// The range worth offering. Below 22 weeks is outside viability, and 37+
// is full term by definition, which is what the other option already says.
const EARLIEST_WEEK = 22;
const LATEST_PRETERM_WEEK = FULL_TERM_WEEKS - 1; // 36

const WEEK_OPTIONS = Array.from(
  { length: LATEST_PRETERM_WEEK - EARLIEST_WEEK + 1 },
  (_, i) => EARLIEST_WEEK + i
);

type Mode = "unset" | "term" | "early";

function modeFor(value: number | null): Mode {
  if (value === null) return "unset";
  return isPreterm(value) ? "early" : "term";
}

export function BornEarlyQuestion({
  value,
  onChange,
  childName,
}: {
  value: number | null;
  onChange: (gestationalWeeks: number | null) => void;
  childName?: string;
}) {
  // Tapping "Born early" has to hold that choice for the moment between
  // the tap and picking a number, which `value` alone can't express —
  // it's still null until a week is chosen.
  const [mode, setMode] = useState<Mode>(() => modeFor(value));
  const name = childName?.trim().split(" ")[0] || "your baby";

  const chooseTerm = () => {
    setMode("term");
    onChange(FULL_TERM_ANSWER);
  };

  const chooseEarly = () => {
    setMode("early");
    // Don't guess a week on their behalf — a wrong gestation silently
    // shifts every milestone. Correction waits for a real answer.
    if (!isPreterm(value)) onChange(null);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Was {name} born early?</Text>

      <View style={styles.optionRow}>
        <Pressable
          onPress={chooseTerm}
          style={[styles.option, mode === "term" && styles.optionOn]}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === "term" }}
        >
          <Text style={[styles.optionText, mode === "term" && styles.optionTextOn]}>
            Born on time
          </Text>
        </Pressable>
        <Pressable
          onPress={chooseEarly}
          style={[styles.option, mode === "early" && styles.optionOn]}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === "early" }}
        >
          <Text style={[styles.optionText, mode === "early" && styles.optionTextOn]}>
            Born early
          </Text>
        </Pressable>
      </View>

      {mode === "early" && (
        <View style={styles.earlyBlock}>
          <Text style={styles.weeksLabel}>How many weeks at birth?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekRow}
          >
            {WEEK_OPTIONS.map((week) => {
              const selected = value === week;
              return (
                <Pressable
                  key={week}
                  onPress={() => onChange(week)}
                  style={[styles.week, selected && styles.weekOn]}
                  accessibilityRole="button"
                  accessibilityLabel={`${week} weeks`}
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.weekText, selected && styles.weekTextOn]}>{week}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.why}>
            {isPreterm(value)
              ? `We'll use ${name}'s corrected age for discoveries and activities. So nothing is measured against a timeline that was never theirs.`
              : "Roughly is fine. We use this to work out their corrected age, so discoveries are matched to where they actually are."}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.lg,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  option: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  optionOn: {
    backgroundColor: colors.warmTaupe,
    borderColor: colors.warmTaupe,
  },
  optionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.bodySmall,
    color: colors.charcoal,
  },
  optionTextOn: {
    color: colors.white,
  },
  earlyBlock: {
    marginTop: spacing.md,
  },
  weeksLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  weekRow: {
    gap: spacing.xs,
    paddingRight: spacing.lg,
  },
  week: {
    minWidth: 44,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
  },
  weekOn: {
    backgroundColor: "rgba(168, 181, 164, 0.28)",
    borderColor: colors.sage,
  },
  weekText: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.body,
    color: colors.textMuted,
  },
  weekTextOn: {
    fontFamily: fonts.bodySemiBold,
    color: colors.charcoal,
  },
  why: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    lineHeight: typeScale.caption * 1.55,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
