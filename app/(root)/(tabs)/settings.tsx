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
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Team type (from your enriched /api/teams response)
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

  // Edit profile states
  const [editName, setEditName] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Notification toggles (local for now – can sync to backend/user later)
  const [notifications, setNotifications] = useState({
    taskAssigned: true,
    dueReminders: true,
    mentions: true,
  });

  useEffect(() => {
    if (!isLoaded || !user) return;

    setEditName(`${user.firstName || ""} ${user.lastName || ""}`.trim());

    const fetchTeams = async () => {
      try {
        const token = await getToken();
        const res = await api("/teams", token);
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

  const saveProfile = async () => {
    if (!editName.trim()) return Alert.alert("Error", "Name cannot be empty");

    try {
      const [firstName, ...lastNameParts] = editName.trim().split(" ");
      await user?.update({
        firstName,
        lastName: lastNameParts.join(" "),
      });

      Alert.alert("Success", "Profile updated");
      setIsEditingProfile(false);
    } catch (err) {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  const handleLeaveTeam = (teamId: string, teamName: string) => {
    Alert.alert(
      "Leave Team",
      `Are you sure you want to leave "${teamName}"?\n\nYou will lose access to all its projects and tasks.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              const res = await api(`/teams/${teamId}/members/self`, token, {
                method: "DELETE",
              });

              if (res.success) {
                setTeams(teams.filter((t) => t._id !== teamId));
                Alert.alert("Success", `You have left "${teamName}"`);
              } else {
                throw new Error(res.error || "Failed to leave team");
              }
            } catch (err: any) {
              console.error("Leave team failed:", err);
              Alert.alert("Error", `Failed to leave team\n${err.message}`);
            }
          },
        },
      ]
    );
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    Alert.alert(
      "Delete Team",
      `Delete "${teamName}"?\nThis will archive the team, projects, and tasks permanently.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              const res = await api(`/teams/${teamId}`, token, {
                method: "DELETE",
              });

              if (res.success) {
                setTeams(teams.filter((t) => t._id !== teamId));
                Alert.alert("Success", `${teamName} deleted`);
              }
            } catch (err) {
              Alert.alert("Error", "Failed to delete team");
            }
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
          {/* Profile Section */}
          <View className="items-center mb-10">
            <View className="w-24 h-24 rounded-full bg-slate-700 border-4 border-slate-600 overflow-hidden mb-4">
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Ionicons name="person" size={48} color="#94a3b8" />
                </View>
              )}
            </View>

            {isEditingProfile ? (
              <View className="w-full mb-4">
                <TextInput
                  className="bg-slate-800/60 rounded-2xl px-6 py-4 text-white text-lg border border-slate-700 mb-3"
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter your name"
                  placeholderTextColor="#64748b"
                  autoFocus
                />
                <View className="flex-row space-x-4 gap-5 justify-center items-center">
                  <TouchableOpacity
                    onPress={() => setIsEditingProfile(false)}
                    className="px-6 py-3 bg-slate-700 rounded-xl"
                  >
                    <Text className="text-white font-medium">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={saveProfile}
                    className="px-6 py-3 bg-blue-600 rounded-xl"
                  >
                    <Text className="text-white font-medium">Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <Text className="text-white text-2xl font-bold">
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text className="text-slate-400 text-base mt-1">
                  {user?.primaryEmailAddress?.emailAddress || "No email"}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsEditingProfile(true)}
                  className="mt-4 px-6 py-2 bg-slate-700 rounded-xl"
                >
                  <Text className="text-white font-medium">Edit Profile</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Quick Actions */}
          <View className="flex-row justify-around mb-10">
            <TouchableOpacity
              onPress={handleSignOut}
              className="bg-red-600/80 px-6 py-4 rounded-2xl items-center flex-1"
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
              <View className="space-y-4 gap-4">
                {teams.map((team) => (
                  <TouchableOpacity
                  key={team._id}
                  className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5"
                  onPress={() => router.push(`/team/${team._id}`)}
                  >
                    <View className="flex-row items-center justify-between mb-3">
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
                            {team.role
                              ? team.role.charAt(0).toUpperCase() +
                                team.role.slice(1).toLowerCase()
                              : "Member"}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row space-x-4 gap-5">
                        {team.role === "admin" && (
                          <TouchableOpacity
                            onPress={() =>
                              handleDeleteTeam(team._id, team.name)
                            }
                          >
                            <Ionicons
                              name="trash-outline"
                              size={24}
                              color="#ef4444"
                            />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() => handleLeaveTeam(team._id, team.name)}
                        >
                          <Ionicons
                            name="exit-outline"
                            size={24}
                            color="#94a3b8"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Notifications Section */}
          <View className="mb-10 bg-slate-800/60 rounded-2xl p-5 border border-slate-700">
            <Text className="text-white text-xl font-bold mb-4">
              Notifications
            </Text>

            <View className="flex-row justify-between items-center py-3 border-b border-slate-700">
              <Text className="text-slate-300 flex-1">Task assigned to me</Text>
              <Switch
                value={notifications.taskAssigned}
                onValueChange={(v) =>
                  setNotifications({ ...notifications, taskAssigned: v })
                }
                trackColor={{ false: "#475569", true: "#60a5fa" }}
                thumbColor={notifications.taskAssigned ? "#ffffff" : "#94a3b8"}
              />
            </View>

            <View className="flex-row justify-between items-center py-3 border-b border-slate-700">
              <Text className="text-slate-300 flex-1">Due date reminders</Text>
              <Switch
                value={notifications.dueReminders}
                onValueChange={(v) =>
                  setNotifications({ ...notifications, dueReminders: v })
                }
                trackColor={{ false: "#475569", true: "#60a5fa" }}
                thumbColor={notifications.dueReminders ? "#ffffff" : "#94a3b8"}
              />
            </View>

            <View className="flex-row justify-between items-center py-3">
              <Text className="text-slate-300 flex-1">Mentions & comments</Text>
              <Switch
                value={notifications.mentions}
                onValueChange={(v) =>
                  setNotifications({ ...notifications, mentions: v })
                }
                trackColor={{ false: "#475569", true: "#60a5fa" }}
                thumbColor={notifications.mentions ? "#ffffff" : "#94a3b8"}
              />
            </View>
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
