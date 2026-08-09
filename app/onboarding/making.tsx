import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { OnboardingScreen } from "../../components/onboarding";
import { LogoMark } from "../../components/Logo";
import { PrimaryButton } from "../../components/ui";
import { useAuth } from "../../lib/AuthProvider";
import * as family from "../../lib/db/family";
import * as plans from "../../lib/db/plans";
import { ensureSession } from "../../lib/db/session";
import { useOnboarding } from "../../lib/OnboardingProvider";
import { useRecoveryProfile } from "../../lib/recoveryProfile";
import { colors, fonts, radius, spacing, typeScale } from "../../lib/theme";

// Calm, human facts — never fake-technical. Rotate underneath a real
// progress fill so the wait reads as "getting ready", not "processing".
const FACTS = [
  "The first five years are the fastest period of brain development.",
  "Play builds cognitive, language, and social skills.",
  "Small daily activities create long-term developmental gains.",
];

const FACT_INTERVAL = 1250; // ms per fact
const BAR_DURATION = FACT_INTERVAL * FACTS.length; // 3750ms
const READY_HOLD = 750; // ms spent on the "Ready." moment
const NAVIGATE_AT = BAR_DURATION + READY_HOLD; // 4500ms — comfortably under 5s

export default function Making() {
  const router = useRouter();
  const { hydrateFamily, refreshFamily } = useAuth();
  const { draft, clear, resumeHref } = useOnboarding();
  const { updateProfile: updateRecoveryProfile } = useRecoveryProfile();
  const [factIndex, setFactIndex] = useState(0);
  const [ready, setReady] = useState(false);
  /**
   * A failed save is NOT survivable: a parent who finishes onboarding with
   * no child row has a broken account and an app that can't plan anything.
   * So this screen holds rather than navigating on, and offers a retry.
   */
  const [saveError, setSaveError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef(Date.now());

  const barProgress = useRef(new Animated.Value(0)).current;
  const entrance = useRef(new Animated.Value(0)).current;
  const factOpacity = useRef(new Animated.Value(1)).current;
  const factRise = useRef(new Animated.Value(0)).current;
  const readyOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Premium micro-interaction: the whole block settles in on mount
    // rather than appearing abruptly.
    Animated.timing(entrance, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // A real, smooth progress fill — not a spinner standing in for one.
    Animated.timing(barProgress, {
      toValue: 1,
      duration: BAR_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const fadeToNextFact = (nextIndex: number) => {
      Animated.parallel([
        Animated.timing(factOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(factRise, { toValue: -6, duration: 160, useNativeDriver: true }),
      ]).start(() => {
        setFactIndex(nextIndex);
        factRise.setValue(6);
        Animated.parallel([
          Animated.timing(factOpacity, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(factRise, {
            toValue: 0,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    };

    const factTimers = FACTS.slice(1).map((_, i) =>
      setTimeout(() => fadeToNextFact(i + 1), FACT_INTERVAL * (i + 1))
    );

    const readyTimer = setTimeout(() => {
      setReady(true);
      Animated.timing(readyOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, BAR_DURATION);

    void save();

    return () => {
      factTimers.forEach(clearTimeout);
      clearTimeout(readyTimer);
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * The real commit: a profiles row and a children row.
   *
   * Runs alongside the animation rather than after it — the promise to the
   * parent is "ready in under 5 seconds", not "as slow as the network" —
   * but navigation waits for it to succeed. Failures are surfaced, never
   * swallowed, because landing on Home with no child is a broken account
   * that looks like a working one.
   */
  const save = async () => {
    setSaveError(null);
    try {
      // This screen can be reached with an incomplete draft — a restored
      // dev route, a deep link, or a resumed session whose storage was
      // cleared. Writing anyway produced a raw Postgres error ("invalid
      // input syntax for type date"), which is both meaningless to a
      // parent and impossible to act on. Send them back to the step
      // that's actually missing instead.
      if (!draft.parentName || !draft.childName || !draft.dateOfBirth) {
        router.replace(resumeHref);
        return;
      }

      const userId = await ensureSession();

      const profile = await family.updateProfile(userId, {
        parent_name: draft.parentName,
        // Captured once, here. Every "today" in the product — which plan
        // is current, when it rolls over — is derived from this.
        timezone: family.deviceTimezone(),
        ...(draft.mobile ? { phone: draft.mobile } : {}),
      });

      // Reuse the MVP child when onboarding is completed again. Keeping the
      // old row here meant a new name or birthday silently disappeared from
      // Home and the age-aware milestone experience.
      const existing = await family.getPrimaryChild(userId);
      const savedChild =
        existing
          ? await family.updateChild(existing.id, {
              name: draft.childName,
              date_of_birth: draft.dateOfBirth,
              gender: draft.gender || null,
            })
          : await family.createChild({
              parentId: userId,
              name: draft.childName,
              dateOfBirth: draft.dateOfBirth,
              gender: draft.gender || null,
            });

      // A plan is persisted for the day. Clear today's copy when the child
      // profile changes so recommendations are regenerated for the new age.
      if (existing) await plans.invalidateTodaysPlan(savedChild.id).catch(() => {});

      hydrateFamily({
        parentName: profile.parent_name ?? draft.parentName,
        child: savedChild,
      });
      await refreshFamily();
      await clear();

      // Hold the "Ready." beat if the save finished early.
      const elapsed = Date.now() - startedAtRef.current;
      navTimerRef.current = setTimeout(
        () => router.replace("/home?guidedTour=1&step=0&next=milestones"),
        Math.max(0, NAVIGATE_AT - elapsed)
      );
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const retry = async () => {
    setRetrying(true);
    await save();
    setRetrying(false);
  };

  const barWidth = barProgress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <OnboardingScreen>
      <Animated.View
        style={[
          styles.wrap,
          {
            opacity: entrance,
            transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
          },
        ]}
      >
        <LogoMark size={44} />

        <Text style={styles.headline}>Getting everything ready for your family.</Text>

        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: barWidth }]} />
        </View>

        <View style={styles.factSlot}>
          {saveError ? (
            <Text style={styles.errorText}>
              We couldn&rsquo;t finish setting up your family. Nothing is lost — your
              answers are still here.
            </Text>
          ) : !ready ? (
            <Animated.Text
              style={[
                styles.fact,
                { opacity: factOpacity, transform: [{ translateY: factRise }] },
              ]}
            >
              {FACTS[factIndex]}
            </Animated.Text>
          ) : (
            <Animated.Text style={[styles.ready, { opacity: readyOpacity }]}>Ready.</Animated.Text>
          )}
        </View>

        {saveError && (
          <View style={styles.retryWrap}>
            <PrimaryButton
              tone="taupe"
              title="Try again"
              onPress={retry}
              loading={retrying}
            />
            {/* The underlying cause, kept small. Useful while this is in
                testing; the sentence above is what actually matters. */}
            <Text style={styles.errorDetail}>{saveError}</Text>
          </View>
        )}
      </Animated.View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
  },
  headline: {
    marginTop: spacing.lg,
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.h3,
    lineHeight: typeScale.h3 * 1.4,
    color: colors.charcoal,
    textAlign: "center",
  },
  track: {
    width: "100%",
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: "hidden",
    marginTop: spacing.xl,
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.warmTaupe,
  },
  factSlot: {
    marginTop: spacing.lg,
    minHeight: typeScale.body * 1.5 * 2, // reserves space so layout doesn't jump between facts
    justifyContent: "center",
  },
  fact: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.5,
    color: colors.textMuted,
    textAlign: "center",
  },
  ready: {
    fontFamily: fonts.serifItalic,
    fontSize: typeScale.h1,
    color: colors.warmTaupe,
    textAlign: "center",
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.5,
    color: colors.charcoal,
    textAlign: "center",
  },
  retryWrap: {
    width: "100%",
    marginTop: spacing.lg,
  },
  errorDetail: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
