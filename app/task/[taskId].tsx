import { api } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { Feather, Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

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
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]); // { userId, name, email }
  const [addingAssignee, setAddingAssignee] = useState(false);

  // const fetchTask = useCallback(async () => {
  //   if (!taskId || !projectId) {
  //     setLoading(false);
  //     return;
  //   }
  //   try {
  //     const token = await getToken();
  //     // console.log(
  //     //   "Token from getToken():",
  //     //   token ? "Valid token" : "NULL/UNDEFINED TOKEN"
  //     // );

  //     if (!token) {
  //       throw new Error("No auth token available");
  //     }
  //     const res = await api(`/tasks/${projectId}/tasks/${taskId}`, token);
  //     // console.log("Fetched task data:", res.data);
  //     setTask(res.data);

  //     // Team Members Fetch
  //     const projectIdFromTask = res.data.projectId?._id;
  //     if (projectIdFromTask) {
  //       try {
  //         // Fetch project to get teamId
  //         const projectRes = await api(`/projects/${projectIdFromTask}`, token);
  //         const teamId = projectRes.data?.teamId;

  //         if (teamId) {
  //           // console.log(
  //           //   "Fetching team members with token:",
  //           //   token.substring(0, 20) + "..."
  //           // );
  //           // Fetch team members (your /teams/:id endpoint)
  //           const teamRes = await api(`/teams/${teamId}`, token);
  //           setTeamMembers(teamRes.data?.members || []);
  //         }
  //       } catch (err) {
  //         console.log("Failed to load team members for assignee picker", err);
  //       }
  //     }
  //   } catch (err) {
  //     console.error("Authentication Issues", err);
  //     Alert.alert(
  //       "Authentication Issue",
  //       "Could not load data - please sign out and sign back in, or check your internet connection."
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [taskId, projectId, getToken]);

  // Trigger every time the user navigates back to this screen

  const fetchTask = useCallback(async () => {
    if (!taskId || !projectId) {
      setLoading(false);
      return;
    }

    try {
      // Force fresh token with forceRefresh: true
      const token = await getToken();
      console.log("Fresh token for fetchTask:", token ? "VALID" : "NULL");

      if (!token) {
        Alert.alert("Session Expired", "Please sign in again to continue.");
        return;
      }

      const res = await api(`/tasks/${projectId}/tasks/${taskId}`, token);
      console.log("Fetched task data in fetchTask:", res.data);
      setTask(res.data);

      // Team fetch with same fresh token
      const projectIdFromTask = res.data.projectId?._id;
      if (projectIdFromTask) {
        const projectRes = await api(`/projects/${projectIdFromTask}`, token);
        const teamId = projectRes.data?.teamId;

        if (teamId) {
          const teamRes = await api(`/teams/${teamId}`, token);
          setTeamMembers(teamRes.data?.members || []);
        }
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      if (
        err.message.includes("authentication") ||
        err.message.includes("401")
      ) {
        Alert.alert(
          "Session Issue",
          "Authentication failed - try signing out/in."
        );
      } else {
        Alert.alert("Error", "Could not load task data");
      }
    } finally {
      setLoading(false);
    }
  }, [taskId, projectId]);

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

  const handleAssignMember = async (member: { userId: any }) => {
    console.log("Assigning member:", member);
    if (!task || addingAssignee) return;

    setAddingAssignee(true);

    try {
      const token = await getToken();
      const res = await api(
        `/tasks/${projectId}/tasks/${taskId}/assignees`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            userId: member.userId,
            // email/name optional — backend can resolve
          }),
        }
      );
      console.log("Assign member response:", res.data);

      if (res.success) {
        console.log("Assign successful, refetching task...");
        // Refresh task
        fetchTask();
        console.log("Task after refetch:", task); // Log the updated task
        Toast.show({ type: "success", text1: "Assignee added" });
        setShowAssigneeModal(false);
      } else {
        console.log("Assign failed with response:", res);
      }
    } catch (err: any) {
      console.error("Error assigning member:", err);
      Toast.show({
        type: "error",
        text1: "Failed to assign",
        text2: err.message || "Try again",
      });
    } finally {
      setAddingAssignee(false);
    }
  };

  const confirmRemoveAssignee = (assignee: {
    userId: any;
    name: any;
    email?: string;
  }) => {
    Alert.alert("Remove Assignee", `Remove ${assignee.name} from this task?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await getToken();
            await api(
              `/tasks/${projectId}/tasks/${taskId}/assignees/${assignee.userId}`,
              token,
              { method: "DELETE" }
            );
            fetchTask(); // refresh
            Toast.show({ type: "success", text1: "Assignee removed" });
          } catch (err) {
            Toast.show({ type: "error", text1: "Failed to remove" });
          }
        },
      },
    ]);
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

          {/* Assignees Section */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-slate-400 text-base font-medium">
                Assignees
              </Text>

              {/* Show add button only if user can edit task/project */}
              <TouchableOpacity
                onPress={() => setShowAssigneeModal(true)}
                className="bg-blue-600/30 px-4 py-1.5 rounded-full flex-row items-center"
              >
                <Ionicons name="person-add-outline" size={16} color="#60a5fa" />
                <Text className="text-blue-400 text-sm font-medium ml-2">
                  Add
                </Text>
              </TouchableOpacity>
            </View>

            {task.assignees?.length === 0 ? (
              <Text className="text-slate-500 italic text-center py-4">
                No assignees yet — add team members
              </Text>
            ) : (
              <View className="flex-row flex-wrap gap-3">
                {task.assignees.map((a) => (
                  <View
                    key={a.userId}
                    className="flex-row items-center bg-slate-800/60 px-4 py-2 rounded-full border border-slate-700"
                  >
                    <View className="w-8 h-8 rounded-full bg-indigo-600/40 items-center justify-center mr-2">
                      <Text className="text-indigo-300 text-sm font-bold">
                        {a.name?.charAt(0)?.toUpperCase() || "?"}
                      </Text>
                    </View>
                    <Text className="text-white text-sm font-medium">
                      {a.name}
                    </Text>

                    {/* Remove button - only if user can edit */}
                    <TouchableOpacity
                      onPress={() => confirmRemoveAssignee(a)}
                      className="ml-2 p-1"
                    >
                      <Ionicons name="close" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
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

          <Modal
            visible={showAssigneeModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowAssigneeModal(false)}
          >
            <View className="flex-1 justify-center items-center bg-black/70">
              <View className="bg-slate-900 rounded-3xl p-6 w-[92%] max-w-md border border-slate-700">
                <Text className="text-white text-2xl font-black mb-2">
                  Assign Team Member
                </Text>
                <Text className="text-slate-400 mb-6">
                  Select from team members
                </Text>

                {teamMembers.length === 0 ? (
                  <View className="py-8 items-center">
                    <ActivityIndicator size="small" color="#60a5fa" />
                    <Text className="text-slate-500 mt-4">
                      Loading team members...
                    </Text>
                  </View>
                ) : (
                  <ScrollView className="max-h-80">
                    {teamMembers.map((m) => (
                      <TouchableOpacity
                        key={m.userId}
                        onPress={() => handleAssignMember(m)}
                        className="flex-row items-center py-4 border-b border-slate-800 last:border-b-0"
                      >
                        <View className="w-10 h-10 rounded-full bg-indigo-600/30 items-center justify-center mr-3">
                          <Text className="text-indigo-300 font-bold">
                            {(m.name?.[0] || "?").toUpperCase()}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-white font-medium">
                            {m.name}
                          </Text>
                          <Text className="text-slate-400 text-sm">
                            {m.email}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                <TouchableOpacity
                  onPress={() => setShowAssigneeModal(false)}
                  className="mt-6 py-3 bg-slate-800 rounded-2xl items-center"
                >
                  <Text className="text-slate-300 font-medium">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
