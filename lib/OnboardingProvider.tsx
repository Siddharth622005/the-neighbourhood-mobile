import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { EMAIL_AUTH_ENABLED } from "./authMode";
import { computeAge } from "./childAge";
import { isRecoveryRelevant } from "./recoveryRelevance";

/**
 * The onboarding draft — collected BEFORE the parent ever creates an account.
 * The flow is mobile+email → (auth) → parent name → your role → child name
 * → birthday → birth type (mother only) → feeding (first year only) →
 * gender: one question per screen, short enough to finish in under a
 * minute. The draft is mirrored to AsyncStorage so a parent who closes the
 * app mid-flow resumes exactly where they left off.
 *
 * Both the child's facts AND the parent's own (role, birth type, feeding
 * method) are collected here, in the same coherent setup — not as a
 * separate "Parent Care" questionnaire sprung on the parent later. Home
 * needs all of this to personalise the very first screen, so it can't wait
 * until a parent happens to open the You tab. See lib/AuthProvider.tsx for
 * where these facts end up (the `profiles` row) and lib/parentCare.ts for
 * how they're used.
 *
 * These seven facts are the ONLY profiling the app ever does up front.
 * Everything else — interests, goals, temperament — is learned from usage
 * (activities completed, notes, copilot questions), never from a form.
 */
export type OnboardingDraft = {
  mobile: string;
  email: string;
  parentName: string;
  role: "" | "mother" | "father" | "prefer_not_to_say";
  childName: string;
  dateOfBirth: string; // YYYY-MM-DD
  birthMethod: "" | "vaginal" | "caesarean" | "prefer_not_to_say";
  feedingMethod: "" | "exclusive" | "combination" | "formula" | "prefer_not_to_say";
  gender: string; // Boy | Girl | Prefer not to say
};

const EMPTY: OnboardingDraft = {
  mobile: "",
  email: "",
  parentName: "",
  role: "",
  childName: "",
  dateOfBirth: "",
  birthMethod: "",
  feedingMethod: "",
  gender: "",
};

// Bumped from v2: the draft shape gained role/birthMethod/feedingMethod,
// and a half-finished v2 draft would resume into a screen expecting them.
const STORAGE_KEY = "tn.onboarding.draft.v3";

/**
 * Birth type is about the birthing parent's own body — asked only when the
 * parent has said they're the mother (or hasn't said either way; a father
 * is never asked). Feeding is asked alongside it for the same reason
 * lib/parentCare.ts groups them, AND only while a newborn framing still
 * fits the child's age, so an 18-month-old's parent is never asked a
 * postpartum feeding question. Both gates mirror the exact rules
 * isCareAreaVisible/isRecoveryRelevant apply everywhere else in the app.
 */
function asksBirthingQuestions(role: OnboardingDraft["role"]): boolean {
  return role !== "father";
}

function childStillInFirstYear(dateOfBirth: string): boolean {
  if (!dateOfBirth) return false;
  const ageMonths = computeAge(dateOfBirth)?.totalMonths ?? 0;
  return isRecoveryRelevant(ageMonths);
}

// The linear order of the flow. Used only to decide where to resume a
// half-finished draft — never shown to the parent as "step N of M".
export const ONBOARDING_STEPS = [
  ...(EMAIL_AUTH_ENABLED ? (["/onboarding/contact"] as const) : []),
  "/onboarding/parent-name",
  "/onboarding/role",
  "/onboarding/child-name",
  "/onboarding/birthday",
  "/onboarding/birth-type",
  "/onboarding/feeding",
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

/**
 * "Given what's filled in so far, what's the next thing to ask?" Used both
 * to resume a half-finished draft on relaunch AND, by conditional screens
 * (birthday, birth-type), to decide their own Continue destination — so
 * the branching logic (mother vs father, first year vs not) lives in
 * exactly one place instead of being re-derived per screen.
 */
export function resumeFromDraft(d: OnboardingDraft): (typeof ONBOARDING_STEPS)[number] {
  if (EMAIL_AUTH_ENABLED && (!d.mobile || !d.email)) return "/onboarding/contact";
  if (!d.parentName) return "/onboarding/parent-name";
  if (!d.role) return "/onboarding/role";
  if (!d.childName) return "/onboarding/child-name";
  if (!d.dateOfBirth) return "/onboarding/birthday";
  if (asksBirthingQuestions(d.role) && !d.birthMethod) return "/onboarding/birth-type";
  if (asksBirthingQuestions(d.role) && childStillInFirstYear(d.dateOfBirth) && !d.feedingMethod) {
    return "/onboarding/feeding";
  }
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
