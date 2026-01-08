import { api } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateProjectScreen() {
  const { getToken } = useAuth();
  const [teams, setTeams] = useState<{ _id: string; name: string; color?: string }[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const token = await getToken();
        const res = await api("/teams", token);
        const teamData = res.data || [];
        setTeams(teamData);
        if (teamData.length > 0) setSelectedTeamId(teamData[0]._id);
      } catch (err) {
        console.error("Failed to sync teams:", err);
      }
    };
    fetchTeams();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return Alert.alert("Required", "Project nomenclature is required.");
    if (!selectedTeamId) return Alert.alert("Selection Required", "Please assign this project to a team node.");

    setLoading(true);
    try {
      const token = await getToken();
      await api(`/projects/team/${selectedTeamId}`, token, {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });
      Alert.alert("Success", "Project initialized in database.", [
        { text: "Confirm", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("System Error", err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0f172a", "#1e293b", "#0f172a"]} className="flex-1">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          className="flex-1"
        >
          <ScrollView className="flex-1 px-8 pt-6" showsVerticalScrollIndicator={false}>
            
            {/* Header */}
            <View className="flex-row items-center justify-between mb-10">
              <TouchableOpacity 
                onPress={() => router.back()}
                className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700"
              >
                <Ionicons name="chevron-back" size={24} color="#94a3b8" />
              </TouchableOpacity>
              <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[4px]">
                Project.Provisioning
              </Text>
              <View className="w-12" />
            </View>

            <View className="mb-10">
              <Text className="text-4xl font-black text-white tracking-tight">New Project</Text>
              <Text className="text-slate-400 mt-2 font-medium">Define parameters for a new team initiative.</Text>
            </View>

            <View className="space-y-8 pb-10">
              {/* Team Selection */}
              <View>
                <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 ml-1">
                  Assign to Team Node
                </Text>
                <View className="flex-row flex-wrap">
                  {teams.length === 0 ? (
                    <Text className="text-slate-600 italic">No teams available. Create a team first.</Text>
                  ) : (
                    teams.map((team) => (
                      <TouchableOpacity
                        key={team._id}
                        onPress={() => setSelectedTeamId(team._id)}
                        className={`mr-3 mb-3 px-5 py-3 rounded-2xl border ${
                          selectedTeamId === team._id 
                            ? "border-emerald-500 bg-emerald-500/10" 
                            : "border-slate-700 bg-slate-800/40"
                        }`}
                      >
                        <Text className={`font-bold text-sm ${
                          selectedTeamId === team._id ? "text-emerald-400" : "text-slate-400"
                        }`}>
                          {team.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>

              {/* Project Name */}
              <View>
                <Text className="text-slate-500 text-[10px] mt-5 font-black uppercase tracking-widest mb-3 ml-1">
                  Project Title
                </Text>
                <TextInput
                  className="bg-slate-800/40 rounded-2xl px-6 py-5 text-white text-lg border border-slate-700/50"
                  placeholder="e.g. Q1 INFRASTRUCTURE REBUILD"
                  placeholderTextColor="#475569"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Description */}
              <View>
                <Text className="text-slate-500 text-[10px] mt-5 font-black uppercase tracking-widest mb-3 ml-1">
                  Scope of Work
                </Text>
                <TextInput
                  className="bg-slate-800/40 rounded-2xl px-6 py-5 text-white text-base border border-slate-700/50 min-h-[120px]"
                  placeholder="Describe the primary objectives..."
                  placeholderTextColor="#475569"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleCreate}
                disabled={loading}
                activeOpacity={0.8}
                className="mt-4 overflow-hidden rounded-2xl"
              >
                <LinearGradient
                  colors={["#10b981", "#065f46"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-5 flex-row justify-center items-center"
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text className="text-white text-center text-lg font-black uppercase tracking-widest mr-2">
                        Launch Project
                      </Text>
                      <Feather name="layers" size={20} color="white" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <Text className="text-slate-600 text-[10px] text-center mt-10 font-bold tracking-tight">
                AUTHORIZED PERSONNEL ONLY • ENCRYPTED UPLOAD
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}