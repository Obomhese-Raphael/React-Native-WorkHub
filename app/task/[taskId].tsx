import { api } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
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

type TaskDetail = {
  _id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  projectId: {
    _id: string;
    name: string;
  };
  assignees: Array<{
    userId: string;
    name: string;
    email: string;
  }>;
};

export default function TaskDetailScreen() {
  const { taskId, projectId } = useLocalSearchParams<{
    taskId: string;
    projectId: string;
  }>();
  console.log("taskId:", taskId, "projectId:", projectId);
  const { getToken } = useAuth();
  const router = useRouter();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId || !projectId) {
        Alert.alert("Error", "Missing task or project ID");
        setLoading(false);
        return;
      }
      try {
        const token = await getToken();

        const res = await api(`/tasks/${projectId}/tasks/${taskId}`, token);
        setTask(res); // adjust based on your API response shape
      } catch (err) {
        console.error("Failed to load task", err);
        Alert.alert("Error", "Could not load task details");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId, getToken]);

  const updateStatus = async (newStatus: TaskDetail["status"]) => {
    if (!task || updating) return;

    setUpdating(true);
    try {
      const token = await getToken();
      const projectId = task.projectId._id;

      const res = await api(`/tasks/${projectId}/tasks/${taskId}`, token, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.success) {
        setTask((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      Alert.alert("Error", "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={["#0f172a", "#1e293b"]} className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="white" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!task) {
    return (
      <LinearGradient colors={["#0f172a", "#1e293b"]} className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center">
          <Text className="text-white text-lg">Task not found</Text>
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
          {/* Header */}
          <View className="flex-row justify-between items-start mb-6">
            <TouchableOpacity onPress={() => router.back()}>
              <Feather name="chevron-left" size={28} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold flex-1 mx-4">
              {task.title}
            </Text>
            <TouchableOpacity>
              <Feather name="edit-2" size={24} color="#60a5fa" />
            </TouchableOpacity>
          </View>

          {/* Status & Priority */}
          <View className="flex-row flex-wrap gap-3 mb-6">
            <View
              className={`px-4 py-2 rounded-full ${
                task.status === "done"
                  ? "bg-emerald-600/30"
                  : task.status === "in-progress"
                    ? "bg-amber-600/30"
                    : "bg-slate-700/50"
              }`}
            >
              <Text className="text-white font-medium capitalize">
                {task.status.replace("-", " ")}
              </Text>
            </View>

            <View
              className={`px-4 py-2 rounded-full ${
                task.priority === "urgent"
                  ? "bg-red-600/30"
                  : task.priority === "high"
                    ? "bg-orange-600/30"
                    : task.priority === "medium"
                      ? "bg-yellow-600/30"
                      : "bg-green-600/30"
              }`}
            >
              <Text className="text-white font-medium capitalize">
                {task.priority}
              </Text>
            </View>
          </View>

          {/* Project */}
          <Text className="text-slate-400 mb-2">Project</Text>
          <Text className="text-blue-400 text-lg mb-6">
            {task.projectId.name}
          </Text>

          {/* Description */}
          {task.description && (
            <>
              <Text className="text-slate-400 mb-2">Description</Text>
              <Text className="text-white text-base leading-6 mb-8">
                {task.description}
              </Text>
            </>
          )}

          {/* Quick Actions */}
          <View className="flex-row flex-wrap gap-4 pb-20">
            {task.status !== "in-progress" && (
              <TouchableOpacity
                onPress={() => updateStatus("in-progress")}
                disabled={updating}
                className="flex-1 bg-amber-600 py-4 rounded-xl items-center"
              >
                <Text className="text-white font-bold">Start Task</Text>
              </TouchableOpacity>
            )}

            {task.status !== "done" && (
              <TouchableOpacity
                onPress={() => updateStatus("done")}
                disabled={updating}
                className="flex-1 bg-emerald-600 py-4 rounded-xl items-center"
              >
                <Text className="text-white font-bold">Complete</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
