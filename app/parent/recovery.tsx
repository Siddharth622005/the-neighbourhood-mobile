import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, CareNote, Chevron, PageHeading, SectionLabel } from "../../components/parentUI";
import { useAuth } from "../../lib/AuthProvider";
import { computeAge } from "../../lib/childAge";
import { usePalette } from "../../lib/ModeProvider";
import {
  CARE_AREAS,
  STAGE_LABEL,
  deliveryPhrase,
  deriveProfile,
  elapsedPhrase,
  topicsForArea,
} from "../../lib/parentCare";
import { fonts, spacing, typeScale } from "../../lib/theme";

/**
 * Postpartum Care.
 *
 * A library, not a programme. There is no completion state and no order you
 * are supposed to go in, because the parent arriving here is usually looking
 * for one specific reassurance at an odd hour — most often "is this normal?".
 *
 * So the top of the screen is stage-aware ("at six months, here's what's
 * ordinary") and everything below is browsable by area. The seek-help lines
 * live inside each topic rather than here, where they'd read as alarm.
 */
export default function Recovery() {
  const router = useRouter();
  const p = usePalette();
  const { child } = useAuth();

  const ageMonths = child ? computeAge(child.date_of_birth)?.totalMonths ?? 0 : 0;
  const profile = useMemo(() => deriveProfile(ageMonths), [ageMonths]);

  return (
    <ScrollView
      style={{ backgroundColor: p.bg }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <PageHeading
        eyebrow={`${STAGE_LABEL[profile.stage]} · week ${profile.weeksPostpartum}`}
        title="Your recovery, explained."
        body="Written to be read at 3am, when you want to know whether what you're feeling is ordinary."
      />

      {/* Stage-aware reassurance, before any navigation. */}
      <Card style={styles.stageCard}>
        <Text style={[styles.stageSerif, { color: p.primary }]}>Where you are</Text>
        <Text style={[styles.stageBody, { color: p.text }]}>
          At {elapsedPhrase(profile.weeksPostpartum)} after{" "}
          {deliveryPhrase(profile.delivery)}, the deep layers are still knitting.
          Scar tightness, altered sensation, and a core that feels unreliable are
          all expected — not signs you&rsquo;ve done something wrong.
        </Text>
      </Card>

      {CARE_AREAS.map((area) => {
        const topics = topicsForArea(area.key);
        if (topics.length === 0) return null;
        return (
          <View key={area.key} style={styles.block}>
            <SectionLabel>{area.label}</SectionLabel>
            <Text style={[styles.areaBlurb, { color: p.textMuted }]}>{area.blurb}</Text>
            {topics.map((topic) => (
              <Card
                key={topic.slug}
                style={styles.topicCard}
                onPress={() => router.push(`/care/${topic.slug}`)}
              >
                <View style={styles.rowBetween}>
                  <Text style={[styles.topicTitle, { color: p.text }]}>{topic.title}</Text>
                  <Chevron />
                </View>
                <Text style={[styles.topicBlurb, { color: p.textMuted }]}>{topic.blurb}</Text>
                <Text style={[styles.topicMinutes, { color: p.primary }]}>
                  {topic.minutes} min read
                </Text>
              </Card>
            ))}
          </View>
        );
      })}

      <CareNote>
        This library is here to educate and reassure. It is not medical advice,
        and it cannot see you — if something feels wrong, please contact your GP,
        midwife or health visitor.
      </CareNote>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  stageCard: {
    padding: spacing.lg,
  },
  stageSerif: {
    fontFamily: fonts.serifItalic,
    fontSize: typeScale.body,
    marginBottom: spacing.sm,
  },
  stageBody: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.6,
  },
  block: {
    marginTop: spacing.xl,
  },
  areaBlurb: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  topicCard: {
    marginTop: spacing.sm,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  topicTitle: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.h3,
    lineHeight: typeScale.h3 * 1.3,
  },
  topicBlurb: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.55,
    marginTop: spacing.xs,
  },
  topicMinutes: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    marginTop: spacing.sm,
  },
});
