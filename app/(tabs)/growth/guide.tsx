import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useScreenFocus } from "../../../lib/useScreenFocus";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { GuidedTourDialog } from "../../../components/GuidedTourDialog";
import { markFirstRunComplete, markHomeCoachComplete } from "../../../lib/firstRun";
import { colors, fonts, radius, spacing, typeScale } from "../../../lib/theme";

const FEATURED = [
  "Sleep rhythms in the first years",
  "What play is really teaching",
  "When big feelings arrive",
];

/**
 * The Guide — parent learning without a feed-shaped pressure loop.
 *
 * This starts as a real-feeling shell so the first-run tour can introduce
 * the mental model now: parents come here when they want to understand,
 * not when the app wants to push content at them.
 */
export default function Guide() {
  const router = useRouter();
  const params = useLocalSearchParams<{ guidedTour?: string; next?: string }>();
  // Every screen the tour visits stays mounted with guidedTour=1 in its params,
  // and a Modal draws above whatever is on top — so an unfocused screen would
  // keep its dialog on the user's face after they left. Only the focused screen
  // may show one.
  const isFocused = useScreenFocus();
  const guidedTour = params.guidedTour === "1" && isFocused;
  const afterOnboardingTour = params.next === "milestones";
  const tourNext = afterOnboardingTour ? "&next=milestones" : "";

  const skipGuidedTour = async () => {
    await Promise.all([markHomeCoachComplete(), markFirstRunComplete()]).catch(() => {});
    router.replace("/home");
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={
          guidedTour
            ? {
                headerStyle: { backgroundColor: colors.cream },
                headerTintColor: "rgba(139, 115, 85, 0.42)",
                headerTitleStyle: {
                  fontFamily: fonts.bodySemiBold,
                  fontSize: 17,
                  color: "rgba(44, 44, 44, 0.42)",
                },
              }
            : undefined
        }
      />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>THE GUIDE</Text>
        <Text style={styles.title}>Learn at your own pace.</Text>
        <Text style={styles.body}>
          Short, expert-backed guidance for real-life questions.
        </Text>

        <View style={[styles.featuredCard, guidedTour && styles.tourHighlight]}>
          <Text style={styles.featuredLabel}>START HERE</Text>
          <Text style={styles.featuredTitle}>Small daily moments are how children learn.</Text>
          <Text style={styles.featuredBody}>
            A gentle guide to seeing development inside ordinary play.
          </Text>
        </View>

        <View style={styles.list}>
          {FEATURED.map((item) => (
            <Pressable key={item} style={styles.row}>
              <Text style={styles.rowTitle}>{item}</Text>
              <Text style={styles.rowMeta}>5 min read</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {guidedTour && (
        <GuidedTourDialog
          eyebrow="The Guide"
          focus="The learning shelf"
          title="Learn at your own pace."
          body="Expert-backed guidance for real-life parenting questions."
          step={2}
          total={4}
          primaryTitle="Continue"
          onPrimary={() => router.replace(`/copilot?guidedTour=1&step=3${tourNext}`)}
          onSkip={skipGuidedTour}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
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
    lineHeight: typeScale.h1 * 1.2,
    color: colors.charcoal,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.5,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  featuredCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tourHighlight: {
    borderColor: colors.warmTaupe,
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 4,
  },
  featuredLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: colors.warmTaupe,
    marginBottom: spacing.sm,
  },
  featuredTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.h2,
    lineHeight: typeScale.h2 * 1.24,
    color: colors.charcoal,
  },
  featuredBody: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.5,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  list: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    backgroundColor: "rgba(255, 255, 255, 0.48)",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.bodySmall,
    color: colors.charcoal,
  },
  rowMeta: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.textMuted,
    marginTop: 3,
  },
});
