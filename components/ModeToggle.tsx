import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useMode } from "../lib/ModeProvider";
import { fonts, spacing, typeScale } from "../lib/theme";

/**
 * The doorway between modes, in the header where it is always reachable.
 *
 * It shows where you would GO, not where you are — a parent in Child Mode
 * sees "You", which is the invitation. A plain icon button would have been
 * quieter, but this is a mode switch: it deserves a word, or nobody finds
 * the second half of the product.
 */
export function ModeToggle() {
  const { isParent, palette, toggle } = useMode();
  const target = isParent ? "child" : "parent";

  return (
    <Pressable
      onPress={toggle}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={
        isParent ? "Switch to your child's view" : "Switch to your own view"
      }
      style={({ pressed }) => [
        styles.wrap,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.glyph, { backgroundColor: palette.surfaceAlt }]}>
        {target === "parent" ? (
          <SelfCareGlyph color={palette.primary} />
        ) : (
          <ChildGlyph color={palette.primary} />
        )}
      </View>
      <Text style={[styles.label, { color: palette.text }]}>
        {target === "parent" ? "You" : "Child"}
      </Text>
    </Pressable>
  );
}

/** A leaf cradled by a hand — recovery, tended. */
function SelfCareGlyph({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 13.5c0-4 2.6-7 6.5-7.5.4 3.9-1.7 7.6-6.5 7.5Z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
      <Path
        d="M12 21v-7.5M12 14c-.4-2.7-2-4.4-4.5-4.8"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** A small figure — back to them. */
function ChildGlyph({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7" r="3.4" stroke={color} strokeWidth={1.9} />
      <Path
        d="M5.5 20c1-4 3.6-6 6.5-6s5.5 2 6.5 6"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 4,
    paddingRight: 10,
    paddingVertical: 4,
    marginLeft: spacing.lg,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.62,
  },
  glyph: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.bodySmall,
  },
});
