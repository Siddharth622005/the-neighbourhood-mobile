import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { RecoveryProfileQuestions } from "./RecoveryProfileQuestions";
import { GhostButton, PrimaryButton } from "./ui";
import {
  type RecoveryBirthMethod,
  type RecoveryFeedingMethod,
  type RecoveryRole,
} from "../lib/recoveryProfile";
import { usePalette } from "../lib/ModeProvider";
import { fonts, spacing, typeScale } from "../lib/theme";

/**
 * The first thing a parent sees on entering "You" mode.
 *
 * This is where the recovery questions belong. They used to sit at step 5
 * of 6 in onboarding — the last gate before the app existed — which asked
 * the two most loaded questions in postpartum life ("how did you give
 * birth", "how are you feeding") before the parent had received anything.
 * Both carry real weight: a caesarean can carry grief, formula feeding
 * carries stigma most parents have already been judged for.
 *
 * Here, the parent has just deliberately switched to their own space, so
 * the ask has an obvious reason. Nobody who never opens this is asked at
 * all, and everyone who is asked has already shown they want it.
 *
 * Both answers are optional and Continue is never disabled. Skipping
 * yields general content rather than an empty screen, and Settings is
 * always the way back.
 *
 * Painted from the PARENT palette, not the child tokens. This screen is
 * the threshold into parent mode, so arriving on the child's cream and
 * then switching to the parent background a tap later read as a glitch.
 */
export function RecoveryWelcome({
  parentName,
  onSave,
  onSkip,
}: {
  parentName: string | null;
  onSave: (values: {
    role: RecoveryRole | "";
    feedingMethod: RecoveryFeedingMethod | "";
    birthMethod: RecoveryBirthMethod | "";
  }) => void;
  onSkip: () => void;
}) {
  const [role, setRole] = useState<RecoveryRole | "">("");
  const [feedingMethod, setFeedingMethod] = useState<RecoveryFeedingMethod | "">("");
  const [birthMethod, setBirthMethod] = useState<RecoveryBirthMethod | "">("");

  const p = usePalette();

  const answeredAny = role !== "" || feedingMethod !== "" || birthMethod !== "";

  return (
    <View style={[styles.screen, { backgroundColor: p.bg }]}>
      {/* flex:1 constrains the list to the space above the footer. Without
          it the ScrollView sizes to its content and the last option ends up
          underneath the buttons. */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.eyebrow, { color: p.primary }]}>YOUR SPACE</Text>
        <Text style={[styles.title, { color: p.text }]}>
          {parentName ? `This part is yours, ${parentName}.` : "This part is yours."}
        </Text>
        <Text style={[styles.body, { color: p.textMuted }]}>
          Everywhere else in the app is about your child. Here, it&rsquo;s about
          you — how you&rsquo;re healing, eating, and holding up.
        </Text>
        <Text style={[styles.body, { color: p.textMuted }]}>
          A few questions shape what you see. Answer any of them, or none — it
          works regardless.
        </Text>

        <RecoveryProfileQuestions
          role={role}
          feedingMethod={feedingMethod}
          birthMethod={birthMethod}
          onRoleChange={setRole}
          onFeedingChange={setFeedingMethod}
          onBirthChange={setBirthMethod}
        />

        <Text style={[styles.reassurance, { color: p.primary }]}>
          There are no wrong answers. This only shapes what you see, and it
          stays on your account.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        {/* Never disabled. The parent decides how much to share, and an
            unanswered question simply means general content. */}
        <PrimaryButton
          tone="taupe"
          title={answeredAny ? "Continue" : "Take me in"}
          onPress={() => onSave({ role, feedingMethod, birthMethod })}
        />
        <GhostButton title="Not now" onPress={onSkip} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  eyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.h1,
    lineHeight: typeScale.h1 * 1.25,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.55,
    marginTop: spacing.md,
  },
  reassurance: {
    fontFamily: fonts.serifItalic,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.5,
    marginTop: spacing.xl,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    alignItems: "stretch",
  },
});
