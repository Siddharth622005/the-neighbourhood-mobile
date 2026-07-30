import { useLocalSearchParams, useRouter } from "expo-router";
import { useScreenFocus } from "../../lib/useScreenFocus";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { GuidedTourDialog } from "../../components/GuidedTourDialog";
import { PrimaryButton } from "../../components/ui";
import { useAuth } from "../../lib/AuthProvider";
import { computeAge, stageLabel } from "../../lib/childAge";
import * as growth from "../../lib/db/growth";
import { DOMAIN_LABEL, type Activity, type Domain, type VaccinationScheduleItem } from "../../lib/db/types";
import { hasCompletedHomeCoach, markFirstRunComplete, markHomeCoachComplete } from "../../lib/firstRun";
import { useMode } from "../../lib/ModeProvider";
import { bridgesFor, deriveProfile } from "../../lib/parentCare";
import { useTodaysPlan } from "../../lib/useTodaysPlan";
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
  const params = useLocalSearchParams<{
    guidedTour?: string;
    next?: string;
    step?: string;
    tourComplete?: string;
  }>();
  const { child, parentName } = useAuth();
  const [coachVisible, setCoachVisible] = useState(false);
  const [coachStep, setCoachStep] = useState(0);
  const [showTourDone, setShowTourDone] = useState(params.tourComplete === "1");
  const [nextVaccination, setNextVaccination] = useState<VaccinationScheduleItem | null>(null);
  // See guide.tsx: only the focused screen may show a tour dialog.
  const isFocused = useScreenFocus();
  const guidedTour = params.guidedTour === "1" && isFocused;
  const afterOnboardingTour = params.next === "milestones";
  const tourNext = afterOnboardingTour ? "&next=milestones" : "";

  /** Set only when the parent taps a row open ahead of its turn. */
  const [openedEarly, setOpenedEarly] = useState<Domain | null>(null);

  // The plan now comes from the database, cached locally so this renders
  // immediately and completions never wait on the network.
  const { plan, completed, loading, error, complete, swap } =
    useTodaysPlan(child?.id ?? null);

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
    let alive = true;
    if (!child || guidedTour) return;
    hasCompletedHomeCoach()
      .then((complete) => {
        if (!alive || complete) return;
        setTimeout(() => {
          if (alive) setCoachVisible(true);
        }, 650);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [child, guidedTour]);

  useEffect(() => {
    if (params.tourComplete !== "1") return;
    setShowTourDone(true);
    const timer = setTimeout(() => setShowTourDone(false), 2600);
    return () => clearTimeout(timer);
  }, [params.tourComplete]);

  useEffect(() => {
    if (!child) return;
    let alive = true;
    const ageDays = Math.floor(
      (Date.now() - new Date(`${child.date_of_birth}T00:00:00`).getTime()) / 86_400_000
    );
    Promise.all([growth.getVaccinationSchedule(), growth.getAdministeredVaccinations(child.id)])
      .then(([schedule, recorded]) => {
        if (!alive) return;
        const recordedIds = new Set(recorded.map((item) => item.vaccination_id));
        const remaining = schedule.filter((item) => !recordedIds.has(item.id));
        setNextVaccination(
          remaining.find((item) => item.age_days >= ageDays) ?? remaining[0] ?? null
        );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [child]);

  const closeCoach = async () => {
    setCoachVisible(false);
    setCoachStep(0);
    await markHomeCoachComplete().catch(() => {});
  };

  const nextCoach = () => {
    if (coachStep >= HOME_COACH.length - 1) {
      void closeCoach();
      return;
    }
    setCoachStep((step) => step + 1);
  };

  const skipGuidedTour = async () => {
    await Promise.all([markHomeCoachComplete(), markFirstRunComplete()]).catch(() => {});
    router.replace("/home");
  };

  const fadeSwap = useCallback(
    (domain: Domain, run: () => Promise<void>) => {
      Animated.timing(cardOpacity, { toValue: 0, duration: 140, useNativeDriver: true }).start(
        async () => {
          await run();
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

  if (!child || (loading && !plan)) {
    return (
      <View style={styles.screen}>
        <View style={styles.inner}>
          <Text style={styles.loading}>Setting up your plan…</Text>
        </View>
      </View>
    );
  }

  // Only reached when there's genuinely nothing to show — a cached plan
  // takes precedence over reporting a network problem.
  if (error && !plan) {
    return (
      <View style={styles.screen}>
        <View style={styles.inner}>
          <Text style={styles.loading}>
            We couldn&rsquo;t load today&rsquo;s plan. It&rsquo;ll be here when
            you&rsquo;re back online.
          </Text>
        </View>
      </View>
    );
  }

  const activities = plan?.activities ?? [];
  const age = computeAge(child.date_of_birth);
  const allDone = activities.length > 0 && completed.length === activities.length;

  // The expanded card is the first incomplete activity, unless the parent
  // has deliberately opened another one early.
  const firstIncomplete = activities.find((a) => !completed.includes(a.domain))?.domain ?? null;
  const expanded =
    openedEarly && !completed.includes(openedEarly) ? openedEarly : firstIncomplete;

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
          <View style={styles.planHero}>
            <Text style={styles.planEyebrow}>TODAY&apos;S PLAN</Text>
            <Text style={styles.planTitle}>A few good things for {child.name}.</Text>
            <Text style={styles.subline}>
              Personalised for {age?.label ?? "where they are right now"} — simple, useful, and easy to return to.
            </Text>
            <ProgressSegments plan={activities} completed={completed} expanded={expanded} />
          </View>

          <View style={styles.list}>
            {activities.map((activity) => {
              const isDone = completed.includes(activity.domain);
              if (isDone) return <DoneRow key={activity.domain} activity={activity} />;

              if (activity.domain === expanded) {
                return (
                  <Animated.View key={activity.domain} style={{ opacity: cardOpacity }}>
                    <ExpandedCard
                      activity={activity}
                      canSwap
                      highlighted={guidedTour}
                      onComplete={() => complete(activity)}
                      onSwap={() => fadeSwap(activity.domain, () => swap(activity.domain))}
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

          <ForYouCard childName={child.name} ageMonths={age?.totalMonths ?? 0} />

          <CopilotHomeCard onPress={(prompt) => router.push(prompt ? `/copilot?prompt=${encodeURIComponent(prompt)}` : "/copilot")} />

          <DailyLearning activity={activities.find((item) => item.domain === expanded)} onPress={() => router.push("/growth/guide")} />

          <View style={styles.discoverSection}>
            <Text style={styles.discoverEyebrow}>COMING UP</Text>
            <DiscoveryRow
              title={nextVaccination ? vaccinationTitle(nextVaccination) : "Keep vaccinations in view"}
              body={
                nextVaccination
                  ? `Recommended around ${nextVaccination.age_label}. Review the schedule when it suits you.`
                  : "Keep the schedule and your records together."
              }
              onPress={() => router.push("/growth/vaccinations")}
            />
          </View>
        </Animated.View>
      </ScrollView>
      {showTourDone && (
        <View style={styles.tourDoneToast}>
          <Text style={styles.tourDoneTitle}>Welcome home.</Text>
          <Text style={styles.tourDoneBody}>Everything's ready for you and {child.name}.</Text>
        </View>
      )}
      <HomeCoachMark
        visible={coachVisible}
        step={coachStep}
        onNext={nextCoach}
        onSkip={closeCoach}
      />
      {guidedTour && (
        <GuidedTourDialog
          eyebrow="Today's Plan"
          focus="Today’s activity card"
          title="Start here each day."
          body="A few personal activities, chosen for where your child is right now."
          step={0}
          total={4}
          primaryTitle="Continue"
          onPrimary={() => router.replace(`/growth?guidedTour=1&step=1${tourNext}`)}
          onSkip={skipGuidedTour}
        />
      )}
    </View>
  );
}

const HOME_COACH = [
  {
    label: "Today's activities",
    title: "Start here.",
    body: "A few simple activities for today. Do one, do all, or come back later.",
  },
  {
    label: "Parenting companion",
    title: "Need help in the moment?",
    body: "Ask about sleep, feeding, routines, behaviour, or anything on your mind.",
  },
  {
    label: "Your child",
    title: "Your child's story builds here.",
    body: "Milestones, memories, and progress collect gently over time.",
  },
];

function HomeCoachMark({
  visible,
  step,
  onNext,
  onSkip,
}: {
  visible: boolean;
  step: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const item = HOME_COACH[step];
  const isLast = step === HOME_COACH.length - 1;
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onSkip}>
      <View style={styles.coachScrim}>
        <View style={styles.coachCard}>
          <View style={styles.coachHeader}>
            <Text style={styles.coachLabel}>{item.label}</Text>
            <Pressable onPress={onSkip} hitSlop={10}>
              <Text style={styles.coachSkip}>Skip</Text>
            </Pressable>
          </View>
          <Text style={styles.coachTitle}>{item.title}</Text>
          <Text style={styles.coachBody}>{item.body}</Text>
          <View style={styles.coachDots}>
            {HOME_COACH.map((_, index) => (
              <View key={index} style={[styles.coachDot, index === step && styles.coachDotActive]} />
            ))}
          </View>
          <PrimaryButton title={isLast ? "Begin" : "Next"} tone="taupe" onPress={onNext} />
        </View>
      </View>
    </Modal>
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

/** The activity in focus stays compact so the full day remains visible. */
function ExpandedCard({
  activity,
  canSwap,
  highlighted = false,
  onComplete,
  onSwap,
}: {
  activity: Activity;
  canSwap: boolean;
  highlighted?: boolean;
  onComplete: () => void;
  onSwap: () => void;
}) {
  return (
    <View style={[styles.card, highlighted && styles.tourHighlight]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardCopy}>
          <Text style={styles.domainLabel}>{DOMAIN_LABEL[activity.domain].toUpperCase()}</Text>
          <Text style={styles.title} numberOfLines={1}>{activity.title}</Text>
        </View>
        <View style={styles.duration}>
          <ClockIcon />
          <Text style={styles.durationText}>{activity.duration_minutes} min</Text>
        </View>
      </View>
      <Text style={styles.why} numberOfLines={1}>{activity.why}</Text>

      <View style={styles.actionRow}>
        <Text style={styles.materials} numberOfLines={1}>{activity.materials}</Text>
        <Pressable
          style={styles.activityButton}
          onPress={onComplete}
          accessibilityRole="button"
          accessibilityLabel={`Mark ${activity.title} done`}
        >
          <Text style={styles.activityButtonText}>Done</Text>
        </Pressable>
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
        <Text style={styles.rowDomainDone}>{DOMAIN_LABEL[activity.domain]}</Text>
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
        <Text style={styles.rowDomain}>{DOMAIN_LABEL[activity.domain]}</Text>
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

function DiscoveryRow({ title, body, onPress }: { title: string; body: string; onPress: () => void }) {
  return (
    <Pressable style={styles.discoveryRow} onPress={onPress} accessibilityRole="button">
      <View style={styles.discoveryText}>
        <Text style={styles.discoveryRowTitle}>{title}</Text>
        <Text style={styles.discoveryRowBody}>{body}</Text>
      </View>
      <ChevronRight />
    </Pressable>
  );
}

function vaccinationTitle(vaccination: VaccinationScheduleItem): string {
  return vaccination.dose_label
    ? `${vaccination.vaccine_name} - ${vaccination.dose_label}`
    : vaccination.vaccine_name;
}

/**
 * The bridge, seen from the child's side.
 *
 * This is the only place Child Mode talks about the parent, and it earns its
 * spot by being causal rather than promotional: today's actual activity
 * becomes the reason for the parent's suggestion. "Tummy time → open your
 * chest while you're down there" is the whole product thesis in one card.
 *
 * Tapping it switches modes rather than pushing a screen, so the transition
 * is identical whichever door you come through.
 */
function ForYouCard({ childName, ageMonths }: { childName: string; ageMonths: number }) {
  const { switchTo } = useMode();
  const bridge = bridgesFor(deriveProfile(ageMonths))[0];

  return (
    <Pressable
      onPress={() => switchTo("parent")}
      accessibilityRole="button"
      style={({ pressed }) => [styles.forYouCard, pressed && { opacity: 0.75 }]}
    >
      <Text style={styles.forYouEyebrow}>WHILE {childName.toUpperCase()} PLAYS</Text>
      <Text style={styles.forYouTitle}>{bridge.parentOffer}</Text>
      <Text style={styles.forYouBody}>{bridge.detail}</Text>
      <Text style={styles.forYouLink}>{bridge.minutes} min · in your space →</Text>
    </Pressable>
  );
}

function CopilotHomeCard({ onPress }: { onPress: (prompt: string) => void }) {
  const [prompt, setPrompt] = useState("");
  const submit = () => onPress(prompt.trim());

  return (
    <View style={styles.copilotModule}>
      <Text style={styles.copilotEyebrow}>COPILOT</Text>
      <Text style={styles.copilotQuestion}>What would you like help with today?</Text>
      <View style={styles.copilotComposer}>
        <TextInput
          style={styles.copilotInput}
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Sleep, feeding, or a tricky moment"
          placeholderTextColor={colors.textMuted}
          returnKeyType="send"
          onSubmitEditing={submit}
        />
        <Pressable
          style={styles.copilotAskButton}
          onPress={submit}
          accessibilityRole="button"
          accessibilityLabel="Ask Copilot"
        >
          <Text style={styles.copilotAskText}>Ask</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DailyLearning({ activity, onPress }: { activity?: Activity; onPress: () => void }) {
  const title = activity
    ? `What ${DOMAIN_LABEL[activity.domain].toLowerCase()} looks like in everyday play.`
    : "Small daily moments are how children learn.";
  return (
    <Pressable style={styles.learningCard} onPress={onPress} accessibilityRole="button">
      <Text style={styles.learningEyebrow}>TODAY&apos;S LEARNING</Text>
      <Text style={styles.learningTitle}>{title}</Text>
      <View style={styles.learningMeta}>
        <Text style={styles.learningMetaText}>4 min read</Text>
        <ChevronRight />
      </View>
    </Pressable>
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
    paddingTop: spacing.lg,
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
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.bodySmall,
    color: colors.charcoal,
  },
  planHero: { marginTop: spacing.sm },
  planEyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.3,
    color: colors.warmTaupe,
  },
  planTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.h1,
    lineHeight: typeScale.h1 * 1.16,
    color: colors.charcoal,
    marginTop: spacing.xs,
  },
  subline: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    lineHeight: typeScale.caption * 1.45,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  progressWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  segments: {
    flex: 1,
    flexDirection: "row",
    gap: 5,
  },
  segment: {
    flex: 1,
    height: 3,
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
    marginTop: spacing.lg,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tourHighlight: {
    borderWidth: 1,
    borderColor: colors.warmTaupe,
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 6,
  },
  domainLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.4,
    color: colors.warmTaupe,
    marginBottom: 2,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.25,
    color: colors.charcoal,
  },
  why: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.5,
    color: colors.textMuted,
    marginTop: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  cardCopy: { flex: 1 },
  duration: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  durationText: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.caption,
    color: colors.textMuted,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  materials: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.textMuted,
  },
  activityButton: {
    minWidth: 64,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.warmTaupe,
  },
  activityButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    color: colors.white,
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    paddingVertical: spacing.md - 1,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowDone: {
    opacity: 0.78,
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
    marginTop: spacing.xl,
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
  // Carries a hint of Parent Mode's eucalyptus into Child Mode, so the card
  // looks like it belongs to somewhere else before you tap it.
  forYouCard: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "rgba(94, 115, 96, 0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(60, 80, 62, 0.16)",
  },
  forYouEyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.4,
    color: "#5E7360",
  },
  forYouTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.h3,
    lineHeight: typeScale.h3 * 1.3,
    color: colors.charcoal,
    marginTop: spacing.sm,
  },
  forYouBody: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.55,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  forYouLink: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    color: "#5E7360",
    marginTop: spacing.md,
  },
  copilotModule: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "rgba(139, 116, 91, 0.11)",
  },
  copilotEyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.3,
    color: colors.warmTaupe,
  },
  copilotQuestion: {
    fontFamily: fonts.serifItalic,
    fontSize: typeScale.h2,
    lineHeight: typeScale.h2 * 1.25,
    color: colors.charcoal,
    marginTop: spacing.xs,
  },
  copilotComposer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  copilotInput: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    color: colors.charcoal,
  },
  copilotAskButton: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.warmTaupe,
  },
  copilotAskText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.bodySmall,
    color: colors.white,
  },
  learningCard: {
    marginTop: spacing.xxl,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.softSand,
  },
  learningEyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.2,
    color: colors.warmTaupe,
  },
  learningTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.35,
    color: colors.charcoal,
    marginTop: spacing.xs,
  },
  learningMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  learningMetaText: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.textMuted,
  },
  discoverSection: { marginTop: spacing.xxl },
  discoverEyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.4,
    color: colors.warmTaupe,
  },
  discoveryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: "rgba(168, 181, 164, 0.18)",
  },
  discoveryText: { flex: 1 },
  discoveryRowTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.bodySmall,
    color: colors.charcoal,
  },
  discoveryRowBody: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    lineHeight: typeScale.caption * 1.4,
    color: colors.textMuted,
    marginTop: 3,
  },
  coachScrim: {
    flex: 1,
    justifyContent: "flex-end",
    padding: spacing.lg,
    backgroundColor: "rgba(44, 44, 44, 0.32)",
  },
  coachCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coachHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  coachLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    color: colors.warmTaupe,
  },
  coachSkip: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.bodySmall,
    color: colors.textMuted,
  },
  coachTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.h2,
    lineHeight: typeScale.h2 * 1.25,
    color: colors.charcoal,
  },
  coachBody: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.5,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  coachDots: {
    flexDirection: "row",
    gap: 6,
    marginBottom: spacing.md,
  },
  coachDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  coachDotActive: {
    width: 20,
    backgroundColor: colors.warmTaupe,
  },
  tourDoneToast: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    top: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 5,
  },
  tourDoneTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.body,
    color: colors.charcoal,
  },
  tourDoneBody: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },
});
