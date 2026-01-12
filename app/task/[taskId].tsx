import { api } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
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
    title?: string;
  };
  assignees: Array<{
    userId: string;
    name: string;
    email: string;
  }>;
  createdAt: string;
};

export default function TaskDetailScreen() {
  const selectedDateRef = useRef<string | null>(null);
  const { taskId, projectId } = useLocalSearchParams<{
    taskId: string;
    projectId: string;
  }>();
  const { getToken } = useAuth();
  const router = useRouter();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // useEffect(() => {
  //   const fetchTask = async () => {
  //     if (!taskId || !projectId) {
  //       Alert.alert("Error", "Missing task or project ID");
  //       setLoading(false);
  //       return;
  //     }
  //     try {
  //       const token = await getToken();
  //       const res = await api(`/tasks/${projectId}/tasks/${taskId}`, token);
  //       setTask(res.data); // adjust based on your API response shape
  //     } catch (err) {
  //       console.error("Failed to load task", err);
  //       Alert.alert("Error", "Could not load task details");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchTask();
  // }, [taskId, getToken]);

  // // This ensures the data refreshes every time you navigate back to this screen
  // useFocusEffect(
  //   useCallback(() => {
  //     fetchTask(); // Make sure your fetchTask function is defined outside of the original useEffect so it can be called here
  //   }, [taskId])
  // );

  // 1. Define fetchTask outside with useCallback
  const fetchTask = useCallback(async () => {
    if (!taskId || !projectId) {
      setLoading(false);
      return;
    }
    try {
      const token = await getToken();
      const res = await api(`/tasks/${projectId}/tasks/${taskId}`, token);
      setTask(res.data);
    } catch (err) {
      console.error("Failed to load task", err);
      Alert.alert("Error", "Could not load task details");
    } finally {
      setLoading(false);
    }
  }, [taskId, projectId, getToken]);

  // 2. Trigger on initial mount
  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  // 3. Trigger every time the user navigates back to this screen
  useFocusEffect(
    useCallback(() => {
      fetchTask();
    }, [fetchTask])
  );

  const onDateChange = async (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    // Close the picker only on confirmation or dismissal
    if (event.type === "set" || event.type === "dismissed") {
      setShowDatePicker(false);
    }

    // If dismissed or no date selected, do nothing
    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    // Update local state immediately for snappy UI
    const dateString = selectedDate.toISOString();
    setTask((prev) => (prev ? { ...prev, dueDate: dateString } : null));

    // Fire and forget the API call
    setUpdating(true);
    try {
      const token = await getToken();
      const res = await api(`/tasks/${projectId}/tasks/${taskId}`, token, {
        method: "PUT",
        body: JSON.stringify({ dueDate: dateString }),
      });
      console.log("Due date update response:", res);

      if (!res.success) {
        throw new Error("Failed to save");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to save due date to server");
      // Optional: Rollback on failure
      // setTask((prev) => (prev ? { ...prev, dueDate: originalDueDate } : null));
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const clearDate = async () => {
    setUpdating(true);
    try {
      const token = await getToken();
      const res = await api(`/tasks/${projectId}/tasks/${taskId}`, token, {
        method: "PUT",
        body: JSON.stringify({ dueDate: null }),
      });
      if (res.success) {
        setTask((prev) => (prev ? { ...prev, dueDate: undefined } : null));
      }
    } catch (err) {
      Alert.alert("Error", "Failed to clear date");
    } finally {
      setUpdating(false);
    }
  };

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
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/create-task",
                  params: {
                    taskId: task._id,
                    projectId: projectId,
                  },
                })
              }
            >
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
          <Text className="text-blue-400 text-2xl uppercase mb-6">
            {task.projectId.name || task.projectId.title}
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

          {/* Assignees */}
          {task.assignees?.length > 0 && (
            <>
              <Text className="text-slate-400 mb-2">Assignees</Text>
              <View className="flex-row flex-wrap gap-3 mb-8">
                {task.assignees.map((a) => (
                  <View
                    key={a.userId}
                    className="flex-row items-center bg-slate-800/60 px-4 py-2 rounded-full border border-slate-700"
                  >
                    <View className="w-8 h-8 rounded-full bg-indigo-600 items-center justify-center mr-2">
                      <Text className="text-white font-bold">
                        {a.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text className="text-white text-sm font-medium">
                      {a.name}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Created At */}
          <Text className="text-slate-400 mb-2">Created at: </Text>
          <Text className="text-white mb-6">{formatDate(task.createdAt)}</Text>

          {/* Due Date Section */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-slate-400">Due Date</Text>
              <View className="flex-row gap-4">
                {task.dueDate && (
                  <TouchableOpacity onPress={clearDate}>
                    <Text className="text-red-400 text-sm font-bold">
                      Clear
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                  <Text className="text-blue-400 text-sm font-bold">
                    {task.dueDate ? "Change" : "Add"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {task.dueDate ? (
              <View className="flex-row items-center bg-slate-800/40 p-4 rounded-2xl border border-slate-700">
                <View className="bg-red-500/20 p-2 rounded-lg mr-3">
                  <Feather name="calendar" size={18} color="#f87171" />
                </View>
                <Text className="text-white text-lg font-semibold">
                  {formatDate(task.dueDate)}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center justify-center bg-slate-800/20 border border-dashed border-slate-700 p-6 rounded-2xl"
              >
                <Feather
                  name="plus"
                  size={20}
                  color="#94a3b8"
                  className="mr-2"
                />
                <Text className="text-slate-400 font-medium">
                  Set a Deadline
                </Text>
              </TouchableOpacity>
            )}

            {showDatePicker && (
              <DateTimePicker
                // Use the existing date if it exists, otherwise use the start of today
                value={
                  task.dueDate
                    ? new Date(task.dueDate)
                    : new Date(new Date().setHours(0, 0, 0, 0))
                }
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onDateChange}
                // Normalize minimumDate to the very start of today
                minimumDate={new Date(new Date().setHours(0, 0, 0, 0))}
              />
            )}
          </View>

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
