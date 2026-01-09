import { useRefresh } from "@/context/RefreshContext";
import { api } from "@/lib/api";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
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

export default function CreateTeamScreen() {
  const { getToken } = useAuth();
  const { triggerRefresh } = useRefresh();
  const { user } = useUser();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-defined official colors for teams
  const teamColors = [
    "#6366f1",
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
  ];
  const [selectedColor, setSelectedColor] = useState(teamColors[0]);

  const handleCreate = async () => {
    if (!name.trim())
      return Alert.alert(
        "Required",
        "Please enter a designation for this team."
      );

    setLoading(true);
    try {
      const token = await getToken();
      const response = await api("/teams", token, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || "No description provided.",
          color: selectedColor,
          createdBy: user?.id,
        }),
      });

      Alert.alert("Success", "New team initialized.", [
        {
          text: "Proceed",
          onPress: () => {
            triggerRefresh(); // ← ADD THIS
            router.back();
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert("System Error", err.message || "Failed to create team");
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
            {/* --- Navigation Header --- */}
            <View className="flex-row items-center justify-between mb-10">
              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700"
              >
                <Ionicons name="chevron-back" size={24} color="#94a3b8" />
              </TouchableOpacity>
              <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[4px]">
                Deployment.Manager
              </Text>
              <View className="w-12" /> {/* Spacer for balance */}
            </View>

            <View className="mb-10">
              <Text className="text-4xl font-black text-white tracking-tight">
                Create Team
              </Text>
              <Text className="text-slate-400 mt-2 font-medium">
                Establish a new high-performance workspace.
              </Text>
            </View>

            {/* --- Form Fields --- */}
            <View className="space-y-8">
              {/* Name Input */}
              <View>
                <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3 ml-1">
                  Team Designation
                </Text>
                <TextInput
                  className="bg-slate-800/40 rounded-2xl px-6 py-5 text-white text-lg border border-slate-700/50"
                  placeholder="e.g. ALPHA SQUAD"
                  placeholderTextColor="#475569"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Description Input */}
              <View>
                <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3 ml-1 mt-4">
                  Mission Objective (Optional)
                </Text>
                <TextInput
                  className="bg-slate-800/40 rounded-2xl px-6 py-5 text-white text-base border border-slate-700/50 min-h-[120px]"
                  placeholder="Define the team's core purpose..."
                  placeholderTextColor="#475569"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Color Selection */}
              <View>
                <Text className="text-slate-500 text-[10px] mt-4 font-black uppercase tracking-widest mb-4 ml-1">
                  Identity Accent
                </Text>
                <View className="flex-row justify-between">
                  {teamColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setSelectedColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-10 h-10 rounded-full border-4 ${selectedColor === color ? "border-white" : "border-transparent"}`}
                    />
                  ))}
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                onPress={handleCreate}
                disabled={loading}
                activeOpacity={0.8}
                className="mt-6 overflow-hidden rounded-2xl"
              >
                <LinearGradient
                  colors={["#4f46e5", "#3730a3"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 20,
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 18,
                          fontWeight: "800",
                          textTransform: "uppercase",
                          marginRight: 8,
                        }}
                      >
                        Initialize Team
                      </Text>
                      <Feather name="zap" size={20} color="white" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Safety Note */}
              <Text className="text-slate-600 text-[10px] mt-10 text-center font-bold tracking-tight">
                SECURE DATA TRANSMISSION ENCRYPTED VIA CLERK_AUTH
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
