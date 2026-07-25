import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ChevronRight } from "../../../components/TabIcons";
import { useAuth } from "../../../lib/AuthProvider";
import { computeAge } from "../../../lib/childAge";
import { GROWTH_SECTIONS, growthHref } from "../../../lib/growthSections";
import { colors, fonts, radius, spacing, typeScale } from "../../../lib/theme";

/**
 * Growth — the single home for everything retrospective or reference-based
 * about the child. Nothing here belongs on Home, which only ever answers
 * "what do I do today?".
 *
 * The landing view is the child's timeline; the five sections sit beneath
 * it as a plain list. That ordering is deliberate: the emotional payoff
 * (their story so far) comes before the filing cabinet.
 *
 * SCAFFOLD: the timeline itself is not built yet — the strip below is an
 * honest empty state, not fabricated history. It fills in from real
 * activity completions, notes, and milestones as they accumulate.
 */
export default function Growth() {
  const router = useRouter();
  const { child } = useAuth();
  const age = child ? computeAge(child.date_of_birth) : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Timeline — the landing view proper. */}
      <Text style={styles.eyebrow}>
        {child?.name ? `${child.name.toUpperCase()}'S TIMELINE` : "TIMELINE"}
      </Text>
      <Text style={styles.title}>Every child on their own clock.</Text>
      <Text style={styles.body}>
        {age
          ? `${child?.name} is ${age.label} old. As you go, this fills with what you did together, what you noticed, and what changed — no percentiles, no rankings, no other children.`
          : "This fills with what you did together, what you noticed, and what changed."}
      </Text>

      <View style={styles.timelinePlaceholder}>
        <Text style={styles.placeholderText}>
          Nothing here yet. Finish today&rsquo;s activity and it starts building itself.
        </Text>
      </View>

      {/* The five sections. One tap from here, two from Home. */}
      <View style={styles.sections}>
        {GROWTH_SECTIONS.map((section) => (
          <Pressable
            key={section.slug}
            style={styles.row}
            onPress={() => router.push(growthHref(section.slug))}
            accessibilityRole="button"
          >
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{section.title}</Text>
              <Text style={styles.rowBlurb}>{section.blurb}</Text>
            </View>
            <ChevronRight color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
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
    lineHeight: typeScale.h1 * 1.25,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.5,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  timelinePlaceholder: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  placeholderText: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.5,
    color: colors.textMuted,
  },
  sections: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowText: { flexShrink: 1 },
  rowTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.body,
    color: colors.charcoal,
  },
  rowBlurb: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    lineHeight: typeScale.caption * 1.45,
    color: colors.textMuted,
    marginTop: 3,
  },
});
