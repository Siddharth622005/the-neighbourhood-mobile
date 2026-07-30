import { Tabs } from "expo-router";
import { AvatarButton } from "../../components/AvatarButton";
import { ModeToggle } from "../../components/ModeToggle";
import {
  NutritionIcon,
  ParentCopilotIcon,
  RecoveryIcon,
  TodayIcon,
} from "../../components/ParentTabIcons";
import { usePalette } from "../../lib/ModeProvider";
import { fonts, spacing } from "../../lib/theme";

/**
 * Parent Mode's shell — the same four slots as Child Mode, in the same
 * positions, carrying the parent's context instead of the child's:
 *
 *   1  Home        → Today       (how am I doing?)
 *   2  Copilot     → Copilot     (identical slot, parent-aware answers)
 *   3  Community   → Nutrition   (the browse slot)
 *   4  Your Child  → Recovery    (the deep-care slot)
 *
 * Slot 2 is deliberately untouched: keeping one fixed landmark is what makes
 * the switch read as a change of context rather than a change of app. The
 * mode toggle sits on the left of the header in both modes, so the way back
 * is always in the same place as the way in.
 */
export default function ParentTabsLayout() {
  const p = usePalette();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: p.bg },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: fonts.bodySemiBold,
          fontSize: 16,
          color: p.text,
        },
        headerLeft: () => <ModeToggle />,
        headerTitle: "",
        headerRight: () => <AvatarButton />,
        sceneStyle: { backgroundColor: p.bg },
        tabBarActiveTintColor: p.text,
        tabBarInactiveTintColor: p.textMuted,
        tabBarStyle: {
          backgroundColor: p.bg,
          borderTopColor: p.border,
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
        name="today"
        options={{
          title: "Today",
          tabBarIcon: ({ color, focused }) => <TodayIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="copilot"
        options={{
          title: "Copilot",
          tabBarIcon: ({ color, focused }) => (
            <ParentCopilotIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: "Nutrition",
          tabBarIcon: ({ color, focused }) => <NutritionIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="recovery"
        options={{
          title: "Recovery",
          tabBarIcon: ({ color, focused }) => <RecoveryIcon color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
