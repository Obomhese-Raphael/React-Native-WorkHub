import React from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
} from "react-native";
import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { Link, router } from "expo-router";

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [pendingVerification, setPendingVerification] = React.useState(false);
    const [code, setCode] = React.useState("");

    if (!isLoaded) return null;

    const handleEmailSignUp = async () => {
        try {
            await signUp.create({ emailAddress: email, password });
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setPendingVerification(true);
        } catch (err: any) {
            console.error(err);
        }
    };

    const handleVerifyCode = async () => {
        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });
            if (completeSignUp.status === "complete") {
                await setActive({ session: completeSignUp.createdSessionId });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            const { createdSessionId, setActive } = await startOAuthFlow();
            if (createdSessionId) {
                await setActive!({ session: createdSessionId });
            }
        } catch (err) {
            console.error("Google Sign-Up error", err);
        }
    };

    return (
        <SafeAreaView className="flex-1 items-center justify-center px-6">
            <View className="w-full max-w-m ">
                <Text className="text-2xl font-bold text-center text-gray-800 mb-6">
                    Create an Account ⚒️
                </Text>

                {pendingVerification ? (
                    <>
                        <TextInput
                            value={code}
                            onChangeText={setCode}
                            placeholder="Enter verification code"
                            className="w-full  rounded-lg px-4 py-3 mb-4 text-gray-700"
                        />
                        <TouchableOpacity
                            onPress={handleVerifyCode}
                            className="bg-blue-600 rounded-lg py-3"
                        >
                            <Text className="text-white text-center font-semibold">
                                Verify Email
                            </Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Email"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 text-gray-700"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Password"
                            secureTextEntry
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6 text-gray-700"
                        />

                        <TouchableOpacity
                            onPress={handleEmailSignUp}
                            className="bg-blue-600 rounded-lg py-3 mb-4"
                        >
                            <Text className="text-white text-center font-semibold">
                                Sign Up
                            </Text>
                        </TouchableOpacity>

                        <View className="flex-row items-center mb-4">
                            <View className="flex-1 h-px bg-gray-300" />
                            <Text className="px-2 text-gray-500">or</Text>
                            <View className="flex-1 h-px bg-gray-300" />
                        </View>

                        <TouchableOpacity
                            onPress={handleGoogleSignUp}
                            className="bg-white border border-gray-300 rounded-lg py-3 flex flex-row items-center justify-center"
                        >
                            <Text className="text-black font-medium">
                                Continue with Google
                            </Text>
                        </TouchableOpacity>
                         <View className="flex-row justify-center mt-8">
                                        <Text className="text-gray-500">Already have an account?</Text>
                                        <TouchableOpacity onPress={() => router.push("/sign-in")}>
                                            <Text className="text-blue-600 font-semibold ml-1">Sign In</Text>
                                        </TouchableOpacity>
                                    </View>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}
