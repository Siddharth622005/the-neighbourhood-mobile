import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CareNote } from "../../components/parentUI";
import { usePalette } from "../../lib/ModeProvider";
import { topicBySlug } from "../../lib/parentCare";
import { fonts, radius, spacing, typeScale } from "../../lib/theme";

/**
 * A single postpartum topic, as an editorial read rather than a doc page.
 *
 * Lives at the root rather than inside the parent tabs so it pushes over the
 * whole shell — reading is a full-attention act, and the tab bar competing
 * for a 3am reader helps nobody.
 *
 * The "when to seek help" block is always last and always visually distinct.
 * Putting it first would make every topic read as a warning; leaving it out
 * would be irresponsible.
 */
export default function CareTopic() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const p = usePalette();
  const topic = slug ? topicBySlug(slug) : undefined;

  if (!topic) {
    return (
      <View style={[styles.missing, { backgroundColor: p.bg }]}>
        <Text style={[styles.missingText, { color: p.textMuted }]}>
          We couldn&rsquo;t find that one.
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[styles.back, { color: p.primary }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "",
          headerStyle: { backgroundColor: p.bg },
          headerShadowVisible: false,
          headerTintColor: p.primary,
        }}
      />
      <ScrollView
        style={{ backgroundColor: p.bg }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.minutes, { color: p.primary }]}>
          {topic.minutes} MIN READ
        </Text>
        <Text style={[styles.title, { color: p.text }]}>{topic.title}</Text>
        <Text style={[styles.blurb, { color: p.textMuted }]}>{topic.blurb}</Text>

        {topic.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={[styles.heading, { color: p.text }]}>{section.heading}</Text>
            <Text style={[styles.body, { color: p.textMuted }]}>{section.body}</Text>
          </View>
        ))}

        {topic.seekHelp && (
          <View
            style={[
              styles.seek,
              { backgroundColor: p.surface, borderColor: p.border },
            ]}
          >
            <Text style={[styles.seekHeading, { color: p.text }]}>
              Worth a call, not a search
            </Text>
            {topic.seekHelp.map((line) => (
              <View key={line} style={styles.seekRow}>
                <View style={[styles.seekDot, { backgroundColor: p.attention }]} />
                <Text style={[styles.seekText, { color: p.textMuted }]}>{line}</Text>
              </View>
            ))}
          </View>
        )}

        <CareNote>
          Educational content, reviewed against NHS and WHO postnatal guidance.
          It doesn&rsquo;t know your history — your GP, midwife or health visitor
          does.
        </CareNote>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  minutes: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.caption,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.display,
    lineHeight: typeScale.display * 1.16,
  },
  blurb: {
    fontFamily: fonts.serifItalic,
    fontSize: typeScale.h3,
    lineHeight: typeScale.h3 * 1.45,
    marginTop: spacing.md,
  },
  section: {
    marginTop: spacing.xl,
  },
  heading: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.h3,
    marginBottom: spacing.sm,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.68,
  },
  seek: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  seekHeading: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.bodySmall,
    marginBottom: spacing.sm,
  },
  seekRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  seekDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 7,
  },
  seekText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.55,
  },
  missing: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  missingText: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
  },
  back: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.body,
  },
});
