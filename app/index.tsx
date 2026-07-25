import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../lib/AuthProvider";
import { colors } from "../lib/theme";

/**
 * The entry route. Decides, once, where a visitor actually belongs:
 *   no session          -> /welcome (starts pre-auth onboarding)
 *   session, no child    -> /onboarding/parent-name
 *   session, child exists -> /home — today's plan, inside the tab shell
 * A connection error (e.g. the backend is unreachable) is shown here
 * rather than leaving the app on an infinite spinner.
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

  // No session yet → the value-first welcome, which opens the pre-auth
  // onboarding flow (we earn the account at the end, not the front door).
  if (!session) return <Redirect href="/welcome" />;

  if (connectionError) return <Redirect href="/connection-error" />;

  // Authed but no child profile (e.g. returning on a fresh device before
  // sync, or an interrupted flush) → let them complete onboarding, from
  // the first name step since nothing about the family is known yet.
  if (!child) return <Redirect href="/onboarding/parent-name" />;

  return <Redirect href="/home" />;
}
