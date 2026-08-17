import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FadeIn, Hint, Prompt } from "../components/onboarding";
import { PrimaryButton, TextField } from "../components/ui";
import { useAuth } from "../lib/AuthProvider";
import * as session from "../lib/db/session";
import { colors, fonts, radius, spacing, typeScale } from "../lib/theme";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Attaching an email to an anonymous account.
 *
 * The product deliberately skips the account at the front door — a parent
 * gets to a plan without ever seeing a signup form. The cost is that until
 * this screen is completed, everything they've built lives in one install's
 * refresh token and dies with it.
 *
 * So the copy leads with what is actually at stake, by name, rather than
 * "create an account to unlock features". There is nothing to unlock. The
 * only thing on offer is not losing what they already have.
 *
 * Skipping is a real option and stays a real option — this screen is
 * reachable from Profile forever, and nothing here blocks the app.
 */
export default function SecureAccount() {
  const router = useRouter();
  const { child, accountLinked, accountEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const childName = child?.name ?? "your child";

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await session.linkEmail(email);
      router.push({ pathname: "/verify", params: { email: email.trim(), mode: "link" } });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't send that code. Check the address and try again."
      );
    } finally {
      setBusy(false);
    }
  };

  // Already done — this screen has nothing to offer.
  if (accountLinked) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <View style={styles.inner}>
          <FadeIn>
            <Prompt>You&rsquo;re already safe.</Prompt>
            <Hint>
              This family is attached to {accountEmail}. Sign in with that address
              on any device and {childName}&rsquo;s record comes with you.
            </Hint>
          </FadeIn>
          <View style={styles.footer}>
            <PrimaryButton title="Done" onPress={() => router.back()} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.inner}>
        <FadeIn>
          <Prompt>Keep {childName}&rsquo;s record safe.</Prompt>
          <Hint>
            Everything you&rsquo;ve saved lives on this phone right now. Add an
            email and it follows you to a new one.
          </Hint>

          <View style={styles.stakes}>
            {[
              `${childName}'s discoveries and the notes you wrote`,
              "Vaccination records and what's still due",
              "Your daily plans and everything already done",
            ].map((line) => (
              <View key={line} style={styles.stakeRow}>
                <View style={styles.stakeDot} />
                <Text style={styles.stakeText}>{line}</Text>
              </View>
            ))}
          </View>

          <View style={styles.field}>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!busy}
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Text style={styles.reassure}>
            No password. We send a six-digit code, and we don&rsquo;t email you
            anything else.
          </Text>
        </FadeIn>

        <View style={styles.footer}>
          <PrimaryButton
            title="Send the code"
            onPress={submit}
            loading={busy}
            disabled={!isValidEmail(email)}
          />
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => pressed && { opacity: 0.6 }}
          >
            <Text style={styles.later}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  stakes: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "rgba(139, 116, 91, 0.07)",
    gap: spacing.sm,
  },
  stakeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  stakeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.warmTaupe,
    marginTop: 8,
  },
  stakeText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.5,
    color: colors.charcoal,
  },
  field: {
    marginTop: spacing.xl,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  reassure: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    lineHeight: typeScale.caption * 1.55,
    color: colors.textMuted,
  },
  footer: {
    marginTop: "auto",
    marginBottom: spacing.lg,
    gap: spacing.md,
    alignItems: "stretch",
  },
  later: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.body,
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: spacing.sm,
  },
});
