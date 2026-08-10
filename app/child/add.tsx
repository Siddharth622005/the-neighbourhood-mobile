import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DateWheel, MONTHS, isComplete, type DateParts } from "../../components/DateWheel";
import { DisplayField, FadeIn, Hint, OnboardingScreen, Prompt } from "../../components/onboarding";
import { PrimaryButton } from "../../components/ui";
import { useAuth } from "../../lib/AuthProvider";
import { computeAge } from "../../lib/childAge";
import { colors, fonts, radius, spacing, typeScale } from "../../lib/theme";

const TODAY = new Date();
const LATEST_YEAR = TODAY.getFullYear();
const EARLIEST_YEAR = LATEST_YEAR - 12;

const GENDER_OPTIONS = ["Male", "Female", "Prefer not to say"];

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Add a second (or third) child — reuses the same name/birthday/gender
 * inputs as main onboarding, but as one screen: this is a quick addition
 * for an existing family, not a fresh onboarding pass.
 */
export default function AddChild() {
  const router = useRouter();
  const { addChild } = useAuth();
  const [name, setName] = useState("");
  const [parts, setParts] = useState<DateParts>({ year: null, month: null, day: null });
  const [gender, setGender] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const dateComplete = isComplete(parts);
  const iso = dateComplete ? toISO(parts.year, parts.month, parts.day) : null;
  const inFuture = iso ? new Date(iso + "T00:00:00").getTime() > TODAY.getTime() : false;
  const age = iso && !inFuture ? computeAge(iso) : null;
  const ready = name.trim().length > 0 && dateComplete && !inFuture && !saving;

  const handleSave = async () => {
    if (!ready || !iso) return;
    setSaving(true);
    setSaveError(false);
    try {
      await addChild({ name: name.trim(), dateOfBirth: iso, gender });
      router.back();
    } catch {
      setSaving(false);
      setSaveError(true);
    }
  };

  return (
    <OnboardingScreen
      scroll
      footer={<PrimaryButton title="Add child" onPress={handleSave} disabled={!ready} />}
    >
      <FadeIn>
        <Prompt>Add another child</Prompt>
        <Hint>Their own activities, milestones and vaccinations — kept separate from the rest.</Hint>

        <DisplayField
          label="Their name"
          value={name}
          onChangeText={setName}
          placeholder="Their first name"
          autoCapitalize="words"
        />

        <View style={styles.spacer} />

        <DateWheel value={parts} onChange={setParts} earliestYear={EARLIEST_YEAR} latestYear={LATEST_YEAR} />

        {inFuture ? (
          <Text style={styles.error}>That date hasn&rsquo;t happened yet.</Text>
        ) : (
          dateComplete &&
          age && (
            <Text style={styles.echo}>
              {parts.day} {MONTHS[parts.month]} {parts.year} — that makes them {age.label}.
            </Text>
          )
        )}

        <View style={styles.spacer} />

        <Text style={styles.genderLabel}>Gender (optional)</Text>
        <View style={styles.genderRow}>
          {GENDER_OPTIONS.map((option) => {
            const selected = gender === option;
            return (
              <Pressable
                key={option}
                onPress={() => setGender(selected ? null : option)}
                style={[styles.genderPill, selected && styles.genderPillOn]}
              >
                <Text style={[styles.genderPillText, selected && styles.genderPillTextOn]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {saveError && (
          <Text style={styles.error}>
            We couldn&rsquo;t save that. Check your connection and try again.
          </Text>
        )}
      </FadeIn>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  spacer: { height: spacing.lg },
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
  genderLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  genderRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  genderPill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genderPillOn: { backgroundColor: colors.warmTaupe, borderColor: colors.warmTaupe },
  genderPillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.bodySmall,
    color: colors.charcoal,
  },
  genderPillTextOn: { color: colors.white },
});
