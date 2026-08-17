import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { ActivityVideo } from "./ActivityVideo";
import { kitItemsFor } from "../lib/devKit";
import { DOMAIN_LABEL, type Activity, type Domain } from "../lib/db/types";
import { colors, fonts, radius, spacing, typeScale } from "../lib/theme";

/**
 * The day's activity cards — shared between Home and the Child hub so
 * both present the same WHAT / HOW / WHY, collapsed-by-default
 * interaction (see app/(tabs)/home.tsx and app/(tabs)/child/index.tsx).
 * Previously lived only in home.tsx; lifted out rather than duplicated.
 */

/**
 * A short, honest fallback for the rare activity whose source content had
 * no genuine rationale sentence to split out (see
 * scripts/gen-activity-library-seed.mjs) — a true domain-level statement
 * rather than a fabricated per-activity claim.
 */
const DOMAIN_BENEFIT_FALLBACK: Record<Domain, string> = {
  motor: "Small movements like this build coordination and body confidence.",
  communication: "Moments like this are how language and connection grow together.",
  cognitive: "Simple exploration like this is how early problem-solving develops.",
  social_emotional: "Everyday moments like this build trust and emotional security.",
};

/** Collapsed — enough to understand what it is, not the full detail. */
export function ActivityCollapsedRow({
  activity,
  onPress,
}: {
  activity: Activity;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${activity.title}`}
    >
      <View style={styles.rowDot} />
      <View style={styles.rowText}>
        <Text style={styles.rowDomain}>{DOMAIN_LABEL[activity.domain]}</Text>
        <Text style={styles.rowTitle}>{activity.title}</Text>
      </View>
      <View style={styles.rowMeta}>
        <Text style={styles.rowDuration}>
          {activity.duration_label ?? `${activity.duration_minutes} min`}
        </Text>
        <ChevronRight />
      </View>
    </Pressable>
  );
}

/**
 * Once every domain for the day is done, the list of rows has nothing left
 * to act on, so it folds into this single card — the day's result without
 * the clutter. Still tappable: reopens the full list to look back at what
 * was done. Shared between Home and the Child hub, same as the rows above.
 */
export function EndOfDay({
  childName,
  collapsed,
  onToggle,
}: {
  childName: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [styles.endCard, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={collapsed ? "Show today's four activities" : "Hide today's activities"}
    >
      {/* No title here — callers that want a headline show it themselves
          (see Home's "Nicely done today."); repeating it read as the same
          sentence twice. */}
      <Text style={styles.endBody}>
        Motor, communication, cognitive and social — {childName} had a bit of each today.
      </Text>
      <Text style={styles.endToggle}>{collapsed ? "Show what we did ›" : "Hide"}</Text>
    </Pressable>
  );
}

/** Done, and staying visible — quieter, but not struck through or greyed out.
 *  Still opens on tap: finishing an activity shouldn't lock the parent out of
 *  the steps they just followed, or of doing it a second time. */
export function ActivityDoneRow({
  activity,
  onPress,
}: {
  activity: Activity;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, styles.rowDone, pressed && { opacity: 0.5 }]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${activity.title}, completed`}
    >
      <CheckIcon />
      <View style={styles.rowText}>
        <Text style={styles.rowDomainDone}>{DOMAIN_LABEL[activity.domain]}</Text>
        <Text style={styles.rowTitleDone} numberOfLines={1}>
          {activity.title}
        </Text>
      </View>
      <ChevronRight />
    </Pressable>
  );
}

/** Opened on tap — WHAT is already visible above (the collapsed row); this
 *  adds HOW, WHY THIS MATTERS, an optional trust marker, and what's needed. */
export function ActivityExpandedCard({
  activity,
  canSwap,
  highlighted = false,
  isDone = false,
  ageLabel,
  onComplete,
  onSwap,
  onCollapse,
}: {
  activity: Activity;
  canSwap: boolean;
  highlighted?: boolean;
  /** Already completed today — reopened to re-read, not to re-log. */
  isDone?: boolean;
  /** e.g. "8 months" — powers the optional "Why this?" explanation. */
  ageLabel?: string | null;
  onComplete: () => void;
  onSwap: () => void;
  onCollapse: () => void;
}) {
  const router = useRouter();
  const [showWhyThis, setShowWhyThis] = useState(false);
  // Matched on the activity's own band rather than the child's, so a
  // swapped-in activity for an adjacent stage still suggests the right thing.
  const kitItem = kitItemsFor(activity.materials, activity.age_band)[0];
  const steps = (activity.instructions ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);

  return (
    <View style={[styles.card, highlighted && styles.tourHighlight]}>
      {/* PROTOTYPE: only "Reach for it" has a clip right now. */}
      {activity.title === "Reach for it" && <ActivityVideo style={styles.activityVideo} />}
      <Pressable onPress={onCollapse} style={styles.cardHeader} accessibilityRole="button" accessibilityLabel="Collapse">
        <View style={styles.cardCopy}>
          <Text style={styles.domainLabel}>{DOMAIN_LABEL[activity.domain].toUpperCase()}</Text>
          <Text style={styles.title}>{activity.title}</Text>
        </View>
        <View style={styles.duration}>
          <ClockIcon />
          <Text style={styles.durationText}>
            {activity.duration_label ?? `${activity.duration_minutes} min`}
          </Text>
        </View>
      </Pressable>

      {ageLabel && (
        <Pressable onPress={() => setShowWhyThis((v) => !v)} hitSlop={6} accessibilityRole="button">
          <Text style={styles.whyThisLink}>{showWhyThis ? "Hide" : "Why this?"}</Text>
        </Pressable>
      )}
      {ageLabel && showWhyThis && (
        <Text style={styles.whyThisText}>
          Your child is {ageLabel}, and this {DOMAIN_LABEL[activity.domain].toLowerCase()} activity
          supports skills developing around this stage.
        </Text>
      )}

      {steps.length > 0 && (
        <View style={styles.howBlock}>
          <Text style={styles.blockLabel}>HOW</Text>
          {steps.map((step, i) => (
            <View key={step} style={styles.stepRow}>
              {steps.length > 1 && <Text style={styles.stepNumber}>{i + 1}</Text>}
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      )}

      {/* WHY THIS MATTERS — genuinely new information, not a repeat of WHAT. */}
      <View style={styles.whyMattersBlock}>
        <Text style={styles.blockLabel}>WHY THIS MATTERS</Text>
        <Text style={styles.whyMattersText}>
          {activity.benefit ?? DOMAIN_BENEFIT_FALLBACK[activity.domain]}
        </Text>
      </View>

      {/* What you'll need. The household answer comes first and is the
          primary text — nothing here is a shopping list, and the activity
          works without owning anything. */}
      <View style={styles.needBlock}>
        <Text style={styles.blockLabel}>WHAT YOU&rsquo;LL NEED</Text>
        <Text style={styles.needPrimary}>{activity.materials}</Text>
        {kitItem && <Text style={styles.needAlt}>{kitItem.household}</Text>}
        {kitItem && (
          <Pressable
            onPress={() => router.push("/child/kit")}
            hitSlop={6}
            style={({ pressed }) => pressed && { opacity: 0.55 }}
          >
            <Text style={styles.kitNote}>
              We also make one — {kitItem.name.toLowerCase()} ›
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.actionRow}>
        {isDone ? (
          // Already logged today. Shown as a quiet marker rather than a live
          // button so a second tap can't double-log the same activity.
          <View style={styles.doneMarker}>
            <CheckIcon />
            <Text style={styles.doneMarkerText}>Done today</Text>
          </View>
        ) : (
          <Pressable
            style={styles.activityButton}
            onPress={onComplete}
            accessibilityRole="button"
            accessibilityLabel={`Mark ${activity.title} done`}
          >
            <Text style={styles.activityButtonText}>Done</Text>
          </Pressable>
        )}
        {canSwap && !isDone && (
          <Pressable
            onPress={onSwap}
            style={styles.swapButton}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Show a different activity"
          >
            <RefreshIcon />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function ClockIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 7v5.5l3.5 2M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z"
        stroke={colors.textMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RefreshIcon() {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4v4.2h-4.2"
        stroke={colors.warmTaupe}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 12.5 9.5 17.5 19.5 6.5"
        stroke={colors.sage}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRight() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5l7 7-7 7"
        stroke={colors.textMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md - 1,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowDone: {
    opacity: 0.78,
  },
  rowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: colors.softSand,
  },
  rowText: { flex: 1 },
  rowMeta: {
    alignItems: "flex-end",
    gap: 2,
  },
  rowDomain: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.warmTaupe,
  },
  rowTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.bodySmall,
    color: colors.charcoal,
    marginTop: 1,
  },
  rowDuration: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.caption,
    color: colors.textMuted,
  },
  rowDomainDone: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  rowTitleDone: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    color: colors.textMuted,
    marginTop: 1,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  tourHighlight: {
    borderWidth: 1,
    borderColor: colors.warmTaupe,
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 6,
  },
  domainLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.4,
    color: colors.warmTaupe,
    marginBottom: 2,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.25,
    color: colors.charcoal,
  },
  blockLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.3,
    color: colors.warmTaupe,
    marginBottom: spacing.sm,
  },
  howBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  stepRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  stepNumber: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.bodySmall,
    color: colors.softSand,
    width: 14,
  },
  stepText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.55,
    color: colors.textMuted,
  },
  whyMattersBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  whyMattersText: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.55,
    color: colors.textMuted,
  },
  needBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  needPrimary: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.5,
    color: colors.charcoal,
  },
  needAlt: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.55,
    color: colors.textMuted,
    marginTop: 2,
  },
  kitNote: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.warmTaupe,
    marginTop: spacing.sm,
  },
  whyThisLink: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    color: colors.warmTaupe,
    marginTop: spacing.xs,
  },
  whyThisText: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    lineHeight: typeScale.caption * 1.5,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  activityVideo: {
    width: "100%",
    aspectRatio: 16 / 9,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  cardCopy: { flex: 1 },
  duration: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  durationText: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.caption,
    color: colors.textMuted,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  activityButton: {
    minWidth: 64,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.warmTaupe,
  },
  activityButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    color: colors.white,
  },
  doneMarker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
  },
  doneMarkerText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    color: colors.textMuted,
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  endCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "rgba(168, 181, 164, 0.20)",
  },
  endBody: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.5,
    color: colors.textMuted,
  },
  endToggle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    color: colors.warmTaupe,
    marginTop: spacing.sm,
  },
});
