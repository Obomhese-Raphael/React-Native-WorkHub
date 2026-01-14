import { api } from "@/lib/api";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Type for team list (adjust based on your /api/teams response)
type Team = {
  _id: string;
  name: string;
  color: string;
  role: "admin" | "member";
};

export default function SettingsScreen() {
  const { user, isLoaded } = useUser();
  const { signOut, getToken } = useAuth();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchTeams = async () => {
      try {
        const token = await getToken();
        console.log("Settings Screen Token:", token?.slice(0, 10) + "...");

        const res = await api("/teams", token); // assuming you have GET /api/teams endpoint
        console.log("Fetched Teams in Settings:", res.data);

        const teamData: Team[] = res.data || [];
        setTeams(teamData);
      } catch (err) {
        console.error("Failed to load teams in settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [isLoaded, user]);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of WorkHub?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/(auth)/sign-in");
          } catch (err) {
            Alert.alert("Error", "Failed to sign out");
          }
        },
      },
    ]);
  };

  const handleLeaveTeam = (teamId: string, teamName: string) => {
    Alert.alert(
      "Leave Team",
      `Are you sure you want to leave "${teamName}"? You will lose access to all its projects and tasks.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => {
            // TODO: Call DELETE /api/teams/:teamId/members/self or similar
            Alert.alert("Left team", `"${teamName}" has been left`);
            setTeams(teams.filter((t) => t._id !== teamId));
          },
        },
      ]
    );
  };

  if (!isLoaded) {
    return (
      <LinearGradient colors={["#0f172a", "#1e293b"]} className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#60a5fa" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#0f172a", "#1e293b", "#0f172a"]}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <ScrollView className="px-6 pt-6">
          {/* Profile Header */}
          <View className="items-center mb-10">
            <View className="w-24 h-24 rounded-full bg-slate-700 border-4 border-slate-600 overflow-hidden mb-4">
              {user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Ionicons name="person" size={48} color="#94a3b8" />
                </View>
              )}
            </View>
            <Text className="text-white text-2xl font-bold">
              {user?.firstName} {user?.lastName}
            </Text>
            <Text className="text-slate-400 text-base mt-1">
              {user?.primaryEmailAddress?.emailAddress || "No email"}
            </Text>
          </View>

          {/* Quick Actions */}
          <View className="flex-row justify-around mb-10">
            <TouchableOpacity
              onPress={() =>
                Alert.alert("Coming soon", "Profile editing in next update")
              }
              className="bg-slate-800/60 px-6 py-4 rounded-2xl border border-slate-700 items-center flex-1 mr-3"
            >
              <Ionicons name="pencil" size={24} color="#60a5fa" />
              <Text className="text-white mt-2 font-medium">Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSignOut}
              className="bg-red-600/80 px-6 py-4 rounded-2xl items-center flex-1 ml-3"
            >
              <Ionicons name="log-out" size={24} color="white" />
              <Text className="text-white mt-2 font-medium">Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* Teams Section */}
          <View className="mb-10">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-xl font-bold">Your Teams</Text>
              <TouchableOpacity
                onPress={() => router.push("/create-team")}
                className="bg-blue-600 px-4 py-2 rounded-xl"
              >
                <Text className="text-white font-medium">+ New Team</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator color="#60a5fa" />
            ) : teams.length === 0 ? (
              <View className="bg-slate-800/40 border border-slate-700 p-6 rounded-2xl items-center">
                <Text className="text-slate-400 text-center">
                  You're not in any teams yet. Create one to get started!
                </Text>
              </View>
            ) : (
              <View className="space-y-4">
                {teams.map((team) => (
                  <View
                    key={team._id}
                    className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View
                          className="w-10 h-10 rounded-full mr-3"
                          style={{ backgroundColor: team.color }}
                        />
                        <View>
                          <Text className="text-white font-bold text-lg">
                            {team.name}
                          </Text>
                          <Text className="text-slate-400 text-sm">
                            Role:{" "}
                            {
                              team.role
                                ? team.role.charAt(0).toUpperCase() +
                                  team.role.slice(1)
                                : "Member" // fallback
                            }
                          </Text>
                        </View>
                      </View>

                      {team.role !== "admin" && (
                        <TouchableOpacity
                          onPress={() => handleLeaveTeam(team._id, team.name)}
                        >
                          <Ionicons
                            name="exit-outline"
                            size={24}
                            color="#ef4444"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* App Info */}
          <View className="items-center pb-20">
            <Text className="text-slate-600 text-sm">
              WorkHub v1.0.0 • Made in Lagos
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
