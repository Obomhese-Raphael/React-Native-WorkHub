// app/team/[teamId].tsx
import { api } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Team {
  _id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  members: { userId: string; name: string; email: string; role: string }[];
  projects: any[]; // or define proper Project type
}

interface Project {
  _id: string;
  name: string;
  description?: string;
  color?: string;
  tasks: { isActive: boolean }[];
}

export default function TeamDetailsScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const { getToken } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const activeTaskCount = (project: Project) =>
    project.tasks?.filter((t) => t.isActive).length || 0;

  useEffect(() => {
    const fetchTeam = async () => {
      if (!teamId) return;
      try {
        const token = await getToken();
        // Use your existing endpoint that returns team + projects
        const res = await api(`/projects/team/${teamId}`, token); // This returns projects
        const projectsRes = res.data || [];

        // Fetch team separately for full details
        const teamRes = await api(`/teams/${teamId}`, token);
        teamRes.data.isAdmin === true ? setIsAdmin(true) : setIsAdmin(false);
        setTeam({ ...teamRes.data, projects: projectsRes });
      } catch (err) {
        console.error("Failed to load team data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [teamId]);

  const handleDeleteProject = (projectId: string, projectName: string) => {
    Alert.alert(
      "Delete Project",
      `Are you sure you want to delete "${projectName}"?\n\nThis will archive the project and all its tasks. This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              const teamId = team?._id; // from your team state

              const res = await api(
                `/projects/team/${teamId}/${projectId}`,
                token,
                {
                  method: "DELETE",
                }
              );

              if (res.success) {
                // Optimistic update: remove from local list
                if (team) {
                  // Guard against null
                  setTeam({
                    ...team, // Now TypeScript knows team is Team (not null)
                    projects: team.projects.filter((p) => p._id !== projectId),
                  });
                }
                Alert.alert("Success", `${projectName} deleted`);
              } else {
                throw new Error(res.error || "Failed to delete project");
              }
            } catch (err: any) {
              console.error("Delete project failed:", err);
              Alert.alert("Error", `Failed to delete project\n${err.message}`);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={["#0f172a", "#1e293b"]} className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8b5cf6" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!team) {
    return (
      <LinearGradient colors={["#0f172a", "#1e293b"]} className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center px-8">
          <Text className="text-white text-xl">Team not found</Text>
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
        <ScrollView className="flex-1 px-8 pt-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-10">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700"
            >
              <Ionicons name="chevron-back" size={24} color="#94a3b8" />
            </TouchableOpacity>
            <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[4px]">
              TEAM PROFILE
            </Text>
            <View className="w-12" />
          </View>

          {/* Team Avatar + Name */}
          <View className="items-center mb-10">
            <View
              className="w-32 h-32 rounded-3xl items-center justify-center shadow-2xl mb-6 border-4 border-slate-700"
              style={{ backgroundColor: team.color || "#3b82f6" }}
            >
              <Text className="text-white text-6xl font-black">
                {getInitial(team.name)}
              </Text>
            </View>
            <Text className="text-white text-4xl font-black tracking-tight">
              {team.name}
            </Text>
            <Text className="text-slate-400 text-lg mt-2">
              {team.description || "No description"}
            </Text>
          </View>

          {/* Info Cards */}
          <View className="space-y-6 mb-10">
            {/* Created Date */}
            <View className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50 mb-2">
              <Text className="text-slate-500 text-xs uppercase tracking-widest mb-2">
                Established
              </Text>
              <Text className="text-white text-xl font-bold">
                {formatDate(team.createdAt)}
              </Text>
            </View>

            {/* Member Count */}
            <View className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50 mb-2">
              <Text className="text-slate-500 text-xs uppercase tracking-widest mb-2">
                Workforce
              </Text>
              <Text className="text-white text-xl font-bold">
                {team.members.length}{" "}
                {team.members.length === 1 ? "Member" : "Members"}
              </Text>
            </View>

            {/* Projects */}
            <View className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50 mb-2">
              <Text className="text-slate-500 text-xs uppercase tracking-widest mb-2">
                Active Projects
              </Text>
              <Text className="text-white text-xl font-bold">
                {team.projects?.length || 0}
              </Text>
            </View>
          </View>

          {/* Members List */}
          <Text className="text-white text-xl font-bold mb-4">
            Team Members
          </Text>
          <View className="space-y-4 mb-10">
            {team.members.map((member, index) => (
              <View
                key={index}
                className="bg-slate-800/40 rounded-2xl p-5 flex-row items-center border border-slate-700/50"
              >
                <View className="w-12 h-12 rounded-xl bg-indigo-600 items-center justify-center mr-4">
                  <Text className="text-white text-xl font-bold">
                    {getInitial(member.name || "U")}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold">
                    {member.name || "Unknown"}
                  </Text>
                  <Text className="text-slate-400 text-sm">
                    {member.email || "No email"}
                  </Text>
                </View>
                <View
                  className={`px-3 py-1 rounded-full ${
                    member.role === "admin"
                      ? "bg-purple-600/30"
                      : "bg-slate-600/30"
                  }`}
                >
                  <Text className="text-xs font-bold text-purple-300 uppercase">
                    {member.role}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Projects List — Added Underneath */}
          <Text className="text-white text-2xl font-bold mb-6">Projects</Text>
          {team.projects && team.projects.length > 0 ? (
            <View className="space-y-5 pb-10">
              {team.projects.map((project) => (
                <View
                  key={project._id}
                  className="bg-slate-800/40 rounded-2xl border border-slate-700/50 overflow-hidden relative"
                >
                  {/* Full-height color sidebar – now more prominent */}
                  <View
                    className="absolute inset-y-0 left-0 w-5" // wider (20px) and full height
                    style={{ backgroundColor: project.color || "#8b5cf6" }}
                  />

                  {/* Card content – add left padding to make space for the bar */}
                  <View className="flex-row items-center justify-between pl-8 pr-6 py-6">
                    <TouchableOpacity
                      onPress={() => router.push(`/projects/${project._id}`)}
                      className="flex-row items-center flex-1"
                    >
                      <View className="flex-1">
                        <Text className="text-white text-xl font-bold">
                          {project.name}
                        </Text>
                        <Text className="text-slate-400 mt-1">
                          {project.activeTaskCount || 0} active task
                          {project.activeTaskCount !== 1 ? "s" : ""}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={24}
                        color="#94a3b8"
                      />
                    </TouchableOpacity>

                    {/* Delete button */}
                    {isAdmin && (
                      <TouchableOpacity
                        onPress={() =>
                          handleDeleteProject(project._id, project.name)
                        }
                        className="ml-4 p-2"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={24}
                          color="#ef4444"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => router.push("/create-project")} // ← Change to your actual create-project route
              activeOpacity={0.8}
              className="bg-slate-800/30 rounded-2xl p-10 items-center mb-10 border border-slate-700/30"
            >
              <View className="w-20 h-20 rounded-full bg-blue-600/20 items-center justify-center mb-4">
                <Ionicons name="add" size={48} color="#60a5fa" />
              </View>

              <Text className="text-slate-400 text-center text-lg font-medium">
                No projects yet
              </Text>

              <Text className="text-slate-500 text-sm mt-2 text-center">
                Tap here to create your first project
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
