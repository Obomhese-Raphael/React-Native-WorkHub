import { api } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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

// app/my-work.tsx
type Task = {
  _id: string;
  title: string;
  status: "todo" | "in-progress" | "done"; // Match backend enum
  priority: "low" | "medium" | "high" | "urgent";
  projectId?: {
    _id: string;
    name: string;
  };
};

export default function MyWorkScreen() {
  const { getToken } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = "https://react-native-work-hub-backend.vercel.app/api";

  const confirmDelete = (taskId: string) => {
    Alert.alert("Delete Task", "Move this task to trash?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => performAction(taskId, "delete"),
      },
    ]);
  };

  const performAction = async (taskId: string, type: "delete" | "archive") => {
  try {
    const token = await getToken();
    const taskToProcess = tasks.find((t) => t._id === taskId);
    
    console.log('Task found:', taskToProcess);           // ← add this
    console.log('Project ID being used:', taskToProcess?.projectId?._id); // ← add this

    const pId = taskToProcess?.projectId?._id;
    if (!pId) {
      Alert.alert("Error", "Task has no project association – cannot archive/delete");
      return;
    }

    const endpoint =
      type === "delete"
        ? `/${pId}/tasks/${taskId}`
        : `/${pId}/tasks/${taskId}/archive`;

    const method = type === "delete" ? "DELETE" : "PATCH";

    console.log(`Sending ${method} to: ${API_BASE_URL}${endpoint}`); // ← crucial debug

    const res = await api(endpoint, token, { method });

    if (res.success) {  // ← note: your backend returns { success: true, message }
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      Alert.alert("Success", type === "delete" ? "Task deleted" : "Task archived");
    } else {
      throw new Error(res.error || "Action failed");
    }
  } catch (err) {
    console.error(`Error during ${type}:`, err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    Alert.alert("Error", `Failed to ${type} task: ${errorMessage}`);
  }
};

  const handleArchive = (taskId: string) => {
    Alert.alert("Archive Task", "Move this task to your archives?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        onPress: () => performAction(taskId, "archive"),
      },
    ]);
  };

  useEffect(() => {
    const fetchMyTasks = async () => {
      try {
        const token = await getToken();
        const res = await api("/tasks/my-tasks", token);
        setTasks(res.data || []); // Fixed: Access the tasks array directly
      } catch (err) {
        console.error("Failed to load my work", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTasks();
  }, [getToken]);

  return (
    <LinearGradient
      colors={["#0f172a", "#1e293b", "#0f172a"]}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <ScrollView className="px-6 pt-6">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-3xl font-black text-white">My Work</Text>
            <TouchableOpacity
              onPress={() => router.push("/create-task")}
              className="bg-blue-600 p-3 rounded-xl"
            >
              <Feather name="plus" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="white" />
          ) : tasks.length === 0 ? (
            <View className="mt-20 items-center">
              <Text className="text-slate-400 text-sm">
                No assigned tasks yet.
              </Text>
            </View>
          ) : (
            <View className="space-y-4 mb-10">
              {tasks.map((task) => (
                <View
                  key={task._id}
                  className="bg-slate-800/50 border mb-5 border-slate-700 rounded-2xl p-5"
                >
                  {/* Top Row: Title & Icons */}
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 mr-4">
                      <Text className="text-white font-bold text-lg leading-6">
                        {task.title}
                      </Text>
                      {task.projectId && (
                        <Text className="text-slate-400 text-xs mt-1">
                          {task.projectId.name}
                        </Text>
                      )}
                    </View>

                    {/* Action Buttons Grouped Top-Right */}
                    <View className="flex-row gap-5 items-center space-x-3 bg-slate-900/50 p-2 rounded-lg">
                      <TouchableOpacity
                        onPress={() => handleArchive(task._id)}
                        hitSlop={10}
                      >
                        <Feather name="archive" size={18} color="#94a3b8" />
                      </TouchableOpacity>
                      <View className="w-[1px] h-4 bg-slate-700" />{" "}
                      {/* Tiny separator */}
                      <TouchableOpacity
                        onPress={() => confirmDelete(task._id)}
                        hitSlop={10}
                      >
                        <Feather name="trash-2" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Bottom Row: Status & Priority */}
                  <View className="flex-row justify-between mt-6 pt-4 border-t border-slate-700/50">
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                      <Text className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                        {task.status}
                      </Text>
                    </View>
                    <View className="bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                      <Text className="text-[10px] font-bold text-blue-400 uppercase">
                        {task.priority}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
