import { Stack, useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { GuidedTourDialog } from "../../../components/GuidedTourDialog";
import { CourseCard, WorkshopCard } from "../../../components/LearningUI";
import { markFirstRunComplete, markHomeCoachComplete } from "../../../lib/firstRun";
import { COURSES, upcomingWorkshops, type Course, type Workshop } from "../../../lib/learning";
import { getCompletedLessons, getRegisteredWorkshops } from "../../../lib/learningProgress";
import { colors, fonts, radius, spacing, typeScale } from "../../../lib/theme";
import { useScreenFocus } from "../../../lib/useScreenFocus";

const FEATURED_COURSE = COURSES[0];
const PREVIEW_COUNT = 2;

/**
 * The Guide — home for Courses & Workshops.
 *
 * This started as a shell so the first-run tour could introduce the mental
 * model early ("parents come here when they want to understand"); this is
 * that shell filled in. The hub only ever shows a short preview of each —
 * courses.tsx and workshops.tsx hold the full, filterable lists.
 */
export default function Guide() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ guidedTour?: string; step?: string; next?: string }>();
  const isFocused = useScreenFocus();
  const isGuideRoute = pathname === "/child/guide";
  const guidedTour = params.guidedTour === "1" && params.step === "2" && isFocused && isGuideRoute;
  const afterOnboardingTour = params.next === "milestones";
  const tourNext = afterOnboardingTour ? "&next=milestones" : "";

  const [featuredCompleted, setFeaturedCompleted] = useState<number | undefined>(undefined);
  const [registeredWorkshops, setRegisteredWorkshops] = useState<string[]>([]);

  const loadState = useCallback(async () => {
    const [completed, registered] = await Promise.all([
      getCompletedLessons(FEATURED_COURSE.slug),
      getRegisteredWorkshops(),
    ]);
    setFeaturedCompleted(completed.length);
    setRegisteredWorkshops(registered);
  }, []);

  useEffect(() => {
    if (isFocused) void loadState();
  }, [isFocused, loadState]);

  const skipGuidedTour = async () => {
    await Promise.all([markHomeCoachComplete(), markFirstRunComplete()]).catch(() => {});
    if (afterOnboardingTour) {
      router.replace("/child/milestones?initial=1&afterTour=1");
      return;
    }
    router.replace("/home");
  };

  const openCourse = (course: Course) => router.push(`/child/course/${course.slug}`);
  const openWorkshop = (workshop: Workshop) => router.push(`/child/workshop/${workshop.slug}`);

  const otherCourses = COURSES.filter((c) => c.slug !== FEATURED_COURSE.slug).slice(
    0,
    PREVIEW_COUNT - 1,
  );
  const nextWorkshops = upcomingWorkshops().slice(0, PREVIEW_COUNT);

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
        <Text style={styles.body}>Structured courses and live workshops, expert-backed.</Text>

        <Pressable
          style={[styles.featuredCard, guidedTour && styles.tourHighlight]}
          onPress={() => openCourse(FEATURED_COURSE)}
        >
          <Text style={styles.featuredLabel}>START HERE</Text>
          <Text style={styles.featuredTitle}>{FEATURED_COURSE.title}</Text>
          <Text style={styles.featuredBody}>{FEATURED_COURSE.description}</Text>
          {featuredCompleted != null && featuredCompleted > 0 && (
            <Text style={styles.featuredProgress}>
              {featuredCompleted}/{FEATURED_COURSE.lessons.length} lessons done
            </Text>
          )}
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>COURSES</Text>
          <Pressable onPress={() => router.push("/child/courses")} hitSlop={8}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>
        {otherCourses.map((course) => (
          <CourseCard key={course.slug} course={course} onPress={() => openCourse(course)} />
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>WORKSHOPS</Text>
          <Pressable onPress={() => router.push("/child/workshops")} hitSlop={8}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>
        {nextWorkshops.length === 0 ? (
          <Text style={styles.emptyText}>Nothing scheduled right now — check back soon.</Text>
        ) : (
          nextWorkshops.map((workshop) => (
            <WorkshopCard
              key={workshop.slug}
              workshop={workshop}
              registered={registeredWorkshops.includes(workshop.slug)}
              onPress={() => openWorkshop(workshop)}
            />
          ))
        )}
      </ScrollView>

      {guidedTour && (
        <GuidedTourDialog
          eyebrow="The Guide"
          focus="The learning shelf"
          title="Learn at your own pace."
          body="Structured courses and live workshops for real-life parenting questions."
          step={2}
          total={4}
          primaryTitle="Continue"
          onPrimary={() => router.replace(`/ask?guidedTour=1&step=3${tourNext}`)}
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
  featuredProgress: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    color: colors.sage,
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xl,
  },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.4,
    color: colors.textMuted,
  },
  seeAll: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.bodySmall,
    color: colors.warmTaupe,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
