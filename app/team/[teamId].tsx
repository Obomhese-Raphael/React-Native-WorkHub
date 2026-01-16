// app/team/[teamId].tsx
import { api } from "@/lib/api";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

interface Team {
  _id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  members: { userId: string; name: string; email: string; role: string }[];
  projects: any[]; // or define proper Project type
}

interface Project {
  _id: string;
  name: string;
  description?: string;
  color?: string;
  tasks: { isActive: boolean }[];
}

export default function TeamDetailsScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const { getToken } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  // const [newMemberEmail, setNewMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const { user } = useUser();

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const activeTaskCount = (project: Project) =>
    project.tasks?.filter((t) => t.isActive).length || 0;

  const fetchTeam = async () => {
    if (!teamId) return;
    try {
      const token = await getToken();
      console.log("Token fetched for team data:", token);
      // Use your existing endpoint that returns team + projects
      const res = await api(`/projects/team/${teamId}`, token); // This returns projects
      const projectsRes = res.data || [];

      // Fetch team separately for full details
      const teamRes = await api(`/teams/${teamId}`, token);
      teamRes.data.isAdmin === true ? setIsAdmin(true) : setIsAdmin(false);
      setTeam({ ...teamRes.data, projects: projectsRes });
    } catch (err) {
      console.error("Failed to load team data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  const handleDeleteProject = (projectId: string, projectName: string) => {
    Alert.alert(
      "Delete Project",
      `Are you sure you want to delete "${projectName}"?\n\nThis will archive the project and all its tasks. This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              const teamId = team?._id; // from your team state

              const res = await api(
                `/projects/team/${teamId}/${projectId}`,
                token,
                {
                  method: "DELETE",
                }
              );

              if (res.success) {
                // Optimistic update: remove from local list
                if (team) {
                  // Guard against null
                  setTeam({
                    ...team, // Now TypeScript knows team is Team (not null)
                    projects: team.projects.filter((p) => p._id !== projectId),
                  });
                }
                Alert.alert("Success", `${projectName} deleted`);
              } else {
                throw new Error(res.error || "Failed to delete project");
              }
            } catch (err: any) {
              console.error("Delete project failed:", err);
              Alert.alert("Error", `Failed to delete project\n${err.message}`);
            }
          },
        },
      ]
    );
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return;

    setAddingMember(true);

    try {
      const token = await getToken();
      const res = await api(`/teams/${teamId}/invites`, token, {
        method: "POST",
        body: JSON.stringify({
          email: newMemberEmail.trim(),
          role: "member",
        }),
      });

      if (res.success) {
        Alert.alert("Success 🎉", "New member added successfully", [
          {
            text: "OK",
            onPress: async () => {
              await fetchTeam(); // reload team
              setShowAddMemberModal(false);
              setNewMemberEmail("");
            },
          },
        ]);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to add member. Try again.");
    } finally {
      setAddingMember(false);
    }
  };

  // const confirmRemoveMember = (member: {
  //   userId?: string;
  //   name?: string;
  //   email?: string;
  // }) => {
  //   if (!member.userId) {
  //     Alert.alert(
  //       "Pending Invite",
  //       "This is a pending invitation (no userId yet). You can only remove active members.\n\nTo revoke, delete the invite from Clerk dashboard for now.",
  //       [{ text: "OK" }]
  //     );
  //     return;
  //   }

  //   Alert.alert(
  //     "Remove Member",
  //     `Remove ${member.name || member.email} from ${team?.name}?`,
  //     [
  //       { text: "Cancel", style: "cancel" },
  //       {
  //         text: "Remove",
  //         style: "destructive",
  //         onPress: async () => {
  //           try {
  //             const token = await getToken();
  //             const url = `/teams/${teamId}/members/${member.userId}`;

  //             console.log("DELETE attempt → URL:", url);
  //             console.log("Member userId:", member.userId);

  //             const res = await api(url, token, { method: "DELETE" });

  //             console.log("DELETE full response:", res); // ← This is what you're missing

  //             if (!res.success) {
  //               throw new Error(res.error || "Backend rejected removal");
  //             }

  //             // Optimistic UI update
  //             setTeam((prev) =>
  //               prev
  //                 ? {
  //                     ...prev,
  //                     members: prev.members.filter(
  //                       (m) => m.userId !== member.userId
  //                     ),
  //                   }
  //                 : null
  //             );

  //             Toast.show({
  //               type: "success",
  //               text1: "Member Removed",
  //               text2: "Access revoked successfully",
  //             });
  //           } catch (err: any) {
  //             console.error("Remove member full error:", err);
  //             Toast.show({
  //               type: "error",
  //               text1: "Failed to remove member",
  //               text2: err.message || "Check console for details",
  //             });
  //           }
  //         },
  //       },
  //     ]
  //   );
  // };

  const confirmRemoveMember = (member: {
    userId?: string;
    name?: string;
    email?: string;
  }) => {
    if (!member.userId) {
      Alert.alert("Pending Invite", "You can only remove active members.");
      return;
    }

    // Check if current user is removing themselves
    const isSelf = member.userId === user?.id;
    const alertTitle = isSelf ? "Leave Team" : "Remove Member";
    const alertMsg = isSelf
      ? `Are you sure you want to leave ${team?.name}?`
      : `Remove ${member.name || member.email} from ${team?.name}?`;

    Alert.alert(alertTitle, alertMsg, [
      { text: "Cancel", style: "cancel" },
      {
        text: isSelf ? "Leave" : "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await getToken();
            // Note: ensure teamId variable is accessible in this scope
            const url = `/teams/${teamId}/members/${member.userId}`;
            const res = await api(url, token, { method: "DELETE" });

            if (!res.success) {
              throw new Error(res.error || "Backend rejected removal");
            }

            // 1. Update UI Optimistically
            setTeam((prev) =>
              prev
                ? {
                    ...prev,
                    members: prev.members.filter(
                      (m) => m.userId !== member.userId
                    ),
                  }
                : null
            );

            // 2. If user left the team, redirect them away
            if (isSelf) {
              router.replace("/(root)/(tabs)/settings"); // Go back to settings/home
              Toast.show({
                type: "success",
                text1: "Left Team",
                text2: `You are no longer a member of ${team?.name}`,
              });
            } else {
              Toast.show({
                type: "success",
                text1: "Member Removed",
                text2: "Access revoked successfully",
              });
            }
          } catch (err: any) {
            console.error("Remove member error:", err);
            Toast.show({
              type: "error",
              text1: "Action Failed",
              text2: err.message,
            });
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <LinearGradient colors={["#0f172a", "#1e293b"]} className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8b5cf6" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!team) {
    return (
      <LinearGradient colors={["#0f172a", "#1e293b"]} className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center px-8">
          <Text className="text-white text-xl">Team not found</Text>
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
        <ScrollView className="flex-1 px-8 pt-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-10">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700"
            >
              <Ionicons name="chevron-back" size={24} color="#94a3b8" />
            </TouchableOpacity>
            <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[4px]">
              TEAM PROFILE
            </Text>
            <View className="w-12" />
          </View>

          {/* Team Avatar + Name */}
          <View className="items-center mb-10">
            <View
              className="w-32 h-32 rounded-3xl items-center justify-center shadow-2xl mb-6 border-4 border-slate-700"
              style={{ backgroundColor: team.color || "#3b82f6" }}
            >
              <Text className="text-white text-6xl font-black">
                {getInitial(team.name)}
              </Text>
            </View>
            <Text className="text-white text-4xl font-black tracking-tight">
              {team.name}
            </Text>
            <Text className="text-slate-400 text-lg mt-2">
              {team.description || "No description"}
            </Text>
          </View>

          {/* Info Cards */}
          <View className="space-y-6 mb-10">
            {/* Created Date */}
            <View className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50 mb-2">
              <Text className="text-slate-500 text-xs uppercase tracking-widest mb-2">
                Established
              </Text>
              <Text className="text-white text-xl font-bold">
                {formatDate(team.createdAt)}
              </Text>
            </View>

            {/* Member Count */}
            <View className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50 mb-2">
              <Text className="text-slate-500 text-xs uppercase tracking-widest mb-2">
                Workforce
              </Text>
              <Text className="text-white text-xl font-bold">
                {team.members.length}{" "}
                {team.members.length === 1 ? "Member" : "Members"}
              </Text>
            </View>

            {/* Projects */}
            <View className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50 mb-2">
              <Text className="text-slate-500 text-xs uppercase tracking-widest mb-2">
                Active Projects
              </Text>
              <Text className="text-white text-xl font-bold">
                {team.projects?.length || 0}
              </Text>
            </View>
          </View>

          {/* Members List */}
          {/* <Text className="text-white text-xl font-bold mb-4">
            Team Members
          </Text>
          <View className="space-y-4 mb-10">
            {team.members.map((member, index) => (
              <View
                key={index}
                className="bg-slate-800/40 rounded-2xl p-5 flex-row items-center border border-slate-700/50"
              >
                <View className="w-12 h-12 rounded-xl bg-indigo-600 items-center justify-center mr-4">
                  <Text className="text-white text-xl font-bold">
                    {getInitial(member.name || "U")}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold">
                    {member.name || "Unknown"}
                  </Text>
                  <Text className="text-slate-400 text-sm">
                    {member.email || "No email"}
                  </Text>
                </View>
                <View
                  className={`px-3 py-1 rounded-full ${
                    member.role === "admin"
                      ? "bg-purple-600/30"
                      : "bg-slate-600/30"
                  }`}
                >
                  <Text className="text-xs font-bold text-purple-300 uppercase">
                    {member.role}
                  </Text>
                </View>
              </View>
            ))}
          </View> */}

          {/* Team Members Section */}
          <View className="mt-8 bg-slate-800/40 mb-5 border border-slate-700 rounded-2xl p-5">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-white text-xl font-black tracking-tight">
                Team Members ({team.members.length})
              </Text>

              {isAdmin && (
                <TouchableOpacity
                  onPress={() => setShowAddMemberModal(true)}
                  className="bg-blue-600/80 px-5 py-2.5 rounded-xl flex-row items-center shadow-lg shadow-blue-600/30"
                >
                  <Ionicons name="person-add" size={18} color="white" />
                  <Text className="text-white font-bold ml-2 text-sm uppercase tracking-wider">
                    Add
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {team.members.length === 0 ? (
              <View className="py-10 items-center">
                <Ionicons name="people-outline" size={48} color="#475569" />
                <Text className="text-slate-400 mt-4 text-center">
                  No members yet. Add your first team member!
                </Text>
              </View>
            ) : (
              <View className="space-y-4">
                {team.members.map((member) => (
                  <View
                    key={member.userId || member.email}
                    className="flex-row items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-700/50"
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="flex-1">
                        <Text className="text-white font-semibold">
                          {member.name || "Pending User"}
                        </Text>
                        <Text className="text-slate-400 text-sm">
                          {member.email}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center">
                      <View
                        className={`px-3 py-1 rounded-full mr-3 ${
                          member.role === "admin"
                            ? "bg-purple-600/30 border border-purple-500/30"
                            : "bg-slate-600/30 border border-slate-500/30"
                        }`}
                      >
                        <Text className="text-xs font-bold uppercase tracking-wider text-purple-200">
                          {member.role}
                        </Text>
                      </View>

                      {isAdmin && member.userId !== user?.id && (
                        <TouchableOpacity
                          onPress={() => confirmRemoveMember(member)}
                          className="p-2"
                        >
                          <Ionicons
                            name="person-remove-outline"
                            size={20}
                            color="#ef4444"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Add Member Modal */}
          <Modal
            visible={showAddMemberModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowAddMemberModal(false)}
          >
            <View className="flex-1 justify-center items-center bg-black/70">
              <View className="bg-slate-900 rounded-3xl p-6 w-[92%] max-w-md border border-slate-700">
                <Text className="text-white text-2xl font-black mb-2">
                  Add Team Member
                </Text>
                <Text className="text-slate-400 mb-6">
                  Enter email. Existing users join instantly, new users receive
                  an invite.
                </Text>

                <TextInput
                  placeholder="colleague@example.com"
                  value={newMemberEmail}
                  onChangeText={setNewMemberEmail}
                  className="bg-slate-800/70 rounded-2xl px-5 py-4 text-white border border-slate-700 mb-6"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <View className="flex-row justify-end gap-5 space-x-4">
                  <TouchableOpacity
                    onPress={() => {
                      setShowAddMemberModal(false);
                      setNewMemberEmail("");
                    }}
                    className="px-6 py-3 bg-slate-800 rounded-xl"
                  >
                    <Text className="text-slate-300 font-medium">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleAddMember}
                    disabled={addingMember || !newMemberEmail.trim()}
                    className={`px-6 py-3 rounded-xl flex-row items-center ${
                      newMemberEmail.trim() ? "bg-blue-600" : "bg-blue-600/50"
                    }`}
                  >
                    {addingMember && (
                      <ActivityIndicator
                        size="small"
                        color="white"
                        className="mr-2"
                      />
                    )}
                    <Text className="text-white font-bold">Add / Invite</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Projects List — Added Underneath */}
          <Text className="text-white text-2xl font-bold mb-6">Projects</Text>
          {team.projects && team.projects.length > 0 ? (
            <View className="space-y-5 pb-10">
              {team.projects.map((project) => (
                <View
                  key={project._id}
                  className="bg-slate-800/40 rounded-2xl border border-slate-700/50 overflow-hidden relative"
                >
                  {/* Full-height color sidebar – now more prominent */}
                  <View
                    className="absolute inset-y-0 left-0 w-5" // wider (20px) and full height
                    style={{ backgroundColor: project.color || "#8b5cf6" }}
                  />

                  {/* Card content – add left padding to make space for the bar */}
                  <View className="flex-row items-center justify-between pl-8 pr-6 py-6">
                    <TouchableOpacity
                      onPress={() => router.push(`/projects/${project._id}`)}
                      className="flex-row items-center flex-1"
                    >
                      <View className="flex-1">
                        <Text className="text-white text-xl font-bold">
                          {project.name}
                        </Text>
                        <Text className="text-slate-400 mt-1">
                          {project.activeTaskCount || 0} active task
                          {project.activeTaskCount !== 1 ? "s" : ""}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={24}
                        color="#94a3b8"
                      />
                    </TouchableOpacity>

                    {/* Delete button */}
                    {isAdmin && (
                      <TouchableOpacity
                        onPress={() =>
                          handleDeleteProject(project._id, project.name)
                        }
                        className="ml-4 p-2"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={24}
                          color="#ef4444"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => router.push("/create-project")} // ← Change to your actual create-project route
              activeOpacity={0.8}
              className="bg-slate-800/30 rounded-2xl p-10 items-center mb-10 border border-slate-700/30"
            >
              <View className="w-20 h-20 rounded-full bg-blue-600/20 items-center justify-center mb-4">
                <Ionicons name="add" size={48} color="#60a5fa" />
              </View>

              <Text className="text-slate-400 text-center text-lg font-medium">
                No projects yet
              </Text>

              <Text className="text-slate-500 text-sm mt-2 text-center">
                Tap here to create your first project
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
