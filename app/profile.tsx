import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GhostButton } from "../components/ui";
import { useAuth } from "../lib/AuthProvider";
import { AUTH_ENABLED } from "../lib/authMode";
import { computeAge } from "../lib/childAge";
import { colors, fonts, radius, spacing, typeScale } from "../lib/theme";

/**
 * Family + account settings. Reached from the avatar in the top-right of
 * every tab, presented as a modal — deliberately not a fourth tab, and
 * not on Today's Plan, which shouldn't make room for account chrome
 * every single day.
 */
export default function Profile() {
  const router = useRouter();
  const { parentName, child, signOut } = useAuth();
  const age = child ? computeAge(child.date_of_birth) : null;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.inner}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.close}>
          <Text style={styles.closeLabel}>Done</Text>
        </Pressable>

        <Text style={styles.eyebrow}>FAMILY</Text>
        <Text style={styles.title}>{parentName ?? "You"}</Text>

        {child && (
          <View style={styles.card}>
            <Text style={styles.childName}>{child.name}</Text>
            <Text style={styles.childMeta}>{age?.label ?? "—"} old</Text>
          </View>
        )}

        <View style={styles.signOut}>
          {/* Without an account there's nothing to sign out OF — the honest
              description is that this wipes the family on this device. */}
          <GhostButton
            title={AUTH_ENABLED ? "Sign out" : "Start over on this device"}
            onPress={signOut}
          />
        </View>
      </View>
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
});
