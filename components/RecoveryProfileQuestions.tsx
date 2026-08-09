import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  type DeliveryType,
  type FeedingMethod,
  type ParentRole,
} from "../lib/parentCare";
import { usePalette } from "../lib/ModeProvider";
import { fonts, radius, spacing, typeScale } from "../lib/theme";

/**
 * The recovery questions, in one place.
 *
 * Previously duplicated between the onboarding screen and Settings, which
 * meant the options and their glosses could drift apart. Both now render
 * this.
 *
 * ROLE IS ASKED FIRST, and gates the rest. Birth method and feeding method
 * are questions about the birthing parent's own body — asking a father
 * "how did your baby arrive" in the first person doesn't parse, and
 * answering it as bystander information would mislabel him as the birthing
 * parent for every downstream screen. So a father sees only the role
 * question here; postpartum-recovery content for him lives in its own
 * "For dads" area instead (see lib/parentCare.ts), not behind these two.
 *
 * Nothing here is required. "Prefer not to say" is a real answer that
 * yields general content, not a gap to be chased.
 *
 * Colours come from usePalette, not the child tokens, so this renders
 * correctly in parent mode — where it now lives — as well as anywhere else
 * it is reused.
 */

type Option<T> = { value: T; label: string; gloss: string };

const ROLE_OPTIONS: Option<ParentRole>[] = [
  { value: "mother", label: "I'm the mother", gloss: "Shows postpartum recovery content." },
  { value: "father", label: "I'm the father", gloss: "Shows guidance for your own role instead." },
  { value: "prefer_not_to_say", label: "Rather not say", gloss: "We'll keep it general." },
];

const FEEDING_OPTIONS: Option<FeedingMethod>[] = [
  { value: "exclusive", label: "Breast milk only", gloss: "Directly, expressed, or both." },
  { value: "combination", label: "Breast milk and formula", gloss: "Whatever the mix." },
  { value: "formula", label: "Formula", gloss: "However you got here." },
  { value: "prefer_not_to_say", label: "Rather not say", gloss: "We won't assume." },
];

const BIRTH_OPTIONS: Option<DeliveryType>[] = [
  { value: "vaginal", label: "Vaginal birth", gloss: "Including forceps or ventouse." },
  { value: "caesarean", label: "Caesarean", gloss: "Planned or emergency." },
  { value: "prefer_not_to_say", label: "Rather not say", gloss: "We'll keep it general." },
];

function OptionList<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: Option<T>[];
  selected: T | "";
  onSelect: (value: T) => void;
}) {
  const p = usePalette();
  return (
    <View style={styles.stack}>
      {options.map((option) => {
        const isOn = selected === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: p.surface, borderColor: "transparent" },
              isOn && { backgroundColor: p.surfaceAlt, borderColor: p.primary },
              pressed && { opacity: 0.75 },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: isOn }}
            accessibilityLabel={option.label}
          >
            <View style={styles.row}>
              <View style={styles.copy}>
                <Text style={[styles.label, { color: p.text }]}>{option.label}</Text>
                <Text style={[styles.gloss, { color: p.textMuted }]}>{option.gloss}</Text>
              </View>
              <View style={[styles.check, { borderColor: p.border }, isOn && { backgroundColor: p.primary, borderColor: p.primary }]}>
                {isOn && <Text style={[styles.tick, { color: p.surface }]}>✓</Text>}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function RecoveryProfileQuestions({
  role,
  feedingMethod,
  birthMethod,
  onRoleChange,
  onFeedingChange,
  onBirthChange,
}: {
  role: ParentRole | "";
  feedingMethod: FeedingMethod | "";
  birthMethod: DeliveryType | "";
  onRoleChange: (value: ParentRole) => void;
  onFeedingChange: (value: FeedingMethod) => void;
  onBirthChange: (value: DeliveryType) => void;
}) {
  const p = usePalette();
  // Birth/feeding are about the birthing parent's own body. Once someone
  // has told us they're the father, asking them stops making sense — and
  // showing the questions anyway invites an answer that would wrongly file
  // him as the birthing parent everywhere downstream.
  const showBirthingQuestions = role !== "father";

  return (
    <View>
      <Text style={[styles.question, { color: p.text }]}>Which are you?</Text>
      <OptionList options={ROLE_OPTIONS} selected={role} onSelect={onRoleChange} />

      {showBirthingQuestions && (
        <>
          <Text style={[styles.question, { color: p.text }]}>How are you feeding?</Text>
          <OptionList
            options={FEEDING_OPTIONS}
            selected={feedingMethod}
            onSelect={onFeedingChange}
          />

          <Text style={[styles.question, { color: p.text }]}>How did your baby arrive?</Text>
          <OptionList options={BIRTH_OPTIONS} selected={birthMethod} onSelect={onBirthChange} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  question: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.h3,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  stack: { gap: spacing.sm },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  copy: { flex: 1 },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.body,
  },
  gloss: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    marginTop: 2,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tick: { fontSize: 12, fontFamily: fonts.bodyBold },
});
