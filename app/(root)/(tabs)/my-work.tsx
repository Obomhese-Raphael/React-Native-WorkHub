import { api } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Task = {
  _id: string;
  title: string;
  status: "open" | "in-progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  project?: {
    _id: string;
    name: string;
  };
};

export default function MyWorkScreen() {
  const { getToken } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {  
    const fetchMyTasks = async () => {
      try {
        const token = await getToken();
        const res = await api("/tasks/my-tasks", token);
        setTasks(res.data?.data || []);
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
            <Text className="text-3xl font-black text-white">
              My Work
            </Text>
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
            <View className="space-y-4">
              {tasks.map((task) => (
                <TouchableOpacity
                  key={task._id}
                  className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5"
                >
                  <Text className="text-white font-bold text-lg">
                    {task.title}
                  </Text>

                  {task.project && (
                    <Text className="text-slate-400 text-xs mt-1">
                      {task.project.name}
                    </Text>
                  )}

                  <View className="flex-row justify-between mt-4">
                    <Text className="text-xs uppercase tracking-widest text-slate-500">
                      {task.status}
                    </Text>
                    <Text className="text-xs font-bold text-blue-400">
                      {task.priority}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
