import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * The onboarding draft — collected BEFORE the parent ever creates an account.
 * The flow is mobile+email → (auth) → birthday → gender: short enough to
 * finish in under 30 seconds. The draft is mirrored to AsyncStorage so a
 * parent who closes the app mid-flow resumes exactly where they left off.
 */
export type OnboardingDraft = {
  mobile: string;
  email: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: string; // Boy | Girl | Prefer not to say
};

const EMPTY: OnboardingDraft = {
  mobile: "",
  email: "",
  dateOfBirth: "",
  gender: "",
};

const STORAGE_KEY = "tn.onboarding.draft.v1";

// The linear order of the flow. Used only to decide where to resume a
// half-finished draft — never shown to the parent as "step N of M".
export const ONBOARDING_STEPS = [
  "/onboarding/contact",
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
  if (!d.mobile || !d.email) return "/onboarding/contact";
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

  const hasProgress = Boolean(draft.mobile || draft.email);

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
