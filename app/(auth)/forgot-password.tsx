import { useSignIn } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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

export default function ForgotPasswordScreen() {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      await signIn!.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });

      // Navigate to reset screen with email (you can use params or context)
      router.push({ pathname: "/reset-password", params: { email } });
      Toast.show({
        type: "success",
        text1: "Code Sent",
        text2: "Check your email for the reset code.",
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.errors?.[0]?.message || "Could not send reset code.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0f172a", "#1e293b", "#0f172a"]} className="flex-1">
      <SafeAreaView className="flex-1 px-8 justify-center">
        <View className="mb-12">
          <Text className="text-4xl font-black text-white tracking-tight">
            Reset Security Code
          </Text>
          <Text className="text-slate-500 mt-4">
            Enter your operator email to receive a reset code.
          </Text>
        </View>

        <TextInput
          placeholder="Operator Email"
          value={email}
          onChangeText={setEmail}
          className="bg-slate-800/40 border border-slate-700/50 rounded-2xl px-6 py-5 text-white mb-6"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity
          onPress={handleRequestReset}
          disabled={loading}
          className="overflow-hidden rounded-2xl"
        >
          <LinearGradient
            colors={["#3b82f6", "#1d4ed8"]}
            className="py-5 items-center"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-black uppercase">
                Send Reset Code
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-8 items-center"
        >
          <Text className="text-blue-400 font-bold">Back to Authorize</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}