import { AUTH_MODE } from "../authMode";
import { DbError, supabase } from "./client";

/**
 * Getting a usable session.
 *
 * Every write in this app goes through RLS, which means nothing reaches
 * the database without an auth.uid(). This is the one place that
 * guarantees one exists.
 *
 * In anonymous mode a session is created on demand — the parent never
 * sees it happen. In email mode a session must already exist (verify.tsx
 * created it), and the absence of one is a real error rather than
 * something to paper over by silently signing them in as someone else.
 */

/** The current user id, or null if there's no session. */
export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

/**
 * Returns a user id, creating an anonymous session if that's the mode and
 * none exists yet. Throws rather than returning null: callers use this
 * precisely because they're about to write, and a silent null would
 * become an RLS failure three frames later with no useful message.
 */
export async function ensureSession(): Promise<string> {
  const existing = await currentUserId();
  if (existing) return existing;

  if (AUTH_MODE !== "anonymous") {
    throw new DbError(
      "session.ensureSession",
      new Error("No session. Sign in before writing.")
    );
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    // The most likely cause by far, and completely invisible from the
    // client otherwise, so name it explicitly.
    throw new DbError(
      "session.ensureSession",
      new Error(
        error.message.includes("disabled")
          ? "Anonymous sign-ins are disabled for this Supabase project. Enable them under Authentication → Providers → Anonymous."
          : error.message
      )
    );
  }

  const id = data.session?.user?.id;
  if (!id) {
    throw new DbError("session.ensureSession", new Error("No user returned"));
  }
  return id;
}
