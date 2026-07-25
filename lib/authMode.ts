/**
 * Auth kill switch.
 *
 * OFF for now: Supabase's email templates send a magic link rather than
 * the six-digit code `verify.tsx` expects, so nobody could get past the
 * OTP screen. Rather than block testing on a dashboard change, onboarding
 * skips the account step entirely and the family lives on the device.
 *
 * Flip this back to `true` once the Confirm signup and Magic Link
 * templates include {{ .Token }}. Nothing was deleted to turn auth off —
 * contact.tsx, verify.tsx and sign-in.tsx are all still here and wired;
 * this flag just routes around them.
 *
 * What's different while it's off:
 *   · no account, no session, no email
 *   · the profile is AsyncStorage-only, so it's per-device and per-browser
 *   · nothing reaches Supabase — RLS needs auth.uid() for parents/children
 *   · clearing site data (or a new device) starts a fresh family
 */
export const AUTH_ENABLED: boolean = false;
