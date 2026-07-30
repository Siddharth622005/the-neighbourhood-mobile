import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing, typeScale } from "../lib/theme";

/**
 * The honest placeholder every Growth section starts as: says what the
 * section will hold and what still has to exist before it can, rather
 * than rendering invented data behind a finished-looking UI.
 *
 * Delete this wrapper from a section the moment that section is real —
 * it's scaffolding, not a permanent empty state.
 */
export function SectionScaffold({
  eyebrow,
  title,
  body,
  needs,
}: {
  eyebrow: string;
  title: string;
  body: string;
  /** What has to be built before this screen can hold real content. */
  needs: string[];
}) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>

      <View style={styles.needsBox}>
        <Text style={styles.needsLabel}>Coming next</Text>
        {needs.map((n) => (
          <Text key={n} style={styles.needsItem}>
            · {n}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  eyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.5,
    color: colors.warmTaupe,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.h1,
    color: colors.charcoal,
    lineHeight: typeScale.h1 * 1.2,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.5,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  needsBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "solid",
    backgroundColor: "rgba(255, 255, 255, 0.42)",
    borderColor: colors.border,
    gap: 4,
  },
  needsLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.warmTaupe,
    marginBottom: spacing.xs,
  },
  needsItem: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.5,
    color: colors.textMuted,
  },
});
