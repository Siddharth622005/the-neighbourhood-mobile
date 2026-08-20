// Copilot's model backend — a Supabase Edge Function, not a call straight
// from the app, because Groq's API key can't live in the client bundle.
// Expo env vars prefixed EXPO_PUBLIC_* ship inside the JS bundle and are
// readable by anyone who opens the app; GROQ_API_KEY stays a server-side
// secret instead (`supabase secrets set GROQ_API_KEY=...`), and only this
// function ever sees it.
//
// The client calls this via supabase.functions.invoke("copilot-chat", ...),
// which forwards the caller's own access token in the Authorization header.
// That token is used to build a Supabase client scoped to that user, so RLS
// — not this function's own logic — is what proves the child belongs to
// them, the same ownership rule every other child-scoped table already
// enforces.
//
// Deploy:  supabase functions deploy copilot-chat
// Secret:  supabase secrets set GROQ_API_KEY=gsk_...
// Model override (optional): supabase secrets set GROQ_MODEL=openai/gpt-oss-120b
//
// DEFAULT_MODEL history: llama-3.3-70b-versatile was retired from Groq's
// catalog (confirmed via GET /openai/v1/models against this project's own
// key — it 404s as model_not_found and doesn't appear in the list at all).
// Swapped 2026-08-20 for openai/gpt-oss-120b, the closest replacement in
// size and generality (131k context, tool/json_mode/reasoning support) —
// see https://console.groq.com/docs/models for the current catalog if
// this needs revisiting again.

import { createClient } from "jsr:@supabase/supabase-js@2";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ChatMessage = { role: "parent" | "copilot"; text: string };

type AskMode = "family" | "child" | "parent";

type RequestBody = {
  childId?: string;
  /** The parent's new message. */
  message: string;
  /** Prior turns in this conversation, oldest first — not persisted server-side yet, so the client resends it each time. */
  history?: ChatMessage[];
  /**
   * "family" (default, bare Ask tab) | "child" | "parent" — narrows the
   * subject when Ask was opened from inside Child or You. Not two
   * products: one system prompt that widens or narrows its stated remit.
   */
  mode?: AskMode;
  /**
   * Extra known facts to fold into the system prompt — e.g. Parent Mode's
   * weeksPostpartum/stage/feeding profile from lib/parentCare.ts. Kept
   * generic here rather than hardcoding those field names, since that data
   * model belongs to the client, not to this function.
   */
  context?: Record<string, string | number | boolean | null | undefined>;
};

/**
 * What Copilot is allowed to be: warm, practical, and explicit about its
 * own limits. This is the one thing every surface in the app already
 * agrees on (see CareNote in components/parentUI.tsx, the "seek help"
 * blocks in lib/parentCare.ts) — the model gets the same rule, not a
 * softer one just because it's freeform chat.
 */
function systemPrompt(
  mode: AskMode,
  childName: string | null,
  ageLabel: string | null,
  extraContext?: RequestBody["context"]
) {
  const who = childName ? `The parent's child is ${childName}${ageLabel ? `, ${ageLabel}` : ""}.` : "";
  const subject =
    mode === "parent"
      ? "postpartum recovery, feeding, sleep, and the parent's own physical and mental health"
      : mode === "child"
        ? "the child's development, sleep, feeding, and everyday parenting questions"
        : "anything about the family — the child's development, sleep, feeding and behaviour, or the parent's own recovery, sleep and mental health. Read the question and answer about whichever it's actually about";

  const contextLine = extraContext
    ? Object.entries(extraContext)
        .filter(([, v]) => v !== null && v !== undefined && v !== "")
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")
    : "";

  return [
    "You are Copilot, a warm and practical parenting companion inside The Neighbourhood app.",
    `You help with ${subject}. ${who}`.trim(),
    contextLine ? `Known context — ${contextLine}.` : "",
    "Answer in a few short, plain-spoken paragraphs — no bullet-point walls, no headers, no markdown formatting.",
    "You are educational support, not a clinician. Never diagnose, never name a specific medication or dose, and never claim certainty about an individual case.",
    "When something sounds urgent or medical — fever in a young infant, injury, thoughts of self-harm, anything that shouldn't wait — say plainly that it's worth contacting a doctor or emergency services now, before anything else.",
    "If you don't have enough information to answer well, ask one short clarifying question instead of guessing.",
  ]
    .filter(Boolean)
    .join(" ");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "missing authorization" }, 401);
    }

    const groqKey = Deno.env.get("GROQ_API_KEY");
    if (!groqKey) {
      return json({ error: "GROQ_API_KEY is not set on this project" }, 500);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const body = (await req.json()) as RequestBody;
    const message = (body.message ?? "").trim();
    if (!message) return json({ error: "message is required" }, 400);

    const mode: AskMode = body.mode === "parent" || body.mode === "child" ? body.mode : "family";

    // RLS-scoped: this only returns a row if the child belongs to the
    // caller. No separate ownership check needed, same as every other
    // child-scoped read in this app.
    let childName: string | null = null;
    let ageLabel: string | null = null;
    if (body.childId) {
      const { data: child } = await supabase
        .from("children")
        .select("name, date_of_birth")
        .eq("id", body.childId)
        .maybeSingle();
      if (child) {
        childName = child.name;
        const months = monthsSince(child.date_of_birth);
        ageLabel = months < 24 ? `${months} months old` : `${Math.floor(months / 12)} years old`;
      }
    }

    const history = (body.history ?? []).slice(-12); // recent turns only — keeps latency and cost down
    const groqMessages = [
      { role: "system", content: systemPrompt(mode, childName, ageLabel, body.context) },
      ...history.map((m) => ({
        role: m.role === "parent" ? "user" : "assistant",
        content: m.text,
      })),
      { role: "user", content: message },
    ];

    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("GROQ_MODEL") || DEFAULT_MODEL,
        messages: groqMessages,
        temperature: 0.6,
        max_tokens: 600,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq error", groqRes.status, errText);
      return json({ error: "The model is unavailable right now. Please try again." }, 502);
    }

    const data = await groqRes.json();
    const reply: string | undefined = data.choices?.[0]?.message?.content;
    if (!reply) return json({ error: "The model returned an empty response." }, 502);

    return json({ reply: reply.trim() }, 200);
  } catch (err) {
    console.error("copilot-chat error", err);
    return json({ error: "Something went wrong." }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function monthsSince(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  return (
    (now.getFullYear() - dob.getFullYear()) * 12 +
    (now.getMonth() - dob.getMonth()) -
    (now.getDate() < dob.getDate() ? 1 : 0)
  );
}
