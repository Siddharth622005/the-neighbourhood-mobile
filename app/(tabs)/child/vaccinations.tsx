import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "../../../lib/AuthProvider";
import { computeAge } from "../../../lib/childAge";
import * as growth from "../../../lib/db/growth";
import { cancelReminder, scheduleVaccinationReminders } from "../../../lib/notifications";
import {
  VACCINE_TIERS,
  VACCINE_TIER_BLURB,
  VACCINE_TIER_LABEL,
  type VaccinationScheduleItem,
  type VaccineTier,
} from "../../../lib/db/types";
import { colors, fonts, radius, spacing, typeScale } from "../../../lib/theme";

/**
 * Vaccinations — schedule, history, and recording one.
 *
 * Grouped by tier so a parent gets completeness and clarity at once:
 * Essential is what the government programme guarantees, Recommended is
 * what IAP adds, Situational is only for particular circumstances. That
 * ordering matters — a family relying on the free UIP schedule should see
 * their child as fully covered, never as short of a longer private list.
 *
 * Nothing here is framed as overdue. A date that has passed is "due",
 * never "missed", because the app cannot know what happened at the clinic
 * and shouldn't imply fault.
 */
export default function Vaccinations() {
  const { child } = useAuth();
  const [schedule, setSchedule] = useState<VaccinationScheduleItem[]>([]);
  const [recorded, setRecorded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const ageDays = child
    ? Math.floor(
        (Date.now() - new Date(child.date_of_birth + "T00:00:00").getTime()) / 86_400_000
      )
    : 0;

  const load = useCallback(async () => {
    if (!child) return;
    try {
      const [s, given] = await Promise.all([
        growth.getVaccinationSchedule(),
        growth.getAdministeredVaccinations(child.id),
      ]);
      setSchedule(s);
      const recordedIds = new Set(given.map((g) => g.vaccination_id));
      setRecorded(recordedIds);
      scheduleVaccinationReminders(child.id, child.name, child.date_of_birth, s, recordedIds).catch(
        () => {}
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [child]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Optimistic, and rolled back on failure — a vaccination record must
   *  never claim something happened that wasn't saved. */
  const toggle = async (item: VaccinationScheduleItem) => {
    if (!child) return;
    const was = recorded.has(item.id);

    setRecorded((prev) => {
      const next = new Set(prev);
      was ? next.delete(item.id) : next.add(item.id);
      return next;
    });

    try {
      if (was) {
        await growth.removeVaccination(child.id, item.id);
      } else {
        await growth.recordVaccination({
          childId: child.id,
          vaccinationId: item.id,
          administeredOn: new Date().toISOString().slice(0, 10),
        });
        void cancelReminder(`vaccine-${child.id}-${item.id}`);
      }
    } catch {
      setRecorded((prev) => {
        const next = new Set(prev);
        was ? next.add(item.id) : next.delete(item.id);
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

  if (error || schedule.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>
            {error ? "We couldn't load the schedule." : "The schedule isn't here yet."}
          </Text>
          <Text style={styles.emptyBody}>
            {error
              ? "Check your connection and try again — anything you've recorded is safe."
              : "It'll appear here shortly. In the meantime, please follow the schedule your paediatrician gave you."}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        Tap anything {child?.name ?? "your child"} has already had. This is a record to
        help you keep track — your paediatrician decides what&rsquo;s right.
      </Text>

      {VACCINE_TIERS.map((tier) => {
        const items = schedule.filter((s) => s.tier === tier);
        if (items.length === 0) return null;
        return (
          <View key={tier} style={styles.tierBlock}>
            <View style={styles.tierHeader}>
              <View style={[styles.tierDot, styles[`dot_${tier}` as const]]} />
              <Text style={styles.tierTitle}>{VACCINE_TIER_LABEL[tier]}</Text>
            </View>
            <Text style={styles.tierBlurb}>{VACCINE_TIER_BLURB[tier]}</Text>

            {items.map((item) => (
              <Row
                key={item.id}
                item={item}
                recorded={recorded.has(item.id)}
                due={ageDays >= item.age_days}
                onPress={() => toggle(item)}
              />
            ))}
          </View>
        );
      })}

      <Text style={styles.footnote}>
        Sources: National Immunization Schedule (Government of India) and the IAP-ACVIP
        Recommended Immunization Schedule 2023. Not a substitute for your
        paediatrician&rsquo;s advice.
      </Text>
    </ScrollView>
  );
}

function Row({
  item,
  recorded,
  due,
  onPress,
}: {
  item: VaccinationScheduleItem;
  recorded: boolean;
  due: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, recorded && styles.rowDone, pressed && { opacity: 0.7 }]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: recorded }}
      accessibilityLabel={`${item.vaccine_name}, ${item.age_label}`}
    >
      <View style={[styles.check, recorded && styles.checkOn]}>{recorded && <Tick />}</View>
      <View style={styles.rowText}>
        <Text style={styles.name}>{item.vaccine_name}</Text>
        <Text style={styles.meta}>
          {item.age_label}
          {item.dose_label ? ` · ${item.dose_label}` : ""}
        </Text>
        {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
        {item.source && <Text style={styles.source}>Source: {sourceLabel(item.source)}</Text>}
      </View>
      {/* "Due" only — never "overdue". We can't know what happened at the
          clinic, and implying a parent is late would be both wrong and unkind. */}
      {!recorded && due && <Text style={styles.due}>Due</Text>}
    </Pressable>
  );
}

/** The schedule's own source codes, spelled out — see
 *  supabase/migrations/20260726094000_vaccination_schedule_seed.sql. */
function sourceLabel(source: string): string {
  if (source === "NIS") return "National Immunization Schedule, Govt. of India";
  if (source === "IAP") return "IAP-ACVIP Recommended Schedule";
  return source;
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
  tierBlock: { marginBottom: spacing.xl },
  tierHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  tierDot: { width: 8, height: 8, borderRadius: 4 },
  dot_essential: { backgroundColor: colors.sage },
  dot_recommended: { backgroundColor: colors.warmTaupe },
  dot_situational: { backgroundColor: colors.softSand },
  tierTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.h3,
    color: colors.charcoal,
  },
  tierBlurb: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    lineHeight: typeScale.caption * 1.5,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.md,
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
  rowDone: { backgroundColor: "rgba(168, 181, 164, 0.20)" },
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
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.bodySmall,
    color: colors.charcoal,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  notes: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    lineHeight: typeScale.caption * 1.45,
    color: colors.textMuted,
    marginTop: 4,
  },
  source: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 3,
  },
  due: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.caption,
    color: colors.warmTaupe,
    marginTop: 2,
  },
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
  footnote: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    lineHeight: typeScale.caption * 1.5,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
