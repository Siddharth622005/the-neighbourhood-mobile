import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { PrimaryButton } from "../../components/ui";
import { DateWheel, MONTHS, isComplete, type DateParts } from "../../components/DateWheel";
import { FadeIn, Hint, OnboardingScreen, Prompt } from "../../components/onboarding";
import { computeAge } from "../../lib/childAge";
import { resumeFromDraft, useOnboarding } from "../../lib/OnboardingProvider";
import { colors, fonts, spacing, typeScale } from "../../lib/theme";

// Local-date safe — avoids the UTC day-shift that Date#toISOString() can
// introduce when the device's timezone is ahead of UTC.
function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const TODAY = new Date();
const LATEST_YEAR = TODAY.getFullYear();
const EARLIEST_YEAR = LATEST_YEAR - 12; // the product covers birth to seven

export default function Birthday() {
  const router = useRouter();
  const { draft, update } = useOnboarding();

  const [parts, setParts] = useState<DateParts>(() => {
    if (!draft.dateOfBirth) return { year: null, month: null, day: null };
    const [y, m, d] = draft.dateOfBirth.split("-").map(Number);
    return { year: y, month: m - 1, day: d };
  });

  const complete = isComplete(parts);
  const iso = complete ? toISO(parts.year, parts.month, parts.day) : null;
  const age = iso ? computeAge(iso) : null;

  // A date in the future is the one nonsensical answer this picker can
  // still produce (e.g. a day later this month), so it's blocked here.
  const inFuture = iso ? new Date(iso + "T00:00:00").getTime() > TODAY.getTime() : false;
  const ready = complete && !inFuture;

  const handleContinue = () => {
    if (!iso || !ready) return;
    update({ dateOfBirth: iso });
    // Next stop depends on role (birth type is never asked of a father)
    // and the child's age (feeding is skipped once a newborn framing no
    // longer fits) — resumeFromDraft is the one place that logic lives.
    router.push(resumeFromDraft({ ...draft, dateOfBirth: iso }));
  };

  return (
    <OnboardingScreen
      progress={4 / 7}
      scroll
      footer={<PrimaryButton title="Continue" onPress={handleContinue} disabled={!ready} />}
    >
      <FadeIn>
        <Prompt>When was {draft.childName || "your child"} born?</Prompt>
        <Hint>
          We use their date of birth to personalize developmental discoveries and activities to
          their exact age.
        </Hint>

        <DateWheel
          value={parts}
          onChange={setParts}
          earliestYear={EARLIEST_YEAR}
          latestYear={LATEST_YEAR}
        />

        {complete && (
          <Text style={styles.selected}>
            {parts.day} {MONTHS[parts.month]} {parts.year}
          </Text>
        )}

        {inFuture ? (
          <Text style={styles.error}>That date hasn&rsquo;t happened yet.</Text>
        ) : (
          age && <Text style={styles.echo}>That makes them {age.label}.</Text>
        )}
      </FadeIn>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  selected: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.h3,
    color: colors.charcoal,
    marginTop: spacing.lg,
  },
  echo: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.body,
    color: colors.warmTaupe,
    marginTop: spacing.sm,
  },
  error: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.body,
    color: colors.error,
    marginTop: spacing.sm,
  },
});
