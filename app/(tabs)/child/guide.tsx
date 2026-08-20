import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CourseCard, WorkshopCard } from "../../../components/LearningUI";
import { COURSES, upcomingWorkshops, type Course, type Workshop } from "../../../lib/learning";
import { getCompletedLessons, getRegisteredWorkshops } from "../../../lib/learningProgress";
import { colors, fonts, radius, spacing, typeScale } from "../../../lib/theme";
import { useScreenFocus } from "../../../lib/useScreenFocus";

const FEATURED_COURSE = COURSES[0];
const PREVIEW_COUNT = 2;

/**
 * The Guide — home for Courses & Workshops.
 *
 * Not a stop on the guided tour (see app/(tabs)/child/index.tsx) — the
 * tour only introduces the five tabs, and Guide is one tap deeper than
 * that inside Child. The hub only ever shows a short preview of each —
 * courses.tsx and workshops.tsx hold the full, filterable lists.
 */
export default function Guide() {
  const router = useRouter();
  const isFocused = useScreenFocus();

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

  const openCourse = (course: Course) => router.push(`/child/course/${course.slug}`);
  const openWorkshop = (workshop: Workshop) => router.push(`/child/workshop/${workshop.slug}`);

  const otherCourses = COURSES.filter((c) => c.slug !== FEATURED_COURSE.slug).slice(
    0,
    PREVIEW_COUNT - 1,
  );
  const nextWorkshops = upcomingWorkshops().slice(0, PREVIEW_COUNT);

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>THE GUIDE</Text>
        <Text style={styles.title}>Learn at your own pace.</Text>
        <Text style={styles.body}>Structured courses and live workshops, expert-backed.</Text>

        <Pressable style={styles.featuredCard} onPress={() => openCourse(FEATURED_COURSE)}>
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
          <Text style={styles.emptyText}>Nothing scheduled right now. Check back soon.</Text>
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
