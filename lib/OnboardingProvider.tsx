import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { EMAIL_AUTH_ENABLED } from "./authMode";

/**
 * The onboarding draft — collected BEFORE the parent ever creates an account.
 * The flow is mobile+email → (auth) → parent name → child name → birthday
 * → gender: one question per screen, short enough to finish in under 30
 * seconds. The draft is mirrored to AsyncStorage so a parent who closes
 * the app mid-flow resumes exactly where they left off.
 *
 * Every question here is about the CHILD. The recovery questions that
 * used to sit at the end — birth method, feeding method — moved to the
 * first visit to parent mode, so the most personal thing the app asks is
 * no longer standing between a parent and a working app.
 *
 * These four child/parent facts are the ONLY profiling the app ever does.
 * Everything else — interests, goals, temperament — is learned from usage
 * (activities completed, notes, copilot questions), never from a form.
 */
export type OnboardingDraft = {
  mobile: string;
  email: string;
  parentName: string;
  childName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: string; // Boy | Girl | Prefer not to say
};

const EMPTY: OnboardingDraft = {
  mobile: "",
  email: "",
  parentName: "",
  childName: "",
  dateOfBirth: "",
  gender: "",
};

// Bumped from v1: the draft shape gained parentName/childName, and a
// half-finished v1 draft would resume into a screen expecting them.
const STORAGE_KEY = "tn.onboarding.draft.v2";

// The linear order of the flow. Used only to decide where to resume a
// half-finished draft — never shown to the parent as "step N of M".
export const ONBOARDING_STEPS = [
  ...(EMAIL_AUTH_ENABLED ? (["/onboarding/contact"] as const) : []),
  "/onboarding/parent-name",
  "/onboarding/child-name",
  "/onboarding/birthday",
  "/onboarding/gender",
] as const;

type OnboardingContextValue = {
  draft: OnboardingDraft;
  hydrated: boolean; // AsyncStorage read has completed
  update: (patch: Partial<OnboardingDraft>) => void;
  clear: () => Promise<void>;
  /** The furthest screen the parent has meaningful data for — for resume. */
  resumeHref: (typeof ONBOARDING_STEPS)[number];
  hasProgress: boolean;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

function resumeFromDraft(d: OnboardingDraft): (typeof ONBOARDING_STEPS)[number] {
  if (EMAIL_AUTH_ENABLED && (!d.mobile || !d.email)) return "/onboarding/contact";
  if (!d.parentName) return "/onboarding/parent-name";
  if (!d.childName) return "/onboarding/child-name";
  if (!d.dateOfBirth) return "/onboarding/birthday";
  return "/onboarding/gender";
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setDraft({ ...EMPTY, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  const update = (patch: Partial<OnboardingDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const clear = async () => {
    setDraft(EMPTY);
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  };

  // Any field the CURRENT flow actually collects. Keying this off
  // mobile/email alone meant it was permanently false with auth off,
  // since those screens no longer run — so a parent who quit halfway was
  // never offered their place back.
  const hasProgress = Boolean(
    draft.mobile || draft.email || draft.parentName || draft.childName || draft.dateOfBirth
  );

  return (
    <OnboardingContext.Provider
      value={{ draft, hydrated, update, clear, resumeHref: resumeFromDraft(draft), hasProgress }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
