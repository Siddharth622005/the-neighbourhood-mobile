import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  FeatureCard,
  FeatureGrid,
  FeatureIcon,
  HubHeader,
  type FeatureIconName,
} from "../../../components/FeatureHub";
import { RecoveryWelcome } from "../../../components/RecoveryWelcome";
import { useAuth } from "../../../lib/AuthProvider";
import { computeAge } from "../../../lib/childAge";
import { usePalette } from "../../../lib/ModeProvider";
import {
  deriveProfile,
  elapsedPhrase,
  visibleCareAreas,
  type CareArea,
} from "../../../lib/parentCare";
import { useRecoveryProfile } from "../../../lib/recoveryProfile";
import { hasBeenAskedRecoveryProfile, isRecoveryRelevant, markAskedRecoveryProfile } from "../../../lib/recoveryRelevance";
import { spacing } from "../../../lib/theme";

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
  const p = usePalette();
  const { parentName, child } = useAuth();
  const { profile: recoveryProfile, hydrated: recoveryHydrated, updateProfile } =
    useRecoveryProfile();

  const ageMonths = child ? computeAge(child.date_of_birth)?.totalMonths ?? 0 : 0;

  /**
   * The recovery questions are asked HERE, on the first visit to this
   * space — see components/RecoveryWelcome. Three conditions, all of
   * which must hold: the parent hasn't been asked before, they haven't
   * already answered (via Settings), and a postpartum framing still fits
   * the child's age. Undefined means "still checking", which keeps the
   * welcome from flashing before storage is read.
   */
  const [askRecovery, setAskRecovery] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (!recoveryHydrated) return;
    if (!child) {
      setAskRecovery(false);
      return;
    }
    const alreadyAnswered =
      recoveryProfile.role !== "" ||
      recoveryProfile.feedingMethod !== "" ||
      recoveryProfile.birthMethod !== "";
    if (alreadyAnswered || !isRecoveryRelevant(ageMonths)) {
      setAskRecovery(false);
      return;
    }
    hasBeenAskedRecoveryProfile().then((asked) => setAskRecovery(!asked));
  }, [recoveryHydrated, child, recoveryProfile, ageMonths]);

  const closeRecoveryWelcome = () => {
    void markAskedRecoveryProfile();
    setAskRecovery(false);
  };

  const profile = useMemo(() => deriveProfile(ageMonths, recoveryProfile), [ageMonths, recoveryProfile]);
  const careAreas = useMemo(
    () => visibleCareAreas(profile.role, ageMonths, profile.delivery),
    [profile.role, profile.delivery, ageMonths],
  );

  if (askRecovery === undefined) return <View style={{ flex: 1, backgroundColor: p.bg }} />;

  if (askRecovery) {
    return (
      <RecoveryWelcome
        parentName={parentName?.trim().split(" ")[0] ?? null}
        onSave={({ role, feedingMethod, birthMethod }) => {
          updateProfile({
            role,
            feedingMethod,
            birthMethod,
            deliveryDate: recoveryProfile.deliveryDate || child?.date_of_birth || "",
          });
          closeRecoveryWelcome();
        }}
        onSkip={closeRecoveryWelcome}
      />
    );
  }

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

      <FeatureGrid>
        <FeatureCard
          icon={<FeatureIcon name="today" color={p.primary} />}
          title="Today"
          description="A quiet check-in, food that helps, and one small thing to do."
          onPress={() => router.push("/you/today")}
        />

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
          icon={<FeatureIcon name="meal" color={p.primary} />}
          title="Nutrition"
          description="What your body is asking for right now."
          onPress={() => router.push("/you/nutrition")}
        />

        <FeatureCard
          icon={<FeatureIcon name="guide" color={p.primary} />}
          title="The Guide"
          description="Courses and live workshops, expert-backed."
          onPress={() => router.push("/child/guide")}
        />
      </FeatureGrid>
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
