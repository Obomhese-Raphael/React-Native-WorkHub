// app/team/[teamId].tsx
import { api } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
        setTeam({ ...teamRes.data, projects: projectsRes });
      } catch (err) {
        console.error("Failed to load team data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [teamId]);

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
                <TouchableOpacity
                  key={project._id}   
                  onPress={() => router.push(`/projects/${project._id}`)}
                  className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50 flex-row items-center"
                >
                  <View
                    className="w-4 h-full absolute left-0 rounded-l-2xl"
                    style={{ backgroundColor: project.color || "#8b5cf6" }}
                  />
                  <View className="ml-6 flex-1">
                    <Text className="text-white text-xl font-bold">
                      {project.name}
                    </Text>
                    <Text className="text-slate-400 mt-1">
                      {project.activeTaskCount} active task
                      {project.activeTaskCount !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="bg-slate-800/30 rounded-2xl p-10 items-center mb-10 border border-slate-700/30">
              <Text className="text-slate-500 text-center text-lg">
                No projects yet
              </Text>
              <Text className="text-slate-600 text-sm mt-2 text-center">
                Create a project to see it here
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
