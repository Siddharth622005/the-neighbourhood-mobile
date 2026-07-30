import type { ColorValue } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

/**
 * Parent Mode's tab glyphs. Same line weight and 24px grid as the Child Mode
 * set so the bar keeps its rhythm — only the subjects change, from a home and
 * a heart to a horizon and a leaf.
 */
type IconProps = { color: ColorValue; focused: boolean };

const w = (focused: boolean) => (focused ? 2 : 1.6);

/** Today — a sun over a horizon. The day, not the house. */
export function TodayIcon({ color, focused }: IconProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M3 18h18" stroke={color} strokeWidth={w(focused)} strokeLinecap="round" />
      <Path
        d="M6.5 18a5.5 5.5 0 0 1 11 0"
        stroke={color}
        strokeWidth={w(focused)}
        strokeLinecap="round"
      />
      <Path
        d="M12 4.5v2M5.4 7.4l1.4 1.4M18.6 7.4l-1.4 1.4"
        stroke={color}
        strokeWidth={w(focused)}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Nutrition — a bowl with steam. Warm, not a calorie ring. */
export function NutritionIcon({ color, focused }: IconProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.5 12h17c0 4.1-3.8 7-8.5 7s-8.5-2.9-8.5-7Z"
        stroke={color}
        strokeWidth={w(focused)}
        strokeLinejoin="round"
      />
      <Path
        d="M9.5 4.5c-.8 1.1-.8 2 0 3.1M14.5 4.5c-.8 1.1-.8 2 0 3.1"
        stroke={color}
        strokeWidth={w(focused)}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Recovery — a leaf on a stem. Growing back. */
export function RecoveryIcon({ color, focused }: IconProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 12.5c0-4.4 2.9-7.7 7.3-8.3.5 4.4-2 8.5-7.3 8.3Z"
        stroke={color}
        strokeWidth={w(focused)}
        strokeLinejoin="round"
      />
      <Path
        d="M12 20.5v-8M12 13.5c-.5-3-2.3-4.9-5.1-5.3"
        stroke={color}
        strokeWidth={w(focused)}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Copilot — unchanged from Child Mode. Slot 2 never moves. */
export function ParentCopilotIcon({ color, focused }: IconProps) {
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
