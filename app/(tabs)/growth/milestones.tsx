import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "../../../lib/AuthProvider";
import { computeAge } from "../../../lib/childAge";
import * as growth from "../../../lib/db/growth";
import { DOMAIN_LABEL, type Milestone } from "../../../lib/db/types";
import { colors, fonts, radius, spacing, typeScale } from "../../../lib/theme";

/**
 * Milestones — library, upcoming, and mark-achieved. Two taps from Home.
 *
 * Ordered by typical_age_min_months rather than age_band: the band is a
 * lossy 7-way bucket over a 15-stage dataset, so it's right for filtering
 * and wrong for display order.
 *
 * Never a percentile and never a comparison. A milestone not yet marked is
 * simply not marked — it is never "missing" or "behind".
 */
export default function Milestones() {
  const { child } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [achieved, setAchieved] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const ageMonths = child ? computeAge(child.date_of_birth)?.totalMonths ?? 0 : 0;

  const load = useCallback(async () => {
    if (!child) return;
    setLoading(true);
    setError(false);
    try {
      const [library, marked] = await Promise.all([
        growth.getMilestonesForAge(ageMonths),
        growth.getAchievedMilestones(child.id),
      ]);
      setMilestones(library);
      setAchieved(new Set(marked.map((m) => m.milestone_id)));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [child, ageMonths]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Optimistic: the tick lands immediately, the write follows. */
  const toggle = async (milestone: Milestone) => {
    if (!child) return;
    const wasAchieved = achieved.has(milestone.id);

    setAchieved((prev) => {
      const next = new Set(prev);
      if (wasAchieved) next.delete(milestone.id);
      else next.add(milestone.id);
      return next;
    });

    try {
      if (wasAchieved) {
        await growth.unmarkMilestone(child.id, milestone.id);
      } else {
        await growth.markMilestoneAchieved({
          childId: child.id,
          milestoneId: milestone.id,
        });
      }
    } catch {
      // Put it back — showing a milestone as reached when it wasn't saved
      // would be a quiet lie about the child's record.
      setAchieved((prev) => {
        const next = new Set(prev);
        if (wasAchieved) next.add(milestone.id);
        else next.delete(milestone.id);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.warmTaupe} />
      </View>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="We couldn't load milestones."
        body="Check your connection and try again — nothing you've marked is lost."
      />
    );
  }

  /**
   * Genuinely empty for children over five: the source dataset stops at
   * six years, so the 5–7 band has no milestones at all. That's a content
   * gap, and it should read as "nothing here yet", never as a broken
   * screen or a child who has fallen behind.
   */
  if (milestones.length === 0) {
    return (
      <EmptyState
        title="Nothing to track at this age yet."
        body={
          ageMonths >= 60
            ? `Our milestone library currently runs to age five. We're still writing the ones for ${child?.name ?? "older children"} — they'll appear here when they're ready.`
            : "Milestones for this age will appear here soon."
        }
      />
    );
  }

  // Group by the dataset's own stage label, which is finer than age_band.
  const groups = milestones.reduce<Record<string, Milestone[]>>((acc, m) => {
    (acc[m.stage_label] ??= []).push(m);
    return acc;
  }, {});

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        What&rsquo;s typical around {child?.name ?? "this age"} right now. Tap one you&rsquo;ve
        seen — there&rsquo;s no rush, and nothing here is a test.
      </Text>

      {Object.entries(groups).map(([stage, items]) => (
        <View key={stage} style={styles.group}>
          <Text style={styles.stageLabel}>{stage.toUpperCase()}</Text>
          {items.map((m) => {
            const isAchieved = achieved.has(m.id);
            return (
              <Pressable
                key={m.id}
                onPress={() => toggle(m)}
                style={({ pressed }) => [
                  styles.row,
                  isAchieved && styles.rowAchieved,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isAchieved }}
                accessibilityLabel={m.description}
              >
                <View style={[styles.check, isAchieved && styles.checkOn]}>
                  {isAchieved && <Tick />}
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowDomain}>{DOMAIN_LABEL[m.domain]}</Text>
                  <Text style={[styles.rowDesc, isAchieved && styles.rowDescDone]}>
                    {m.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.screen}>
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyBody}>{body}</Text>
      </View>
    </View>
  );
}

function Tick() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 12.5 9.5 17.5 19.5 6.5"
        stroke={colors.white}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  centered: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  intro: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.55,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  group: { marginBottom: spacing.lg },
  stageLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.4,
    color: colors.warmTaupe,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "rgba(255, 255, 255, 0.55)",
    marginBottom: 6,
  },
  rowAchieved: { backgroundColor: "rgba(168, 181, 164, 0.20)" },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkOn: { backgroundColor: colors.sage, borderColor: colors.sage },
  rowText: { flex: 1 },
  rowDomain: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.warmTaupe,
  },
  rowDesc: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.45,
    color: colors.charcoal,
    marginTop: 2,
  },
  rowDescDone: { color: colors.textMuted },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.h3,
    color: colors.charcoal,
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.55,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
