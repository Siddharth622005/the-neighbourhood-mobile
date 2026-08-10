import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing, typeScale } from "../lib/theme";

/**
 * The confirmation for "Start over on this device" — a real Modal rather
 * than Alert.alert, because react-native-web's Alert.alert is a no-op
 * (see node_modules/react-native-web/dist/exports/Alert): on the web build
 * the button would call it and nothing would ever happen. This works the
 * same on native and web.
 */
export function StartOverDialog({
  visible,
  childName,
  onCancel,
  onKeepSafe,
  onErase,
}: {
  visible: boolean;
  childName: string;
  onCancel: () => void;
  onKeepSafe: () => void;
  onErase: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.veil} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Start over?</Text>
          <Text style={styles.body}>
            This erases {childName}&rsquo;s milestones, vaccination records and plans from this
            phone. Because no email is attached, there&rsquo;s no way to get them back.
          </Text>

          <Pressable
            onPress={onKeepSafe}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Keep it safe instead</Text>
          </Pressable>

          <Pressable
            onPress={onErase}
            style={({ pressed }) => [styles.eraseButton, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.eraseButtonText}>Erase</Text>
          </Pressable>

          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  veil: {
    flex: 1,
    backgroundColor: "rgba(44, 44, 44, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.h3,
    color: colors.charcoal,
    marginBottom: spacing.sm,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: typeScale.bodySmall,
    lineHeight: typeScale.bodySmall * 1.5,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.pill,
    backgroundColor: colors.charcoal,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  primaryButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.bodySmall,
    color: colors.white,
  },
  eraseButton: {
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  eraseButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.bodySmall,
    color: colors.error,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  cancelButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.bodySmall,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.72,
  },
});
