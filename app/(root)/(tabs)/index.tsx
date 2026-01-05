// app/(root)/(tabs)/index.tsx
import SearchBar from "@/components/SearchBar";
import icons from "@/constants/icons";
import { api } from "@/lib/api";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  tasks: any[]; // We'll count later
};

type TaskSummary = {
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
  upcoming: number;
  reminders: number;
};

export default function HomeScreen() {
  const { getToken } = useAuth();
  const { user } = useUser();
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

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Morning");
    else if (hour < 18) setGreeting("Afternoon");
    else setGreeting("Evening");
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);

      // Safely get Clerk token inside component
      const token = await getToken();
      console.log("Clerk token:", token ? "Present" : "Missing"); // ← Add this
      if (!token) {
        throw new Error("Not authenticated");
      }

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

      // Loop through each team to get its projects
      for (const team of userTeams) {
        try {
          const projectsRes = await api(`/teams/${team._id}`, token);
          const teamProjects = projectsRes.data || [];

          // Add projects to list
          allProjects.push(...teamProjects);

          // Count tasks by status for summary
          teamProjects.forEach((project: any) => {
            const activeTasks =
              project.tasks?.filter((t: any) => t.isActive) || [];

            activeTasks.forEach((task: any) => {
              switch (task.status) {
                case "todo":
                  totalTodo++;
                  break;
                case "in-progress":
                  totalInProgress++;
                  break;
                case "done":
                  totalDone++;
                  break;
              }

              // Overdue: due date passed and not done
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
          // Continue with other teams
        }
      }

      // Update state with real data
      setProjects(allProjects);

      setTaskSummary({
        todo: totalTodo,
        inProgress: totalInProgress,
        done: totalDone,
        overdue: totalOverdue,
        upcoming: 3, // You can enhance this later with real logic
        reminders: 1, // Placeholder — add real reminders later
      });
    } catch (error: any) {
      console.error("Failed to load home data:", error.message || error);
      // Optional: show toast notification in the future
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Loading your workspace...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="px-4 pt-8">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-xl font-bold">
            Good {greeting}, {user?.firstName || "there"}!
          </Text>
          <TouchableOpacity onPress={() => router.push("/settings")}>
            <Image
              source={{ uri: user?.imageUrl || icons.person }}
              className="w-10 h-10 rounded-full"
            />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="w-full border-blue-800">
          <SearchBar placeholder="Search tasks, projects..." />
        </View>

        {/* Teams */}
        <Text className="text-lg font-semibold mt-8 mb-3">Your Teams</Text>
        {teams.length === 0 ? (
          <Text className="text-gray-500">No teams yet. Create one!</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {teams.map((team) => (
              <TouchableOpacity
                key={team._id}
                className="mr-4 w-40 bg-gray-100 rounded-2xl p-5 items-center"
                style={{ backgroundColor: team.color + "20" }} // e.g., #FF000020
                onPress={() => console.log("Navigate to team", team._id)}
              >
                <View
                  className="w-16 h-16 rounded-full mb-3"
                  style={{ backgroundColor: team.color }}
                />
                <Text className="font-bold text-lg">{team.name}</Text>
                <Text className="text-gray-600">
                  {team.members.length} members
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Task Summary Cards */}
        <Text className="text-lg font-semibold mt-8 mb-3">Task Overview</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <SummaryCard
            count={taskSummary.todo}
            label="To Do"
            color="bg-yellow-100"
          />
          <SummaryCard
            count={taskSummary.inProgress}
            label="In Progress"
            color="bg-blue-100"
          />
          <SummaryCard
            count={taskSummary.done}
            label="Done"
            color="bg-green-100"
          />
          <SummaryCard
            count={taskSummary.overdue}
            label="Overdue"
            color="bg-red-100"
          />
          <SummaryCard
            count={taskSummary.upcoming}
            label="Upcoming"
            color="bg-purple-100"
          />
        </ScrollView>

        {/* Recent Projects */}
        <Text className="text-lg font-semibold mt-8 mb-3">Recent Projects</Text>
        {projects.length === 0 ? (
          <Text className="text-gray-500">No projects yet</Text>
        ) : (
          <View>
            {projects.slice(0, 5).map((project) => (
              <TouchableOpacity
                key={project._id}
                className="bg-gray-50 rounded-2xl p-5 mb-4 border-l-4 border-blue-500"
                onPress={() =>
                  router.push({
                    pathname: "/details/[projectId]",
                    params: { projectId: project._id },
                  })
                }
              >
                <Text className="font-bold text-lg">{project.name}</Text>
                <Text className="text-gray-600">
                  {project.tasks?.filter((t: any) => t.isActive).length || 0}{" "}
                  active tasks
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Reusable summary card component
const SummaryCard = ({
  count,
  label,
  color,
}: {
  count: number;
  label: string;
  color: string;
}) => (
  <View className={`${color} rounded-2xl p-5 w-32 items-center mr-4`}>
    <Text className="text-3xl font-bold">{count}</Text>
    <Text className="text-gray-700 font-medium">{label}</Text>
  </View>
);
