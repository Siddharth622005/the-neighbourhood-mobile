import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { PlayfairDisplay_400Regular_Italic } from "@expo-google-fonts/playfair-display";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../lib/AuthProvider";
import { ModeProvider } from "../lib/ModeProvider";
import { OnboardingProvider } from "../lib/OnboardingProvider";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_400Regular_Italic,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ModeProvider>
          <OnboardingProvider>
            <StatusBar style="dark" />
            {/* Headers are owned by each area: the tab navigator draws its
                own, onboarding uses its bespoke OnboardingScreen chrome.
                Profile is a modal rather than a route inside (tabs), so
                account settings never occupy one of the three tab slots.

                (tabs) and parent are sibling shells — Child Mode and Parent
                Mode — swapped by ModeProvider rather than pushed, so neither
                ever sits on the other's back stack. */}
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="parent" />
              <Stack.Screen
                name="profile"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="community/discussion"
                options={{ presentation: "card" }}
              />
              <Stack.Screen
                name="community/ask"
                options={{ presentation: "modal" }}
              />
            </Stack>
          </OnboardingProvider>
        </ModeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
