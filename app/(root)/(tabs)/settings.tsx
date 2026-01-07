// app/(root)/(tabs)/settings.tsx
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/"); // or "/(auth)/sign-in" if you have one
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={["#0f172a", "#1e293b"]} className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-8 pt-10">
          <Text className="text-3xl font-black text-white tracking-tight mb-10">
            Settings
          </Text>

          {/* Other settings items can go here later */}

          {/* Sign Out Button - Bottom positioned */}
          <View className="mt-auto mb-12">
            <TouchableOpacity
              onPress={handleSignOut}
              activeOpacity={0.8}
              className="overflow-hidden rounded-2xl shadow-lg"
            >
              <LinearGradient
                colors={["#dc2626", "#b91c1c"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-5 flex-row justify-center items-center"
              >
                <Ionicons name="log-out-outline" size={22} color="white" className="mr-3" />
                <Text className="text-white text-lg font-black uppercase tracking-widest">
                  Sign Out
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}