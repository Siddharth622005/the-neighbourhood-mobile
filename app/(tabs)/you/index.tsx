import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet } from "react-native";
import {
  FeatureCard,
  FeatureGrid,
  FeatureGroupLabel,
  FeatureIcon,
  HubHeader,
  type FeatureIconName,
} from "../../../components/FeatureHub";
import { GuidedTourDialog } from "../../../components/GuidedTourDialog";
import { useAuth } from "../../../lib/AuthProvider";
import { computeAge } from "../../../lib/childAge";
import { markFirstRunComplete, markHomeCoachComplete } from "../../../lib/firstRun";
import { usePalette } from "../../../lib/ModeProvider";
import {
  deriveProfile,
  elapsedPhrase,
  visibleCareAreas,
  type CareArea,
} from "../../../lib/parentCare";
import { isRecoveryRelevant } from "../../../lib/recoveryRelevance";
import { spacing } from "../../../lib/theme";
import { useGuidedTourStep } from "../../../lib/useGuidedTourStep";
import { useScreenFocus } from "../../../lib/useScreenFocus";

/**
 * You's landing hub — the mirror of Child's: a feature grid, not a page of
 * content. "Today" (the parent's own daily companion — check-in,
 * nourishment, recovery line) used to live at this exact URL; it's now
 * one tap away via its own card, at app/(tabs)/you/today.tsx, so the
 * landing spot can be a clean hub like Child's rather than a long scroll.
 *
 * Care's areas (Physical recovery, Mental health, Sleep, Relationships,
 * Feeding, For dads) each get their own card rather than being folded
 * into one "Care" card — visibleCareAreas() is the exact same
 * role/age/delivery filter the Care screen itself uses, reused rather
 * than re-derived, so a card never appears here for an area the Care
 * screen would show empty (or vice versa). A father never sees "Physical
 * recovery"; "For dads" only appears for a father; nothing shows once a
 * postpartum framing has stopped fitting the child's age.
 */
const CARE_ICONS: Record<CareArea, FeatureIconName> = {
  physical: "recovery",
  fathering: "dads",
  mental: "mental",
  sleep: "sleep",
  feeding: "meal",
  nutrition: "meal",
  relationships: "relationships",
};

export default function YouHub() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ guidedTour?: string; next?: string; step?: string }>();
  const p = usePalette();
  const { parentName, profile: authProfile, child } = useAuth();

  // The tour's final stop — see child/guide.tsx: only the focused screen
  // on matching route with the right step may show a tour dialog.
  const isFocused = useScreenFocus();
  const isYouRoute = pathname === "/you";
  const wantsGuidedTour = params.guidedTour === "1" && params.step === "4" && isFocused && isYouRoute;
  const guidedTour = useGuidedTourStep(4, wantsGuidedTour);
  const afterOnboardingTour = params.next === "milestones";

  const finishGuidedTour = async () => {
    await markHomeCoachComplete().catch(() => {});
    if (afterOnboardingTour) {
      router.replace("/child/milestones?initial=1&afterTour=1");
      return;
    }
    await markFirstRunComplete().catch(() => {});
    router.replace("/home?tourComplete=1");
  };

  const ageMonths = child ? computeAge(child.date_of_birth)?.totalMonths ?? 0 : 0;

  // Role/birth type/feeding method were asked once, during main
  // onboarding — see lib/AuthProvider.tsx's `profile` and
  // app/onboarding/role.tsx / birth-type.tsx / feeding.tsx. This hub used
  // to ask them itself on first visit; it now just reads what's already
  // known, the same way Home and Copilot do.
  const profile = useMemo(
    () => deriveProfile(ageMonths, authProfile),
    [ageMonths, authProfile],
  );
  const careAreas = useMemo(
    () => visibleCareAreas(profile.role, ageMonths, profile.delivery),
    [profile.role, profile.delivery, ageMonths],
  );

  const firstName = parentName?.trim().split(" ")[0];

  /**
   * Short and factual, matching Child's "{age} old" — the paragraph-length
   * reassurance now lives on the Today card's own screen, not the header.
   * Falls back to a plain line once a postpartum framing has stopped
   * fitting, rather than showing a stale "week 109 postpartum".
   */
  const subtitle = isRecoveryRelevant(ageMonths)
    ? profile.role === "father"
      ? `${elapsedPhrase(profile.weeksPostpartum)} in.`
      : `${elapsedPhrase(profile.weeksPostpartum)} postpartum.`
    : firstName
      ? `Everything here is for you, ${firstName}.`
      : "Everything here is for you.";

  return (
    <ScrollView
      style={{ backgroundColor: p.bg }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <HubHeader title="You" subtitle={subtitle} />

      {/* Zone 1, above the fold: the one obvious first action. Today and
          Nutrition are both daily, changing things — the parent should
          never have to scan the whole library just to check in. */}
      <FeatureGroupLabel>WHAT'S FOR TODAY</FeatureGroupLabel>
      <FeatureGrid>
        <FeatureCard
          icon={<FeatureIcon name="today" color={p.primary} />}
          title="Today"
          description="A quiet check-in, food that helps, and one small thing to do."
          onPress={() => router.push("/you/today")}
        />

        <FeatureCard
          icon={<FeatureIcon name="meal" color={p.primary} />}
          title="Nutrition"
          description="What your body is asking for right now."
          onPress={() => router.push("/you/nutrition")}
        />
      </FeatureGrid>

      {/* Zone 2: the reference library — same cards as before, just moved
          below the daily zone since they're read less often and change
          far less. */}
      <FeatureGroupLabel>PARENT CARE LIBRARY</FeatureGroupLabel>
      <FeatureGrid>
        {careAreas.map((area) => (
          <FeatureCard
            key={area.key}
            icon={<FeatureIcon name={CARE_ICONS[area.key]} color={p.primary} />}
            title={area.label}
            description={area.blurb}
            status={`${area.topicCount} ${area.topicCount === 1 ? "topic" : "topics"}`}
            onPress={() => router.push(`/you/care?area=${area.key}`)}
          />
        ))}

        <FeatureCard
          icon={<FeatureIcon name="guide" color={p.primary} />}
          title="The Guide"
          description="Courses and live workshops, expert-backed."
          onPress={() => router.push("/child/guide")}
        />
      </FeatureGrid>

      {guidedTour && (
        <GuidedTourDialog
          eyebrow="You"
          focus="And don't forget yourself"
          title="This part is yours."
          body="Parent Care, wellbeing, and nutrition — personalised to your role and your child's stage."
          step={4}
          total={5}
          primaryTitle="Start exploring"
          onPrimary={finishGuidedTour}
          onSkip={finishGuidedTour}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
