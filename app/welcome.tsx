import { Link, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../components/ui";
import { FadeIn, OnboardingScreen } from "../components/onboarding";
import { useOnboarding } from "../lib/OnboardingProvider";
import { colors, fonts, spacing, typeScale } from "../lib/theme";

export default function Welcome() {
  const router = useRouter();
  const { resumeHref, hasProgress } = useOnboarding();

  return (
    <OnboardingScreen
      footer={
        <FadeIn delay={260}>
          <PrimaryButton
            title={hasProgress ? "Pick up where you left off" : "Meet your Neighbourhood"}
            onPress={() => router.push(resumeHref)}
          />
          {!hasProgress && (
            <Link href="/sign-in" asChild>
              <Text style={styles.signIn}>Already a neighbour? Sign in</Text>
            </Link>
          )}
        </FadeIn>
      }
    >
      <FadeIn>
        <Text style={styles.headline}>
          Raising a child was never{"\n"}meant to be{" "}
          <Text style={styles.headlineAccent}>done alone.</Text>
        </Text>
      </FadeIn>
      <FadeIn delay={140}>
        <Text style={styles.sub}>
          The Neighbourhood learns your child, and tells you what today is for.
        </Text>
        {hasProgress && <Text style={styles.saved}>Welcome back — we saved your place.</Text>}
      </FadeIn>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  headline: {
    fontFamily: fonts.bodyBold,
    fontSize: 34,
    lineHeight: 44,
    color: colors.charcoal,
  },
  headlineAccent: {
    fontFamily: fonts.serifItalic,
    color: colors.warmTaupe,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.5,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
  saved: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.bodySmall,
    color: colors.warmTaupe,
    marginTop: spacing.md,
  },
  signIn: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.body,
    color: colors.warmTaupe,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
