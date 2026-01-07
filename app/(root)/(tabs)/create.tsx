import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function CreateScreen() {
  const options = [
    {
      title: "Team",
      subtitle: "Enterprise Workspace",
      description: "Collaborate with members and scale operations",
      icon: <Ionicons name="people" size={28} color="#818cf8" />,
      accent: "#6366f1",
      tag: "STRATEGIC",
      onPress: () => router.push("/create-team"),
    },
    {
      title: "Project",
      subtitle: "New Initiative",
      description: "Define goals, timelines, and technical tasks",
      icon: <MaterialIcons name="folder-open" size={28} color="#34d399" />,
      accent: "#10b981",
      tag: "OPERATIONAL",
      onPress: () => router.push("/create-project"),
    },
    {
      title: "Task",
      subtitle: "Direct Assignment",
      description: "Quick-entry task for immediate execution",
      icon: <Feather name="check-square" size={28} color="#60a5fa" />,
      accent: "#3b82f6",
      tag: "TACTICAL",
      onPress: () => router.push("/create-task"),
    },
  ];

  return (
    <LinearGradient colors={["#0f172a", "#1e293b", "#0f172a"]} className="flex-1">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-8 pt-10" showsVerticalScrollIndicator={false}>
          {/* Header Section */}
          <View className="mb-12">
            <Text className="text-slate-500 text-xs font-bold uppercase tracking-[4px] mb-2">
              Action.Center
            </Text>
            <Text className="text-4xl font-black text-white tracking-tight">
              Quick Create
            </Text>
            <Text className="text-slate-400 text-base mt-2 font-medium">
              Initialize new nodes in your ecosystem
            </Text>
          </View>

          {/* Action Cards */}
          <View className="space-y-6">
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                onPress={option.onPress}
                className="bg-slate-800/40 border border-slate-700/50 rounded-[32px] overflow-hidden shadow-2xl mb-2"
              >
                <View className="p-7 flex-row items-center">
                  {/* Icon Container with Glow */}
                  <View 
                    className="mr-5 p-4 rounded-2xl bg-slate-900/80 border border-slate-700"
                    style={{
                      shadowColor: option.accent,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                    }}
                  >
                    {option.icon}
                  </View>

                  {/* Text Content */}
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Text className="text-xl font-black text-white">
                        {option.title}
                      </Text>
                      <View 
                        className="ml-3 px-2 py-0.5 rounded-md border"
                        style={{ borderColor: `${option.accent}50`, backgroundColor: `${option.accent}10` }}
                      >
                        <Text className="text-[8px] font-black tracking-widest" style={{ color: option.accent }}>
                          {option.tag}
                        </Text>
                      </View>
                    </View>
                    
                    <Text className="text-slate-300 font-bold text-sm">
                      {option.subtitle}
                    </Text>
                    <Text className="text-slate-500 text-xs mt-1 leading-4">
                      {option.description}
                    </Text>
                  </View>

                  {/* Minimal Chevron */}
                  <Feather name="arrow-right" size={20} color="#475569" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom Branding */}
          <View className="mt-16 items-center opacity-20">
            <View className="w-10 h-1 bg-slate-500 rounded-full" />
            <Text className="text-slate-500 text-[10px] font-bold mt-4 tracking-[3px] uppercase">
              Secure Terminal v2.0
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}