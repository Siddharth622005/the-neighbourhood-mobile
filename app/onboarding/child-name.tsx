import { useRouter } from "expo-router";
import { useState } from "react";
import { PrimaryButton } from "../../components/ui";
import { DisplayField, FadeIn, Hint, OnboardingScreen, Prompt } from "../../components/onboarding";
import { useOnboarding } from "../../lib/OnboardingProvider";

/**
 * Child name — the last identity fact the app ever asks for outright.
 * Everything after this (interests, temperament, what they take to) is
 * learned from usage, never from another form.
 *
 * Greets the parent by the name they just gave, so the two screens read
 * as one exchange rather than two fields split apart.
 */
export default function ChildName() {
  const router = useRouter();
  const { draft, update } = useOnboarding();
  const [name, setName] = useState(draft.childName);

  const ready = name.trim().length > 0;

  const handleContinue = () => {
    if (!ready) return;
    update({ childName: name.trim() });
    router.push("/onboarding/birthday");
  };

  return (
    <OnboardingScreen
      progress={3 / 5}
      scroll
      footer={<PrimaryButton title="Continue" onPress={handleContinue} disabled={!ready} />}
    >
      <FadeIn>
        <Prompt>
          {draft.parentName ? `And who are we here for, ${draft.parentName}?` : "And who are we here for?"}
        </Prompt>
        <Hint>Your child&rsquo;s first name — it&rsquo;s how we&rsquo;ll refer to them from here on.</Hint>
        <DisplayField
          label="Your child's name"
          value={name}
          onChangeText={setName}
          placeholder="Their first name"
          autoCapitalize="words"
          onSubmitEditing={handleContinue}
        />
      </FadeIn>
    </OnboardingScreen>
  );
}
