// app/project/[projectId]/index.tsx
import { api } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Assignee = {
  name: string;
  email: string;
};

type Task = {
  order: number;
  _id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assignees: Assignee[];
  assignedBy?: { name: string }; // From your backend: assignedBy is userId → enriched to name
  dueDate?: string;
  projectId?: {
    _id: string;
    name: string;
  };
};

type Column = {
  id: "todo" | "in-progress" | "done";
  title: string;
  tasks: Task[];
};

const columnConfig: Column[] = [
  { id: "todo", title: "To Do", tasks: [] },
  { id: "in-progress", title: "In Progress", tasks: [] },
  { id: "done", title: "Done", tasks: [] },
];

export default function ProjectTaskBoard() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { getToken } = useAuth();
  const router = useRouter();

  const [projectName, setProjectName] = useState("Loading Project...");
  const [columns, setColumns] = useState<Column[]>(columnConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjectAndTasks = async () => {
      try {
        const token = await getToken();

        const projectRes = await api(`/projects/${projectId}`, token);
        setProjectName(projectRes.data?.name || "Project Board");

        const tasksRes = await api(`/tasks/${projectId}/tasks`, token);
        const tasks: Task[] = tasksRes.data || [];

        const grouped = columnConfig.map((col) => ({
          ...col,
          tasks: tasks
            .filter((task) => task.status === col.id)
            .sort((a, b) => (a.order || 0) - (b.order || 0)),
        }));

        setColumns(grouped);
      } catch (err: any) {
        console.error("Failed to load task board:", err);
        Alert.alert("Sync Failed", "Unable to load tasks for this project.");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) fetchProjectAndTasks();
  }, [projectId, getToken]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return {
          bg: "bg-red-900/30",
          border: "border-red-600",
          text: "text-red-400",
        };
      case "high":
        return {
          bg: "bg-orange-900/30",
          border: "border-orange-600",
          text: "text-orange-400",
        };
      case "medium":
        return {
          bg: "bg-yellow-900/30",
          border: "border-yellow-600",
          text: "text-yellow-400",
        };
      case "low":
        return {
          bg: "bg-green-900/30",
          border: "border-green-600",
          text: "text-green-400",
        };
      default:
        return {
          bg: "bg-slate-700/50",
          border: "border-slate-600",
          text: "text-slate-400",
        };
    }
  };

  const renderTaskCard = ({ item }: { item: Task }) => {
    const priorityStyle = getPriorityColor(item.priority);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        className="bg-slate-800/70 backdrop-blur border border-slate-700/60 rounded-2xl p-5 mb-5 shadow-lg"
        onPress={() => {
          const rawProjectId = item.projectId;

          console.log("Navigating to task:", {
            taskId: item._id,
            projectIdRaw: rawProjectId,
            projectIdExtracted:
              typeof rawProjectId === "string"
                ? rawProjectId
                : rawProjectId?._id,
          });

          router.push({
            pathname: "/task/[taskId]",
            params: {
              taskId: item._id,
              projectId:
                typeof rawProjectId === "string"
                  ? rawProjectId
                  : rawProjectId?._id,
            },
          });
        }}
      >
        {/* Title */}
        <Text className="text-white text-lg font-black tracking-tight mb-3">
          {item.title}
        </Text>

        {/* Priority Badge */}
        <View
          className={`self-start px-4 py-1.5 rounded-full border ${priorityStyle.border} ${priorityStyle.bg} mb-4`}
        >
          <Text
            className={`text-xs font-black uppercase tracking-wider ${priorityStyle.text}`}
          >
            {item.priority}
          </Text>
        </View>

        {/* Assignees Row */}
        {item.assignees?.length > 0 && (
          <View className="flex-row items-center mb-3">
            <Text className="text-slate-500 text-xs font-bold mr-3">
              ASSIGNED TO
            </Text>
            <View className="flex-row -space-x-2">
              {item.assignees.slice(0, 4).map((a, i) => (
                <View
                  key={i}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 border-2 border-slate-900 flex items-center justify-center"
                >
                  <Text className="text-white text-sm font-bold">
                    {a.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              ))}
              {item.assignees.length > 4 && (
                <View className="w-9 h-9 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center">
                  <Text className="text-slate-400 text-xs font-bold">
                    +{item.assignees.length - 4}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Assigned By */}
        {item.assignedBy && (
          <View className="flex-row items-center">
            <Text className="text-slate-500 text-xs font-bold mr-2">
              ASSIGNED BY
            </Text>
            <Text className="text-slate-300 text-sm font-medium">
              {item.assignedBy.name}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#0f172a", "#1e293b", "#0f172a"]}
        className="flex-1"
      >
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text className="text-slate-400 mt-6 text-lg">
            Syncing Task Board...
          </Text>
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
        {/* Header */}
        <View className="px-6 pt-4 pb-6 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#94a3b8" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-3xl font-black text-white tracking-tight">
              {projectName}
            </Text>
            <Text className="text-slate-500 text-xs uppercase tracking-widest mt-1">
              Task Board • Encrypted • Live Sync
            </Text>
          </View>
          <View className="w-10" />
        </View>

        {/* Kanban Columns - Balanced & Polished */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-1 px-6"
        >
          <View className="flex-row" style={{ gap: 24 }}>
            {columns.map((column) => (
              <View key={column.id} className="w-80 pb-20">
                {/* Column Header */}
                <View className="flex-row items-center justify-between mb-5">
                  <Text className="text-slate-300 font-black uppercase text-sm tracking-widest">
                    {column.title}
                  </Text>
                  <View className="bg-slate-700/60 px-4 py-2 rounded-full">
                    <Text className="text-slate-200 text-sm font-bold">
                      {column.tasks.length}
                    </Text>
                  </View>
                </View>

                {/* Task List */}
                <FlatList
                  data={column.tasks}
                  renderItem={renderTaskCard}
                  keyExtractor={(item) => item._id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 120 }}
                  ListEmptyComponent={
                    <View className="items-center py-16 opacity-50">
                      <Feather name="inbox" size={56} color="#475569" />
                      <Text className="text-slate-600 text-base mt-4 font-medium">
                        No tasks{" "}
                        {column.id === "done"
                          ? "completed"
                          : column.id === "in-progress"
                            ? "in progress"
                            : "yet"}
                      </Text>
                    </View>
                  }
                />
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Floating Action Button */}
        <TouchableOpacity
          onPress={() => router.push(`/create-task?projectId=${projectId}`)}
          className="absolute bottom-8 mb-20 right-6 w-16 h-16 bg-blue-600 rounded-full items-center justify-center shadow-2xl"
        >
          <Feather name="plus" size={32} color="white" />
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}
