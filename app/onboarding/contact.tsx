import { useRouter } from "expo-router";
import { useState } from "react";
import { Body, Eyebrow, PrimaryButton } from "../../components/ui";
import { DisplayField, FadeIn, Hint, OnboardingScreen, Prompt } from "../../components/onboarding";
import { useOnboarding } from "../../lib/OnboardingProvider";
import { supabase } from "../../lib/supabase";
import { StyleSheet, Text } from "react-native";
import { colors, fonts, spacing, typeScale } from "../../lib/theme";

const isValidMobile = (v: string) => v.replace(/\D/g, "").length >= 10;
const isValidEmail = (v: string) => v.includes("@") && v.includes(".");

export default function Contact() {
  const router = useRouter();
  const { draft, update } = useOnboarding();
  const [mobile, setMobile] = useState(draft.mobile);
  const [email, setEmail] = useState(draft.email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = isValidMobile(mobile) && isValidEmail(email);

  const handleContinue = async () => {
    if (!ready) return;
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    update({ mobile: mobile.trim(), email: email.trim() });
    router.push({ pathname: "/verify", params: { email: email.trim(), mode: "onboard" } });
  };

  return (
    <OnboardingScreen
      progress={1 / 8}
      scroll
      footer={
        <>
          <PrimaryButton title="Continue" onPress={handleContinue} loading={loading} disabled={!ready} />
          <Text style={styles.trustLine}>
            Private to your family. Never sold, never shared.
          </Text>
        </>
      }
    >
      <FadeIn>
        <Eyebrow>Takes less than 30 seconds</Eyebrow>
        <Prompt>How can we reach you?</Prompt>
        <Hint>
          Your mobile gets today&rsquo;s plan the moment it&rsquo;s ready. Email is just a backup.
          Neither is ever used for spam.
        </Hint>
        <DisplayField
          label="Mobile number"
          value={mobile}
          onChangeText={setMobile}
          placeholder="10-digit number"
          keyboardType="phone-pad"
          autoComplete="tel"
        />
        <DisplayField
          label="Email address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          onSubmitEditing={handleContinue}
        />
        {error && <Body muted>{error}</Body>}
      </FadeIn>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  trustLine: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
