import { supabase } from "./db/client";

/**
 * Client side of the Groq-backed Copilot — calls the copilot-chat Edge
 * Function (supabase/functions/copilot-chat) rather than Groq directly.
 * See that function's header comment for why: an API key inside the app
 * bundle is a public key, not a secret.
 */

export type ChatTurn = { role: "parent" | "copilot"; text: string };

/**
 * "family" is the default — Ask opened bare from the tab bar, no incoming
 * context. "child"/"parent" arrive when Ask is opened from inside Child or
 * You, so the system prompt (see the Edge Function) can narrow its subject
 * without this being a second, separate AI product.
 */
export type AskMode = "family" | "child" | "parent";

export class CopilotChatError extends Error {}

export async function askCopilot(args: {
  message: string;
  history: ChatTurn[];
  childId?: string;
  mode?: AskMode;
  context?: Record<string, string | number | boolean | null | undefined>;
}): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ reply?: string; error?: string }>(
    "copilot-chat",
    { body: args }
  );

  if (error) {
    throw new CopilotChatError(error.message || "Copilot is unavailable right now.");
  }
  if (!data?.reply) {
    throw new CopilotChatError(data?.error || "Copilot didn't return a reply.");
  }
  return data.reply;
}
