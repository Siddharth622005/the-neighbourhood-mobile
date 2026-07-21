import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GhostButton, PrimaryButton } from "../components/ui";
import { FadeIn } from "../components/onboarding";
import { useAuth } from "../lib/AuthProvider";
import { activityForChild } from "../lib/todaysPlan";
import { colors, fonts, radius, spacing, typeScale } from "../lib/theme";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Today's Plan: one card, one reason, one action. Everything else earns
// its way onto this screen over time — progressive disclosure applies to
// the product, not just onboarding (PRD 9.1 / 9.3).
export default function Dashboard() {
  const { child, parentName, signOut } = useAuth();
  const today = WEEKDAYS[new Date().getDay()];

  if (!child) {
    // The entry route normally prevents this; render calmly if it happens.
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.inner}>
          <Text style={styles.body}>Setting up your plan…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const activity = activityForChild(child);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.inner}>
        <FadeIn>
          <Text style={styles.header}>
            {today}, for {child.name}
          </Text>
        </FadeIn>

        <FadeIn delay={120} style={styles.center}>
          <View style={styles.card}>
            <Text style={styles.eyebrow}>TODAY&rsquo;S ACTIVITY</Text>
            <Text style={styles.title}>{activity.title}</Text>
            <Text style={styles.why}>{activity.why}</Text>
            <View style={styles.meta}>
              <Text style={styles.metaItem}>{activity.durationMins} min</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaItem}>{activity.materials}</Text>
            </View>
            <View style={styles.action}>
              <PrimaryButton title="See how" onPress={() => {}} />
            </View>
          </View>
        </FadeIn>

        <View style={styles.footer}>
          <GhostButton
            title={parentName ? `Signed in as ${parentName.split(" ")[0]} · Sign out` : "Sign out"}
            onPress={signOut}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  header: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.h3,
    color: colors.charcoal,
  },
  center: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  eyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.5,
    color: colors.warmTaupe,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.h1,
    color: colors.charcoal,
  },
  why: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.5,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  metaItem: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.bodySmall,
    color: colors.charcoal,
  },
  metaDot: {
    color: colors.textMuted,
  },
  action: {
    marginTop: spacing.lg,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    color: colors.textMuted,
  },
  footer: {
    alignItems: "center",
  },
});
