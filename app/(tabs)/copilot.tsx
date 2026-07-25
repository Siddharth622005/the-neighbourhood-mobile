import { useState } from "react";
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
  const { child } = useAuth();
  const age = child ? computeAge(child.date_of_birth) : null;
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

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
              The question you&rsquo;d text a friend at 11pm.
            </Text>
            <Text style={styles.emptyBody}>
              {child?.name && age
                ? `Ask anything — sleep, feeding, a tricky moment. Answers will know ${child.name} is ${age.label} old.`
                : "Ask anything — sleep, feeding, a tricky moment."}
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

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Ask anything…"
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
    lineHeight: typeScale.h1 * 1.25,
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.5,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  bubble: {
    maxWidth: "85%",
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  parentBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.charcoal,
    borderBottomRightRadius: radius.sm / 2,
  },
  copilotBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
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
