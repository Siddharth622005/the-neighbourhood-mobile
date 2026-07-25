import { Stack } from "expo-router";
import { AvatarButton } from "../../../components/AvatarButton";
import { GROWTH_SECTIONS } from "../../../lib/growthSections";
import { colors, fonts } from "../../../lib/theme";

/**
 * Growth is a Stack, not a flat screen, so its five sections push over the
 * timeline with a real back button instead of becoming destinations of
 * their own. The tab bar stays visible throughout — a parent is never
 * more than one tap from Home or Copilot, even three levels into Growth.
 *
 * Depth budget: landing (1 tap from Home) → section (2 taps) → detail
 * (3 taps, only for a specific milestone / report / kit item, which is
 * where the IA explicitly allows a third).
 */
export default function GrowthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerShadowVisible: false,
        headerTintColor: colors.warmTaupe,
        headerTitleStyle: {
          fontFamily: fonts.bodySemiBold,
          fontSize: 17,
          color: colors.charcoal,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "Growth", headerRight: () => <AvatarButton /> }}
      />
      {GROWTH_SECTIONS.map((section) => (
        <Stack.Screen
          key={section.slug}
          name={section.slug}
          options={{ title: section.title }}
        />
      ))}
    </Stack>
  );
}
