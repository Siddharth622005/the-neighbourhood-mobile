import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../../components/ui";
import { FadeIn, Hint, OnboardingScreen, Prompt } from "../../components/onboarding";
import { useOnboarding } from "../../lib/OnboardingProvider";
import { colors, fonts, radius, spacing, typeScale } from "../../lib/theme";

const GENDER_OPTIONS = ["Male", "Female", "Prefer not to say"];

export default function Gender() {
  const router = useRouter();
  const { draft, update } = useOnboarding();
  const [gender, setGender] = useState(draft.gender);
  const childName = draft.childName || "your child";

  const handleContinue = () => {
    if (!gender) return;
    update({ gender });
    router.push("/onboarding/making");
  };

  return (
    <OnboardingScreen
      progress={5 / 5}
      footer={<PrimaryButton title="Continue" onPress={handleContinue} disabled={!gender} />}
    >
      <FadeIn>
        <Prompt>What&rsquo;s {childName}&rsquo;s gender?</Prompt>
        <Hint>This helps us personalize content where relevant.</Hint>
        <View style={styles.stack}>
          {GENDER_OPTIONS.map((option) => {
            const selected = gender === option;
            return (
              <Pressable
                key={option}
                onPress={() => setGender(option)}
                style={[styles.card, selected && styles.cardSelected]}
              >
                <Text style={styles.cardTitle}>{option}</Text>
                <View style={[styles.check, selected && styles.checkOn]}>
                  {selected && <Text style={styles.checkMark}>✓</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>
      </FadeIn>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  stack: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "transparent",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  cardSelected: {
    backgroundColor: "rgba(168, 181, 164, 0.20)",
    borderColor: colors.sage,
  },
  cardTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.body,
    color: colors.charcoal,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  checkMark: {
    color: colors.white,
    fontSize: 12,
    fontFamily: fonts.bodyBold,
  },
});
