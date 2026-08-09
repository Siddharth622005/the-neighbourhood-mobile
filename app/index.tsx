import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../lib/AuthProvider";
import { hasCompletedFirstRun } from "../lib/firstRun";
import { colors } from "../lib/theme";

/**
 * The entry route. Decides, once, where a visitor actually belongs:
 *   no child yet         -> /welcome, which opens onboarding (resuming
 *                            mid-way if they left a draft behind)
 *   child yet no role    -> /onboarding/role?complete=1 — an account from
 *                            before role/birth/feeding existed on the main
 *                            profile. Home needs a role to personalise
 *                            around, so this is asked once, briefly,
 *                            rather than forcing the whole flow again.
 *   child and role exist -> /home — today's plan, inside the tab shell
 *
 * Gating on the CHILD rather than a session is what lets the same code
 * serve both auth modes: with auth off the child comes from the device,
 * with auth on it comes from the server, and either way "do we know this
 * family?" is the only question that decides the route.
 *
 * A connection error is shown here rather than leaving the app spinning.
 */
export default function Index() {
  const { session, loading, familyLoading, child, profile, connectionError } = useAuth();
  const [firstRunChecked, setFirstRunChecked] = useState(false);
  const [firstRunComplete, setFirstRunComplete] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!child) {
      setFirstRunChecked(true);
      setFirstRunComplete(false);
      return;
    }
    setFirstRunChecked(false);
    hasCompletedFirstRun()
      .then((complete) => {
        if (!alive) return;
        setFirstRunComplete(complete);
      })
      .catch(() => {
        if (!alive) return;
        setFirstRunComplete(false);
      })
      .finally(() => {
        if (alive) setFirstRunChecked(true);
      });
    return () => {
      alive = false;
    };
  }, [child]);

  if (loading || (session && familyLoading) || (child && !firstRunChecked)) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream }}>
        <ActivityIndicator color={colors.warmTaupe} />
      </View>
    );
  }

  // Only meaningful when a session exists — it's set by the server fetch.
  if (session && connectionError) return <Redirect href="/connection-error" />;

  if (!child) return <Redirect href="/welcome" />;

  if (!firstRunComplete) return <Redirect href="/onboarding/first-run" />;

  if (!profile?.relationship) return <Redirect href="/onboarding/role?complete=1" />;

  return <Redirect href="/home" />;
}
