import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../lib/AuthProvider";
import { colors } from "../lib/theme";

/**
 * The entry route. Decides, once, where a visitor actually belongs:
 *   no child yet -> /welcome, which opens onboarding (resuming mid-way
 *                   if they left a draft behind)
 *   child exists -> /home — today's plan, inside the tab shell
 *
 * Gating on the CHILD rather than a session is what lets the same code
 * serve both auth modes: with auth off the child comes from the device,
 * with auth on it comes from the server, and either way "do we know this
 * family?" is the only question that decides the route.
 *
 * A connection error is shown here rather than leaving the app spinning.
 */
export default function Index() {
  const { session, loading, familyLoading, child, connectionError } = useAuth();

  if (loading || (session && familyLoading)) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream }}>
        <ActivityIndicator color={colors.warmTaupe} />
      </View>
    );
  }

  // Only meaningful when a session exists — it's set by the server fetch.
  if (session && connectionError) return <Redirect href="/connection-error" />;

  if (!child) return <Redirect href="/welcome" />;

  return <Redirect href="/home" />;
}
