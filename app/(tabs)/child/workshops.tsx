import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { WorkshopCard } from "../../../components/LearningUI";
import { upcomingWorkshops, type Workshop } from "../../../lib/learning";
import { getRegisteredWorkshops } from "../../../lib/learningProgress";
import { colors, fonts, spacing, typeScale } from "../../../lib/theme";
import { useScreenFocus } from "../../../lib/useScreenFocus";

/**
 * Upcoming live/scheduled sessions, soonest first. Reached from the Guide
 * hub's "See all" link, same pattern as courses.tsx.
 */
export default function Workshops() {
  const router = useRouter();
  const isFocused = useScreenFocus();
  const [registered, setRegistered] = useState<string[]>([]);
  const workshops = upcomingWorkshops();

  const loadRegistered = useCallback(async () => {
    setRegistered(await getRegisteredWorkshops());
  }, []);

  useEffect(() => {
    if (isFocused) void loadRegistered();
  }, [isFocused, loadRegistered]);

  const openWorkshop = (workshop: Workshop) => router.push(`/child/workshop/${workshop.slug}`);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "Workshops" }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>WORKSHOPS</Text>
        <Text style={styles.title}>Live sessions, worth clearing time for.</Text>
        <Text style={styles.body}>
          Hosted by real practitioners. Join online or in person, whichever suits.
        </Text>

        <View style={styles.list}>
          {workshops.length === 0 && (
            <Text style={styles.empty}>Nothing scheduled right now. Check back soon.</Text>
          )}
          {workshops.map((workshop) => (
            <WorkshopCard
              key={workshop.slug}
              workshop={workshop}
              registered={registered.includes(workshop.slug)}
              onPress={() => openWorkshop(workshop)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
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
    color: colors.charcoal,
    lineHeight: typeScale.h1 * 1.25,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.5,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  list: {
    paddingBottom: spacing.md,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xl,
    textAlign: "center",
  },
});
