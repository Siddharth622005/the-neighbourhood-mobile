/**
 * How a parent gets a session.
 *
 * "anonymous" — onboarding silently creates a real Supabase user via
 *   signInAnonymously. There is still a genuine auth.uid(), so every RLS
 *   policy works and profiles/children/plans are real database rows; the
 *   parent just never sees an account step. This matches the product's
 *   "we earn the account at the end, not the front door" stance, and it's
 *   what unblocked Phase 2 while the email templates are still wrong
 *   (Supabase sends a magic link, verify.tsx expects a six-digit code).
 *
 *   Trade-off: the account lives on the device. Reinstall or a second
 *   phone starts a new family until it's linked to an email.
 *
 * "email" — the designed flow: contact → OTP → verify. Requires the
 *   Confirm signup AND Magic Link templates to include {{ .Token }}.
 *   Switching back is this one constant; contact.tsx, verify.tsx and
 *   sign-in.tsx were never deleted.
 *
 * Upgrading an anonymous account to a permanent one later is supported by
 * Supabase (updateUser with an email, then verify) and keeps the same
 * user id — so no data migration is needed when that day comes.
 */
export type AuthMode = "anonymous" | "email";

export const AUTH_MODE: AuthMode = "anonymous";

/**
 * Whether the email/OTP screens are part of onboarding.
 *
 * The cast is load-bearing: TypeScript narrows a `const` to its initializer's
 * literal type for comparisons, so without it this reads as comparing
 * "anonymous" to "email" and fails to compile — even though AUTH_MODE is
 * declared as the union and is meant to be edited.
 */
export const EMAIL_AUTH_ENABLED: boolean = (AUTH_MODE as string) === "email";
