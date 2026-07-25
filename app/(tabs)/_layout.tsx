import { Tabs } from "expo-router";
import { AvatarButton } from "../../components/AvatarButton";
import { CopilotIcon, GrowthIcon, HomeIcon } from "../../components/TabIcons";
import { colors, fonts, spacing } from "../../lib/theme";

/**
 * The app shell: three tabs, and only ever three.
 *
 *   Home    — today's plan (zero taps: it's the landing screen)
 *   Copilot — ask anything (one tap from anywhere)
 *   Growth  — everything retrospective (one tap; its sections are two)
 *
 * Profile/settings sit behind the avatar in the top-right, not in the tab
 * bar. Development kit, vaccinations, reports and the product guide are
 * deliberately NOT tabs — they're sections inside Growth.
 *
 * This shell is age-invariant: it looks identical for a 2-week-old and a
 * 7-year-old. Age filters the CONTENT inside each slot, and never adds,
 * removes, or renames a destination.
 *
 * Replaces the old hand-rolled BottomNav, which used router.replace() and
 * so tore down and rebuilt each screen on every tab switch — that lost
 * Copilot's scroll position and any in-flight message, which a real
 * navigator preserves.
 *
 * Home is home.tsx (route "/home"), not index.tsx: route groups are
 * transparent to URLs, so an index here would collide with app/index.tsx,
 * the auth gate that decides where a visitor belongs.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: fonts.bodySemiBold,
          fontSize: 17,
          color: colors.charcoal,
        },
        headerRight: () => <AvatarButton />,
        tabBarActiveTintColor: colors.charcoal,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.cream,
          borderTopColor: colors.border,
          paddingTop: spacing.sm,
          height: 88,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bodyMedium,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          // Home writes its own greeting as the first line of the screen;
          // a second title bar above it would just repeat the same beat.
          headerTitle: "",
          tabBarIcon: ({ color, focused }) => <HomeIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="copilot"
        options={{
          title: "Copilot",
          tabBarIcon: ({ color, focused }) => <CopilotIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="growth"
        options={{
          title: "Growth",
          // The nested Stack draws its own headers, including back buttons
          // for the section screens.
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <GrowthIcon color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
