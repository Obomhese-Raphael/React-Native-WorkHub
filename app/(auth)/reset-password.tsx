import { useAuth, useSignIn } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function ResetPasswordScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      const result = await signIn!.attemptFirstFactor({
        strategy: "reset_password_email_code",  
        code,
        password: newPassword,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        Toast.show({ type: "success", text1: "Success", text2: "Security code updated." });
        router.replace("/"); // Redirect to home after login
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.errors?.[0]?.message || "Invalid code or password.",
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isSignedIn) router.replace("/");
  }, [isSignedIn]);

  return (
    <LinearGradient colors={["#0f172a", "#1e293b", "#0f172a"]} className="flex-1">
      <SafeAreaView className="flex-1 px-8 justify-center">
        <View className="mb-12">
          <Text className="text-4xl font-black text-white tracking-tight">
            Set New Security Code
          </Text>
          <Text className="text-slate-500 mt-4">Email: {email}</Text>
        </View>

        <TextInput
          placeholder="Verification Code"
          value={code}
          onChangeText={setCode}
          className="bg-slate-800/40 border border-slate-700/50 rounded-2xl px-6 py-5 text-white mb-6"
          keyboardType="number-pad"
        />

        <View className="relative">
          <TextInput
            placeholder="New Security Code"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!isPasswordVisible}
            className="bg-slate-800/40 border border-slate-700/50 rounded-2xl px-6 py-5 text-white pr-14"
          />
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            className="absolute right-5 top-5"
          >
            <Feather name={isPasswordVisible ? "eye-off" : "eye"} size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleReset}
          disabled={loading}
          className="mt-10 overflow-hidden rounded-2xl"
        >
          <LinearGradient
            colors={["#3b82f6", "#1d4ed8"]}
            className="py-5 items-center"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-black uppercase">
                Update Security Code
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}