import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../../lib/AuthProvider";
import * as growth from "../../../lib/db/growth";
import type { ChildVaccination, VaccinationScheduleItem } from "../../../lib/db/types";
import { colors, fonts, radius, spacing, typeScale } from "../../../lib/theme";

/**
 * Vaccinations — schedule, history, record a vaccination.
 *
 * The schedule table is seeded EMPTY on purpose: no sourced dataset exists
 * in the codebase, and an immunisation schedule is not something to
 * reconstruct from memory — a wrong date here has real consequences. So
 * this screen is wired end to end and simply has nothing to show yet.
 *
 * The empty state says exactly that. A parent must never be left thinking
 * their child has no vaccinations due because the app looked confident
 * about an empty list.
 */
export default function Vaccinations() {
  const { child } = useAuth();
  const [schedule, setSchedule] = useState<VaccinationScheduleItem[]>([]);
  const [given, setGiven] = useState<ChildVaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!child) return;
    (async () => {
      try {
        const [s, g] = await Promise.all([
          growth.getVaccinationSchedule(),
          growth.getAdministeredVaccinations(child.id),
        ]);
        setSchedule(s);
        setGiven(g);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [child]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.warmTaupe} />
      </View>
    );
  }

  if (error) {
    return (
      <Empty
        title="We couldn't load the schedule."
        body="Check your connection and try again — anything you've recorded is safe."
      />
    );
  }

  if (schedule.length === 0) {
    return (
      <Empty
        title="The schedule isn't here yet."
        body="We're adding the immunisation schedule from a verified medical source rather than assembling it ourselves. Until it's in, please keep following the schedule your paediatrician gave you."
        footnote="This section will never be a substitute for your doctor."
      />
    );
  }

  const givenIds = new Set(given.map((g) => g.vaccination_id));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {schedule.map((item) => (
        <View key={item.id} style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.name}>{item.vaccine_name}</Text>
            <Text style={styles.meta}>
              {item.recommended_age_months === 0
                ? "At birth"
                : `${item.recommended_age_months} months`}
              {item.dose_label ? ` · ${item.dose_label}` : ""}
            </Text>
          </View>
          <Text style={givenIds.has(item.id) ? styles.done : styles.due}>
            {givenIds.has(item.id) ? "Recorded" : "Due"}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

function Empty({
  title,
  body,
  footnote,
}: {
  title: string;
  body: string;
  footnote?: string;
}) {
  return (
    <View style={styles.screen}>
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyBody}>{body}</Text>
        {footnote && <Text style={styles.footnote}>{footnote}</Text>}
      </View>
    </View>
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
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "rgba(255, 255, 255, 0.55)",
  },
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
  due: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.caption,
    color: colors.warmTaupe,
  },
  done: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.caption,
    color: colors.sage,
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
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.caption,
    color: colors.warmTaupe,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
