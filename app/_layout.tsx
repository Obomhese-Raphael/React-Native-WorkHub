import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache"; // assuming you're using this
import { Stack } from "expo-router";
import "./globals.css";

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();

if (!PUBLISHABLE_KEY || !PUBLISHABLE_KEY.startsWith("pk_test_")) {
  throw new Error(
    `Invalid or missing Clerk key! Check .env – current: ${PUBLISHABLE_KEY ? "starts with " + PUBLISHABLE_KEY.slice(0, 15) : "undefined"}`
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <Stack screenOptions={{ headerShown: false }} />
    </ClerkProvider>
  );
}