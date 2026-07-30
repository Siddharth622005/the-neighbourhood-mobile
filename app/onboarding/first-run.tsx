import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { FadeIn, OnboardingScreen } from "../../components/onboarding";
import { GhostButton, PrimaryButton } from "../../components/ui";
import { useAuth } from "../../lib/AuthProvider";
import { canShowMilestones, computeAge } from "../../lib/childAge";
import * as growth from "../../lib/db/growth";
import { DOMAIN_LABEL, DOMAINS, type Domain, type Milestone } from "../../lib/db/types";
import { colors, fonts, radius, spacing, typeScale } from "../../lib/theme";

type Phase = "welcome" | "milestones" | "plan";

const WELCOME_LINES = [
  "Creating a personalized experience",
  "Curating activities by age",
  "Preparing developmental milestones",
  "Personalizing recommendations",
];

const REASSURANCE = [
  "Every child develops at their own pace.",
  "Milestones are guides, not deadlines.",
  "Small moments lead to big milestones.",
  "You're doing a great job by simply paying attention.",
];

const PLAN_LINES = [
  "Choosing age-appropriate activities",
  "Highlighting helpful milestones",
  "Preparing development recommendations",
  "Gathering resources for the days ahead",
];

function firstName(name: string | null | undefined) {
  return name?.trim().split(" ")[0] || "your child";
}

export default function FirstRun() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phase?: string }>();
  const { child } = useAuth();
  const [phase, setPhase] = useState<Phase>(params.phase === "milestones" ? "milestones" : "welcome");
  const [lineIndex, setLineIndex] = useState(0);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [planLineIndex, setPlanLineIndex] = useState(0);

  const childName = firstName(child?.name);
  const ageMonths = child ? computeAge(child.date_of_birth)?.totalMonths ?? 0 : 0;
  const pulse = useRef(new Animated.Value(0)).current;
  const lineOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  useEffect(() => {
    if (phase !== "welcome") return;
    const lineTimers = WELCOME_LINES.slice(1).map((_, index) =>
      setTimeout(() => fadeLine(index + 1), 720 * (index + 1))
    );
    const timer = setTimeout(
      () =>
        router.replace("/home?guidedTour=1&step=0&next=milestones"),
      3600
    );
    return () => {
      lineTimers.forEach(clearTimeout);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ageMonths, phase, router]);

  useEffect(() => {
    if (phase !== "plan") return;
    const timers = PLAN_LINES.slice(1).map((_, index) =>
      setTimeout(() => setPlanLineIndex(index + 1), 520 * (index + 1))
    );
    const doneTimer = setTimeout(() => {
      router.replace("/home?guidedTour=1&step=0");
    }, 2600);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(doneTimer);
    };
  }, [phase, router]);

  const fadeLine = (nextIndex: number) => {
    Animated.timing(lineOpacity, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start(() => {
      setLineIndex(nextIndex);
      Animated.timing(lineOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const loadMilestones = useCallback(async () => {
    if (!child) return;
    if (!canShowMilestones(ageMonths)) {
      setMilestones([]);
      setSelected(new Set());
      return;
    }
    setLoadingMilestones(true);
    try {
      const [library, marked] = await Promise.all([
        growth.getMilestonesForCurrentAge(ageMonths),
        growth.getAchievedMilestones(child.id),
      ]);
      setMilestones(library);
      setSelected(new Set(marked.map((m) => m.milestone_id)));
    } finally {
      setLoadingMilestones(false);
    }
  }, [ageMonths, child]);

  useEffect(() => {
    if (phase === "milestones") void loadMilestones();
  }, [loadMilestones, phase]);

  const grouped = useMemo(() => {
    const limited: Partial<Record<Domain, Milestone[]>> = {};
    DOMAINS.forEach((domain) => {
      const items = milestones.filter((milestone) => milestone.domain === domain);
      if (items.length) limited[domain] = items.slice(0, 4);
    });
    return limited;
  }, [milestones]);

  const toggleMilestone = async (milestone: Milestone) => {
    if (!child || savingId) return;
    const wasSelected = selected.has(milestone.id);
    setSavingId(milestone.id);
    setSelected((prev) => {
      const next = new Set(prev);
      if (wasSelected) next.delete(milestone.id);
      else next.add(milestone.id);
      return next;
    });
    try {
      if (wasSelected) {
        await growth.unmarkMilestone(child.id, milestone.id);
      } else {
        await growth.markMilestoneAchieved({
          childId: child.id,
          milestoneId: milestone.id,
        });
      }
    } catch {
      setSelected((prev) => {
        const next = new Set(prev);
        if (wasSelected) next.add(milestone.id);
        else next.delete(milestone.id);
        return next;
      });
    } finally {
      setSavingId(null);
    }
  };

  if (!child) {
    return (
      <OnboardingScreen>
        <Text style={styles.body}>We need a child profile before personalizing your experience.</Text>
      </OnboardingScreen>
    );
  }

  if (phase === "welcome") {
    return (
      <OnboardingScreen>
        <FadeIn style={styles.center}>
          <Animated.View
            style={[
              styles.orbit,
              {
                transform: [
                  {
                    scale: pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.04],
                    }),
                  },
                ],
              },
            ]}
          >
            <LogoGlyph />
          </Animated.View>
          <Text style={styles.welcomeTitle}>Welcome to The Neighbourhood.</Text>
          <Text style={styles.bodyMuted}>
            We're creating a calm, personalized space for you and {childName}.
          </Text>
          <Animated.View style={[styles.statusCard, { opacity: lineOpacity }]}>
            <CheckTiny />
            <Text style={styles.statusText}>
              {WELCOME_LINES[lineIndex]} for {childName}.
            </Text>
          </Animated.View>
        </FadeIn>
      </OnboardingScreen>
    );
  }

  if (phase === "milestones") {
    return (
      <OnboardingScreen
        scroll
        footer={
          <View style={styles.footerStack}>
            <PrimaryButton
              tone="taupe"
              title={selected.size ? "Continue to today's plan" : "Continue without marking"}
              onPress={() => setPhase("plan")}
            />
            {selected.size > 0 && (
              <GhostButton title="Skip the rest for now" onPress={() => setPhase("plan")} />
            )}
          </View>
        }
      >
        <FadeIn>
          <Text style={styles.title}>Let's understand where {childName} is today.</Text>
          <Text style={styles.bodyMuted}>
            Choose anything you've already noticed. You can update this anytime.
          </Text>
        </FadeIn>

        {loadingMilestones ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={colors.warmTaupe} />
            <Text style={styles.smallMuted}>Finding a few milestones that fit {childName}'s age.</Text>
          </View>
        ) : (
          <View style={styles.milestoneStack}>
            {DOMAINS.map((domain, index) => {
              const items = grouped[domain] ?? [];
              if (!items.length) return null;
              return (
                <View key={domain}>
                  <Text style={styles.domainTitle}>{DOMAIN_LABEL[domain]}</Text>
                  {items.map((milestone) => {
                    const checked = selected.has(milestone.id);
                    return (
                      <Pressable
                        key={milestone.id}
                        onPress={() => toggleMilestone(milestone)}
                        disabled={savingId === milestone.id}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked }}
                        style={({ pressed }) => [
                          styles.milestoneRow,
                          checked && styles.milestoneRowSelected,
                          pressed && { opacity: 0.72 },
                        ]}
                      >
                        <View style={[styles.milestoneCheck, checked && styles.milestoneCheckOn]}>
                          {checked && <CheckTiny color={colors.white} />}
                        </View>
                        <Text style={styles.milestoneText}>{milestone.description}</Text>
                      </Pressable>
                    );
                  })}
                  <Text style={styles.reassurance}>
                    {REASSURANCE[index % REASSURANCE.length]}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </OnboardingScreen>
    );
  }

  return (
    <OnboardingScreen>
      <FadeIn style={styles.center}>
        <View style={styles.orbit}>
          <PlanIcon />
        </View>
        <Text style={styles.titleCenter}>Creating today's plan for {childName}...</Text>
        <Text style={styles.bodyMuted}>
          We're turning what you shared into a gentle starting point.
        </Text>
        <View style={styles.planList}>
          {PLAN_LINES.map((line, index) => (
            <View key={line} style={styles.planLine}>
              <View style={[styles.planCheck, index <= planLineIndex && styles.planCheckOn]}>
                {index <= planLineIndex && <CheckTiny color={colors.white} />}
              </View>
              <Text style={[styles.planText, index <= planLineIndex && styles.planTextOn]}>
                {line}
              </Text>
            </View>
          ))}
        </View>
      </FadeIn>
    </OnboardingScreen>
  );
}

function LogoGlyph() {
  return (
    <Svg width={58} height={58} viewBox="0 0 58 58" fill="none">
      <Circle cx={29} cy={29} r={27} fill="rgba(255,255,255,0.8)" />
      <Path
        d="M18 32c5-10 17-10 22 0M22 24c0-4 3-7 7-7s7 3 7 7"
        stroke={colors.warmTaupe}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <Path
        d="M20 38h18"
        stroke={colors.sage}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PlanIcon() {
  return (
    <Svg width={58} height={58} viewBox="0 0 58 58" fill="none">
      <Circle cx={29} cy={29} r={27} fill="rgba(255,255,255,0.8)" />
      <Path d="M19 23h20M19 30h14M19 37h9" stroke={colors.warmTaupe} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M36 36l3 3 6-7" stroke={colors.sage} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckTiny({ color = colors.sage }: { color?: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 12.5 9.5 17.5 19.5 6.5"
        stroke={color}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  orbit: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.42)",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  welcomeTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.display,
    lineHeight: typeScale.display * 1.18,
    color: colors.charcoal,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.h1,
    lineHeight: typeScale.h1 * 1.24,
    color: colors.charcoal,
    marginBottom: spacing.sm,
  },
  titleCenter: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.h1,
    lineHeight: typeScale.h1 * 1.24,
    color: colors.charcoal,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.5,
    color: colors.charcoal,
  },
  bodyMuted: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.5,
    color: colors.textMuted,
    textAlign: "center",
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusText: {
    flexShrink: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.bodySmall,
    color: colors.charcoal,
  },
  eyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.warmTaupe,
    marginBottom: spacing.sm,
  },
  dots: {
    flexDirection: "row",
    gap: 7,
    marginTop: spacing.xl,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.warmTaupe,
  },
  footerStack: {
    gap: spacing.md,
    alignItems: "center",
  },
  loadingBlock: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  smallMuted: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.45,
    color: colors.textMuted,
    textAlign: "center",
  },
  milestoneStack: {
    marginTop: spacing.xl,
    gap: spacing.lg,
  },
  domainTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.h3,
    color: colors.charcoal,
    marginBottom: spacing.sm,
  },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  milestoneRowSelected: {
    backgroundColor: "rgba(168, 181, 164, 0.18)",
    borderColor: "rgba(168, 181, 164, 0.58)",
  },
  milestoneCheck: {
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  milestoneCheckOn: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  milestoneText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.45,
    color: colors.charcoal,
  },
  reassurance: {
    fontFamily: fonts.serifItalic,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.45,
    color: colors.warmTaupe,
    marginTop: spacing.xs,
  },
  planList: {
    width: "100%",
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  planLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  planCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.border,
  },
  planCheckOn: {
    backgroundColor: colors.sage,
  },
  planText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    color: colors.textMuted,
  },
  planTextOn: {
    fontFamily: fonts.bodySemiBold,
    color: colors.charcoal,
  },
});
