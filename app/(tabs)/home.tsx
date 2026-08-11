import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useScreenFocus } from "../../lib/useScreenFocus";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { ActivityCollapsedRow, ActivityDoneRow, ActivityExpandedCard } from "../../components/ActivityCard";
import { GuidedTourDialog } from "../../components/GuidedTourDialog";
import { PrimaryButton } from "../../components/ui";
import { useAuth, type Child, type Profile } from "../../lib/AuthProvider";
import { computeAge, stageLabel } from "../../lib/childAge";
import * as growth from "../../lib/db/growth";
import { DOMAIN_LABEL, type Domain, type Milestone, type VaccinationScheduleItem } from "../../lib/db/types";
import { hasCompletedHomeCoach, markFirstRunComplete, markHomeCoachComplete } from "../../lib/firstRun";
import {
  mealsFor as kidMealsFor,
  slotsForStage,
  stageForAgeMonths,
  type KidMeal,
  type MealSlot,
} from "../../lib/kidMealPlanner";
import {
  bridgesFor,
  deriveProfile,
  topicsForProfile,
  visibleCareAreas,
  type CareArea,
  type CareTopic,
} from "../../lib/parentCare";
import { useGuidedTourStep } from "../../lib/useGuidedTourStep";
import { useTodaysPlan } from "../../lib/useTodaysPlan";
import { colors, fonts, radius, spacing, typeScale } from "../../lib/theme";

function greetingWord(hour: number): string {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
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
  const pathname = usePathname();
  const params = useLocalSearchParams<{
    guidedTour?: string;
    next?: string;
    step?: string;
    tourComplete?: string;
    replay?: string;
  }>();
  const { child, children: kids, parentName, profile: authProfile } = useAuth();
  const [coachVisible, setCoachVisible] = useState(false);
  const [coachStep, setCoachStep] = useState(0);
  const [showTourDone, setShowTourDone] = useState(params.tourComplete === "1");
  const [nextVaccination, setNextVaccination] = useState<VaccinationScheduleItem | null>(null);
  const [nextMilestone, setNextMilestone] = useState<Milestone | null>(null);
  // See guide.tsx: only the focused screen on matching route with step 0 may show a tour dialog.
  const isFocused = useScreenFocus();
  const isHomeRoute = pathname === "/home" || pathname === "/";
  const wantsGuidedTour =
    params.guidedTour === "1" && (params.step === "0" || !params.step) && isFocused && isHomeRoute;
  const guidedTour = useGuidedTourStep(0, wantsGuidedTour, params.replay === "1");
  const afterOnboardingTour = params.next === "milestones";
  const tourNext = afterOnboardingTour ? "&next=milestones" : "";

  // The plan now comes from the database, cached locally so this renders
  // immediately and completions never wait on the network. Kept here only
  // for the screen-level loading/error gate below — the actual activity
  // list for each child now lives in ChildDayActivities, one instance per
  // child, so more than one child's plan can be on screen (swipeable) at
  // once instead of just the single active child's.
  const { plan, loading, error } = useTodaysPlan(child?.id ?? null);

  const entrance = useRef(new Animated.Value(0)).current;

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
    if (!child || guidedTour || params.guidedTour === "1") return;
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
  }, [child, guidedTour, params.guidedTour]);

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

  useEffect(() => {
    if (!child) return;
    let alive = true;
    const ageMonths = computeAge(child.date_of_birth)?.totalMonths ?? 0;
    Promise.all([growth.getMilestonesForCurrentAge(ageMonths), growth.getAchievedMilestones(child.id)])
      .then(([current, achieved]) => {
        if (!alive) return;
        const achievedIds = new Set(achieved.map((item) => item.milestone_id));
        const outstanding = current.filter((item) => !achievedIds.has(item.id));
        if (outstanding.length === 0) {
          setNextMilestone(null);
          return;
        }
        // Rotates by day, same as the Care topic below — a toddler has
        // several outstanding milestones at once, so this keeps the card
        // from suggesting the same one every morning.
        const dayIndex = Math.floor(Date.now() / 86_400_000);
        setNextMilestone(outstanding[dayIndex % outstanding.length]);
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
    if (afterOnboardingTour) {
      router.replace("/child/milestones?initial=1&afterTour=1");
      return;
    }
    router.replace("/home");
  };

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

  const age = computeAge(child.date_of_birth);
  const ageMonths = age?.totalMonths ?? 0;

  // A vaccination only earns a spot on Home when it's genuinely close —
  // otherwise it's not "today", it's just what the Vaccinations screen is
  // for. Everything else about it (schedule, records) lives on Child.
  // This is the ONE reminder slot — it never competes with the two
  // recommendation cards below for space or attention.
  const ageDays = Math.floor(
    (Date.now() - new Date(`${child.date_of_birth}T00:00:00`).getTime()) / 86_400_000
  );
  const vaccinationDueSoon =
    nextVaccination && nextVaccination.age_days - ageDays <= 60 ? nextVaccination : null;
  const reminder = vaccinationDueSoon
    ? {
        title: vaccinationTitle(vaccinationDueSoon),
        body: `Due around ${vaccinationDueSoon.age_label} — worth booking ahead.`,
        onPress: () => router.push("/child/vaccinations"),
      }
    : null;

  // "For you" reuses the exact gating You's own hub uses — physical
  // recovery only for a mother within the postpartum window, "For dads"
  // only for a father, mental/sleep/feeding/relationships open to anyone.
  // The single highest-priority visible area wins the slot; which TOPIC
  // within it shows rotates by day so it isn't the same line forever.
  // This is always available (bridgesFor is a guaranteed fallback), so it
  // is always the first of the two curated recommendations.
  const careProfile = deriveProfile(ageMonths, authProfile);
  const careAreas = visibleCareAreas(careProfile.role, ageMonths, careProfile.delivery);
  const topCareArea = careAreas[0] ?? null;
  const careTopics = topCareArea ? topicsForProfile(careProfile.delivery, topCareArea.key) : [];
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const careTopic = careTopics.length > 0 ? careTopics[dayIndex % careTopics.length] : null;

  // The second recommendation: a stage-appropriate meal when there is
  // one, otherwise an outstanding milestone for this exact age band —
  // never both, and never neither if either is genuinely available.
  // Nothing is invented to fill this slot.
  const mealStage = stageForAgeMonths(ageMonths);
  const mealSlots = slotsForStage(mealStage);
  const mealSlot = mealSlots[0] ?? null;
  const mealIdea = mealSlot ? kidMealsFor(mealStage, mealSlot.key)[0] ?? null : null;
  const milestoneRecommendation =
    !mealIdea && nextMilestone
      ? {
          eyebrow: `WATCH FOR · ${DOMAIN_LABEL[nextMilestone.domain].toUpperCase()}`,
          title: nextMilestone.description,
          body: "Typical for this age — no rush, just something to notice.",
          onPress: () => router.push("/child/milestones"),
        }
      : null;

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
          {/* Date orients the day; greeting and intro stay smaller than the
              activity title, which is the loudest thing on screen. */}
          <Text style={styles.dateLine}>{todayLabel()}</Text>
          <Text style={styles.greeting}>
            {greetingWord(new Date().getHours())}
            {parentName ? `, ${parentName.split(" ")[0]}` : ""}.
          </Text>
          <View style={styles.introRow}>
            <Text style={styles.familyIntro}>Today with your family.</Text>
            {age && (
              <View style={styles.stageChip}>
                <Text style={styles.stageChipText}>
                  {child.name} · {age.label}
                </Text>
              </View>
            )}
          </View>

          <SectionLabel first accent={colors.warmTaupe}>
            TODAY
          </SectionLabel>
          <TodayActivitiesPager kids={kids.length > 0 ? kids : [child]} activeChildId={child.id} guidedTour={guidedTour} />

          <CopilotHomeCard onPress={(prompt) => router.push(prompt ? `/ask?prompt=${encodeURIComponent(prompt)}` : "/ask")} />

          <SectionLabel accent="#5E7360">FOR YOU</SectionLabel>
          <ForYouCard
            childName={child.name}
            ageMonths={ageMonths}
            authProfile={authProfile}
            area={topCareArea}
            topic={careTopic}
          />

          {mealSlot && mealIdea ? (
            <>
              <SectionLabel accent={colors.softSand}>TOGETHER</SectionLabel>
              <MealIdeaCard
                slot={mealSlot}
                meal={mealIdea}
                onPress={() => router.push("/child/meals")}
              />
            </>
          ) : (
            milestoneRecommendation && (
              <>
                <SectionLabel accent={colors.softSand}>WORTH NOTICING</SectionLabel>
                <DiscoveryRow
                  eyebrow={milestoneRecommendation.eyebrow}
                  title={milestoneRecommendation.title}
                  body={milestoneRecommendation.body}
                  onPress={milestoneRecommendation.onPress}
                />
              </>
            )
          )}

          {reminder && (
            <>
              <SectionLabel accent={colors.softSand}>COMING UP</SectionLabel>
              <DiscoveryRow
                eyebrow="VACCINATION"
                title={reminder.title}
                body={reminder.body}
                onPress={reminder.onPress}
              />
            </>
          )}
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
          eyebrow="Home"
          focus="Your family, at a glance"
          title="Start here each day."
          body="What matters today for your family — activities, milestones, vaccinations, and support for you."
          step={0}
          total={5}
          primaryTitle="Continue"
          onPrimary={() => router.replace(`/community?guidedTour=1&step=1${tourNext}`)}
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

/**
 * One child's "today" card — extracted so it can be mounted once per
 * child. Each instance owns its own useTodaysPlan/expand state, so
 * swiping between children never mixes up which activity is expanded
 * where.
 */
function ChildDayActivities({
  child,
  guidedTour,
  width,
}: {
  child: Child;
  guidedTour: boolean;
  width: number;
}) {
  const { plan, completed, complete, swap } = useTodaysPlan(child.id);
  const [expandedDomain, setExpandedDomain] = useState<Domain | null>(null);
  const cardOpacity = useRef(new Animated.Value(1)).current;

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

  const age = computeAge(child.date_of_birth);
  const activities = plan?.activities ?? [];
  const allDone = activities.length > 0 && completed.length === activities.length;

  return (
    <View style={{ width }}>
      <View style={styles.childSection}>
        <View style={styles.planHero}>
          <Text style={styles.planTitle}>A few good things for {child.name}.</Text>
          <Text style={styles.subline}>Pick one that feels right today.</Text>
        </View>

        <View style={styles.list}>
          {activities.map((activity) => {
            const isDone = completed.includes(activity.domain);
            if (isDone) return <ActivityDoneRow key={activity.domain} activity={activity} />;

            if (activity.domain === expandedDomain) {
              return (
                <Animated.View key={activity.domain} style={{ opacity: cardOpacity }}>
                  <ActivityExpandedCard
                    activity={activity}
                    canSwap
                    highlighted={guidedTour}
                    ageLabel={age?.label}
                    onComplete={() => complete(activity)}
                    onSwap={() => fadeSwap(activity.domain, () => swap(activity.domain))}
                    onCollapse={() => setExpandedDomain(null)}
                  />
                </Animated.View>
              );
            }

            return (
              <ActivityCollapsedRow
                key={activity.domain}
                activity={activity}
                onPress={() => setExpandedDomain(activity.domain)}
              />
            );
          })}
        </View>

        {allDone && <EndOfDay childName={child.name} />}
      </View>
    </View>
  );
}

/**
 * Wraps ChildDayActivities in a horizontal swipe pager once there's more
 * than one child — otherwise renders exactly the single card it always
 * has, so nothing changes for the common one-child case. Defaults to
 * whichever child is active elsewhere in the app (Child tab's switcher);
 * swiping here is just looking, it doesn't change that active child.
 */
function TodayActivitiesPager({
  kids,
  activeChildId,
  guidedTour,
}: {
  kids: Child[];
  activeChildId: string;
  guidedTour: boolean;
}) {
  const width = Dimensions.get("window").width - spacing.lg * 2;
  const initialIndex = Math.max(
    0,
    kids.findIndex((k) => k.id === activeChildId)
  );
  const scrollRef = useRef<ScrollView>(null);
  const [pageIndex, setPageIndex] = useState(initialIndex);

  if (kids.length <= 1) {
    return <ChildDayActivities child={kids[0]} guidedTour={guidedTour} width={width} />;
  }

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: initialIndex * width, y: 0 }}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setPageIndex(idx);
        }}
      >
        {kids.map((kid) => (
          <ChildDayActivities
            key={kid.id}
            child={kid}
            guidedTour={guidedTour && kid.id === activeChildId}
            width={width}
          />
        ))}
      </ScrollView>
      <View style={styles.pagerDots}>
        {kids.map((kid, index) => (
          <View key={kid.id} style={[styles.pagerDot, index === pageIndex && styles.pagerDotActive]} />
        ))}
      </View>
    </View>
  );
}

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

function DiscoveryRow({
  eyebrow,
  title,
  body,
  onPress,
}: {
  eyebrow: string;
  title: string;
  body: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.discoveryRow} onPress={onPress} accessibilityRole="button">
      <View style={styles.discoveryText}>
        <Text style={styles.discoveryEyebrow}>{eyebrow}</Text>
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

/** A quiet all-caps header marking a shift in who a section is for, with a
 *  small dot in the section's accent color so the shift also reads at a
 *  glance while scrolling, not just on close reading. */
function SectionLabel({
  children,
  first = false,
  accent,
}: {
  children: string;
  first?: boolean;
  accent: string;
}) {
  return (
    <View style={[styles.sectionLabelRow, first && styles.sectionLabelFirst]}>
      <View style={[styles.sectionDot, { backgroundColor: accent }]} />
      <Text style={styles.sectionLabel}>{children}</Text>
    </View>
  );
}

/**
 * The parent's own suggestion for today. When a Care area is genuinely
 * relevant right now (postpartum recovery for the mother, "For dads" for a
 * father, or one of the areas open to any parent) it shows one topic from
 * the highest-priority such area — the same gating You's own hub uses, so
 * nothing appears here that wouldn't also appear there. The topic rotates
 * by day rather than always being the first one, so the card doesn't go
 * stale for a parent who opens Home every morning.
 *
 * When there's nothing more specific to say, it falls back to the bridge:
 * today's actual activity becomes the reason for a small self-care
 * suggestion — "Tummy time → open your chest while you're down there".
 *
 * Tapping it goes to the You tab — an ordinary navigation, not a mode
 * switch.
 */
function ForYouCard({
  childName,
  ageMonths,
  authProfile,
  area,
  topic,
}: {
  childName: string;
  ageMonths: number;
  authProfile: Profile | null;
  area: { key: CareArea; label: string } | null;
  topic: CareTopic | null;
}) {
  const router = useRouter();
  const [showWhyThis, setShowWhyThis] = useState(false);

  if (area && topic) {
    return (
      <Pressable
        onPress={() => router.push(`/you/care?area=${area.key}`)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.forYouCard, pressed && { opacity: 0.75 }]}
      >
        <Text style={styles.forYouEyebrow}>{area.label.toUpperCase()}</Text>
        <Text style={styles.forYouTitle}>{topic.title}</Text>
        <Text style={styles.forYouBody}>{topic.blurb}</Text>
        <Text style={styles.forYouLink}>{topic.minutes} min read →</Text>
        <Pressable onPress={(e) => { e.stopPropagation(); setShowWhyThis((v) => !v); }} hitSlop={6}>
          <Text style={styles.forYouWhyThis}>{showWhyThis ? "Hide" : "Why this?"}</Text>
        </Pressable>
        {showWhyThis && (
          <Text style={styles.forYouWhyThisText}>
            {area.label} is one of the areas most relevant to you right now, based on your role
            and {stageLabel(ageMonths)}.
          </Text>
        )}
      </Pressable>
    );
  }

  const bridge = bridgesFor(deriveProfile(ageMonths, authProfile))[0];
  return (
    <Pressable
      onPress={() => router.push("/you/today")}
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

/**
 * One meal idea for today, staged to the child's feeding age and framed as
 * shared time rather than a child-only task — cooking or feeding together
 * is the brief's own example of "together" content. Home decides whether
 * a stage-appropriate meal exists at all; this component only renders it.
 */
function MealIdeaCard({
  slot,
  meal,
  onPress,
}: {
  slot: { key: MealSlot; label: string; window: string };
  meal: KidMeal;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.mealIdeaCard, pressed && { opacity: 0.75 }]}
    >
      <Text style={styles.mealIdeaEyebrow}>{slot.window.toUpperCase()} · COOK TOGETHER</Text>
      <Text style={styles.mealIdeaTitle}>{meal.title}</Text>
      <Text style={styles.mealIdeaBody}>{meal.blurb}</Text>
      <Text style={styles.mealIdeaLink}>{meal.minutes} min · see the full plan →</Text>
    </Pressable>
  );
}

function CopilotHomeCard({ onPress }: { onPress: (prompt: string) => void }) {
  const [prompt, setPrompt] = useState("");
  const submit = () => onPress(prompt.trim());

  return (
    <View style={styles.copilotModule}>
      <Text style={styles.copilotEyebrow}>ASK</Text>
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
          accessibilityLabel="Ask"
        >
          <Text style={styles.copilotAskText}>Ask</Text>
        </Pressable>
      </View>
    </View>
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
  dateLine: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.caption,
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: 2,
  },
  greeting: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.bodySmall,
    color: colors.charcoal,
  },
  introRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: 2,
  },
  familyIntro: {
    fontFamily: fonts.serifItalic,
    fontSize: typeScale.h3,
    lineHeight: typeScale.h3 * 1.3,
    color: colors.charcoal,
  },
  stageChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: "rgba(137, 116, 91, 0.1)",
  },
  stageChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.caption,
    color: colors.warmTaupe,
  },

  // A quiet colored dot in front of each eyebrow, so the shift between
  // "for your child" / "for you" / "together" reads at a glance while
  // scrolling, not just on close reading.
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
  sectionLabelFirst: {
    marginTop: spacing.xl,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.4,
    color: colors.warmTaupe,
  },

  // The primary block: today's activities live inside a gently tinted
  // card, so it reads as one elevated "today" surface rather than text
  // sitting loose on the page background — the loudest thing on screen,
  // by container as well as by type size.
  childSection: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "rgba(137, 116, 91, 0.05)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(96, 79, 60, 0.08)",
  },
  planHero: { paddingHorizontal: spacing.xs },
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


  list: {
    marginTop: spacing.lg,
  },

  pagerDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.sm,
  },
  pagerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(96, 79, 60, 0.18)",
  },
  pagerDotActive: {
    backgroundColor: colors.warmTaupe,
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
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "rgba(94, 115, 96, 0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(60, 80, 62, 0.16)",
    shadowColor: "#3C503E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 1,
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
  forYouWhyThis: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  forYouWhyThisText: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    lineHeight: typeScale.caption * 1.5,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  mealIdeaCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "rgba(201, 165, 142, 0.16)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(150, 110, 70, 0.16)",
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 1,
  },
  mealIdeaEyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.4,
    color: colors.warmTaupe,
  },
  mealIdeaTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.h3,
    lineHeight: typeScale.h3 * 1.3,
    color: colors.charcoal,
    marginTop: spacing.sm,
  },
  mealIdeaBody: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.55,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  mealIdeaLink: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    color: colors.warmTaupe,
    marginTop: spacing.md,
  },
  copilotModule: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "rgba(139, 116, 91, 0.11)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(96, 79, 60, 0.12)",
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
  discoveryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(96, 79, 60, 0.1)",
  },
  discoveryText: { flex: 1 },
  discoveryEyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.warmTaupe,
    marginBottom: 2,
  },
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
