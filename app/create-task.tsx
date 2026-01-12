import { api } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateTaskScreen() {
  const { projectId, taskId } = useLocalSearchParams<{
    projectId: string;
    taskId: string;
  }>();
  const [currentProjectName, setCurrentProjectName] = useState("");
  const isEditMode = !!taskId;
  const { getToken } = useAuth();
  const [projects, setProjects] = useState<{ _id: string; name: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = await getToken();
        const res = await api("/projects", token); // ← ADD /api HERE
        // Backend returns { success: true, data: [...] }
        const projectData = res.data?.data || res.data || [];

        setProjects(projectData);

        if (projectData.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projectData[0]._id);
        }
      } catch (err: any) {
        console.error("Task Module: Failed to sync parent projects", err);
        Alert.alert(
          "Sync Failed",
          "Unable to load projects. Check your connection and try again."
        );
      }
    };

    fetchProjects();
  }, [getToken]);

  useEffect(() => {
    if (isEditMode) {
      const fetchTaskForEdit = async () => {
        try {
          const token = await getToken();
          const res = await api(`/tasks/${projectId}/tasks/${taskId}`, token);

          if (res.data) {
            setTitle(res.data.title);
            setDescription(res.data.description || "");
            setPriority(res.data.priority);
            setCurrentProjectName(
              res.data.projectId?.name || "Unknown Project"
            );
            // Set other fields like assignees here
          }
        } catch (err) {
          Alert.alert("Error", "Failed to load task for editing");
        }
      };
      fetchTaskForEdit();
    }
  }, [taskId]);

  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert("Error", "Title is required");
    // Only require a project selection if we are NOT in edit mode
    // (because in edit mode, the project is already established)
    if (!isEditMode && !selectedProjectId)
      return Alert.alert("Error", "Please select a project");

    setLoading(true);
    try {
      const token = await getToken();
      const payload = {
        title: title.trim(),
        description: description.trim(),
        priority,
      };

      // Use selectedProjectId for NEW tasks, or the projectId from params for EDITS
      const targetProjectId = isEditMode ? projectId : selectedProjectId;
      const endpoint = isEditMode
        ? `/tasks/${targetProjectId}/tasks/${taskId}`
        : `/tasks/${targetProjectId}/tasks`;

      const method = isEditMode ? "PUT" : "POST";

      const res = await api(endpoint, token, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.success) {
        if (isEditMode) {
          router.back();
        } else {
          Alert.alert("Success", "Task deployed", [
            { text: "OK", onPress: () => router.back() },
          ]);
        }
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        `Failed to ${isEditMode ? "update" : "deploy"} task`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#0f172a", "#1e293b", "#0f172a"]}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 px-8 pt-6"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-10">
              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700"
              >
                <Ionicons name="chevron-back" size={24} color="#94a3b8" />
              </TouchableOpacity>
              <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[4px]">
                Task.Initialization
              </Text>
              <View className="w-12" />
            </View>

            <View className="mb-10">
              <Text className="text-4xl font-black text-white tracking-tight">
                {isEditMode ? "Edit Task" : "New Task"}
              </Text>
              <Text className="text-slate-400 mt-2 font-medium">
                Create a tactical action item.
              </Text>
            </View>

            <View className="space-y-8 pb-10">
              {/* Parent Project Selection */}
              {/* <View>
                <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 ml-1">
                  Parent Project Node
                </Text>
                <View className="flex-row flex-wrap">
                  {projects.length === 0 ? (
                    <View className="bg-slate-800/20 border border-dashed border-slate-700 p-4 rounded-2xl w-full">
                      <Text className="text-slate-500 text-xs italic">
                        No projects detected in ecosystem.
                      </Text>
                    </View>
                  ) : (
                    projects.map((proj) => (
                      <TouchableOpacity
                        key={proj._id}
                        onPress={() => setSelectedProjectId(proj._id)}
                        className={`mr-3 mb-3 px-5 py-3 rounded-2xl border ${
                          selectedProjectId === proj._id
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-slate-700 bg-slate-800/40"
                        }`}
                      >
                        <Text
                          className={`font-bold text-sm ${
                            selectedProjectId === proj._id
                              ? "text-blue-400"
                              : "text-slate-400"
                          }`}
                        >
                          {proj.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View> */}

              {/* Parent Project Selection - Hidden in Edit Mode */}
              {!isEditMode && (
                <View>
                  <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 ml-1">
                    Parent Project Node
                  </Text>
                  <View className="flex-row flex-wrap">
                    {projects.length === 0 ? (
                      <View className="bg-slate-800/20 border border-dashed border-slate-700 p-4 rounded-2xl w-full">
                        <Text className="text-slate-500 text-xs italic">
                          No projects detected in ecosystem.
                        </Text>
                      </View>
                    ) : (
                      projects.map((proj) => (
                        <TouchableOpacity
                          key={proj._id}
                          onPress={() => setSelectedProjectId(proj._id)}
                          className={`mr-3 mb-3 px-5 py-3 rounded-2xl border ${
                            selectedProjectId === proj._id
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-slate-700 bg-slate-800/40"
                          }`}
                        >
                          <Text
                            className={`font-bold text-sm ${
                              selectedProjectId === proj._id
                                ? "text-blue-400"
                                : "text-slate-400"
                            }`}
                          >
                            {proj.name}
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                </View>
              )}

              {/* Project Context - Shown ONLY in Edit Mode */}
              {isEditMode && currentProjectName && (
                <View className="mb-6 bg-blue-500/5 border border-blue-500/20 p-4 rounded-2xl flex-row items-center justify-between">
                  <View>
                    <Text className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">
                      Current Project Node
                    </Text>
                    <Text className="text-white text-lg font-bold">
                      {currentProjectName}
                    </Text>
                  </View>
                  <Ionicons
                    name="lock-closed"
                    size={20}
                    color="#60a5fa"
                    opacity={0.5}
                  />
                </View>
              )}
              {/* Task Title */}
              <View>
                <Text className="text-slate-500 text-[10px] mt-5 font-black uppercase tracking-widest mb-3 ml-1">
                  Action Item Title
                </Text>
                <TextInput
                  className="bg-slate-800/40 rounded-2xl px-6 py-5 text-white text-lg border border-slate-700/50"
                  placeholder="e.g. REVIEW API DOCUMENTATION"
                  placeholderTextColor="#475569"
                  value={title}
                  onChangeText={setTitle}
                  autoFocus={true}
                />
              </View>

              {/* Task Description (Optional) */}
              <View>
                <Text className="text-slate-500 text-[10px] mt-5 font-black uppercase tracking-widest mb-3 ml-1">
                  Description (Optional)
                </Text>
                <TextInput
                  className="bg-slate-800/40 rounded-2xl px-6 py-5 text-white text-base border border-slate-700/50 min-h-[120px]"
                  placeholder="Add context, requirements, or notes..."
                  placeholderTextColor="#475569"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit} // Use the new unified function
                disabled={loading}
                activeOpacity={0.8}
                className="mt-6 overflow-hidden rounded-2xl"
              >
                <LinearGradient
                  colors={
                    isEditMode ? ["#60a5fa", "#2563eb"] : ["#3b82f6", "#1d4ed8"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-5 flex-row justify-center items-center"
                >
                  <Text className="text-white text-center text-lg font-black uppercase tracking-widest mr-2">
                    {loading
                      ? "Processing..."
                      : isEditMode
                        ? "Update Task"
                        : "Deploy Task"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              {/* System Info */}
              <View className="items-center mt-10">
                <Text className="text-slate-600 text-[10px] font-bold tracking-tight">
                  PRIORITY: NORMAL • STATUS: OPEN • ENCRYPTED
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
