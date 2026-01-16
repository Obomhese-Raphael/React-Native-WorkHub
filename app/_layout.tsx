// app/_layout.tsx
import { RefreshProvider } from "@/context/RefreshContext";
import { ClerkLoaded, ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Slot } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import "./globals.css";

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key in .env");
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ClerkLoaded>
        <RefreshProvider>
          <ThemeProvider value={DarkTheme}>
            <LinearGradient
              colors={["#0f172a", "#1e293b", "#0f172a"]}
              className="flex-1"
            >
              <SafeAreaView className="flex-1">
                <Slot />
              </SafeAreaView>
            </LinearGradient>
          </ThemeProvider>
        </RefreshProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}