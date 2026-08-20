import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // Loud in dev, harmless in prod builds where env vars are always set.
  console.warn(
    "Supabase env vars are missing. Copy .env.example to .env and fill them in."
  );
}

// Same project the website's waitlist already uses (kvayhcablmsorycpqmkg) —
// the app and the site share one backend, per the PRD's "one platform"
// architecture. AsyncStorage persists the session across app restarts;
// autoRefreshToken keeps it alive while the app is foregrounded.
export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
