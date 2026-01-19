// // app/_layout.tsx
// import { RefreshProvider } from "@/context/RefreshContext";
// import { ClerkLoaded, ClerkProvider } from "@clerk/clerk-expo";
// import { tokenCache } from "@clerk/clerk-expo/token-cache";
// import { DarkTheme, ThemeProvider } from "@react-navigation/native";
// import { LinearGradient } from "expo-linear-gradient";
// import { Slot } from "expo-router";
// import { SafeAreaView } from "react-native-safe-area-context";
// import "./globals.css";

// const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();

// if (!PUBLISHABLE_KEY) {
//   throw new Error("Missing Clerk Publishable Key in .env");
// }


// const registerToken = async () => {
//   const tokenData = await Notifications.getExpoPushTokenAsync();
//   const token = tokenData.data;

//   if (user?.id) {
//     await api('/users/register-push-token', null, {  // Adjust path if needed
//       method: 'POST',
//       body: JSON.stringify({ userId: user.id, pushToken: token }),
//     });
//   }
// };

// export default function RootLayout() {
//   return (
//     <ClerkProvider publishableKey={PUBLISHABLE_KEY} tokenCache={tokenCache}>
//       <ClerkLoaded>
//         <RefreshProvider>
//           <ThemeProvider value={DarkTheme}>
//             <LinearGradient
//               colors={["#0f172a", "#1e293b", "#0f172a"]}
//               className="flex-1"
//             >
//               <SafeAreaView className="flex-1">
//                 <Slot />
//               </SafeAreaView>
//             </LinearGradient>
//           </ThemeProvider>
//         </RefreshProvider>
//       </ClerkLoaded>
//     </ClerkProvider>
//   );
// }


// app/_layout.tsx
import { RefreshProvider } from "@/context/RefreshContext";
import { api } from "@/lib/api"; // Your API helper
import { ClerkLoaded, ClerkProvider, useUser } from "@clerk/clerk-expo"; // Changed: useUser instead of useAuth
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications"; // Added: For push notifications
import { Slot } from "expo-router";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import "./globals.css";

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key in .env");
}

// Configure notifications globally
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,  // Show pop-up alerts
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,  // iOS banner
    shouldShowList: true,    // iOS notification center
  }),
});

// Inner component to access Clerk hooks (must be inside ClerkProvider/ClerkLoaded)
function AppContent() {
  const { user } = useUser();  // Fixed: useUser hook for user object

  useEffect(() => {
    const setupNotifications = async () => {
      // Request notification permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.warn("Notification permissions denied - reminders won't work");
        // Optional: Alert the user to enable notifications in settings
      }

      // Register push token if user is logged in
      if (user?.id) {
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync();
          const token = tokenData.data;

          // Send token to backend to store in Clerk metadata
          await api("/users/register-push-token", null, {  // No auth token needed for this public endpoint
            method: "POST",
            body: JSON.stringify({ userId: user.id, pushToken: token }),
          });
          console.log("Push token registered successfully");
        } catch (error) {
          console.error("Failed to register push token:", error);
        }
      }
    };

    setupNotifications();

    // Listen for incoming notifications (optional: for custom in-app handling)
    const subscription = Notifications.addNotificationReceivedListener((notification: any) => {
      console.log("Notification received:", notification);
      // You can trigger a custom modal or action here if needed
    });

    // Cleanup on unmount
    return () => subscription.remove();
  }, [user]);  // Re-run when user logs in/out

  return (
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
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ClerkLoaded>
        <RefreshProvider>
          <AppContent />
        </RefreshProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}