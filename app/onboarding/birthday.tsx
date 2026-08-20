import { useRouter } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { PrimaryButton } from "../../components/ui";
import { BornEarlyQuestion } from "../../components/BornEarlyQuestion";
import { DateWheel, MONTHS, isComplete, type DateParts } from "../../components/DateWheel";
import { FadeIn, Hint, OnboardingScreen, Prompt } from "../../components/onboarding";
import { CORRECTION_UNTIL_MONTHS, computeAge } from "../../lib/childAge";
import { resumeFromDraft, useDraftState, useOnboarding } from "../../lib/OnboardingProvider";
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

  const [parts, setParts] = useDraftState<DateParts>(
    (d) => {
      if (!d.dateOfBirth) return { year: null, month: null, day: null };
      const [y, m, day] = d.dateOfBirth.split("-").map(Number);
      return { year: y, month: m - 1, day };
    },
    (p) => p.year === null && p.month === null && p.day === null
  );

  const complete = isComplete(parts);
  const iso = complete ? toISO(parts.year, parts.month, parts.day) : null;
  const age = iso ? computeAge(iso) : null;

  // A date in the future is the one nonsensical answer this picker can
  // still produce (e.g. a day later this month), so it's blocked here.
  const inFuture = iso ? new Date(iso + "T00:00:00").getTime() > TODAY.getTime() : false;
  const dateReady = complete && !inFuture;

  // Prematurity only changes anything while correction still applies, so
  // the question appears for a child under two and stays invisible for
  // everyone else — no extra screen, no extra tap for most parents.
  const asksBornEarly = !!age && !inFuture && age.totalMonths < CORRECTION_UNTIL_MONTHS;

  // Mandatory whenever it's asked at all: corrected age silently drives
  // every discovery and activity a preterm child sees (see
  // lib/childAge.ts developmentalAge), so a skipped answer here isn't a
  // shrug — it's a wrong assumption baked into the rest of the product.
  // `null` is the one value that means "not answered yet"; both "born on
  // time" (40) and any real week count clear it.
  const bornEarlyAnswered = !asksBornEarly || draft.gestationalWeeks !== null;
  const ready = dateReady && bornEarlyAnswered;

  const handleContinue = () => {
    if (!iso || !dateReady || !ready) return;
    // A date edited upwards past the correction window leaves a stale
    // gestation behind. developmentalAge ignores it anyway, but carrying a
    // fact the parent can no longer see or change is how quiet wrongness
    // gets in.
    const gestationalWeeks = asksBornEarly ? draft.gestationalWeeks : null;
    update({ dateOfBirth: iso, gestationalWeeks });
    // Next stop depends on role (birth type is never asked of a father)
    // and the child's age (feeding is skipped once a newborn framing no
    // longer fits) — resumeFromDraft is the one place that logic lives.
    router.push(resumeFromDraft({ ...draft, dateOfBirth: iso, gestationalWeeks }));
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

        {asksBornEarly && (
          <BornEarlyQuestion
            value={draft.gestationalWeeks}
            onChange={(gestationalWeeks) => update({ gestationalWeeks })}
            childName={draft.childName}
          />
        )}

        {dateReady && asksBornEarly && !bornEarlyAnswered && (
          <Text style={styles.required}>
            Let us know if {draft.childName || "your child"} was born early or on time to
            continue.
          </Text>
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
  required: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
