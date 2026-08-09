import { Session } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import * as family from "./db/family";
import { isAccountLinked } from "./db/session";
import type { Child, Profile } from "./db/types";
import { supabase } from "./supabase";

/**
 * The signed-in family.
 *
 * The database is the source of truth: `child` comes from the `children`
 * table, not from device storage. That's what makes the same family
 * appear on a reinstall once the account is linked to an email, and it's
 * why lib/localProfile.ts is gone.
 *
 * `profile` carries the parent's own facts (role, birth method, feeding
 * method — see lib/parentCare.ts) the same way: collected once during main
 * onboarding, read from `profiles`, never a second local copy. This
 * replaced a separate AsyncStorage-only "Recovery Profile" that was asked
 * on first visit to the You tab and never survived a reinstall.
 *
 * `Child` is re-exported from lib/db/types so screens keep importing it
 * from here — its shape now matches the table exactly (uuid id, no
 * interests/goals columns; those are learned from activity_log instead of
 * being stored on the child).
 */
export type { Child, Profile };

type AuthState = {
  session: Session | null;
  /** Still resolving the initial session. */
  loading: boolean;
  /** Fetching profile/children rows. */
  familyLoading: boolean;
  parentName: string | null;
  /** The full profiles row — role/birth/feeding live on `relationship` /
   *  `birth_method` / `feeding_method`. Null until a session resolves. */
  profile: Profile | null;
  child: Child | null;
  connectionError: string | null;
  /**
   * True once an email is confirmed on this account. Until then the family
   * exists only on this device — see isAccountLinked. Screens use this to
   * decide whether signing out is safe and whether to offer linking.
   */
  accountLinked: boolean;
  /** The confirmed email, for display. Null while anonymous. */
  accountEmail: string | null;
  hydrateFamily: (input: { profile: Profile; child: Child }) => void;
  refreshFamily: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [parentName, setParentName] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  // Which user id `child` currently reflects. Lets fetchFamily tell "a
  // slower fetch for the SAME user landed late" (keep the newer local
  // state) apart from "the signed-in identity actually changed" (an old
  // anonymous account's child must never leak into a fresh Google/Apple
  // sign-in that legitimately has none yet).
  const childUserId = useRef<string | null>(null);

  const fetchFamily = async (userId: string) => {
    setFamilyLoading(true);
    setConnectionError(null);
    try {
      const [profileRow, primary] = await Promise.all([
        family.getProfile(userId),
        family.getPrimaryChild(userId),
      ]);
      setParentName(profileRow?.parent_name ?? null);
      // No stale-carry-over guard needed here the way `child` needs one:
      // the profiles row is created by a DB trigger the moment a user
      // exists (see lib/db/family.ts), so profileRow is only ever null
      // for a split second before that trigger runs — never a legitimate
      // "this account has no profile" state to protect against overwriting.
      setProfile(profileRow);
      // Anonymous signup can fire an auth-state fetch before onboarding has
      // inserted the child row. If that slower "no child yet" response lands
      // after onboarding has already hydrated the created child locally for
      // this SAME user, do not erase the dashboard's source of truth. But if
      // the signed-in user has changed since `child` was last set, `primary`
      // is authoritative even when null — otherwise a previous anonymous
      // account's child would leak into a brand-new Google/Apple sign-in.
      setChild((current) => (primary ?? (childUserId.current === userId ? current : null)));
      childUserId.current = userId;
    } catch {
      // Network/DNS failures land here too — surface a calm message rather
      // than leaving the app stuck on a spinner forever.
      setConnectionError(
        "We couldn't reach The Neighbourhood right now. Please check your connection and try again."
      );
    } finally {
      setFamilyLoading(false);
    }
  };

  const refreshFamily = async () => {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    // Keep session in step: onboarding may have created one since mount.
    setSession(data.session);
    if (userId) await fetchFamily(userId);
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user?.id) {
        await fetchFamily(data.session.user.id);
      }
      setLoading(false);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user?.id) {
        fetchFamily(newSession.user.id);
      } else {
        // Signed out — clear, or the next person on this device inherits
        // the previous family.
        setParentName(null);
        setProfile(null);
        setChild(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setParentName(null);
    setProfile(null);
    setChild(null);
    await supabase.auth.signOut();
  };

  const hydrateFamily = (input: { profile: Profile; child: Child }) => {
    setParentName(input.profile.parent_name);
    setProfile(input.profile);
    setChild(input.child);
    setConnectionError(null);
    setFamilyLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        familyLoading,
        parentName,
        profile,
        child,
        connectionError,
        accountLinked: isAccountLinked(session?.user),
        accountEmail: isAccountLinked(session?.user) ? session?.user?.email ?? null : null,
        hydrateFamily,
        refreshFamily,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
