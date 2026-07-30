import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { colors, fonts } from "../lib/theme";

/**
 * A compact, context-aware confirmation nudge.
 *
 * `placement` controls where the card floats so it never covers the
 * screen's primary content:
 *
 *   "bottom" — above the tab bar / safe area (default; suits screens
 *              whose content lives in the upper half, like Profile)
 *   "top"    — below the status bar (suits screens with a bottom-heavy
 *              layout, like Copilot's composer)
 */
export function ReplayTourDialog({
  visible,
  onDismiss,
  onConfirm,
  placement = "bottom",
}: {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
  placement?: "top" | "bottom";
}) {
  const entrance = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) {
      entrance.setValue(0);
      return;
    }
    Animated.spring(entrance, {
      toValue: 1,
      damping: 24,
      stiffness: 300,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [entrance, visible]);

  const slideOrigin = placement === "top" ? -8 : 8;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.veil, { opacity: entrance }]} />
      </Pressable>

      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.anchor,
          placement === "top"
            ? { top: 0, paddingTop: Math.max(insets.top, 12) + 8 }
            : { bottom: 0, paddingBottom: Math.max(insets.bottom, 12) + 84 },
          {
            opacity: entrance,
            transform: [
              {
                translateY: entrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: [slideOrigin, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <ReplayIcon />
          </View>
          <Text style={styles.label}>Quick refresher?</Text>
          <View style={styles.actions}>
            <Pressable
              onPress={onDismiss}
              hitSlop={6}
              style={({ pressed }) => pressed && styles.pressed}
              accessibilityRole="button"
            >
              <Text style={styles.dismiss}>Skip</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
              accessibilityRole="button"
            >
              <Text style={styles.pillText}>Start</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

function ReplayIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 8.5A8 8 0 1 0 20 14M19 4.5v4h-4"
        stroke={colors.warmTaupe}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  veil: {
    backgroundColor: "rgba(44, 44, 44, 0.06)",
  },
  anchor: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 6,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(96, 79, 60, 0.09)",
    shadowColor: "#2C2C2C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "rgba(139, 116, 91, 0.07)",
  },
  label: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.charcoal,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  dismiss: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  pressed: {
    opacity: 0.45,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: colors.charcoal,
  },
  pillPressed: {
    opacity: 0.82,
  },
  pillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.white,
  },
});
