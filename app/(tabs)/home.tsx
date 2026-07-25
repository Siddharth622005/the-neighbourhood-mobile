import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { PrimaryButton } from "../../components/ui";
import { useAuth } from "../../lib/AuthProvider";
import { computeAge, stageLabel } from "../../lib/childAge";
import {
  getInProgressActivity,
  markActivityDone,
  markActivityStarted,
} from "../../lib/continueActivity";
import { activityForChild, alternateActivityForChild, type Activity } from "../../lib/todaysPlan";
import { colors, fonts, radius, spacing, typeScale } from "../../lib/theme";

function greetingWord(hour: number): string {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * The daily home screen. One question answered — "what should I do with
 * my child today?" — everything else is either the answer, a way to
 * revisit it, or a way to ask something new. No charts, scores, streaks,
 * or badges: the only progress signal on this screen is a name and an
 * activity, done or not yet done.
 */
export default function Dashboard() {
  const router = useRouter();
  const { child, parentName } = useAuth();

  const [showingAlternate, setShowingAlternate] = useState(false);
  const [inProgressTitle, setInProgressTitle] = useState<string | null>(null);
  const [checkingProgress, setCheckingProgress] = useState(true);

  const cardOpacity = useRef(new Animated.Value(1)).current;
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const refreshProgress = useCallback(() => {
    getInProgressActivity().then((rec) => {
      setInProgressTitle(rec?.title ?? null);
      setCheckingProgress(false);
    });
  }, []);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  if (!child) {
    return (
      <View style={styles.screen}>
        <View style={styles.inner}>
          <Text style={styles.body}>Setting up your plan…</Text>
        </View>
      </View>
    );
  }

  const primary = activityForChild(child);
  const alternate = alternateActivityForChild(child, primary.title);
  const activity: Activity = showingAlternate ? alternate : primary;
  const age = computeAge(child.date_of_birth);
  const hour = new Date().getHours();

  const swapActivity = () => {
    Animated.timing(cardOpacity, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      setShowingAlternate((v) => !v);
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const startActivity = async () => {
    await markActivityStarted(activity.title);
    setInProgressTitle(activity.title);
  };

  const finishActivity = async () => {
    await markActivityDone();
    setInProgressTitle(null);
  };

  const isInProgress = inProgressTitle === activity.title;

  return (
    <View style={styles.screen}>
      <View style={styles.inner}>
        <Animated.View
          style={{
            flex: 1,
            opacity: entrance,
            transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
          }}
        >
          {/* Greeting — orients, never measures. */}
          <Text style={styles.greeting}>
            {greetingWord(hour)}
            {parentName ? `, ${parentName.split(" ")[0]}` : ""}.
          </Text>
          <Text style={styles.subline}>
            {child.name} is {age?.label ?? "growing"} — right in {stageLabel(age?.totalMonths ?? 0)}.
          </Text>

          {/* Continue where you left off — only exists when there's really
              something to continue. Absent otherwise, not greyed out. */}
          {!checkingProgress && inProgressTitle && inProgressTitle !== activity.title && (
            <View style={styles.continueRow}>
              <Text style={styles.continueText}>
                Still partway through <Text style={styles.continueTitle}>{inProgressTitle}</Text>
              </Text>
              <Pressable onPress={markActivityDone} hitSlop={8}>
                <Text style={styles.continueDismiss}>Done</Text>
              </Pressable>
            </View>
          )}

          {/* Today's Plan — the one thing. */}
          <View style={styles.cardWrap}>
            <Animated.View style={[styles.card, { opacity: cardOpacity }]}>
              <Text style={styles.eyebrow}>{showingAlternate ? "OR, INSTEAD" : "TODAY’S ACTIVITY"}</Text>
              <Text style={styles.title}>{activity.title}</Text>
              <Text style={styles.why}>{activity.why}</Text>

              <View style={styles.meta}>
                <MetaIcon />
                <Text style={styles.metaItem}>{activity.durationMins} min</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaItem}>{activity.materials}</Text>
              </View>

              <View style={styles.action}>
                {isInProgress ? (
                  <PrimaryButton title="Mark as done" onPress={finishActivity} />
                ) : (
                  <PrimaryButton title="Start" onPress={startActivity} />
                )}
              </View>
            </Animated.View>

            <Pressable onPress={swapActivity} hitSlop={8} style={styles.swapRow}>
              <Text style={styles.swapText}>
                {showingAlternate ? "Go back to today’s pick" : "Not feeling this? Try something else"}
              </Text>
            </Pressable>
          </View>

          {/* Copilot — a visible but non-intrusive entry point. The tab bar
              is the always-available route; this is the in-context one. */}
          <Pressable style={styles.companionRow} onPress={() => router.push("/copilot")}>
            <View style={styles.companionText}>
              <Text style={styles.companionTitle}>Ask The Neighbourhood</Text>
              <Text style={styles.companionSub}>Sleep, feeding, a tricky moment — anything.</Text>
            </View>
            <ChevronRight />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

function MetaIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{ marginRight: -2 }}>
      <Path
        d="M12 7v5.5l3.5 2M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z"
        stroke={colors.charcoal}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRight() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M9 5l7 7-7 7" stroke={colors.textMuted} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  greeting: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.h2,
    color: colors.charcoal,
  },
  subline: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  continueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: "rgba(168, 181, 164, 0.18)",
    borderRadius: radius.md,
  },
  continueText: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    color: colors.charcoal,
    flexShrink: 1,
  },
  continueTitle: {
    fontFamily: fonts.bodySemiBold,
  },
  continueDismiss: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.bodySmall,
    color: colors.warmTaupe,
    marginLeft: spacing.sm,
  },
  cardWrap: {
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 2,
  },
  eyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.5,
    color: colors.warmTaupe,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.h1,
    color: colors.charcoal,
    lineHeight: typeScale.h1 * 1.2,
  },
  why: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.5,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  metaItem: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.bodySmall,
    color: colors.charcoal,
  },
  metaDot: {
    color: colors.textMuted,
  },
  action: {
    marginTop: spacing.lg,
  },
  swapRow: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  swapText: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.bodySmall,
    color: colors.textMuted,
  },
  companionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  companionText: {
    flexShrink: 1,
  },
  companionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.body,
    color: colors.charcoal,
  },
  companionSub: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    color: colors.textMuted,
  },
});
