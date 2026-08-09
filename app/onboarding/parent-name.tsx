import { useRouter } from "expo-router";
import { useState } from "react";
import { PrimaryButton } from "../../components/ui";
import { DisplayField, FadeIn, Hint, OnboardingScreen, Prompt } from "../../components/onboarding";
import { useOnboarding } from "../../lib/OnboardingProvider";

/**
 * Parent name — one question per screen, matching the rest of the flow.
 *
 * Asked before the child's name so the next screen can be phrased as a
 * conversation rather than a form, and so the very first thing the app
 * learns is who it's talking to.
 */
export default function ParentName() {
  const router = useRouter();
  const { draft, update } = useOnboarding();
  const [name, setName] = useState(draft.parentName);

  const ready = name.trim().length > 0;

  const handleContinue = () => {
    if (!ready) return;
    update({ parentName: name.trim() });
    router.push("/onboarding/role");
  };

  return (
    <OnboardingScreen
      progress={1 / 7}
      scroll
      footer={<PrimaryButton title="Continue" onPress={handleContinue} disabled={!ready} />}
    >
      <FadeIn>
        <Prompt>What should we call you?</Prompt>
        <Hint>
          A first name is plenty. We use it so the app can talk to you like a neighbour, not a
          form.
        </Hint>
        <DisplayField
          label="Your name"
          value={name}
          onChangeText={setName}
          placeholder="Your first name"
          autoCapitalize="words"
          autoComplete="name"
          onSubmitEditing={handleContinue}
        />
      </FadeIn>
    </OnboardingScreen>
  );
}
