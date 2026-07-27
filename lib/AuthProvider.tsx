import { Session } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import * as family from "./db/family";
import type { Child } from "./db/types";
import { supabase } from "./supabase";

/**
 * The signed-in family.
 *
 * The database is the source of truth: `child` comes from the `children`
 * table, not from device storage. That's what makes the same family
 * appear on a reinstall once the account is linked to an email, and it's
 * why lib/localProfile.ts is gone.
 *
 * `Child` is re-exported from lib/db/types so screens keep importing it
 * from here — its shape now matches the table exactly (uuid id, no
 * interests/goals columns; those are learned from activity_log instead of
 * being stored on the child).
 */
export type { Child };

type AuthState = {
  session: Session | null;
  /** Still resolving the initial session. */
  loading: boolean;
  /** Fetching profile/children rows. */
  familyLoading: boolean;
  parentName: string | null;
  child: Child | null;
  connectionError: string | null;
  refreshFamily: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [parentName, setParentName] = useState<string | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const fetchFamily = async (userId: string) => {
    setFamilyLoading(true);
    setConnectionError(null);
    try {
      const [profile, primary] = await Promise.all([
        family.getProfile(userId),
        family.getPrimaryChild(userId),
      ]);
      setParentName(profile?.parent_name ?? null);
      setChild(primary);
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
        setChild(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setParentName(null);
    setChild(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        familyLoading,
        parentName,
        child,
        connectionError,
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
