import { useAuth, useSignIn, useSSO } from "@clerk/clerk-expo";
import { Feather, FontAwesome } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

// Preloads the browser for Android devices to reduce authentication load time
// See: https://docs.expo.dev/guides/authentication/#improving-user-experience
export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => {
      // Cleanup: closes browser when component unmounts
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  useWarmUpBrowser();

  // Use the `useSSO()` hook to access the `startSSOFlow()` method
  const { startSSOFlow } = useSSO();
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleEmailSignIn = async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Access Denied",
        text2: err.message || "Invalid credentials provided.",
        visibilityTime: 5000,
        autoHide: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = useCallback(async () => {
    if (!isLoaded || !signIn) return;

    setGoogleLoading(true);
    try {
      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive, signIn, signUp } =
        await startSSOFlow({
          strategy: "oauth_google",
          redirectUrl: AuthSession.makeRedirectUri(),
        });

      // If sign in was successful, set the active session
      if (createdSessionId) {
        setActive!({
          session: createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              router.push("/");
              return;
            }

            router.push("/");
          },
        });
      } else {
        console.log("Additional steps required:", { signIn, signUp });
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  }, [isLoaded, signIn]);

  useEffect(() => {
    if (isSignedIn) {
      router.replace("/");
    }
  }, [isSignedIn]);

  return (
    <LinearGradient
      colors={["#0f172a", "#1e293b", "#0f172a"]}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
            className="px-8"
            showsVerticalScrollIndicator={false}
          >
            <View className="mb-12">
              <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[4px] mb-2">
                System.Authentication
              </Text>
              <Text className="text-4xl font-black text-white tracking-tight">
                Welcome Back
              </Text>
            </View>

            <View>
              <View className="mb-6">
                <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3 ml-1">
                  Operator Email
                </Text>
                <TextInput
                  placeholder="Enter identifier..."
                  value={email}
                  onChangeText={setEmail}
                  className="bg-slate-800/40 border border-slate-700/50 rounded-2xl px-6 py-5 text-white text-base"
                  placeholderTextColor="#475569"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3 ml-1">
                  Security Code
                </Text>
                <View className="relative flex-row items-center">
                  <TextInput
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible}
                    className="flex-1 bg-slate-800/40 border border-slate-700/50 rounded-2xl px-6 py-5 text-white text-base pr-14"
                    placeholderTextColor="#475569"
                  />
                  <TouchableOpacity
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    className="absolute right-5"
                  >
                    <Feather
                      name={isPasswordVisible ? "eye-off" : "eye"}
                      size={20}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                </View>
                <View className="mt-4 items-end">
                  <TouchableOpacity
                    onPress={() => router.push("/(auth)/forgot-password")}
                  >
                    <Text className="text-blue-400 font-bold text-sm">
                      Forgot Security Code?
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View className="mt-10">
              <TouchableOpacity
                onPress={handleEmailSignIn}
                disabled={loading}
                activeOpacity={0.8}
                className="overflow-hidden rounded-2xl"
              >
                <LinearGradient
                  colors={["#3b82f6", "#1d4ed8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-5 flex-row justify-center items-center"
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <View className="flex-row items-center">
                      <Text className="text-white text-center text-lg font-black uppercase tracking-widest mr-2">
                        Authorize
                      </Text>
                      <Feather name="shield" size={20} color="white" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View className="flex-row items-center my-8">
                <View className="flex-1 h-[1px] bg-slate-800" />
                <Text className="mx-4 text-slate-600 font-bold text-[10px] uppercase tracking-widest">
                  External Sync
                </Text>
                <View className="flex-1 h-[1px] bg-slate-800" />
              </View>

              <TouchableOpacity
                onPress={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full bg-slate-800/30 border border-slate-700/50 rounded-2xl py-5 flex-row justify-center items-center"
              >
                {googleLoading ? (
                  <ActivityIndicator color="#94a3b8" />
                ) : (
                  <>
                    <FontAwesome name="google" size={18} color="#94a3b8" />
                    <Text className="text-slate-300 font-bold text-base ml-3">
                      Continue with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-center mt-12 pb-10">
              <Text className="text-slate-500 font-medium">New operator?</Text>
              <TouchableOpacity onPress={() => router.push("/sign-up")}>
                <Text className="text-blue-400 font-black ml-2">
                  Register Identity
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
