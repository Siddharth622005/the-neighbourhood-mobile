import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text } from "react-native";
import { PrimaryButton } from "../../components/ui";
import { FadeIn, Hint, OnboardingScreen, Prompt } from "../../components/onboarding";
import { computeAge } from "../../lib/childAge";
import { useOnboarding } from "../../lib/OnboardingProvider";
import { colors, fonts, spacing, typeScale } from "../../lib/theme";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Local-date safe — avoids the UTC day-shift that Date#toISOString() can
// introduce when the device's timezone is ahead of UTC.
function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplay(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const TODAY = new Date();
const EARLIEST = new Date(TODAY.getFullYear() - 12, TODAY.getMonth(), TODAY.getDate());
const DEFAULT_DATE = new Date(TODAY.getFullYear(), TODAY.getMonth() - 18, TODAY.getDate()); // a plausible toddler age

export default function Birthday() {
  const router = useRouter();
  const { draft, update } = useOnboarding();
  const [date, setDate] = useState<Date | null>(() => {
    if (!draft.dateOfBirth) return null;
    const [y, m, d] = draft.dateOfBirth.split("-").map(Number);
    return new Date(y, m - 1, d);
  });
  const [showPicker, setShowPicker] = useState(false);

  const age = date ? computeAge(toISO(date)) : null;

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (event.type === "dismissed") return;
    if (selected) setDate(selected);
  };

  const handleContinue = () => {
    if (!date) return;
    update({ dateOfBirth: toISO(date) });
    router.push("/onboarding/gender");
  };

  return (
    <OnboardingScreen
      progress={2 / 3}
      scroll
      footer={<PrimaryButton title="Continue" onPress={handleContinue} disabled={!date} />}
    >
      <FadeIn>
        <Prompt>When was your child born?</Prompt>
        <Hint>
          We use their date of birth to personalize developmental milestones and activities to
          their exact age.
        </Hint>

        <Pressable
          onPress={() => setShowPicker((v) => !v)}
          style={styles.field}
          accessibilityRole="button"
          accessibilityLabel="Select date of birth"
        >
          <Text style={date ? styles.fieldValue : styles.fieldPlaceholder}>
            {date ? formatDisplay(date) : "Select date of birth"}
          </Text>
        </Pressable>

        {showPicker && (
          <DateTimePicker
            value={date ?? DEFAULT_DATE}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            maximumDate={TODAY}
            minimumDate={EARLIEST}
            onChange={handleChange}
            themeVariant="light"
          />
        )}

        {age && <Text style={styles.echo}>That makes them {age.label}.</Text>}
      </FadeIn>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  field: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
    marginTop: spacing.lg,
  },
  fieldValue: {
    fontFamily: fonts.bodyMedium,
    fontSize: 30,
    color: colors.charcoal,
  },
  fieldPlaceholder: {
    fontFamily: fonts.bodyMedium,
    fontSize: 30,
    color: colors.textMuted,
  },
  echo: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.body,
    color: colors.warmTaupe,
    marginTop: spacing.lg,
  },
});
