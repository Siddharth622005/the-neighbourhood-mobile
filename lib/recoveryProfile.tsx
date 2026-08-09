/**
 * Recovery Profile — the parent's birth-and-feeding context.
 *
 * Four facts, collected once on the first visit to parent mode and editable
 * in Settings:
 *   1. Role            (mother / father / prefer not to say)
 *   2. Birth method     (vaginal / caesarean / prefer not to say)
 *   3. Feeding method   (exclusive / combination / formula / prefer not to say)
 *   4. Delivery date    (optional — falls back to the child's birthday)
 *
 * Role is asked first and gates the other two: birth method and feeding
 * method are questions about the birthing parent's own body, so a father
 * is never asked them — see components/RecoveryProfileQuestions. It exists
 * here, in the same local, once-asked, editable-in-Settings profile as the
 * others, rather than as a new mechanism, because it's the same kind of
 * fact for the same purpose: shaping which content this parent sees.
 *
 * Everything in the Recovery tab, and any recovery-aware line on the Today
 * screen, reads from this provider. The profile is mirrored to AsyncStorage
 * so it survives app restarts and mode switches.
 *
 * "Prefer not to say" is a first-class value, not the absence of a value.
 * Screens that see it show general postpartum content with no assumptions.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type RecoveryRole = "mother" | "father" | "prefer_not_to_say";
export type RecoveryBirthMethod = "vaginal" | "caesarean" | "prefer_not_to_say";
export type RecoveryFeedingMethod =
  | "exclusive"
  | "combination"
  | "formula"
  | "prefer_not_to_say";

export type RecoveryProfile = {
  role: RecoveryRole | "";
  birthMethod: RecoveryBirthMethod | "";
  feedingMethod: RecoveryFeedingMethod | "";
  /** YYYY-MM-DD. Empty string = not provided → child birthday used. */
  deliveryDate: string;
};

const EMPTY: RecoveryProfile = {
  role: "",
  birthMethod: "",
  feedingMethod: "",
  deliveryDate: "",
};

const STORAGE_KEY = "tn.recovery.profile.v1";

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

type RecoveryProfileContextValue = {
  profile: RecoveryProfile;
  /** True once AsyncStorage has been read. */
  hydrated: boolean;
  updateProfile: (patch: Partial<RecoveryProfile>) => void;
  clearProfile: () => Promise<void>;
};

const RecoveryProfileContext =
  createContext<RecoveryProfileContextValue | null>(null);

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export function RecoveryProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<RecoveryProfile>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setProfile({ ...EMPTY, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  const updateProfile = (patch: Partial<RecoveryProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const clearProfile = async () => {
    setProfile(EMPTY);
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  };

  return (
    <RecoveryProfileContext.Provider
      value={{ profile, hydrated, updateProfile, clearProfile }}
    >
      {children}
    </RecoveryProfileContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export function useRecoveryProfile() {
  const ctx = useContext(RecoveryProfileContext);
  if (!ctx)
    throw new Error(
      "useRecoveryProfile must be used within RecoveryProfileProvider"
    );
  return ctx;
}
