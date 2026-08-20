import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { View } from "react-native";
import { PrimaryButton } from "../../components/ui";
import { FadeIn, Hint, OnboardingScreen, Prompt, SelectableCard } from "../../components/onboarding";
import {
  resumeFromDraft,
  useDraftState,
  useOnboarding,
  type OnboardingDraft,
} from "../../lib/OnboardingProvider";
import { spacing } from "../../lib/theme";

const OPTIONS: { value: OnboardingDraft["birthMethod"]; label: string; gloss: string }[] = [
  { value: "vaginal", label: "Vaginal birth", gloss: "Including forceps or ventouse." },
  { value: "caesarean", label: "Caesarean", gloss: "Planned or emergency." },
  { value: "prefer_not_to_say", label: "Rather not say", gloss: "We'll keep it general." },
];

/**
 * Only reached for a mother (or a parent who hasn't said either way) — see
 * resumeFromDraft in lib/OnboardingProvider.tsx. A father never sees this
 * screen; asking him "how did your baby arrive" in the first person
 * doesn't parse, and his relevant support lives in "For Dads" instead.
 */
export default function BirthType() {
  const router = useRouter();
  const { draft, hydrated, update } = useOnboarding();
  const [birthMethod, setBirthMethod] = useDraftState<OnboardingDraft["birthMethod"]>(
    (d) => d.birthMethod,
    (v) => v === ""
  );

  // A father who somehow lands here (e.g. a restored deep link) has
  // nothing to answer — send them straight to whatever's actually next
  // for their draft rather than showing a question that doesn't apply.
  // Gated on `hydrated`: before the AsyncStorage read lands the draft is
  // empty, and an empty draft resolves to the very first step — which
  // would bounce a parent reloading this screen back to the start.
  //
  // useFocusEffect, not useEffect: see the identical comment in
  // feeding.tsx. A Stack push leaves this screen mounted underneath
  // whatever comes next, so a plain useEffect re-fires this guard on every
  // later draft change too (e.g. answering Gender) and can clobber a
  // forward navigation with a stale replace. Scoping to focus means it
  // only runs while this screen is actually the one on screen.
  useFocusEffect(
    useCallback(() => {
      if (!hydrated) return;
      if (draft.role === "father") router.replace(resumeFromDraft(draft));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft, hydrated, router])
  );

  const handleContinue = () => {
    const next = { ...draft, birthMethod };
    update({ birthMethod });
    router.push(resumeFromDraft(next));
  };

  return (
    <OnboardingScreen
      progress={5 / 7}
      footer={
        <PrimaryButton title="Continue" onPress={handleContinue} disabled={!birthMethod} />
      }
    >
      <FadeIn>
        <Prompt>What type of birth did you have?</Prompt>
        <Hint>This personalises your own recovery guidance. Used only to personalise your experience.</Hint>
        <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
          {OPTIONS.map((option) => (
            <SelectableCard
              key={option.value}
              title={option.label}
              gloss={option.gloss}
              selected={birthMethod === option.value}
              onPress={() => setBirthMethod(option.value)}
            />
          ))}
        </View>
      </FadeIn>
    </OnboardingScreen>
  );
}
