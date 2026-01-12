// app/(root)/(tabs)/index.tsx
import SearchBar from "@/components/SearchBar";
import icons from "@/constants/icons";
import images from "@/constants/images";
import { useRefresh } from "@/context/RefreshContext";
import { api } from "@/lib/api";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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

// --- Types ---

type Team = {
  _id: string;
  name: string;
  color: string;
  members: { name: string }[];
};

type Project = {
  _id: string;
  name: string;
  teamId: string;
  tasks: any[];
};

type TaskSummary = {
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
  upcoming: number;
  reminders: number;
};

// --- Main Component ---

export default function HomeScreen() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { refreshTrigger } = useRefresh();

  // State Management
  const [greeting, setGreeting] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskSummary, setTaskSummary] = useState<TaskSummary>({
    todo: 0,
    inProgress: 0,
    done: 0,
    overdue: 0,
    upcoming: 0,
    reminders: 0,
  });
  const [loading, setLoading] = useState(true);

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Morning");
    else if (hour < 18) setGreeting("Afternoon");
    else setGreeting("Evening");
  }, []);

  // --- Logic: Log Token (Debug) ---
  const logToken = async () => {
    try {
      const token = await getToken();
      Alert.alert("Authentication System", "Session token logged to console.");
    } catch (err) {
      console.error("Failed to get token:", err);
    }
  };  

  // --- Logic: Fetch Data ---  
  const fetchHomeData = async () => {           
    try {
      setLoading(true);
      const token = await getToken();
      console.log("Fetched Token:", token);  
      if (!token) throw new Error("Not authenticated");

      // 1. Fetch user's teams
      const teamsRes = await api("/teams", token);
      const userTeams: Team[] = teamsRes.data || [];
      setTeams(userTeams);

      // 2. Prepare to collect all projects and count tasks
      const allProjects: Project[] = [];
      let totalTodo = 0;
      let totalInProgress = 0;
      let totalDone = 0;  
      let totalOverdue = 0;

      for (const team of userTeams) {
        try {
          const projectsRes = await api(`/projects/team/${team._id}`, token);
          const teamProjects = projectsRes.data || [];
          allProjects.push(...teamProjects);

          teamProjects.forEach((project: any) => {
            const activeTasks =
              project.tasks?.filter((t: any) => t.isActive) || [];
            activeTasks.forEach((task: any) => {
              if (task.status === "todo") totalTodo++;
              else if (task.status === "in-progress") totalInProgress++;
              else if (task.status === "done") totalDone++;

              if (
                task.dueDate &&
                new Date(task.dueDate) < new Date() &&
                task.status !== "done"
              ) {
                totalOverdue++;
              }
            });
          });
        } catch (err) {
          console.warn(`Failed to load projects for team ${team.name}`, err);
        }
      }

      setProjects(allProjects);
      setTaskSummary((prev) => ({
        ...prev,
        todo: totalTodo,
        inProgress: totalInProgress,
        done: totalDone,
        overdue: totalOverdue,
        upcoming: 3, // Mock value
        reminders: 1, // Mock value
      }));
    } catch (error: any) {
      console.error("Home Data Fetch Error:", error.message || error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, [refreshTrigger]);

  // Helper: Get first letter of team name
  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  if (loading) {
    return (
      <View className="flex-1 bg-[#0f172a] items-center justify-center">
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text className="mt-4 text-slate-400 font-medium">
          Syncing Environment...
        </Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#0f172a", "#1e293b", "#0f172a"]}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <ScrollView
          className="px-6"
          contentContainerStyle={{ paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
        >
          {/* --- Header --- */}
          <View className="flex-row justify-between items-center mt-8 mb-8">
            <View>
              <Text className="text-slate-500 text-xs font-bold uppercase tracking-[3px] mb-1">
                Good {greeting}
              </Text>
              <Text className="text-3xl font-black text-white">
                {user?.firstName || "Executive"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/settings")}
              className="border-2 border-slate-700 rounded-full p-1"
            >
              <Image
                source={{ uri: user?.imageUrl || icons.person }}
                className="w-12 h-12 rounded-full"
              />
            </TouchableOpacity>
          </View>

          {/* --- Search Bar & Logo Row --- */}
          <View className="flex-row items-center mb-10">
            <View className="flex-1 bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
              <SearchBar placeholder="Search Ecosystem..." />
            </View>
            <View className="ml-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-2 items-center justify-center w-14 h-14">
              <Image
                source={images.expo_icon}
                className="w-8 h-8"
                resizeMode="contain"
              />
            </View>
          </View>

          {/* --- Teams Section --- */}
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-lg font-bold text-white tracking-tight">
              Active Teams
            </Text>
            <TouchableOpacity>
              <Text className="text-sky-400 font-bold text-[10px] uppercase">
                Browse All
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-10"
          >
            {teams.length === 0 ? (
              <Text className="text-slate-500 italic">
                No active teams assigned.
              </Text>
            ) : (
              teams.map((team) => (
                <TouchableOpacity
                  key={team._id}
                  onPress={() => router.push(`/team/${team._id}` as any)}
                  className="mr-5 w-32 bg-slate-800/30 border border-slate-700/50 rounded-[30px] p-5 items-center"
                >
                  <View
                    className="w-14 h-14 rounded-2xl mb-3 items-center justify-center shadow-lg"
                    style={{ backgroundColor: team.color || "#3b82f6" }}
                  >
                    <Text className="text-white text-xl font-black">
                      {getInitial(team.name)}
                    </Text>
                  </View>
                  <Text
                    className="text-white font-bold text-sm text-center"
                    numberOfLines={1}
                  >
                    {team.name}
                  </Text>
                  <Text className="text-slate-500 text-[10px] mt-1 font-bold">
                    {team.members.length} MEMBERS
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* --- Performance Overview Grid --- */}
          <Text className="text-lg font-bold text-white tracking-tight mb-5">
            Performance Metrics
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <SummaryCard
              count={taskSummary.todo}
              label="Pending"
              accent="#f59e0b"
            />
            <SummaryCard
              count={taskSummary.inProgress}
              label="In Work"
              accent="#3b82f6"
            />
            <SummaryCard
              count={taskSummary.done}
              label="Completed"
              accent="#10b981"
            />
            <SummaryCard
              count={taskSummary.overdue}
              label="Critical"
              accent="#ef4444"
            />
          </View>

          {/* --- Recent Projects --- */}
          <Text className="text-lg font-bold text-white tracking-tight mt-10 mb-5">
            Current Operations
          </Text>
          {projects.length === 0 ? (
            <View className="bg-slate-800/20 border border-dashed border-slate-700 p-8 rounded-3xl items-center">
              <Text className="text-slate-500">
                Zero active projects detected.
              </Text>
            </View>
          ) : (
            <View>
              {projects.slice(0, 4).map((project) => (
                <TouchableOpacity
                  key={project._id}
                  className="bg-slate-800/20 border border-slate-700/40 rounded-3xl p-5 mb-4 flex-row items-center justify-between"
                  onPress={() =>
                    router.push({
                      pathname: "/projects/[projectId]", // ← Keep brackets here
                      params: { projectId: project._id }, // ← param name MUST match the [segment]
                    })
                  }
                >
                  <View className="flex-row items-center flex-1">
                    <View className="w-1 h-10 bg-indigo-500 rounded-full mr-4" />
                    <View>
                      <Text className="text-white font-extrabold text-base">
                        {project.name}
                      </Text>
                      <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-tighter">
                        Code: {project._id.slice(-6)}
                      </Text>
                    </View>
                  </View>
                  <View className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                    <Text className="text-sky-400 text-[10px] font-black">
                      {project.tasks?.length || 0} ACTIVE
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* --- Debug Footer --- */}
          <View className="mt-12 items-center opacity-40">
            <TouchableOpacity onPress={logToken}>
              <Text className="text-slate-500 text-[10px] font-bold tracking-[2px]">
                ENCRYPTED SESSION LOGS
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// --- Internal Sub-Components ---

const SummaryCard = ({
  count,
  label,
  accent,
}: {
  count: number;
  label: string;
  accent: string;
}) => (
  <View className="bg-slate-800/30 border border-slate-700/40 w-[48%] rounded-[24px] p-5 mb-4">
    <View className="flex-row justify-between items-start mb-2">
      <Text className="text-3xl font-black text-white">{count}</Text>
      <View
        style={{ backgroundColor: accent }}
        className="w-2 h-2 rounded-full mt-2 shadow-sm shadow-white"
      />
    </View>
    <Text className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">
      {label}
    </Text>
  </View>
);
