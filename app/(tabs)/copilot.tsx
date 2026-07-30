import { useLocalSearchParams, useRouter } from "expo-router";
import { useScreenFocus } from "../../lib/useScreenFocus";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { GuidedTourDialog } from "../../components/GuidedTourDialog";
import { useAuth } from "../../lib/AuthProvider";
import { computeAge } from "../../lib/childAge";
import { markFirstRunComplete, markHomeCoachComplete } from "../../lib/firstRun";
import { colors, fonts, radius, spacing, typeScale } from "../../lib/theme";

/**
 * Copilot — the "ask me anything not already covered by today's plan"
 * layer. A full chat surface, always one tap away via the tab bar.
 *
 * SCAFFOLD ONLY. The composer and thread are real and wired to local
 * state so the layout can be judged honestly, but there is no model
 * behind it yet — sending appends the parent's message and an explicit
 * "not connected yet" reply rather than faking an answer. When the
 * backend lands, replace send() and seed the thread from history.
 *
 * Context this is expected to use once real: child name, age in months,
 * gender, plus the running history of completed activities and past
 * questions — the same signals that personalize Today's plan.
 */
type Message = {
  id: string;
  role: "parent" | "copilot";
  text: string;
};

export default function Copilot() {
  const router = useRouter();
  const params = useLocalSearchParams<{ guidedTour?: string; next?: string; prompt?: string }>();
  const { child } = useAuth();
  // See guide.tsx: only the focused screen may show a tour dialog.
  const isFocused = useScreenFocus();
  const guidedTour = params.guidedTour === "1" && isFocused;
  const afterOnboardingTour = params.next === "milestones";
  const tourNext = afterOnboardingTour ? "&next=milestones" : "";
  const finishGuidedTour = async () => {
    await markHomeCoachComplete().catch(() => {});
    if (afterOnboardingTour) {
      router.replace("/growth/milestones?initial=1&afterTour=1");
      return;
    }
    await markFirstRunComplete().catch(() => {});
    router.replace("/home?tourComplete=1");
  };

  const skipGuidedTour = async () => {
    await Promise.all([markHomeCoachComplete(), markFirstRunComplete()]).catch(() => {});
    router.replace("/home");
  };
  const age = child ? computeAge(child.date_of_birth) : null;
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (params.prompt) setDraft(params.prompt);
  }, [params.prompt]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-p`, role: "parent", text },
      {
        id: `${Date.now()}-c`,
        role: "copilot",
        text: "I'm not connected yet — this part is still being built. Your question is safe here in the meantime.",
      },
    ]);
    setDraft("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      <ScrollView
        style={styles.thread}
        contentContainerStyle={styles.threadContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              A quiet place for the questions that arrive late.
            </Text>
            <Text style={styles.emptyBody}>
              {child?.name && age
                ? `Sleep, feeding, or a tricky moment. We'll keep ${child.name} in mind.`
                : "Sleep, feeding, or a tricky moment. Start wherever you are."}
            </Text>
          </View>
        ) : (
          messages.map((m) => (
            <View
              key={m.id}
              style={[styles.bubble, m.role === "parent" ? styles.parentBubble : styles.copilotBubble]}
            >
              <Text style={m.role === "parent" ? styles.parentText : styles.copilotText}>
                {m.text}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={[styles.composer, guidedTour && styles.tourHighlight]}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="What's on your mind?"
          placeholderTextColor={colors.textMuted}
          multiline
          onSubmitEditing={send}
        />
        <Pressable
          onPress={send}
          disabled={!draft.trim()}
          style={[styles.send, !draft.trim() && styles.sendDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Send"
        >
          <Text style={styles.sendLabel}>Ask</Text>
        </Pressable>
      </View>
      {guidedTour && (
        <GuidedTourDialog
          eyebrow="Parenting Companion"
          focus="The message composer"
          title="Ask when you need a second voice."
          body="Supportive guidance for everyday questions, never a replacement for expert care."
          step={3}
          total={4}
          primaryTitle="Begin"
          onPrimary={finishGuidedTour}
          onSkip={skipGuidedTour}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  thread: { flex: 1 },
  threadContent: {
    padding: spacing.lg,
    gap: spacing.sm,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.h1,
    color: colors.charcoal,
    lineHeight: typeScale.h1 * 1.2,
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.55,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  bubble: {
    maxWidth: "85%",
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  parentBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.charcoal,
    borderBottomRightRadius: radius.sm / 2,
  },
  copilotBubble: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 253, 252, 0.82)",
    borderBottomLeftRadius: radius.sm / 2,
  },
  parentText: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.45,
    color: colors.cream,
  },
  copilotText: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.45,
    color: colors.charcoal,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.cream,
  },
  tourHighlight: {
    borderTopColor: colors.warmTaupe,
    backgroundColor: colors.white,
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    color: colors.charcoal,
  },
  send: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.pill,
    backgroundColor: colors.charcoal,
  },
  sendDisabled: { opacity: 0.4 },
  sendLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.bodySmall,
    color: colors.cream,
  },
});
