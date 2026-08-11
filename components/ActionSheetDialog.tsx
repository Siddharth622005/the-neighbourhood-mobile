import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing, typeScale } from "../lib/theme";

export type ActionSheetOption = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

/**
 * A generic action-sheet confirmation — the same reason StartOverDialog
 * exists: react-native-web's Alert.alert is a no-op (see
 * node_modules/react-native-web/dist/exports/Alert), so any multi-option
 * Alert.alert silently does nothing on the web build. This is the shared
 * replacement for any screen that needs a "pick one of several actions"
 * menu and needs it to actually work on web too.
 */
export function ActionSheetDialog({
  visible,
  title,
  options,
  onDismiss,
}: {
  visible: boolean;
  title?: string;
  options: ActionSheetOption[];
  onDismiss: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.veil} onPress={onDismiss}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {title && (
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
          )}

          {options.map((option, index) => (
            <Pressable
              key={option.label}
              onPress={() => {
                onDismiss();
                option.onPress();
              }}
              style={({ pressed }) => [
                styles.option,
                index === 0 && !title && styles.optionFirst,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
            >
              <Text style={[styles.optionText, option.destructive && styles.optionTextDestructive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}

          <Pressable
            onPress={onDismiss}
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
    padding: spacing.sm,
    paddingTop: spacing.md,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.bodySmall,
    color: colors.textMuted,
    textAlign: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  option: {
    paddingVertical: spacing.sm + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    alignItems: "center",
  },
  optionFirst: {
    borderTopWidth: 0,
  },
  optionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: typeScale.body,
    color: colors.charcoal,
  },
  optionTextDestructive: {
    color: colors.error,
  },
  cancelButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
    backgroundColor: colors.cream,
    alignItems: "center",
  },
  cancelButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typeScale.body,
    color: colors.charcoal,
  },
  pressed: {
    opacity: 0.6,
  },
});
