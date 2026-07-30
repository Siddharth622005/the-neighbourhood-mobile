import type { ColorValue } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

/**
 * The three tab glyphs, lifted out of the old hand-rolled BottomNav so the
 * Tabs navigator can own layout and state while these stay pure drawing.
 *
 * Line weight thickens slightly when focused rather than switching to a
 * filled variant — the same restraint the rest of the app uses.
 */
// ColorValue rather than string: react-navigation hands tabBarIcon a
// ColorValue, and react-native-svg accepts the same union.
type IconProps = { color: ColorValue; focused: boolean };

const w = (focused: boolean) => (focused ? 2 : 1.6);

/** Home — a roof. Today's plan is where you live. */
export function HomeIcon({ color, focused }: IconProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 11.5 12 4l8 7.5"
        stroke={color}
        strokeWidth={w(focused)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 10v9.5h12V10"
        stroke={color}
        strokeWidth={w(focused)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Copilot — a speech bubble mid-conversation. */
export function CopilotIcon({ color, focused }: IconProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H10l-4.5 3.8V16H6.5A2.5 2.5 0 0 1 4 13.5v-7Z"
        stroke={color}
        strokeWidth={w(focused)}
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="10" r="0.9" fill={color} />
      <Circle cx="12.5" cy="10" r="0.9" fill={color} />
      <Circle cx="16" cy="10" r="0.9" fill={color} />
    </Svg>
  );
}

/** Your Child — a heart. Care, plainly. */
export function GrowthIcon({ color, focused }: IconProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 19.5c0 0-8-5-8-11.2C4 5 6.2 3 9 3c1.4 0 2.7.7 3 1.8C12.3 3.7 13.6 3 15 3c2.8 0 5 2 5 5.3 0 6.2-8 11.2-8 11.2Z"
        stroke={color}
        strokeWidth={w(focused)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Community — two overlapping figures standing together. */
export function CommunityIcon({ color, focused }: IconProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7" r="3" stroke={color} strokeWidth={w(focused)} />
      <Path
        d="M3 18c0-3 2.7-5 6-5s6 2 6 5"
        stroke={color}
        strokeWidth={w(focused)}
        strokeLinecap="round"
      />
      <Circle cx="16.5" cy="8.5" r="2.3" stroke={color} strokeWidth={w(focused)} />
      <Path
        d="M14 18c.3-1.8 1.8-3 3.8-3 1.4 0 2.6.6 3.2 1.8"
        stroke={color}
        strokeWidth={w(focused)}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** The avatar affordance in the top corner — profile/settings live behind it. */
export function AvatarIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8.2" r="3.2" stroke={color} strokeWidth={1.8} />
      <Path
        d="M5 20c1.2-3.8 4-5.6 7-5.6s5.8 1.8 7 5.6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Row chevron, used by the Growth section list. */
export function ChevronRight({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M9 5l7 7-7 7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
