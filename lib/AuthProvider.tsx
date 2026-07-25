import { Session } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
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

  const refreshFamily = async () => {
    if (session?.user?.id) await fetchFamily(session.user.id);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session?.user?.id) fetchFamily(data.session.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user?.id) {
        fetchFamily(newSession.user.id);
      } else {
        // Signing out must clear the family, or the next visitor to this
        // device sees the previous parent's child.
        setParentName(null);
        setChild(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
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
