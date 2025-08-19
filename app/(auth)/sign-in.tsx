import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useSignIn } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";

export default function SignInScreen() {
    const { signIn, setActive, isLoaded } = useSignIn();
    const router = useRouter();
    const { isSignedIn } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");


    // --- Email & Password sign-in ---
    const handleEmailSignIn = async () => {
        if (!isLoaded) return;
        try {
            const result = await signIn.create({
                identifier: email,
                password,
            });
            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
            }
        } catch (err: any) {
            console.error("Sign-in error", err);
        }
    };

    // --- Google OAuth sign-in ---
    const handleGoogleSignIn = async () => {
        if (!isLoaded) return;

        const redirectUrl = Linking.createURL("/(tabs)", { scheme: "myapp" });

        try {
            const { createdSessionId, status } = await signIn.create({
                strategy: "oauth_google",
                redirectUrl,
            });

            if (status === "complete") {
                await setActive({ session: createdSessionId });
            }
        } catch (err) {
            console.error("Google Sign-In error", err);
        }
    };

    useEffect(() => {
        if (isSignedIn) {
            console.log("signed in")
            router.replace("/"); // 👈 send user to your tabs root
        }
    }, [isSignedIn]);

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-white px-6 justify-center"
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View className="mb-10">
                <Text className="text-3xl font-bold text-gray-900">Welcome Back 👋</Text>
                <Text className="text-gray-500 mt-2">
                    Sign in to continue managing your tasks
                </Text>
            </View>

            {/* Email Input */}
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 text-gray-900"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
            />

            {/* Password Input */}
            <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-6 text-gray-900"
                placeholderTextColor="#9ca3af"
            />

            {/* Sign-in button */}
            <TouchableOpacity
                onPress={handleEmailSignIn}
                className="w-full bg-blue-600 rounded-xl py-3 mb-6"
            >
                <Text className="text-white text-center text-lg font-semibold">
                    Sign In
                </Text>
            </TouchableOpacity>

            {/* Separator */}
            <View className="flex-row items-center mb-6">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="mx-3 text-gray-500">or</Text>
                <View className="flex-1 h-px bg-gray-300" />
            </View>

            {/* Google Sign-in */}
            <TouchableOpacity
                onPress={handleGoogleSignIn}
                className="w-full bg-white border border-gray-300 rounded-xl py-3 flex-row justify-center items-center"
            >
                <Text className="text-gray-900 font-semibold text-lg">
                    Continue with Google
                </Text>
            </TouchableOpacity>

            {/* Sign-up redirect */}
            <View className="flex-row justify-center mt-8">
                <Text className="text-gray-500">Don’t have an account?</Text>
                <TouchableOpacity onPress={() => router.push("/sign-up")}>
                    <Text className="text-blue-600 font-semibold ml-1">Sign Up</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
