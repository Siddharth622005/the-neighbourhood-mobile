import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { PrimaryButton } from "../../components/ui";
import { FadeIn, Hint, OnboardingScreen, Prompt, SelectableCard } from "../../components/onboarding";
import { resumeFromDraft, useOnboarding, type OnboardingDraft } from "../../lib/OnboardingProvider";
import { spacing } from "../../lib/theme";

const OPTIONS: { value: OnboardingDraft["feedingMethod"]; label: string; gloss: string }[] = [
  { value: "exclusive", label: "Breast milk only", gloss: "Directly, expressed, or both." },
  { value: "combination", label: "Breast milk and formula", gloss: "Whatever the mix." },
  { value: "formula", label: "Formula", gloss: "However you got here." },
  { value: "prefer_not_to_say", label: "Rather not say", gloss: "We won't assume." },
];

/**
 * Only reached for a mother (or undeclared role) with a child still in
 * their first year — see resumeFromDraft in lib/OnboardingProvider.tsx.
 * A father, or a parent whose child has grown past the newborn stage,
 * never sees this: an 18-month-old's parent doesn't need a postpartum
 * feeding question.
 */
export default function Feeding() {
  const router = useRouter();
  const { draft, update } = useOnboarding();
  const [feedingMethod, setFeedingMethod] = useState<OnboardingDraft["feedingMethod"]>(
    draft.feedingMethod
  );

  // Landed here without it actually being the right next step (e.g. a
  // restored deep link after the child's age or role changed) — resolve
  // to whatever's genuinely next instead of showing an irrelevant question.
  useEffect(() => {
    if (resumeFromDraft(draft) !== "/onboarding/feeding") router.replace(resumeFromDraft(draft));
  }, [draft, router]);

  const handleContinue = () => {
    update({ feedingMethod });
    router.push("/onboarding/gender");
  };

  return (
    <OnboardingScreen
      progress={6 / 7}
      footer={
        <PrimaryButton title="Continue" onPress={handleContinue} disabled={!feedingMethod} />
      }
    >
      <FadeIn>
        <Prompt>How are you feeding your baby?</Prompt>
        <Hint>This personalises your own nutrition support. Used only to personalise your experience.</Hint>
        <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
          {OPTIONS.map((option) => (
            <SelectableCard
              key={option.value}
              title={option.label}
              gloss={option.gloss}
              selected={feedingMethod === option.value}
              onPress={() => setFeedingMethod(option.value)}
            />
          ))}
        </View>
      </FadeIn>
    </OnboardingScreen>
  );
}
