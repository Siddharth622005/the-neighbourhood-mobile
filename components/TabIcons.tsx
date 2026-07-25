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

/** Growth — an uneven rising line with marked moments. Never a chart. */
export function GrowthIcon({ color, focused }: IconProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 19c3-6 5-9 8-9s5 3 8 9"
        stroke={color}
        strokeWidth={w(focused)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="4" cy="19" r="1.4" fill={color} />
      <Circle cx="12" cy="10" r="1.4" fill={color} />
      <Circle cx="20" cy="19" r="1.4" fill={color} />
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
