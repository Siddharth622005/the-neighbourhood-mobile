import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useScreenFocus } from "../../lib/useScreenFocus";
import { useEffect, useMemo, useState } from "react";
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
import { askCopilot, CopilotChatError, type AskMode } from "../../lib/copilotChat";
import { markFirstRunComplete, markHomeCoachComplete } from "../../lib/firstRun";
import { deriveProfile, STAGE_LABEL } from "../../lib/parentCare";
import { colors, fonts, radius, spacing, typeScale } from "../../lib/theme";

/**
 * Ask — the ONE AI entry point for the whole app.
 *
 * Previously two screens (Child Mode's Copilot and Parent Mode's Copilot),
 * each hardcoded to one subject. Now one screen whose subject comes from
 * how it was opened, not from which "mode" the app was in — there is no
 * mode to be in anymore.
 *
 *   Bare tab tap            → mode "family": general-purpose, any topic.
 *   From Child > Milestones → mode "child", topic "Milestones": arrives
 *                              knowing this is about the child.
 *   From You > Care > Sleep → mode "parent", topic "Sleep": arrives
 *                              knowing this is about the parent.
 *
 * A screen that links here passes `mode`/`topic`/`prompt` as route params
 * (the same pattern Home already used to prefill a draft). The context
 * chip below the header makes that visible rather than leaving it as
 * invisible backend plumbing — the parent should be able to see why Ask
 * already seems to know what they mean, and clear it if they don't.
 *
 * Visually neutral (the fixed cream palette, not either zone's tint) on
 * purpose: Child and You are different rooms; Ask is the phone line that
 * reaches into either one, so it shouldn't look like it belongs to just
 * one of them.
 */
type Message = { id: string; role: "parent" | "copilot"; text: string };

const PARENT_PROMPTS = [
  "My incision still hurts.",
  "I'm exhausted.",
  "I haven't been eating enough.",
  "Can I start exercising?",
];

export default function Ask() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{
    guidedTour?: string;
    next?: string;
    prompt?: string;
    step?: string;
    mode?: string;
    topic?: string;
  }>();
  const { child, parentName, profile: authProfile } = useAuth();
  const isFocused = useScreenFocus();
  const isAskRoute = pathname === "/ask";
  const guidedTour = params.guidedTour === "1" && params.step === "2" && isFocused && isAskRoute;
  const afterOnboardingTour = params.next === "milestones";
  const tourNext = afterOnboardingTour ? "&next=milestones" : "";

  const incomingMode: AskMode =
    params.mode === "parent" || params.mode === "child" ? params.mode : "family";
  const [mode, setMode] = useState<AskMode>(incomingMode);
  const [topic, setTopic] = useState<string | undefined>(params.topic);

  const age = child ? computeAge(child.date_of_birth) : null;
  const ageMonths = age?.totalMonths ?? 0;
  const parentProfile = useMemo(
    () => deriveProfile(ageMonths, authProfile),
    [ageMonths, authProfile],
  );

  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    if (params.prompt) setDraft(params.prompt);
  }, [params.prompt]);

  const continueGuidedTour = () => {
    router.replace(`/child?guidedTour=1&step=3${tourNext}`);
  };

  const skipGuidedTour = async () => {
    await Promise.all([markHomeCoachComplete(), markFirstRunComplete()]).catch(() => {});
    router.replace("/home");
  };

  const clearContext = () => {
    setMode("family");
    setTopic(undefined);
  };

  const contextForMode = (): Record<string, string | number | boolean | null> | undefined => {
    if (mode !== "parent") return undefined;
    return {
      role: parentProfile.role,
      weeksPostpartum: parentProfile.weeksPostpartum,
      stage: parentProfile.stage,
      delivery: parentProfile.delivery,
      feeding: parentProfile.feeding,
      diet: parentProfile.diet,
      allergies: parentProfile.allergies.join(", ") || null,
    };
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { id: `${Date.now()}-p`, role: "parent", text: trimmed }]);
    setDraft("");
    setThinking(true);
    try {
      const reply = await askCopilot({
        message: trimmed,
        history,
        childId: child?.id,
        mode,
        context: contextForMode(),
      });
      setMessages((prev) => [...prev, { id: `${Date.now()}-c`, role: "copilot", text: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-c`,
          role: "copilot",
          text:
            err instanceof CopilotChatError
              ? err.message
              : "Something went wrong reaching Ask. Please try again.",
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      {topic && (
        <View style={styles.contextChip}>
          <Text style={styles.contextChipText}>
            Asking about: {topic}
            {mode === "parent" ? " (You)" : mode === "child" ? " (Child)" : ""}
          </Text>
          <Pressable onPress={clearContext} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear context">
            <Text style={styles.contextChipClear}>✕</Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        style={styles.thread}
        contentContainerStyle={styles.threadContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View style={styles.empty}>
            {mode === "parent" ? (
              <>
                <Text style={styles.emptyEyebrow}>
                  {STAGE_LABEL[parentProfile.stage].toUpperCase()} · WEEK {parentProfile.weeksPostpartum}
                </Text>
                <Text style={styles.emptyTitle}>Ask about you, not them.</Text>
                <Text style={styles.emptyBody}>
                  {parentName ? `${parentName.split(" ")[0]}, this ` : "This "}
                  knows your stage, your recovery and what you&rsquo;ve eaten. Nothing you ask
                  here is too small.
                </Text>
                <View style={styles.prompts}>
                  {PARENT_PROMPTS.map((prompt) => (
                    <Pressable
                      key={prompt}
                      onPress={() => send(prompt)}
                      style={({ pressed }) => [styles.prompt, pressed && { opacity: 0.65 }]}
                    >
                      <Text style={styles.promptText}>{prompt}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : mode === "child" ? (
              <>
                <Text style={styles.emptyTitle}>
                  A quiet place for the questions that arrive late.
                </Text>
                <Text style={styles.emptyBody}>
                  {child?.name
                    ? `Sleep, feeding, or a tricky moment. We'll keep ${child.name} in mind.`
                    : "Sleep, feeding, or a tricky moment. Start wherever you are."}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyTitle}>Ask anything, for anyone in the family.</Text>
                <Text style={styles.emptyBody}>
                  Sleep, feeding, development, your own recovery, or just what to do
                  today — ask about any of it, and we&rsquo;ll bring the right context.
                </Text>
              </>
            )}
          </View>
        ) : (
          <>
            {messages.map((m) => (
              <View
                key={m.id}
                style={[styles.bubble, m.role === "parent" ? styles.parentBubble : styles.copilotBubble]}
              >
                <Text style={m.role === "parent" ? styles.parentText : styles.copilotText}>
                  {m.text}
                </Text>
              </View>
            ))}
            {thinking && (
              <View style={[styles.bubble, styles.copilotBubble]}>
                <Text style={styles.copilotText}>…</Text>
              </View>
            )}
          </>
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
          onSubmitEditing={() => send(draft)}
          editable={!thinking}
        />
        <Pressable
          onPress={() => send(draft)}
          disabled={!draft.trim() || thinking}
          style={[styles.send, (!draft.trim() || thinking) && styles.sendDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Send"
        >
          <Text style={styles.sendLabel}>Ask</Text>
        </Pressable>
      </View>
      {guidedTour && (
        <GuidedTourDialog
          eyebrow="Ask"
          focus="Ask anything"
          title="A second voice, anytime."
          body="Ask about your child or about parenting — with your family's context already in mind."
          step={2}
          total={5}
          primaryTitle="Continue"
          onPrimary={continueGuidedTour}
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
  contextChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  contextChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.caption,
    color: colors.warmTaupe,
  },
  contextChipClear: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    color: colors.textMuted,
    paddingLeft: spacing.sm,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
  },
  emptyEyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.4,
    color: colors.warmTaupe,
    marginBottom: spacing.sm,
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
  prompts: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  prompt: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 3,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  promptText: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    color: colors.charcoal,
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
