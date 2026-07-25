import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { PrimaryButton } from "../../components/ui";
import { useAuth } from "../../lib/AuthProvider";
import { computeAge, stageLabel } from "../../lib/childAge";
import {
  completeActivity,
  getTodayState,
  startActivity,
  swapDomain,
  type TodayState,
} from "../../lib/todayState";
import { planForChild, poolSize, type Activity, type Domain } from "../../lib/todaysPlan";
import { colors, fonts, radius, spacing, typeScale } from "../../lib/theme";

function greetingWord(hour: number): string {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Home — "what should I do with my child today?", answered four times, one
 * per developmental domain.
 *
 * The four are NOT a checklist. Exactly one is expanded at a time; the
 * rest are quiet single rows. A parent who does two of four should close
 * the app feeling fine, so there is no percentage, no streak, no score,
 * and no state that reads as "behind". Completed activities stay visible
 * as calm lines rather than vanishing, because seeing what you already did
 * is the point.
 *
 * Nothing here is tied to time of day — the plan is equally valid at 7am
 * or 9pm.
 */
export default function Home() {
  const router = useRouter();
  const { child, parentName } = useAuth();

  const [state, setState] = useState<TodayState | null>(null);
  /** Set only when the parent taps a row open ahead of its turn. */
  const [openedEarly, setOpenedEarly] = useState<Domain | null>(null);

  const entrance = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  useEffect(() => {
    getTodayState().then(setState);
  }, []);

  const fadeSwap = useCallback(
    (mutate: () => Promise<TodayState>) => {
      Animated.timing(cardOpacity, { toValue: 0, duration: 140, useNativeDriver: true }).start(
        async () => {
          setState(await mutate());
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }
      );
    },
    [cardOpacity]
  );

  if (!child || !state) {
    return (
      <View style={styles.screen}>
        <View style={styles.inner}>
          <Text style={styles.loading}>Setting up your plan…</Text>
        </View>
      </View>
    );
  }

  const plan = planForChild(child, { swaps: state.swaps });
  const age = computeAge(child.date_of_birth);
  const doneCount = state.completed.length;
  const allDone = doneCount === plan.length;

  // The expanded card is the first incomplete activity, unless the parent
  // has deliberately opened another one early.
  const firstIncomplete = plan.find((a) => !state.completed.includes(a.domain))?.domain ?? null;
  const expanded =
    openedEarly && !state.completed.includes(openedEarly) ? openedEarly : firstIncomplete;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: entrance,
            transform: [
              { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
            ],
          }}
        >
          {/* Greeting — orients, never measures. Deliberately smaller than
              the activity title, which is the loudest thing on screen. */}
          <Text style={styles.greeting}>
            {greetingWord(new Date().getHours())}
            {parentName ? `, ${parentName.split(" ")[0]}` : ""}.
          </Text>
          <Text style={styles.subline}>
            {child.name} is {age?.label ?? "growing"} — right in {stageLabel(age?.totalMonths ?? 0)}.
          </Text>

          <ProgressSegments plan={plan} completed={state.completed} expanded={expanded} />

          <View style={styles.list}>
            {plan.map((activity) => {
              const isDone = state.completed.includes(activity.domain);
              if (isDone) return <DoneRow key={activity.domain} activity={activity} />;

              if (activity.domain === expanded) {
                return (
                  <Animated.View key={activity.domain} style={{ opacity: cardOpacity }}>
                    <ExpandedCard
                      activity={activity}
                      inProgress={state.inProgress?.domain === activity.domain}
                      canSwap={poolSize(child, activity.domain) > 1}
                      onStart={() => startActivity(activity.domain).then(setState)}
                      onComplete={() => completeActivity(activity.domain).then(setState)}
                      onSwap={() => fadeSwap(() => swapDomain(activity.domain))}
                    />
                  </Animated.View>
                );
              }

              return (
                <UpcomingRow
                  key={activity.domain}
                  activity={activity}
                  onPress={() => setOpenedEarly(activity.domain)}
                />
              );
            })}
          </View>

          {allDone && <EndOfDay childName={child.name} />}

          {/* Copilot — a visible but non-intrusive entry point. The tab bar
              is the always-available route; this is the in-context one. */}
          <Pressable style={styles.askRow} onPress={() => router.push("/copilot")}>
            <View style={styles.askText}>
              <Text style={styles.askTitle}>Ask The Neighbourhood</Text>
              <Text style={styles.askSub}>Sleep, feeding, a tricky moment — anything.</Text>
            </View>
            <ChevronRight />
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

/**
 * Four segments, one per domain. Completed reads sage, the one you're on
 * reads taupe, the rest stay muted. There is no "behind" state and no
 * percentage — two of four is a fine place to stop.
 */
function ProgressSegments({
  plan,
  completed,
  expanded,
}: {
  plan: Activity[];
  completed: Domain[];
  expanded: Domain | null;
}) {
  return (
    <View style={styles.progressWrap}>
      <View style={styles.segments}>
        {plan.map((a) => {
          const isDone = completed.includes(a.domain);
          const isCurrent = a.domain === expanded;
          return (
            <View
              key={a.domain}
              style={[
                styles.segment,
                isDone && styles.segmentDone,
                !isDone && isCurrent && styles.segmentCurrent,
              ]}
            />
          );
        })}
      </View>
      <Text style={styles.progressLabel}>
        {completed.length} of {plan.length}
      </Text>
    </View>
  );
}

/** The one activity in focus: the only place with a button. */
function ExpandedCard({
  activity,
  inProgress,
  canSwap,
  onStart,
  onComplete,
  onSwap,
}: {
  activity: Activity;
  inProgress: boolean;
  canSwap: boolean;
  onStart: () => void;
  onComplete: () => void;
  onSwap: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.domainLabel}>{activity.domain.toUpperCase()}</Text>
      <Text style={styles.title}>{activity.title}</Text>
      <Text style={styles.why}>{activity.why}</Text>

      <View style={styles.metaBlock}>
        <View style={styles.metaRow}>
          <ClockIcon />
          <Text style={styles.metaText} numberOfLines={1}>
            {activity.durationMins} min
          </Text>
        </View>
        <View style={styles.metaRow}>
          <BasketIcon />
          <Text style={styles.metaText} numberOfLines={1}>
            {activity.materials}
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <View style={styles.actionMain}>
          <PrimaryButton
            tone="taupe"
            title={inProgress ? "Mark as done" : "Start"}
            onPress={inProgress ? onComplete : onStart}
          />
        </View>
        {canSwap && (
          <Pressable
            onPress={onSwap}
            style={styles.swapButton}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Show a different activity"
          >
            <RefreshIcon />
          </Pressable>
        )}
      </View>
    </View>
  );
}

/** Done, and staying visible — quieter, but not struck through or greyed out. */
function DoneRow({ activity }: { activity: Activity }) {
  return (
    <View style={[styles.row, styles.rowDone]}>
      <CheckIcon />
      <View style={styles.rowText}>
        <Text style={styles.rowDomainDone}>{activity.domain}</Text>
        <Text style={styles.rowTitleDone} numberOfLines={1}>
          {activity.title}
        </Text>
      </View>
    </View>
  );
}

/** Still to come. Tappable, so a parent can jump to the one they fancy. */
function UpcomingRow({ activity, onPress }: { activity: Activity; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${activity.title}`}
    >
      <View style={styles.rowDot} />
      <View style={styles.rowText}>
        <Text style={styles.rowDomain}>{activity.domain}</Text>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {activity.title}
        </Text>
      </View>
      <ChevronRight />
    </Pressable>
  );
}

/** Acknowledgement, not celebration. No confetti, no "come back tomorrow". */
function EndOfDay({ childName }: { childName: string }) {
  return (
    <View style={styles.endCard}>
      <Text style={styles.endTitle}>That&rsquo;s all four.</Text>
      <Text style={styles.endBody}>
        Motor, communication, cognitive and social — {childName} had a bit of each today.
      </Text>
    </View>
  );
}

function ClockIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 7v5.5l3.5 2M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z"
        stroke={colors.textMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BasketIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 9h16l-1.4 9.2a2 2 0 0 1-2 1.8H7.4a2 2 0 0 1-2-1.8L4 9Zm4.5 0L11 4m4.5 5L13 4"
        stroke={colors.textMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RefreshIcon() {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4v4.2h-4.2"
        stroke={colors.warmTaupe}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 12.5 9.5 17.5 19.5 6.5"
        stroke={colors.sage}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRight() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5l7 7-7 7"
        stroke={colors.textMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  inner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  loading: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    color: colors.textMuted,
    paddingTop: spacing.lg,
  },

  // Header — stepped down so the activity title is the largest text here.
  greeting: {
    fontFamily: fonts.bodyBold,
    fontSize: 19,
    color: colors.charcoal,
  },
  subline: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 13 * 1.45,
    color: colors.textMuted,
    marginTop: 2,
  },

  progressWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  segments: {
    flex: 1,
    flexDirection: "row",
    gap: 5,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  segmentDone: { backgroundColor: colors.sage },
  segmentCurrent: { backgroundColor: colors.warmTaupe },
  progressLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.caption,
    color: colors.textMuted,
  },

  list: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  domainLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.4,
    color: colors.warmTaupe,
    marginBottom: 6,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    lineHeight: 20 * 1.25,
    color: colors.charcoal,
  },
  why: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.5,
    color: colors.textMuted,
    marginTop: 6,
  },
  metaBlock: {
    marginTop: spacing.md,
    gap: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  metaText: {
    flexShrink: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.charcoal,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionMain: { flex: 1 },
  swapButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Collapsed rows sit on a translucent fill so the expanded card stays
  // the visually dominant element.
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "rgba(255, 255, 255, 0.55)",
  },
  rowDone: {
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },
  rowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: colors.softSand,
  },
  rowText: { flex: 1 },
  rowDomain: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.warmTaupe,
  },
  rowTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.bodySmall,
    color: colors.charcoal,
    marginTop: 1,
  },
  rowDomainDone: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  rowTitleDone: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    color: colors.textMuted,
    marginTop: 1,
  },

  endCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "rgba(168, 181, 164, 0.20)",
  },
  endTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.h3,
    color: colors.charcoal,
  },
  endBody: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.5,
    color: colors.textMuted,
    marginTop: 4,
  },

  askRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  askText: { flexShrink: 1 },
  askTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.bodySmall,
    color: colors.charcoal,
  },
  askSub: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
