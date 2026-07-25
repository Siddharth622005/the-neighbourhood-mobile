import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../lib/AuthProvider";
import { colors, fonts, spacing, typeScale } from "../lib/theme";

/**
 * Profile and settings live behind this, in the top corner — deliberately
 * NOT a fourth tab. Account chrome shouldn't compete for one of three
 * slots that are all about the child.
 *
 * Shows the parent's initial once we know it, and a neutral dot until
 * then, so the control never flickers between two different shapes.
 */
export function AvatarButton() {
  const router = useRouter();
  const { parentName } = useAuth();
  const initial = parentName?.trim()?.[0]?.toUpperCase() ?? "";

  return (
    <Pressable
      onPress={() => router.push("/profile")}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Profile and settings"
      style={styles.wrap}
    >
      <View style={styles.circle}>
        <Text style={styles.initial}>{initial}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginRight: spacing.lg,
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  initial: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.bodySmall,
    color: colors.warmTaupe,
  },
});
