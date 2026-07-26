import { supabase, unwrap } from "./client";
import type { CopilotConversation, CopilotMessage } from "./types";

/**
 * Copilot history.
 *
 * Child-scoped rather than parent-scoped, so an answer can be grounded in
 * the right child once multi-child ships — and so the conversation can be
 * retrieved as context alongside that child's activity history.
 *
 * There is no model behind this yet; the Copilot tab is still a scaffold.
 * These functions exist so the conversation is persisted from the first
 * day the model is wired in, rather than the history starting at zero.
 */

export async function listConversations(childId: string): Promise<CopilotConversation[]> {
  return unwrap<CopilotConversation[]>(
    "copilot.listConversations",
    await supabase
      .from("copilot_conversations")
      .select("*")
      .eq("child_id", childId)
      .order("last_message_at", { ascending: false })
  );
}

export async function createConversation(
  childId: string,
  title?: string
): Promise<CopilotConversation> {
  return unwrap<CopilotConversation>(
    "copilot.createConversation",
    await supabase
      .from("copilot_conversations")
      .insert({ child_id: childId, title: title ?? null })
      .select()
      .single()
  );
}

export async function getMessages(conversationId: string): Promise<CopilotMessage[]> {
  return unwrap<CopilotMessage[]>(
    "copilot.getMessages",
    await supabase
      .from("copilot_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
  );
}

/**
 * Appends a message and bumps the conversation's last_message_at, so the
 * list stays ordered by recency without a trigger.
 */
export async function addMessage(
  conversationId: string,
  role: CopilotMessage["role"],
  content: string
): Promise<CopilotMessage> {
  const message = unwrap<CopilotMessage>(
    "copilot.addMessage",
    await supabase
      .from("copilot_messages")
      .insert({ conversation_id: conversationId, role, content })
      .select()
      .single()
  );

  await supabase
    .from("copilot_conversations")
    .update({ last_message_at: message.created_at })
    .eq("id", conversationId);

  return message;
}
