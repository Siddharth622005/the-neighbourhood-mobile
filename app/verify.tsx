import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Body } from "../components/ui";
import { FadeIn, Hint, OnboardingScreen, OtpInput, Prompt } from "../components/onboarding";
import { useAuth } from "../lib/AuthProvider";
import * as session from "../lib/db/session";
import { supabase } from "../lib/supabase";
import { colors, fonts, spacing, typeScale } from "../lib/theme";

// Shared six-digit code screen for both onboarding (right after mobile +
// email) and returning sign-in. In onboarding mode, a verified session is
// all that's needed here — the auth trigger already created the parents
// row, and the child's DOB/gender are collected on the screens that follow.
export default function Verify() {
  const router = useRouter();
  const { email, mode } = useLocalSearchParams<{ email: string; mode?: string }>();
  const { refreshFamily } = useAuth();
  const linking = mode === "link";
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCanResend(true), 20000);
    return () => clearTimeout(t);
  }, []);

  const submit = async (token: string) => {
    setBusy(true);
    setError(null);

    // Linking an email to an account that already exists is an email
    // CHANGE, not a sign-up — different OTP type, and there's already a
    // session, so there's no new one to check for.
    if (linking) {
      try {
        await session.confirmEmailLink(String(email), token);
      } catch {
        setBusy(false);
        setError("That code didn't match — try once more, or resend a fresh one.");
        setCode("");
        return;
      }
      try {
        await refreshFamily();
      } catch {
        // The link succeeded regardless; the family is already loaded.
      }
      router.replace("/profile?linked=1");
      return;
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email: String(email),
      token,
      type: "email",
    });
    if (error || !data.session) {
      setBusy(false);
      setError("That code didn't match — try once more, or resend a fresh one.");
      setCode("");
      return;
    }
    try {
      await refreshFamily();
    } catch {
      // Even if the profile fetch hiccups, the session is valid — the
      // entry route will route to onboarding/connection-error as needed.
    }
    router.replace(mode === "onboard" ? "/onboarding/parent-name" : "/");
  };

  const resend = async () => {
    setCanResend(false);
    setError(null);
    if (linking) {
      await session.linkEmail(String(email)).catch(() => {});
    } else {
      await supabase.auth.signInWithOtp({
        email: String(email),
        options: { shouldCreateUser: true },
      });
    }
    setTimeout(() => setCanResend(true), 20000);
  };

  return (
    <OnboardingScreen
      footer={
        canResend ? (
          <Text style={styles.resend} onPress={resend}>
            Send a fresh code
          </Text>
        ) : (
          <Text style={styles.resendMuted}>You can request a new code in a moment.</Text>
        )
      }
    >
      <FadeIn>
        <Prompt>Check your email.</Prompt>
        <Hint>
          {linking
            ? `We sent a six-digit code to ${email}. Enter it and your family is safe on any device.`
            : `We sent a six-digit code to ${email}. Enter it here — no password to remember.`}
        </Hint>
        <OtpInput value={code} onChange={setCode} onComplete={submit} />
        {busy && <Body muted>Just a moment…</Body>}
        {error && <Body muted>{error}</Body>}
      </FadeIn>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  resend: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.body,
    color: colors.warmTaupe,
    textAlign: "center",
    paddingVertical: spacing.sm,
  },
  resendMuted: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: spacing.sm,
  },
});
