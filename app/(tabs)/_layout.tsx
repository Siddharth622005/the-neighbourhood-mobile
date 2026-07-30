import { Tabs, useRouter } from "expo-router";
import { AvatarButton } from "../../components/AvatarButton";
import { LogoMark } from "../../components/Logo";
import { ModeToggle } from "../../components/ModeToggle";
import { CommunityIcon, CopilotIcon, GrowthIcon, HomeIcon } from "../../components/TabIcons";
import { colors, fonts, spacing } from "../../lib/theme";

/**
 * The app shell: four destinations organized around parent intent.
 *
 *   Home       — today's plan (zero taps: it's the landing screen)
 *   Copilot    — ask anything (one tap from anywhere)
 *   Community  — learn from and connect with parents at a similar stage
 *   Your Child — understand, prepare, and look back
 *
 * Family and app settings live behind the avatar in the top-right corner
 * of every screen, presented as a modal. Account chrome does not deserve
 * a permanent tab — parents open the app to plan, ask, or understand,
 * not to edit their profile.
 *
 * Development kit, vaccinations, reports and the product guide are sections
 * inside Your Child.
 *
 * This shell is age-invariant: it looks identical for a 2-week-old and a
 * 7-year-old. Age filters the CONTENT inside each slot, and never adds,
 * removes, or renames a destination.
 *
 * Home is home.tsx (route "/home"), not index.tsx: route groups are
 * transparent to URLs, so an index here would collide with app/index.tsx,
 * the auth gate that decides where a visitor belongs.
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
        // The way into Parent Mode sits in the same place in both shells, so
        // the door out is always where the door in was.
        headerLeft: () => <ModeToggle />,
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
        name="copilot"
        options={{
          title: "Copilot",
          tabBarIcon: ({ color, focused }) => <CopilotIcon color={color} focused={focused} />,
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
        name="growth"
        options={{
          title: "Your Child",
          href: "/growth",
          popToTopOnBlur: true,
          // The nested Stack draws its own headers, including back buttons
          // for the section screens.
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <GrowthIcon color={color} focused={focused} />,
        }}
        listeners={{
          // Growth contains a nested stack. Always make the tab itself land
          // on the section menu instead of reopening the last child route.
          tabPress: (event) => {
            event.preventDefault();
            router.replace("/growth");
          },
        }}
      />
    </Tabs>
  );
}
