import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CategoryChip, CourseCard } from "../../../components/LearningUI";
import {
  CATEGORY_LABEL,
  COURSE_CATEGORIES,
  coursesByCategory,
  type Course,
  type CourseCategory,
} from "../../../lib/learning";
import { getCompletedLessons } from "../../../lib/learningProgress";
import { colors, fonts, spacing, typeScale } from "../../../lib/theme";
import { useScreenFocus } from "../../../lib/useScreenFocus";

/**
 * The full course library, filterable by category. Reached from the Guide
 * hub's "See all" link — the hub itself only ever shows a short preview.
 */
export default function Courses() {
  const router = useRouter();
  const isFocused = useScreenFocus();
  const [category, setCategory] = useState<CourseCategory | undefined>(undefined);
  const [progress, setProgress] = useState<Record<string, number>>({});

  const courses = useMemo(() => coursesByCategory(category), [category]);

  const loadProgress = useCallback(async () => {
    const entries = await Promise.all(
      courses.map(async (c) => [c.slug, (await getCompletedLessons(c.slug)).length] as const),
    );
    setProgress(Object.fromEntries(entries));
  }, [courses]);

  useEffect(() => {
    if (isFocused) void loadProgress();
  }, [isFocused, loadProgress]);

  const openCourse = (course: Course) => router.push(`/child/course/${course.slug}`);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "Courses" }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>COURSES</Text>
        <Text style={styles.title}>Structured learning, at your pace.</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <CategoryChip label="All" active={!category} onPress={() => setCategory(undefined)} />
          {COURSE_CATEGORIES.map((c) => (
            <CategoryChip
              key={c}
              label={CATEGORY_LABEL[c]}
              active={category === c}
              onPress={() => setCategory(c)}
            />
          ))}
        </ScrollView>

        <View style={styles.list}>
          {courses.map((course) => (
            <CourseCard
              key={course.slug}
              course={course}
              completedCount={progress[course.slug]}
              onPress={() => openCourse(course)}
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
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingRight: spacing.lg,
  },
  list: {
    paddingBottom: spacing.md,
  },
});
