import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useScreenFocus } from "../../../lib/useScreenFocus";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  FeatureCard,
  FeatureGrid,
  FeatureIcon,
  HubHeader,
  type FeatureIconName,
} from "../../../components/FeatureHub";
import { GuidedTourDialog } from "../../../components/GuidedTourDialog";
import { useAuth } from "../../../lib/AuthProvider";
import { computeAge } from "../../../lib/childAge";
import { CHILD_SECTIONS, childHref, type ChildSection } from "../../../lib/childSections";
import * as growth from "../../../lib/db/growth";
import type { VaccinationScheduleItem } from "../../../lib/db/types";
import { markFirstRunComplete, markHomeCoachComplete } from "../../../lib/firstRun";
import { STAGE_LABEL, stageForAgeMonths } from "../../../lib/kidMealPlanner";
import { colors, spacing } from "../../../lib/theme";

/**
 * Child's landing hub — a feature grid, not a scrolling list under section
 * headers. Everything about understanding, supporting and tracking the
 * child is one screen, one tap away, visible without scrolling to
 * discover it exists.
 *
 * "Today's activities" deliberately isn't a card here — that's Home's job,
 * and a card that just deep-links back to a different tab would undercut
 * "everything here is about my child, in one place." See
 * lib/childSections.ts for the full reasoning.
 *
 * Status text on a card is only ever a REAL, already-loaded value (how
 * many milestones noticed, when the next vaccination is due) — never a
 * fabricated number. A card with nothing honest to say just shows its
 * description alone.
 */
const ICONS: Record<ChildSection["slug"], FeatureIconName> = {
  meals: "meal",
  milestones: "milestone",
  vaccinations: "vaccine",
  kit: "kit",
  reports: "reports",
  guide: "guide",
  products: "product",
};

export default function ChildHome() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ guidedTour?: string; step?: string; next?: string }>();
  const { child } = useAuth();
  const age = child ? computeAge(child.date_of_birth) : null;
  const ageMonths = age?.totalMonths ?? 0;
  const isFocused = useScreenFocus();
  const isChildRoute = pathname === "/child" || pathname === "/child/";
  const guidedTour = params.guidedTour === "1" && params.step === "1" && isFocused && isChildRoute;
  const afterOnboardingTour = params.next === "milestones";
  const tourNext = afterOnboardingTour ? "&next=milestones" : "";

  const [milestoneStats, setMilestoneStats] = useState<{ achieved: number; total: number } | null>(null);
  const [nextVaccination, setNextVaccination] = useState<VaccinationScheduleItem | null>(null);

  const loadStats = useCallback(async () => {
    if (!child) return;
    try {
      const [current, achieved, schedule, recorded] = await Promise.all([
        growth.getMilestonesForCurrentAge(ageMonths),
        growth.getAchievedMilestones(child.id),
        growth.getVaccinationSchedule(),
        growth.getAdministeredVaccinations(child.id),
      ]);
      setMilestoneStats({ achieved: achieved.length, total: current.length });

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
    if (afterOnboardingTour) {
      router.replace("/child/milestones?initial=1&afterTour=1");
      return;
    }
    router.replace("/home");
  };

  const statusFor = (slug: ChildSection["slug"]): string | undefined => {
    switch (slug) {
      case "milestones":
        return milestoneStats ? `${milestoneStats.achieved} noticed so far` : undefined;
      case "vaccinations":
        return nextVaccination ? `Due around ${nextVaccination.age_label}` : "Up to date";
      case "meals":
        return STAGE_LABEL[stageForAgeMonths(ageMonths)];
      default:
        return undefined;
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <HubHeader
          title={child?.name ?? "Your child"}
          subtitle={age ? `${age.label} old` : "What they're doing now, and what's coming."}
        />

        <FeatureGrid>
          {CHILD_SECTIONS.map((section) => (
            <FeatureCard
              key={section.slug}
              icon={<FeatureIcon name={ICONS[section.slug]} color={colors.warmTaupe} />}
              title={section.title}
              description={section.description}
              status={statusFor(section.slug)}
              onPress={() => router.push(childHref(section.slug))}
              highlighted={guidedTour && section.slug === "milestones"}
            />
          ))}
        </FeatureGrid>
      </ScrollView>
      {guidedTour && (
        <GuidedTourDialog
          eyebrow="Child"
          focus="The journey timeline"
          title="Growth becomes a story."
          body="Milestones are moments to notice, not deadlines to chase."
          step={1}
          total={4}
          primaryTitle="Continue"
          onPrimary={() => router.replace(`/child/guide?guidedTour=1&step=2${tourNext}`)}
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
