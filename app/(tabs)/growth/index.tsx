import { useLocalSearchParams, useRouter } from "expo-router";
import { useScreenFocus } from "../../../lib/useScreenFocus";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { GuidedTourDialog } from "../../../components/GuidedTourDialog";
import { ChevronRight } from "../../../components/TabIcons";
import { useAuth } from "../../../lib/AuthProvider";
import { computeAge, stageLabel } from "../../../lib/childAge";
import * as growth from "../../../lib/db/growth";
import { DOMAIN_LABEL, type Domain, type Milestone, type VaccinationScheduleItem } from "../../../lib/db/types";
import { markFirstRunComplete, markHomeCoachComplete } from "../../../lib/firstRun";
import { growthHref } from "../../../lib/growthSections";
import { colors, fonts, radius, spacing, typeScale } from "../../../lib/theme";

const KIT_PREVIEW = [
  "Textured fabric squares",
  "High-contrast cards",
  "Wooden rattle",
];

const PRODUCT_PICK = {
  title: "Play mat with arches",
  reason: "Encourages reaching and tummy time at this stage.",
};

export default function Growth() {
  const router = useRouter();
  const params = useLocalSearchParams<{ guidedTour?: string; next?: string }>();
  const { child } = useAuth();
  const age = child ? computeAge(child.date_of_birth) : null;
  const ageMonths = age?.totalMonths ?? 0;
  // See guide.tsx: only the focused screen may show a tour dialog.
  const isFocused = useScreenFocus();
  const guidedTour = params.guidedTour === "1" && isFocused;
  const afterOnboardingTour = params.next === "milestones";
  const tourNext = afterOnboardingTour ? "&next=milestones" : "";

  const [milestoneStats, setMilestoneStats] = useState<{ achieved: number; total: number } | null>(null);
  const [nextVaccination, setNextVaccination] = useState<VaccinationScheduleItem | null>(null);
  const [focusMilestone, setFocusMilestone] = useState<Milestone | null>(null);

  const loadStats = useCallback(async () => {
    if (!child) return;
    try {
      const [current, achieved, schedule, recorded] = await Promise.all([
        growth.getMilestonesForCurrentAge(ageMonths),
        growth.getAchievedMilestones(child.id),
        growth.getVaccinationSchedule(),
        growth.getAdministeredVaccinations(child.id),
      ]);
      const achievedIds = new Set(achieved.map((m) => m.milestone_id));
      setMilestoneStats({ achieved: achieved.length, total: current.length });
      const unachieved = current.filter((m) => !achievedIds.has(m.id));
      setFocusMilestone(unachieved[0] ?? current[0] ?? null);

      const recordedIds = new Set(recorded.map((v) => v.vaccination_id));
      const ageDays = Math.floor(
        (Date.now() - new Date(`${child.date_of_birth}T00:00:00`).getTime()) / 86_400_000
      );
      const remaining = schedule.filter((v) => !recordedIds.has(v.id));
      setNextVaccination(remaining.find((v) => v.age_days >= ageDays) ?? remaining[0] ?? null);
    } catch {}
  }, [child, ageMonths]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const skipGuidedTour = async () => {
    await Promise.all([markHomeCoachComplete(), markFirstRunComplete()]).catch(() => {});
    router.replace("/home");
  };

  const stage = stageLabel(ageMonths);

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>YOUR CHILD</Text>
        <Text style={styles.title}>
          {child?.name ? `${child.name}'s journey` : "Your child, in context"}
        </Text>
        <Text style={styles.body}>
          {age
            ? `${age.label} old — ${stage}. A calm overview of where they are, what's ahead, and what helps at home.`
            : "A calm overview of where they are, what's ahead, and what helps at home."}
        </Text>

        {/* --- Milestones: live context --- */}
        <Pressable
          style={[styles.sectionCard, guidedTour && styles.tourHighlight]}
          onPress={() => router.push(growthHref("milestones"))}
          accessibilityRole="button"
        >
          <View style={styles.cardHeader}>
            <MilestoneIcon />
            <Text style={styles.cardLabel}>MILESTONES</Text>
          </View>
          {focusMilestone && (
            <View style={styles.focusRow}>
              <View style={styles.domainDot} />
              <Text style={styles.focusText} numberOfLines={1}>
                {focusMilestone.description}
              </Text>
            </View>
          )}
          <View style={styles.cardFooter}>
            <Text style={styles.cardMeta}>
              {milestoneStats
                ? `${milestoneStats.achieved} noticed · ${milestoneStats.total} at this stage`
                : "See what's typical now"}
            </Text>
            <ChevronRight color={colors.textMuted} />
          </View>
        </Pressable>

        {/* --- Vaccinations: next due --- */}
        <Pressable
          style={styles.sectionCard}
          onPress={() => router.push(growthHref("vaccinations"))}
          accessibilityRole="button"
        >
          <View style={styles.cardHeader}>
            <VaccineIcon />
            <Text style={styles.cardLabel}>VACCINATIONS</Text>
          </View>
          <Text style={styles.cardTitle}>
            {nextVaccination ? nextVaccination.vaccine_name : "Keep vaccinations in view"}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardMeta}>
              {nextVaccination
                ? `Due around ${nextVaccination.age_label}`
                : "Review the schedule when it suits you"}
            </Text>
            <ChevronRight color={colors.textMuted} />
          </View>
        </Pressable>

        {/* --- Development Kit: contextual preview --- */}
        <Pressable
          style={styles.kitCard}
          onPress={() => router.push(growthHref("kit"))}
          accessibilityRole="button"
        >
          <View style={styles.cardHeader}>
            <KitIcon />
            <Text style={styles.cardLabel}>CURRENT PLAY KIT</Text>
          </View>
          <Text style={styles.cardTitle}>Recommended for {age?.label ?? "this stage"}</Text>
          <Text style={styles.kitBody}>
            Chosen for {stage} — simple things that match what they're ready for.
          </Text>
          <View style={styles.kitPreview}>
            {KIT_PREVIEW.map((item) => (
              <View key={item} style={styles.kitItem}>
                <View style={styles.kitDot} />
                <Text style={styles.kitItemText}>{item}</Text>
              </View>
            ))}
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.cardMeta}>See the full kit</Text>
            <ChevronRight color={colors.textMuted} />
          </View>
        </Pressable>

        {/* --- Product Guide: featured pick --- */}
        <Pressable
          style={styles.sectionCard}
          onPress={() => router.push(growthHref("products"))}
          accessibilityRole="button"
        >
          <View style={styles.cardHeader}>
            <ProductIcon />
            <Text style={styles.cardLabel}>HELPFUL AT THIS STAGE</Text>
          </View>
          <Text style={styles.cardTitle}>{PRODUCT_PICK.title}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardMeta}>{PRODUCT_PICK.reason}</Text>
            <ChevronRight color={colors.textMuted} />
          </View>
        </Pressable>

        {/* --- Reports & Guide: compact row --- */}
        <View style={styles.compactGroup}>
          <Pressable
            style={styles.compactRow}
            onPress={() => router.push(growthHref("reports"))}
            accessibilityRole="button"
          >
            <View style={styles.compactLeft}>
              <ReportsIcon />
              <View>
                <Text style={styles.compactTitle}>Reports</Text>
                <Text style={styles.compactBlurb}>Weekly and monthly summaries</Text>
              </View>
            </View>
            <ChevronRight color={colors.textMuted} />
          </Pressable>
          <View style={styles.compactDivider} />
          <Pressable
            style={styles.compactRow}
            onPress={() => router.push(growthHref("guide"))}
            accessibilityRole="button"
          >
            <View style={styles.compactLeft}>
              <GuideIcon />
              <View>
                <Text style={styles.compactTitle}>The Guide</Text>
                <Text style={styles.compactBlurb}>Expert guidance for real-life questions</Text>
              </View>
            </View>
            <ChevronRight color={colors.textMuted} />
          </Pressable>
        </View>
      </ScrollView>
      {guidedTour && (
        <GuidedTourDialog
          eyebrow="Your Child"
          focus="The journey timeline"
          title="Growth becomes a story."
          body="Milestones are moments to notice, not deadlines to chase."
          step={1}
          total={4}
          primaryTitle="Continue"
          onPrimary={() => router.replace(`/growth/guide?guidedTour=1&step=2${tourNext}`)}
          onSkip={skipGuidedTour}
        />
      )}
    </View>
  );
}

function MilestoneIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke={colors.warmTaupe} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function VaccineIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M9 2h6M12 2v4M5 12h14M7 8h10l1 4v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6l1-4Z" stroke={colors.warmTaupe} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function KitIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" stroke={colors.warmTaupe} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" stroke={colors.warmTaupe} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProductIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" stroke={colors.warmTaupe} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReportsIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path d="M3 3v18h18M7 16l4-4 4 4 6-6" stroke={colors.warmTaupe} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GuideIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2ZM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7Z" stroke={colors.warmTaupe} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
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

  // --- Section cards ---
  sectionCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(96, 79, 60, 0.1)",
  },
  tourHighlight: {
    borderColor: colors.warmTaupe,
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.sm,
  },
  cardLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1.3,
    color: colors.warmTaupe,
  },
  cardTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.body,
    color: colors.charcoal,
    lineHeight: typeScale.body * 1.35,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  cardMeta: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    lineHeight: typeScale.caption * 1.4,
    color: colors.textMuted,
  },

  // --- Focus milestone row ---
  focusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 6,
  },
  domainDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.sage,
  },
  focusText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.bodySmall,
    color: colors.charcoal,
  },

  // --- Kit card ---
  kitCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(96, 79, 60, 0.1)",
  },
  kitBody: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    lineHeight: typeScale.caption * 1.45,
    color: colors.textMuted,
    marginTop: 3,
  },
  kitPreview: {
    marginTop: spacing.sm,
    gap: 5,
  },
  kitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  kitDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.warmTaupe,
    opacity: 0.5,
  },
  kitItemText: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.charcoal,
  },

  // --- Compact rows ---
  compactGroup: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(96, 79, 60, 0.1)",
    overflow: "hidden",
  },
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  compactLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  compactTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.bodySmall,
    color: colors.charcoal,
  },
  compactBlurb: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  compactDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(96, 79, 60, 0.08)",
    marginHorizontal: spacing.md,
  },
});
