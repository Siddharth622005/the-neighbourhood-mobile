import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import {
  CATEGORY_LABEL,
  DIFFICULTY_LABEL,
  estimatedMinutes,
  type Course,
  type CourseCategory,
  type DifficultyLevel,
  type LessonType,
  type Workshop,
} from "../lib/learning";
import { colors, fonts, radius, spacing, typeScale } from "../lib/theme";

/**
 * Shared surfaces for Courses & Workshops — the Growth-tab counterpart to
 * parentUI.tsx. Styled with the fixed child-mode tokens directly, matching
 * every other real Growth screen (growth/index.tsx, guide.tsx,
 * milestones.tsx), rather than usePalette, which is reserved for screens
 * that also render under Parent Mode.
 */

export function CategoryChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function DifficultyBadge({ level }: { level: DifficultyLevel }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{DIFFICULTY_LABEL[level]}</Text>
    </View>
  );
}

/** A quiet, real-data-only bar — never shown without an actual fraction behind it. */
export function ProgressBar({ fraction }: { fraction: number }) {
  const clamped = Math.max(0, Math.min(1, fraction));
  return (
    <View style={styles.track}>
      <View style={[styles.trackFill, { width: `${clamped * 100}%` }]} />
    </View>
  );
}

export function CourseCard({
  course,
  completedCount,
  onPress,
}: {
  course: Course;
  /** Omit while progress hasn't loaded yet, to avoid flashing 0%. */
  completedCount?: number;
  onPress: () => void;
}) {
  const total = course.lessons.length;
  const fraction = completedCount != null && total > 0 ? completedCount / total : undefined;

  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <CourseIcon category={course.thumbnailIcon} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardLabel}>{CATEGORY_LABEL[course.category].toUpperCase()}</Text>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {course.title}
          </Text>
        </View>
      </View>
      <Text style={styles.cardBody} numberOfLines={2}>
        {course.description}
      </Text>
      <View style={styles.metaRow}>
        <DifficultyBadge level={course.difficulty} />
        <Text style={styles.metaText}>
          {estimatedMinutes(course)} min · {total} {total === 1 ? "lesson" : "lessons"}
        </Text>
      </View>
      {fraction != null && fraction > 0 && (
        <View style={styles.progressRow}>
          <ProgressBar fraction={fraction} />
          <Text style={styles.progressText}>
            {completedCount}/{total}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function WorkshopCard({
  workshop,
  registered,
  onPress,
}: {
  workshop: Workshop;
  registered?: boolean;
  onPress: () => void;
}) {
  const starts = new Date(workshop.startsAt);
  const dateLabel = starts.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const timeLabel = starts.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <WorkshopIcon mode={workshop.location.mode} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardLabel}>
            {dateLabel.toUpperCase()} · {timeLabel}
          </Text>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {workshop.title}
          </Text>
        </View>
        {registered && (
          <View style={styles.registeredDot}>
            <Text style={styles.registeredDotText}>✓</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardBody} numberOfLines={2}>
        {workshop.description}
      </Text>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{workshop.instructor.name}</Text>
        <Text style={styles.metaText}>
          {workshop.location.mode === "online" ? "Online" : "In person"} · {workshop.durationMinutes} min
        </Text>
      </View>
    </Pressable>
  );
}

export function LessonTypeIcon({ type }: { type: LessonType }) {
  const stroke = colors.warmTaupe;
  if (type === "video") {
    return (
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path d="M23 7l-7 5 7 5V7z" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Rect x="1" y="5" width="15" height="14" rx="2" stroke={stroke} strokeWidth={1.8} />
      </Svg>
    );
  }
  if (type === "quiz") {
    return (
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth={1.8} />
        <Path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.35-1 .8-1 1.7M12 17h.01" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (type === "pdf") {
    return (
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M14 2v6h6" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CourseIcon({ category }: { category: CourseCategory }) {
  const stroke = colors.warmTaupe;
  const paths: Record<CourseCategory, string> = {
    sleep: "M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z",
    feeding: "M7 2v7a3 3 0 0 0 3 3v10M7 2v7M11 2v7M17 2c-2 2-2 5-2 8s0 4 2 4v8",
    development: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
    behaviour: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z",
    wellbeing: "M12 21s-6.7-4.35-9.5-8.5C.6 9.1 2 5 6 5c2.1 0 3.6 1.2 6 3.8C14.4 6.2 15.9 5 18 5c4 0 5.4 4.1 3.5 7.5C18.7 16.65 12 21 12 21Z",
  };
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d={paths[category]} stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WorkshopIcon({ mode }: { mode: "online" | "in_person" }) {
  const stroke = colors.warmTaupe;
  if (mode === "online") {
    return (
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Rect x="2" y="4" width="20" height="14" rx="2" stroke={stroke} strokeWidth={1.8} />
        <Path d="M8 21h8M12 18v3" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    );
  }
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="9" r="2.5" stroke={stroke} strokeWidth={1.8} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.warmTaupe,
    borderColor: colors.warmTaupe,
  },
  chipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.caption,
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.white,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: "rgba(137, 116, 91, 0.1)",
  },
  badgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.warmTaupe,
  },
  track: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(96, 79, 60, 0.1)",
    overflow: "hidden",
  },
  trackFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.sage,
  },
  card: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(96, 79, 60, 0.1)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(137, 116, 91, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderText: {
    flex: 1,
  },
  cardLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1.1,
    color: colors.warmTaupe,
    marginBottom: 2,
  },
  cardTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.body,
    color: colors.charcoal,
    lineHeight: typeScale.body * 1.3,
  },
  cardBody: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    lineHeight: typeScale.caption * 1.5,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  metaText: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.textMuted,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  progressText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.textMuted,
  },
  registeredDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  registeredDotText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: fonts.bodyBold,
  },
});
