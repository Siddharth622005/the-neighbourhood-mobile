import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, Chevron, PageHeading, Ring, SectionLabel } from "../../components/parentUI";
import { useAuth } from "../../lib/AuthProvider";
import { computeAge } from "../../lib/childAge";
import { usePalette } from "../../lib/ModeProvider";
import {
  STAGE_LABEL,
  bridgesFor,
  deliveryPhrase,
  deriveProfile,
  elapsedPhrase,
  nutrientsFor,
  vitalsFor,
} from "../../lib/parentCare";
import { fonts, radius, spacing, typeScale } from "../../lib/theme";

function greeting(hour: number) {
  if (hour < 5) return "It's late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * The Parent Dashboard.
 *
 * It answers one question — "how am I doing today?" — and refuses to answer
 * it with a score. The opening line is a sentence, not a number, because the
 * first thing a tired parent reads should tell them they are doing fine.
 *
 * Ordering is deliberate: the reassurance, then the one thing worth doing
 * next, then the quiet vitals, then the bridge back to the child. Nothing
 * here is a streak and nothing can be failed.
 */
export default function ParentToday() {
  const router = useRouter();
  const p = usePalette();
  const { parentName, child } = useAuth();

  const ageMonths = child ? computeAge(child.date_of_birth)?.totalMonths ?? 0 : 0;
  const profile = useMemo(() => deriveProfile(ageMonths), [ageMonths]);
  const vitals = useMemo(() => vitalsFor(profile), [profile]);
  const nutrients = useMemo(() => nutrientsFor(profile), [profile]);
  const bridges = useMemo(() => bridgesFor(profile), [profile]);

  const firstName = parentName?.trim().split(" ")[0];
  const bridge = bridges[0];

  // The "next" nudge is whichever vital has the most room in it — surfaced as
  // an invitation, never as the thing you're worst at.
  const focus = [...vitals]
    .filter((v) => typeof v.fraction === "number")
    .sort((a, b) => (a.fraction ?? 1) - (b.fraction ?? 1))[0];

  const lowestNutrient = [...nutrients].sort(
    (a, b) => a.current / a.target - b.current / b.target
  )[0];

  return (
    <ScrollView
      style={{ backgroundColor: p.bg }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <PageHeading
        eyebrow={`${STAGE_LABEL[profile.stage]} · week ${profile.weeksPostpartum}`}
        title={`${greeting(new Date().getHours())}${firstName ? `, ${firstName}` : ""}.`}
      />

      {/* The reassurance. Deliberately the largest thing on the screen. */}
      <Card style={styles.hero}>
        <Text style={[styles.heroSerif, { color: p.primary }]}>Today so far</Text>
        <Text style={[styles.heroLine, { color: p.text }]}>
          You&rsquo;ve eaten, you&rsquo;ve moved, and you got some rest.
        </Text>
        <Text style={[styles.heroBody, { color: p.textMuted }]}>
          {elapsedPhrase(profile.weeksPostpartum).replace(/^\w/, (c) => c.toUpperCase())}{" "}
          after {deliveryPhrase(profile.delivery)}, that is a good day. Nothing
          below is a target you have to hit.
        </Text>
      </Card>

      {/* One invitation, not a list of deficits. */}
      {focus && (
        <Card style={styles.nudge} onPress={() => router.push("/parent/nutrition")}>
          <View style={styles.nudgeRow}>
            <Ring fraction={focus.fraction ?? 0} size={46} />
            <View style={styles.nudgeCopy}>
              <SectionLabel>If you have a minute</SectionLabel>
              <Text style={[styles.nudgeTitle, { color: p.text }]}>{focus.detail}</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Vitals — described, never scored. */}
      <View style={styles.block}>
        <SectionLabel>How today looks</SectionLabel>
        <Card padded={false}>
          {vitals.map((vital, index) => (
            <View
              key={vital.key}
              style={[
                styles.vitalRow,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: p.border },
              ]}
            >
              <View style={styles.vitalLead}>
                {typeof vital.fraction === "number" ? (
                  <Ring fraction={vital.fraction} size={30} />
                ) : (
                  <View style={[styles.vitalDot, { backgroundColor: p.surfaceAlt }]} />
                )}
                <View style={styles.vitalText}>
                  <Text style={[styles.vitalLabel, { color: p.text }]}>{vital.label}</Text>
                  <Text style={[styles.vitalReading, { color: p.textMuted }]}>
                    {vital.reading}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Card>
      </View>

      {/* The bridge — the product's thesis, made concrete. */}
      {bridge && (
        <View style={styles.block}>
          <SectionLabel>Because of {child?.name ?? "them"}</SectionLabel>
          <Card>
            <Text style={[styles.bridgeMoment, { color: p.textMuted }]}>
              {bridge.childMoment}
            </Text>
            <View style={[styles.bridgeRule, { backgroundColor: p.border }]} />
            <Text style={[styles.bridgeOffer, { color: p.text }]}>{bridge.parentOffer}</Text>
            <Text style={[styles.bridgeDetail, { color: p.textMuted }]}>{bridge.detail}</Text>
            <Text style={[styles.bridgeMinutes, { color: p.primary }]}>
              {bridge.minutes} min
            </Text>
          </Card>
        </View>
      )}

      {/* Nutrition, previewed rather than linked. */}
      <View style={styles.block}>
        <SectionLabel>Nutrition</SectionLabel>
        <Card onPress={() => router.push("/parent/nutrition")}>
          <View style={styles.rowBetween}>
            <Text style={[styles.cardTitle, { color: p.text }]}>Today&rsquo;s plan</Text>
            <Chevron />
          </View>
          <Text style={[styles.cardBody, { color: p.textMuted }]}>
            Built for feeding at six months — a little more {lowestNutrient.label.toLowerCase()}{" "}
            would help. {lowestNutrient.why}
          </Text>
        </Card>
      </View>

      {/* Recovery. */}
      <View style={styles.block}>
        <SectionLabel>Recovery</SectionLabel>
        <Card onPress={() => router.push("/parent/recovery")}>
          <View style={styles.rowBetween}>
            <Text style={[styles.cardTitle, { color: p.text }]}>
              How a caesarean scar heals
            </Text>
            <Chevron />
          </View>
          <Text style={[styles.cardBody, { color: p.textMuted }]}>
            Tightness at six months is ordinary. Five minutes on what the first
            year actually looks like.
          </Text>
        </Card>
      </View>

      <Text style={[styles.footer, { color: p.textMuted }]}>
        The Neighbourhood supports your care — it never replaces your doctor or
        midwife.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  hero: {
    padding: spacing.lg,
  },
  heroSerif: {
    fontFamily: fonts.serifItalic,
    fontSize: typeScale.body,
    marginBottom: spacing.sm,
  },
  heroLine: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.h2,
    lineHeight: typeScale.h2 * 1.3,
  },
  heroBody: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.55,
    marginTop: spacing.sm,
  },
  nudge: {
    marginTop: spacing.md,
  },
  nudgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  nudgeCopy: {
    flex: 1,
  },
  nudgeTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.5,
  },
  block: {
    marginTop: spacing.xl,
  },
  vitalRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  vitalLead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  vitalDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  vitalText: {
    flex: 1,
  },
  vitalLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.bodySmall,
  },
  vitalReading: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    marginTop: 1,
  },
  bridgeMoment: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.caption,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  bridgeRule: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.sm,
  },
  bridgeOffer: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.h3,
    lineHeight: typeScale.h3 * 1.3,
  },
  bridgeDetail: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.55,
    marginTop: spacing.xs,
  },
  bridgeMinutes: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    marginTop: spacing.sm,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.h3,
  },
  cardBody: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.55,
    marginTop: spacing.xs,
  },
  footer: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    lineHeight: typeScale.caption * 1.6,
    marginTop: spacing.xl,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
});
