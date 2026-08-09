import { Tabs, useRouter } from "expo-router";
import { AvatarButton } from "../../components/AvatarButton";
import { LogoMark } from "../../components/Logo";
import { ChildIcon, CommunityIcon, CopilotIcon, HomeIcon, YouIcon } from "../../components/TabIcons";
import { colors, fonts, spacing } from "../../lib/theme";

/**
 * The app shell: ONE permanent bottom bar, five destinations, no toggle.
 *
 *   Home       — what matters today, for the family (zero taps: it's the
 *                landing screen)
 *   Community  — learn from and connect with parents at a similar stage
 *   Ask        — the single AI entry point (one tap from anywhere)
 *   Child      — everything about understanding, supporting, tracking them
 *   You        — everything about taking care of the parent
 *
 * This replaces two 4-tab bars (Child Mode / Parent Mode) swapped by a
 * header toggle. Child and You are both still real internal "zones" —
 * ModeProvider still derives a palette from the route, since a subtle
 * colour-temperature shift is a useful wayfinding cue — but nothing about
 * that is a concept the user has to learn. They just pick a tab.
 *
 * Family and app settings live behind the avatar in the top-right corner
 * of every screen, presented as a modal. Account chrome does not deserve
 * a permanent tab — parents open the app to plan, ask, or understand, not
 * to edit their profile.
 *
 * Child and You are both nested Stacks (not flat screens): tapping into a
 * section pushes a real screen with a back button while the tab bar stays
 * visible, and re-tapping the tab always lands back on that zone's home
 * rather than reopening whatever was left open.
 */
export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: fonts.bodySemiBold,
          fontSize: 16,
          color: colors.charcoal,
        },
        headerRight: () => <AvatarButton />,
        tabBarActiveTintColor: colors.charcoal,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.cream,
          borderTopColor: colors.border,
          paddingTop: spacing.xs,
          paddingBottom: spacing.sm,
          height: 76,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bodyMedium,
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          // The greeting below already says who this is for, so the header
          // carries the mark instead of a title that would repeat it.
          headerTitle: () => <LogoMark size={26} />,
          tabBarIcon: ({ color, focused }) => <HomeIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ color, focused }) => <CommunityIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: "Ask",
          tabBarIcon: ({ color, focused }) => <CopilotIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="child"
        options={{
          title: "Child",
          headerShown: false, // the nested Stack draws its own header
          tabBarIcon: ({ color, focused }) => <ChildIcon color={color} focused={focused} />,
        }}
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            router.replace("/child");
          },
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: "You",
          headerShown: false, // the nested Stack draws its own header
          tabBarIcon: ({ color, focused }) => <YouIcon color={color} focused={focused} />,
        }}
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            router.replace("/you");
          },
        }}
      />
    </Tabs>
  );
}
