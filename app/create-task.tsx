// app/create-task.tsx
import { api } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

const priorities = [
  { label: "Urgent", value: "urgent", color: "#ef4444" },
  { label: "High", value: "high", color: "#f97316" },
  { label: "Medium", value: "medium", color: "#eab308" },
  { label: "Low", value: "low", color: "#22c55e" },
];

export default function CreateTaskScreen() {
  const { getToken } = useAuth();

  const [projects, setProjects] = useState<{ _id: string; name: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("medium");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = await getToken();
        const res = await api("/projects", token);
        const projectData = res.data?.data || res.data || [];

        setProjects(projectData);

        // ← ONLY set default if nothing is selected yet
        if (projectData.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projectData[0]._id);
        }
      } catch (err: any) {
        console.error("Task Module: Failed to sync parent projects", err);
        Alert.alert("Sync Failed", "Unable to load projects.");
      }
    };

    fetchProjects();
  }, [getToken, selectedProjectId]); // ← Add selectedProjectId as dependency
  
  const handleCreate = async () => {
    if (!title.trim()) {
      return Alert.alert("Required", "Task title cannot be empty.");
    }
    if (!selectedProjectId) {
      return Alert.alert("Missing Node", "Please select a parent project.");
    }

    setLoading(true);
    try {
      const token = await getToken();
      await api(`/tasks/${selectedProjectId}/tasks`, token, {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          priority: selectedPriority, // ← Now sent to backend
        }),
      });

      Alert.alert("Task Deployed", "Action item added to project queue.", [
        { text: "Acknowledge", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Critical Error", err.message || "Failed to deploy task");
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
                Task.Deployment
              </Text>
              <View className="w-12" />
            </View>

            <View className="mb-10">
              <Text className="text-4xl font-black text-white tracking-tight">
                New Task
              </Text>
              <Text className="text-slate-400 mt-2 font-medium">
                Deploy a tactical action item.
              </Text>
            </View>

            <View className="space-y-8 pb-10">
              {/* Parent Project Selection */}
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
                        className={`mr-3 mb-3 px-6 py-3 rounded-2xl border ${
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

              {/* Task Title */}
              <View>
                <Text className="text-slate-500 mt-5 text-[10px] font-black uppercase tracking-widest mb-3 ml-1">
                  Action Item Title
                </Text>
                <TextInput
                  className="bg-slate-800/40 rounded-2xl px-6 py-5 text-white text-lg border border-slate-700/50"
                  placeholder="e.g. REVIEW API DOCUMENTATION"
                  placeholderTextColor="#475569"
                  value={title}
                  onChangeText={setTitle}
                  autoFocus
                />
              </View>

              {/* Priority Level Selector */}
              <View>
                <Text className="text-slate-400 mt-5 text-xs uppercase tracking-widest font-black mb-4 ml-1">
                  Priority Level
                </Text>
                <View className="flex-row flex-wrap justify-between gap-3">
                  {priorities.map((p) => (
                    <TouchableOpacity
                      key={p.value}
                      onPress={() => setSelectedPriority(p.value)}
                      className={`
                        flex-1 py-5 rounded-xl border-2 items-center
                        ${
                          selectedPriority === p.value
                            ? "border-white bg-white/10 shadow-lg"
                            : "border-slate-700 bg-slate-800/50"
                        }
                      `}
                      activeOpacity={0.8}
                    >
                      <Text
                        className="text-sm font-black uppercase tracking-wider"
                        style={{ color: p.color }}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleCreate}
                disabled={loading}
                className="overflow-hidden rounded-2xl mt-8"
              >
                <LinearGradient
                  colors={["#3b82f6", "#1d4ed8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-6 flex-row justify-center items-center"
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text className="text-white text-xl font-black uppercase tracking-widest mr-3">
                        Deploy Task
                      </Text>
                      <Feather name="zap" size={24} color="white" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* System Info */}
              <View className="items-center mt-12">
                <Text className="text-slate-600 text-[10px] font-bold tracking-tight uppercase">
                  Status: Open • Encrypted Transmission
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
