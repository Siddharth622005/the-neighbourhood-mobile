import { useLocalSearchParams, useRouter } from "expo-router";
import { useScreenFocus } from "../lib/useScreenFocus";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GuidedTourDialog } from "../components/GuidedTourDialog";
import { LogoMark } from "../components/Logo";
import { ReplayTourDialog } from "../components/ReplayTourDialog";
import { GhostButton } from "../components/ui";
import { useAuth } from "../lib/AuthProvider";
import { EMAIL_AUTH_ENABLED } from "../lib/authMode";
import { computeAge } from "../lib/childAge";
import { markFirstRunComplete, markHomeCoachComplete } from "../lib/firstRun";
import { colors, fonts, radius, spacing, typeScale } from "../lib/theme";

/**
 * Family + account settings. Reached from the avatar in the top-right of
 * every tab, presented as a modal — deliberately not a fourth tab, and
 * not on Today's Plan, which shouldn't make room for account chrome
 * every single day.
 */
export default function Profile() {
  const router = useRouter();
  const params = useLocalSearchParams<{ guidedTour?: string; next?: string }>();
  const { parentName, child, signOut } = useAuth();
  const age = child ? computeAge(child.date_of_birth) : null;
  // See guide.tsx: only the focused screen may show a tour dialog.
  const isFocused = useScreenFocus();
  const guidedTour = params.guidedTour === "1" && isFocused;
  const afterOnboardingTour = params.next === "milestones";
  const [showReplayDialog, setShowReplayDialog] = useState(false);

  const finishTour = async () => {
    await markHomeCoachComplete().catch(() => {});
    if (afterOnboardingTour) {
      router.replace("/growth/milestones?initial=1&afterTour=1");
      return;
    }
    await markFirstRunComplete().catch(() => {});
    router.replace("/home?tourComplete=1");
  };

  const replayTour = () => {
    setShowReplayDialog(false);
    router.replace("/home?guidedTour=1&step=0&replay=1");
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.inner}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.close}>
          <Text style={styles.closeLabel}>Done</Text>
        </Pressable>

        <View style={styles.brand}>
          <LogoMark size={30} />
        </View>

        <Text style={styles.eyebrow}>FAMILY</Text>
        <Text style={styles.title}>{parentName ?? "You"}</Text>

        {child && (
          <View style={[styles.card, guidedTour && styles.tourHighlight]}>
            <Text style={styles.childName}>{child.name}</Text>
            <Text style={styles.childMeta}>{age?.label ?? "—"} old</Text>
          </View>
        )}

        <View style={styles.settingsList}>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingTitle}>Child details</Text>
              <Text style={styles.settingBody}>Name, birthday, and family preferences.</Text>
            </View>
          </View>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingBody}>Gentle reminders for daily plans.</Text>
            </View>
          </View>
          <Pressable onPress={() => setShowReplayDialog(true)} style={styles.settingRow} accessibilityRole="button">
            <View>
              <Text style={styles.settingTitle}>Take the tour again</Text>
              <Text style={styles.settingBody}>A quick refresher whenever you need it.</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.signOut}>
          {/* Without an account there's nothing to sign out OF — the honest
              description is that this wipes the family on this device. */}
          <GhostButton
            title={EMAIL_AUTH_ENABLED ? "Sign out" : "Start over on this device"}
            onPress={signOut}
          />
        </View>
      </View>
      {guidedTour && (
        <GuidedTourDialog
          eyebrow="Profile"
          focus="Family settings"
          title="Keep family details here."
          body="Update child information, notifications, and replay this tour anytime."
          step={4}
          total={5}
          primaryTitle="Begin"
          onPrimary={finishTour}
          onSkip={finishTour}
        />
      )}
      <ReplayTourDialog
        visible={showReplayDialog}
        onDismiss={() => setShowReplayDialog(false)}
        onConfirm={replayTour}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  inner: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  close: {
    alignSelf: "flex-end",
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  closeLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.body,
    color: colors.warmTaupe,
  },
  brand: {
    marginBottom: spacing.md,
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
  card: {
    marginTop: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  tourHighlight: {
    borderWidth: 1,
    borderColor: colors.warmTaupe,
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 4,
  },
  childName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.h3,
    color: colors.charcoal,
  },
  childMeta: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },
  signOut: {
    marginTop: "auto",
    marginBottom: spacing.lg,
    alignItems: "center",
  },
  settingsList: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  settingRow: {
    backgroundColor: "rgba(255, 255, 255, 0.58)",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  settingTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.bodySmall,
    color: colors.charcoal,
  },
  settingBody: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    lineHeight: typeScale.caption * 1.45,
    color: colors.textMuted,
    marginTop: 2,
  },
});
