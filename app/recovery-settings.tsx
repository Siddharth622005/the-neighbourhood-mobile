import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RecoveryProfileQuestions } from "../components/RecoveryProfileQuestions";
import {
  useRecoveryProfile,
  type RecoveryBirthMethod,
  type RecoveryFeedingMethod,
  type RecoveryRole,
} from "../lib/recoveryProfile";
import { colors, fonts, radius, spacing, typeScale } from "../lib/theme";

/**
 * Recovery Profile settings — the same questions asked on the first visit
 * to parent mode, available anytime from Profile → Recovery profile.
 *
 * The two option lists render from components/RecoveryProfileQuestions so
 * this screen and the first-run welcome can't drift apart; they were
 * previously duplicated with subtly different wording.
 *
 * Changes save instantly on selection (no "Save" button needed). The
 * screen is deliberately simple and warm — same design language as the
 * onboarding step, no clinical feel.
 */


export default function RecoverySettings() {
  const router = useRouter();
  const { profile, updateProfile } = useRecoveryProfile();
  const [deliveryDate, setDeliveryDate] = useState(profile.deliveryDate);

  const handleRole = (value: RecoveryRole) => {
    // Switching to father clears any birth/feeding answers already on file
    // — those describe the birthing parent's body, and leaving stale
    // answers in place after this switch would keep them influencing
    // content that no longer applies to this profile.
    if (value === "father") {
      updateProfile({ role: value, birthMethod: "", feedingMethod: "" });
    } else {
      updateProfile({ role: value });
    }
  };

  const handleBirth = (value: RecoveryBirthMethod) => {
    updateProfile({ birthMethod: value });
  };

  const handleFeeding = (value: RecoveryFeedingMethod) => {
    updateProfile({ feedingMethod: value });
  };

  const handleDateBlur = () => {
    // Basic validation: if the string looks like a date, save it.
    if (/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate) || deliveryDate === "") {
      updateProfile({ deliveryDate });
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.close}>
            <Text style={styles.closeLabel}>Done</Text>
          </Pressable>
          <Text style={styles.eyebrow}>RECOVERY PROFILE</Text>
          <Text style={styles.title}>About your recovery</Text>
          <Text style={styles.subtitle}>
            Updating these changes what you see in the Recovery tab and your
            daily plan. Nothing is shared.
          </Text>
        </View>

        <RecoveryProfileQuestions
          role={profile.role}
          feedingMethod={profile.feedingMethod}
          birthMethod={profile.birthMethod}
          onRoleChange={handleRole}
          onFeedingChange={handleFeeding}
          onBirthChange={handleBirth}
        />

        {/* Delivery date \u2014 like birth/feeding method above, this is asking
            about the birthing parent's own body, so it's hidden once the
            profile says father for the same reason. */}
        {profile.role !== "father" && (
          <>
            <Text style={styles.sectionTitle}>Date of delivery</Text>
            <Text style={styles.dateHint}>
              Used to calculate your postpartum week. Leave blank to use your
              child{"\u2019"}s birthday.
            </Text>
            <TextInput
              value={deliveryDate}
              onChangeText={setDeliveryDate}
              onBlur={handleDateBlur}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              style={[
                styles.dateField,
                Platform.OS === "web" && ({ outlineStyle: "none" } as any),
              ]}
            />
          </>
        )}

        <Text style={styles.reassurance}>
          You can change these anytime. Your recovery experience will update
          straight away.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingTop: spacing.md,
  },
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
  subtitle: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.5,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.h3,
    color: colors.charcoal,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  optionStack: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "transparent",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  cardSelected: {
    backgroundColor: "rgba(168, 181, 164, 0.20)",
    borderColor: colors.sage,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  cardCopy: {
    flex: 1,
  },
  cardLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.body,
    color: colors.charcoal,
  },
  cardGloss: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  checkMark: {
    color: colors.white,
    fontSize: 12,
    fontFamily: fonts.bodyBold,
  },
  dateHint: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.45,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  dateField: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.h2,
    color: colors.charcoal,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  reassurance: {
    fontFamily: fonts.serifItalic,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.5,
    color: colors.warmTaupe,
    marginTop: spacing.xl,
    textAlign: "center",
  },
});
