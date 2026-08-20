import { supabase, unwrap, unwrapMaybe } from "./client";

/**
 * Copilot conversation history.
 *
 * The tables (copilot_conversations, copilot_messages) already existed in
 * the schema — see 20260726090000_core_schema.sql — child-scoped and
 * RLS-protected, but nothing read or wrote them; ask.tsx kept messages in
 * local component state only, lost on navigation. This connects the UI to
 * what was already there instead of building a second history mechanism.
 */

export type CopilotMessageRow = {
  id: string;
  conversation_id: string;
  role: "parent" | "copilot";
  content: string;
  created_at: string;
  context_mode: string | null;
  context_topic: string | null;
};

/** The child's most recent conversation, or a fresh one if none exists yet. */
export async function getOrCreateConversation(childId: string): Promise<string> {
  const existing = await unwrapMaybe<{ id: string }>(
    "copilot.getOrCreateConversation",
    await supabase
      .from("copilot_conversations")
      .select("id")
      .eq("child_id", childId)
      .order("last_message_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  );
  if (existing) return existing.id;

  const created = await unwrap<{ id: string }>(
    "copilot.getOrCreateConversation",
    await supabase
      .from("copilot_conversations")
      .insert({ child_id: childId })
      .select("id")
      .single()
  );
  return created.id;
}

/** Oldest first — the shape askCopilot's `history` already expects. */
export async function getMessages(conversationId: string): Promise<CopilotMessageRow[]> {
  return unwrap<CopilotMessageRow[]>(
    "copilot.getMessages",
    await supabase
      .from("copilot_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
  );
}

/**
 * Appends one turn and bumps the conversation's last_message_at so the
 * "most recent conversation" lookup above stays accurate.
 *
 * `context` tags the message with whatever mode/topic was active when it
 * was sent — "family" mode is left untagged (see the migration comment)
 * since it's the default, not a topic worth surfacing later. This is what
 * lets ask.tsx build "recent chats" out of one continuous thread instead
 * of needing separate conversations per topic.
 */
export async function appendMessage(
  conversationId: string,
  role: "parent" | "copilot",
  content: string,
  context?: { mode: "family" | "child" | "parent"; topic?: string | null }
): Promise<void> {
  await supabase.from("copilot_messages").insert({
    conversation_id: conversationId,
    role,
    content,
    context_mode: context && context.mode !== "family" ? context.mode : null,
    context_topic: context?.topic ?? null,
  });
  await supabase
    .from("copilot_conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
}
