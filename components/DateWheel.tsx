import { useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing, typeScale } from "../lib/theme";

/**
 * A three-column date selector built from plain RN primitives.
 *
 * Deliberately NOT @react-native-community/datetimepicker: that package
 * has no web implementation, so it silently rendered nothing in the web
 * preview — the date step looked like it simply had no way to pick a
 * date. This behaves identically on iOS, Android and web, and matches the
 * app's own type rather than three different OS spinners.
 *
 * Nothing is pre-selected. A child's date of birth drives every activity,
 * milestone and vaccination date in the product, so a plausible-looking
 * default that a parent taps past is worse than an empty field.
 */
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ROW_HEIGHT = 44;

export type DateParts = {
  year: number | null;
  month: number | null; // 0-indexed, matching Date
  day: number | null;
};

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function isComplete(p: DateParts): p is { year: number; month: number; day: number } {
  return p.year !== null && p.month !== null && p.day !== null;
}

function Column({
  label,
  options,
  selected,
  onSelect,
  format = String,
}: {
  label: string;
  options: number[];
  selected: number | null;
  onSelect: (value: number) => void;
  format?: (value: number) => string;
}) {
  const scrollRef = useRef<ScrollView>(null);

  // Bring the current choice into view when returning to a part-filled
  // draft, so a 2023 birth year isn't hidden below the fold.
  useEffect(() => {
    if (selected === null) return;
    const index = options.indexOf(selected);
    if (index < 0) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, (index - 2) * ROW_HEIGHT), animated: false });
  }, [selected, options]);

  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      <ScrollView
        ref={scrollRef}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {options.map((option) => {
          const active = option === selected;
          return (
            <Pressable
              key={option}
              onPress={() => onSelect(option)}
              style={[styles.row, active && styles.rowActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.rowText, active && styles.rowTextActive]}>
                {format(option)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function DateWheel({
  value,
  onChange,
  earliestYear,
  latestYear,
}: {
  value: DateParts;
  onChange: (next: DateParts) => void;
  earliestYear: number;
  latestYear: number;
}) {
  const years = Array.from({ length: latestYear - earliestYear + 1 }, (_, i) => latestYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i);

  // Day count depends on the chosen month/year; before those exist, 31
  // keeps every option reachable rather than blocking the column.
  const dayCount =
    value.year !== null && value.month !== null ? daysInMonth(value.year, value.month) : 31;
  const days = Array.from({ length: dayCount }, (_, i) => i + 1);

  /** Re-clamp the day when a month/year change shortens the month. */
  const commit = (next: DateParts) => {
    if (next.year !== null && next.month !== null && next.day !== null) {
      const max = daysInMonth(next.year, next.month);
      if (next.day > max) next = { ...next, day: max };
    }
    onChange(next);
  };

  return (
    <View style={styles.wrap}>
      <Column
        label="Day"
        options={days}
        selected={value.day}
        onSelect={(day) => commit({ ...value, day })}
      />
      <Column
        label="Month"
        options={months}
        selected={value.month}
        onSelect={(month) => commit({ ...value, month })}
        format={(m) => MONTHS[m].slice(0, 3)}
      />
      <Column
        label="Year"
        options={years}
        selected={value.year}
        onSelect={(year) => commit({ ...value, year })}
      />
    </View>
  );
}

export { MONTHS };

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  column: { flex: 1 },
  columnLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.warmTaupe,
    marginBottom: spacing.xs,
  },
  list: {
    height: ROW_HEIGHT * 5,
    backgroundColor: colors.white,
    borderRadius: radius.md,
  },
  row: {
    height: ROW_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  rowActive: {
    backgroundColor: "rgba(168, 181, 164, 0.28)",
  },
  rowText: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.body,
    color: colors.textMuted,
  },
  rowTextActive: {
    fontFamily: fonts.bodySemiBold,
    color: colors.charcoal,
  },
});
