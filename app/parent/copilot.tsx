import { useMemo, useState } from "react";
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
import { useAuth } from "../../lib/AuthProvider";
import { computeAge } from "../../lib/childAge";
import { usePalette } from "../../lib/ModeProvider";
import { STAGE_LABEL, deriveProfile } from "../../lib/parentCare";
import { fonts, radius, spacing, typeScale } from "../../lib/theme";

type Message = { id: string; role: "parent" | "copilot"; text: string };

/**
 * Copilot, in Parent Mode.
 *
 * Same slot, same composer, different subject — the questions here are about
 * the parent's body and mind, so the empty state offers the ones people are
 * least likely to type unprompted. "My incision still hurts" is easier to tap
 * than to write.
 *
 * SCAFFOLD, like its Child Mode twin: there's no model behind it yet. It
 * answers honestly that it isn't connected rather than improvising medical
 * reassurance, which is the one thing this surface must never fake. The
 * context block below is what a real implementation should send.
 */
const PROMPTS = [
  "My incision still hurts.",
  "I'm exhausted.",
  "I haven't been eating enough.",
  "Can I start exercising?",
];

export default function ParentCopilot() {
  const p = usePalette();
  const { child, parentName } = useAuth();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const ageMonths = child ? computeAge(child.date_of_birth)?.totalMonths ?? 0 : 0;
  const profile = useMemo(() => deriveProfile(ageMonths), [ageMonths]);

  /**
   * The context a real Copilot call would carry. Kept explicit here so the
   * shape is obvious when the backend lands: profile + stage + recovery +
   * nutrition, on top of trusted clinical sources.
   */
  const context = useMemo(
    () => ({
      mode: "parent" as const,
      weeksPostpartum: profile.weeksPostpartum,
      stage: profile.stage,
      delivery: profile.delivery,
      feeding: profile.feeding,
      diet: profile.diet,
      allergies: profile.allergies,
    }),
    [profile]
  );

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-p`, role: "parent", text: trimmed },
      {
        id: `${Date.now()}-c`,
        role: "copilot",
        text: `I'm not connected yet — this part is still being built. When I am, I'll answer knowing you're ${context.weeksPostpartum} weeks post-caesarean and breastfeeding. Until then, anything about pain or healing is worth taking to your GP rather than guessing at.`,
      },
    ]);
    setDraft("");
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: p.bg }]}
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
            <Text style={[styles.emptyEyebrow, { color: p.primary }]}>
              {STAGE_LABEL[profile.stage].toUpperCase()} · WEEK {profile.weeksPostpartum}
            </Text>
            <Text style={[styles.emptyTitle, { color: p.text }]}>
              Ask about you, not them.
            </Text>
            <Text style={[styles.emptyBody, { color: p.textMuted }]}>
              {parentName ? `${parentName.split(" ")[0]}, this ` : "This "}
              knows your stage, your recovery and what you&rsquo;ve eaten. Nothing
              you ask here is too small.
            </Text>

            <View style={styles.prompts}>
              {PROMPTS.map((prompt) => (
                <Pressable
                  key={prompt}
                  onPress={() => send(prompt)}
                  style={({ pressed }) => [
                    styles.prompt,
                    { backgroundColor: p.surface, borderColor: p.border },
                    pressed && { opacity: 0.65 },
                  ]}
                >
                  <Text style={[styles.promptText, { color: p.text }]}>{prompt}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.bubble,
                m.role === "parent"
                  ? { alignSelf: "flex-end", backgroundColor: p.primary }
                  : { alignSelf: "flex-start", backgroundColor: p.surface },
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  { color: m.role === "parent" ? p.surface : p.text },
                ]}
              >
                {m.text}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={[styles.composer, { borderTopColor: p.border, backgroundColor: p.bg }]}>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: p.surface, borderColor: p.border, color: p.text },
          ]}
          value={draft}
          onChangeText={setDraft}
          placeholder="How are you, really?"
          placeholderTextColor={p.textMuted}
          multiline
          onSubmitEditing={() => send(draft)}
        />
        <Pressable
          onPress={() => send(draft)}
          disabled={!draft.trim()}
          accessibilityRole="button"
          accessibilityLabel="Send"
          style={[
            styles.send,
            { backgroundColor: p.primary },
            !draft.trim() && styles.sendDisabled,
          ]}
        >
          <Text style={[styles.sendLabel, { color: p.surface }]}>Ask</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
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
  emptyEyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.h1,
    lineHeight: typeScale.h1 * 1.2,
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.6,
    marginTop: spacing.sm,
  },
  prompts: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  prompt: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 3,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  promptText: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
  },
  bubble: {
    maxWidth: "85%",
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  bubbleText: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.5,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 3,
    fontFamily: fonts.body,
    fontSize: typeScale.body,
  },
  send: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
  },
  sendDisabled: {
    opacity: 0.4,
  },
  sendLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.bodySmall,
  },
});
