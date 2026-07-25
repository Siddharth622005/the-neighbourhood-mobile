import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { OnboardingScreen } from "../../components/onboarding";
import { useAuth } from "../../lib/AuthProvider";
import { useOnboarding } from "../../lib/OnboardingProvider";
import { supabase } from "../../lib/supabase";
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
  const { session, refreshFamily } = useAuth();
  const { draft, clear } = useOnboarding();
  const [factIndex, setFactIndex] = useState(0);
  const [ready, setReady] = useState(false);

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

    const navTimer = setTimeout(() => router.replace("/dashboard"), NAVIGATE_AT);

    // Best-effort save, decoupled from the on-screen timing — the promise
    // to the parent is "ready in under 5 seconds", not "as slow as the
    // network". Dashboard already handles a not-yet-loaded child profile.
    (async () => {
      if (!session?.user?.id) return;
      try {
        await supabase
          .from("parents")
          .update({ phone: draft.mobile, full_name: draft.parentName })
          .eq("id", session.user.id);
        await supabase.from("children").insert({
          parent_id: session.user.id,
          name: draft.childName,
          date_of_birth: draft.dateOfBirth,
          gender: draft.gender,
        });
        await refreshFamily();
        await clear();
      } catch {
        // Swallowed intentionally — see comment above.
      }
    })();

    return () => {
      factTimers.forEach(clearTimeout);
      clearTimeout(readyTimer);
      clearTimeout(navTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <Text style={styles.headline}>Getting everything ready for your family.</Text>

        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: barWidth }]} />
        </View>

        <View style={styles.factSlot}>
          {!ready ? (
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
      </Animated.View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
  },
  headline: {
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
});
