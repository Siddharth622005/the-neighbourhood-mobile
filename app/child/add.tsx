import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DateWheel, MONTHS, isComplete, type DateParts } from "../../components/DateWheel";
import {
  DisplayField,
  FadeIn,
  Hint,
  OnboardingScreen,
  Prompt,
  SelectableCard,
} from "../../components/onboarding";
import { PrimaryButton } from "../../components/ui";
import { useAuth } from "../../lib/AuthProvider";
import { computeAge } from "../../lib/childAge";
import * as family from "../../lib/db/family";
import { colors, fonts, radius, spacing, typeScale } from "../../lib/theme";

const TODAY = new Date();
const LATEST_YEAR = TODAY.getFullYear();
const EARLIEST_YEAR = LATEST_YEAR - 12;

const GENDER_OPTIONS = ["Male", "Female", "Prefer not to say"];

type BirthMethod = "vaginal" | "caesarean" | "prefer_not_to_say";

// Same three options and copy as onboarding/birth-type.tsx — kept in sync
// by hand since this screen asks it a second time (a new child, a new
// relevant birth), not as part of the same draft-driven flow.
const BIRTH_OPTIONS: { value: BirthMethod; label: string; gloss: string }[] = [
  { value: "vaginal", label: "Vaginal birth", gloss: "Including forceps or ventouse." },
  { value: "caesarean", label: "Caesarean", gloss: "Planned or emergency." },
  { value: "prefer_not_to_say", label: "Rather not say", gloss: "We'll keep it general." },
];

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
  const { addChild, profile, session, refreshFamily } = useAuth();
  const [name, setName] = useState("");
  const [parts, setParts] = useState<DateParts>({ year: null, month: null, day: null });
  const [gender, setGender] = useState<string | null>(null);
  const [birthMethod, setBirthMethod] = useState<BirthMethod | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // Delivery type is about the birthing parent's own body, so a father is
  // never asked — same rule as onboarding/birth-type.tsx. It's also stored
  // once on the profile, not per child (see lib/db/family.ts), so adding a
  // child here and answering this makes THIS birth the one that drives the
  // You tab's recovery framing going forward.
  const asksBirthMethod = profile?.relationship !== "father";

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
      if (asksBirthMethod && birthMethod && session?.user?.id) {
        await family.updateProfile(session.user.id, { birth_method: birthMethod });
        await refreshFamily();
      }
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
        <Hint>Their own activities, discoveries and vaccinations — kept separate from the rest.</Hint>

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

        {asksBirthMethod && (
          <>
            <View style={styles.spacer} />
            <Text style={styles.genderLabel}>What type of birth did you have? (optional)</Text>
            <View style={styles.birthStack}>
              {BIRTH_OPTIONS.map((option) => (
                <SelectableCard
                  key={option.value}
                  title={option.label}
                  gloss={option.gloss}
                  selected={birthMethod === option.value}
                  onPress={() =>
                    setBirthMethod((prev) => (prev === option.value ? null : option.value))
                  }
                />
              ))}
            </View>
          </>
        )}

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
  birthStack: { gap: spacing.sm },
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
