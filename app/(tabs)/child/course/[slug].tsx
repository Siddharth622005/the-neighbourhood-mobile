import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { DifficultyBadge, LessonTypeIcon, ProgressBar } from "../../../../components/LearningUI";
import {
  CATEGORY_LABEL,
  courseBySlug,
  estimatedMinutes,
  type Lesson,
} from "../../../../lib/learning";
import { getCompletedLessons } from "../../../../lib/learningProgress";
import { colors, fonts, radius, spacing, typeScale } from "../../../../lib/theme";
import { useScreenFocus } from "../../../../lib/useScreenFocus";

const LESSON_TYPE_LABEL: Record<Lesson["type"], string> = {
  video: "Video",
  text: "Read",
  pdf: "PDF",
  quiz: "Quiz",
};

/**
 * A single course: overview, then its lesson list with real completion
 * state. Lives at growth/course/[slug] rather than nested under
 * growth/courses/, matching how app/care/[slug].tsx sits alongside its
 * list screen rather than inside it — a detail route, not a sub-page.
 */
export default function CourseDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const isFocused = useScreenFocus();
  const course = slug ? courseBySlug(slug) : undefined;
  const [completed, setCompleted] = useState<string[]>([]);

  const loadProgress = useCallback(async () => {
    if (!course) return;
    setCompleted(await getCompletedLessons(course.slug));
  }, [course]);

  useEffect(() => {
    if (isFocused) void loadProgress();
  }, [isFocused, loadProgress]);

  if (!course) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>We couldn&rsquo;t find that course.</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const fraction = course.lessons.length > 0 ? completed.length / course.lessons.length : 0;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "" }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>{CATEGORY_LABEL[course.category].toUpperCase()}</Text>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.description}>{course.description}</Text>

        <View style={styles.metaRow}>
          <DifficultyBadge level={course.difficulty} />
          <Text style={styles.metaText}>
            {estimatedMinutes(course)} min · {course.lessons.length} lessons
          </Text>
        </View>

        {completed.length > 0 && (
          <View style={styles.progressBlock}>
            <View style={styles.progressRow}>
              <ProgressBar fraction={fraction} />
              <Text style={styles.progressText}>
                {completed.length}/{course.lessons.length} done
              </Text>
            </View>
          </View>
        )}

        <View style={styles.lessonList}>
          {course.lessons.map((lesson, index) => {
            const done = completed.includes(lesson.id);
            return (
              <Pressable
                key={lesson.id}
                style={styles.lessonRow}
                onPress={() => router.push(`/child/lesson/${course.slug}/${lesson.id}`)}
                accessibilityRole="button"
              >
                <View style={[styles.lessonDot, done && styles.lessonDotDone]}>
                  {done ? (
                    <Text style={styles.lessonDotCheck}>✓</Text>
                  ) : (
                    <Text style={styles.lessonDotIndex}>{index + 1}</Text>
                  )}
                </View>
                <View style={styles.lessonBody}>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  <View style={styles.lessonMeta}>
                    <LessonTypeIcon type={lesson.type} />
                    <Text style={styles.lessonMetaText}>
                      {LESSON_TYPE_LABEL[lesson.type]} · {lesson.durationMinutes} min
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
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
  description: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.5,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  metaText: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.textMuted,
  },
  progressBlock: {
    marginTop: spacing.lg,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  progressText: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.caption,
    color: colors.textMuted,
  },
  lessonList: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(96, 79, 60, 0.1)",
  },
  lessonDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(137, 116, 91, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  lessonDotDone: {
    backgroundColor: colors.sage,
  },
  lessonDotIndex: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.warmTaupe,
  },
  lessonDotCheck: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.white,
  },
  lessonBody: {
    flex: 1,
  },
  lessonTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.bodySmall,
    color: colors.charcoal,
  },
  lessonMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  lessonMetaText: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.textMuted,
  },
  missing: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: colors.cream,
  },
  missingText: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    color: colors.textMuted,
  },
  back: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.body,
    color: colors.warmTaupe,
  },
});
