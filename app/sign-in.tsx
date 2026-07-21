import { useRouter } from "expo-router";
import { useState } from "react";
import { Body, PrimaryButton } from "../components/ui";
import { DisplayField, FadeIn, Hint, OnboardingScreen, Prompt } from "../components/onboarding";
import { supabase } from "../lib/supabase";

// Returning neighbours: same passwordless code, no onboarding. The entry
// route sends them straight to Today's Plan once the session is live.
export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async () => {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push({ pathname: "/verify", params: { email: email.trim(), mode: "signin" } });
  };

  return (
    <OnboardingScreen
      footer={
        <PrimaryButton
          title="Send my code"
          onPress={sendCode}
          loading={loading}
          disabled={!email.includes("@")}
        />
      }
    >
      <FadeIn>
        <Prompt>Welcome back.</Prompt>
        <Hint>Enter your email and we&rsquo;ll send a six-digit code. No password needed.</Hint>
        <DisplayField
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          onSubmitEditing={() => email.includes("@") && sendCode()}
        />
        {error && <Body muted>{error}</Body>}
      </FadeIn>
    </OnboardingScreen>
  );
}
