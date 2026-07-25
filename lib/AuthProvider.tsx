import { Session } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { clearLocalFamily, getLocalFamily } from "./localProfile";
import { supabase } from "./supabase";

export type Child = {
  id: number;
  name: string;
  date_of_birth: string;
  interests: string[];
  goals: string[];
};

type AuthState = {
  session: Session | null;
  loading: boolean; // still resolving the initial session
  familyLoading: boolean; // fetching parent/child rows
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
      const [{ data: parent, error: parentError }, { data: kids, error: childError }] =
        await Promise.all([
          supabase.from("parents").select("full_name").eq("id", userId).single(),
          supabase
            .from("children")
            .select("id, name, date_of_birth, interests, goals")
            .eq("parent_id", userId)
            .order("created_at", { ascending: true })
            .limit(1),
        ]);

      if (parentError && parentError.code !== "PGRST116") throw parentError;
      if (childError) throw childError;

      setParentName(parent?.full_name ?? null);
      setChild(kids && kids.length > 0 ? (kids[0] as Child) : null);
    } catch (err) {
      // Network/DNS failures land here too — surface a calm message
      // instead of leaving the app stuck on a spinner forever.
      setConnectionError(
        "We couldn't reach The Neighbourhood right now. Please check your connection and try again."
      );
    } finally {
      setFamilyLoading(false);
    }
  };

  /** The device-local family — the only source while auth is off. */
  const loadLocalFamily = async () => {
    const local = await getLocalFamily();
    setParentName(local?.parentName ?? null);
    setChild(local?.child ?? null);
  };

  const refreshFamily = async () => {
    // Server wins whenever there's a session; otherwise fall back to the
    // device, which is where onboarding just wrote.
    if (session?.user?.id) await fetchFamily(session.user.id);
    else await loadLocalFamily();
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user?.id) {
        fetchFamily(data.session.user.id);
      } else {
        // Must finish before `loading` drops, or the entry route briefly
        // sees no child and bounces an existing family out to /welcome.
        await loadLocalFamily();
      }
      setLoading(false);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user?.id) {
        fetchFamily(newSession.user.id);
      } else {
        // Not necessarily a sign-out — this also fires on first load with
        // auth off. Re-read the device rather than blanking state, and let
        // signOut() do the actual clearing.
        loadLocalFamily();
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // Clear the device first: the auth listener re-reads local storage, so
    // wiping it afterwards would just be read back in.
    await clearLocalFamily();
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
