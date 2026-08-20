import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { colors, fonts, radius, spacing, typeScale } from "../lib/theme";

/**
 * Shared onboarding layout: cream, safe-area aware, optional progress arc,
 * a scrollable content region, and a footer pinned above the keyboard for
 * the single primary action. One question or one payoff per screen.
 */
export function OnboardingScreen({
  children,
  footer,
  progress,
  scroll = false,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  progress?: number; // 0..1; omit on payoff screens
  scroll?: boolean;
}) {
  const Body = scroll ? ScrollView : View;
  const bodyProps = scroll
    ? { contentContainerStyle: styles.bodyScroll, keyboardShouldPersistTaps: "handled" as const }
    : { style: styles.body };
  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.inner}>
          {progress !== undefined && <ProgressArc fraction={progress} />}
          <Body {...bodyProps}>{children}</Body>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * A hairline arc in the top corner that quietly fills as onboarding
 * progresses. Deliberately NOT a "Step 3 of 7" — the parent should feel
 * movement, never measurement (PRD 9.1 / 9.5).
 */
export function ProgressArc({ fraction }: { fraction: number }) {
  const size = 30;
  const stroke = 2;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, fraction));
  return (
    <View style={styles.arcWrap}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.border}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.warmTaupe}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
}

/** Gentle entrance: fade + 8px rise, once, on mount. Everything uses this. */
export function FadeIn({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: any;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);
  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

/** The single question a screen asks. Large, calm, spacious. */
export function Prompt({ children }: { children: React.ReactNode }) {
  return <Text style={styles.prompt}>{children}</Text>;
}

/** The one supporting line under a Prompt — often doing trust work. */
export function Hint({ children }: { children: React.ReactNode }) {
  return <Text style={styles.hint}>{children}</Text>;
}

/**
 * Large "displayed" text input — a hairline baseline, no boxy field.
 * `label`, if passed, is a small persistent caption above the field —
 * only worth the extra line when a screen has more than one field and
 * placeholder-only text would otherwise vanish on typing. Optional and
 * unused by every current single-field screen, so this is a pure addition.
 */
export function DisplayField({
  value,
  onChangeText,
  placeholder,
  autoFocus = true,
  label,
  style,
  ...rest
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  label?: string;
} & React.ComponentProps<typeof TextInput>) {
  const field = (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      autoFocus={autoFocus}
      style={[
        styles.displayField,
        label && styles.displayFieldWithLabel,
        Platform.OS === "web" && ({ outlineStyle: "none" } as any),
        style,
      ]}
      {...rest}
    />
  );
  if (!label) return field;
  return (
    <View style={styles.displayFieldGroup}>
      <Text style={styles.displayFieldLabel}>{label}</Text>
      {field}
    </View>
  );
}

export function RelationshipChips({
  value,
  onChange,
  options = ["Mother", "Father", "Guardian", "Grandparent"],
}: {
  value: string;
  onChange: (v: string) => void;
  options?: string[];
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SelectableCard({
  title,
  gloss,
  selected,
  onPress,
}: {
  title: string;
  gloss: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={[styles.cardCheck, selected && styles.cardCheckOn]}>
          {selected && <Text style={styles.cardCheckMark}>✓</Text>}
        </View>
      </View>
      <Text style={styles.cardGloss}>{gloss}</Text>
    </Pressable>
  );
}

/** Six-digit code: one hidden input, six visual cells, auto-submit on fill. */
export function OtpInput({
  value,
  onChange,
  onComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
}) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const cells = [0, 1, 2, 3, 4, 5];

  const handleChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "").slice(0, 6);
    onChange(digits);
    if (digits.length === 6) onComplete?.(digits);
  };

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={styles.otpRow}>
      {cells.map((i) => {
        const active = focused && i === value.length;
        const filled = i < value.length;
        return (
          <View
            key={i}
            style={[styles.otpCell, (active || filled) && styles.otpCellActive]}
          >
            <Text style={styles.otpDigit}>{value[i] ?? ""}</Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
        style={styles.otpHidden}
        caretHidden
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  flex: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  body: {
    flex: 1,
    justifyContent: "center",
  },
  bodyScroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: spacing.lg,
  },
  footer: {
    paddingTop: spacing.md,
  },
  arcWrap: {
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 10,
  },
  prompt: {
    fontFamily: fonts.bodyBold,
    fontSize: 30,
    lineHeight: 38,
    color: colors.charcoal,
    textAlign: "center",
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: typeScale.body * 1.5,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: "center",
  },
  displayField: {
    fontFamily: fonts.bodyMedium,
    fontSize: 30,
    color: colors.charcoal,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
    marginTop: spacing.lg,
  },
  displayFieldGroup: {
    marginTop: spacing.lg,
  },
  displayFieldLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.bodySmall,
    color: colors.textMuted,
  },
  displayFieldWithLabel: {
    marginTop: spacing.xs,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  chipSelected: {
    backgroundColor: "rgba(168, 181, 164, 0.22)", // sage tint
    borderColor: colors.sage,
  },
  chipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.body,
    color: colors.charcoal,
  },
  chipTextSelected: {
    color: colors.charcoal,
  },
  card: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "transparent",
    padding: spacing.md,
  },
  cardSelected: {
    backgroundColor: "rgba(168, 181, 164, 0.20)",
    borderColor: colors.sage,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.h3,
    color: colors.charcoal,
  },
  cardCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cardCheckOn: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  cardCheckMark: {
    color: colors.white,
    fontSize: 12,
    fontFamily: fonts.bodyBold,
  },
  cardGloss: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: typeScale.bodySmall * 1.4,
  },
  otpRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  otpCell: {
    width: 46,
    height: 58,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  otpCellActive: {
    borderColor: colors.warmTaupe,
  },
  otpDigit: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.h2,
    color: colors.charcoal,
  },
  otpHidden: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
});
