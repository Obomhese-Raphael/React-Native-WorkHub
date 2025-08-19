import React from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { Link, router } from "expo-router";

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

    const [firstName, setFirstName] = React.useState("");
    const [lastName, setLastName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [pendingVerification, setPendingVerification] = React.useState(false);
    const [code, setCode] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    if (!isLoaded) return <ActivityIndicator size="large" className="flex-1" />;

    const handleEmailSignUp = async () => {
        if (!firstName || !lastName || !email || !password) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        if (password.length < 8) {
            Alert.alert("Error", "Password must be at least 8 characters long");
            return;
        }

        setLoading(true);
        try {
            // Create the user with name information
            await signUp.create({
                emailAddress: email,
                password: password,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
            });

            // Send the email verification code
            await signUp.prepareEmailAddressVerification({
                strategy: "email_code"
            });

            setPendingVerification(true);
            Alert.alert("Success", "Verification code sent to your email!");
        } catch (err) {
            console.error("Sign up error:", err);
            Alert.alert("Error", err.errors?.[0]?.message || "Failed to create account");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!code) {
            Alert.alert("Error", "Please enter the verification code");
            return;
        }

        setLoading(true);
        try {
            // Attempt to verify the email address
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code: code.trim(),
            });

            console.log("Verification result:", completeSignUp.status);

            // Check if verification was successful
            if (completeSignUp.status === "complete") {
                // Set the active session
                await setActive({ session: completeSignUp.createdSessionId });

                Alert.alert("Success", "Account created successfully!", [
                    {
                        text: "OK",
                        onPress: () => {
                            // Navigate to home or onboarding
                            router.replace("/");
                        }
                    }
                ]);
            } else {
                // Handle other statuses
                console.log("Sign up not complete, status:", completeSignUp.status);
                Alert.alert("Error", "Verification failed. Please try again.");
            }
        } catch (err) {
            console.error("Verification error:", err);

            // Handle specific error cases
            if (err.errors?.[0]?.code === "verification_already_verified") {
                Alert.alert(
                    "Already Verified",
                    "Your email is already verified. Completing sign up...",
                    [
                        {
                            text: "OK",
                            onPress: async () => {
                                try {
                                    // Try to complete the sign up
                                    if (signUp.status === "complete") {
                                        await setActive({ session: signUp.createdSessionId });
                                        router.replace("/");
                                    } else {
                                        // Force complete the sign up
                                        const result = await signUp.attemptEmailAddressVerification({
                                            code: "000000" // Dummy code since it's already verified
                                        });
                                        if (result.createdSessionId) {
                                            await setActive({ session: result.createdSessionId });
                                            router.replace("/");
                                        }
                                    }
                                } catch (finalErr) {
                                    console.error("Final completion error:", finalErr);
                                    Alert.alert("Error", "Please try signing in instead.");
                                    router.push("/sign-in");
                                }
                            }
                        }
                    ]
                );
            } else {
                Alert.alert("Error", err.errors?.[0]?.message || "Invalid verification code");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setLoading(true);
        try {
            const { createdSessionId, setActive: oauthSetActive } = await startOAuthFlow();

            if (createdSessionId) {
                await oauthSetActive({ session: createdSessionId });
                router.replace("/");
            }
        } catch (err) {
            console.error("Google Sign-Up error:", err);
            Alert.alert("Error", "Failed to sign up with Google");
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setLoading(true);
        try {
            await signUp.prepareEmailAddressVerification({
                strategy: "email_code"
            });
            Alert.alert("Success", "New verification code sent!");
        } catch (err) {
            console.error("Resend error:", err);
            Alert.alert("Error", "Failed to resend code");
        } finally {
            setLoading(false);
        }
    };

    const handleGoBack = () => {
        setPendingVerification(false);
        setCode("");
        // Keep the user's entered information when going back
    };

    return (
        <SafeAreaView className="flex-1 items-center justify-center px-6 bg-white">
            <View className="w-full max-w-sm">
                <Text className="text-2xl font-bold text-center text-gray-800 mb-6">
                    {pendingVerification ? "Verify Your Email ✉️" : "Create an Account ⚒️"}
                </Text>

                {pendingVerification ? (
                    <>
                        <Text className="text-gray-600 text-center mb-4">
                            We've sent a verification code to {email}
                        </Text>

                        <TextInput
                            value={code}
                            onChangeText={setCode}
                            placeholder="Enter 6-digit code"
                            keyboardType="number-pad"
                            maxLength={6}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 text-gray-700 text-center text-lg tracking-widest"
                            autoFocus
                        />

                        <TouchableOpacity
                            onPress={handleVerifyCode}
                            disabled={loading || code.length !== 6}
                            className={`rounded-lg py-3 mb-4 ${loading || code.length !== 6
                                    ? "bg-gray-400"
                                    : "bg-blue-600"
                                }`}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white text-center font-semibold">
                                    Verify Email
                                </Text>
                            )}
                        </TouchableOpacity>

                        <View className="flex-row justify-between">
                            <TouchableOpacity
                                onPress={handleResendCode}
                                disabled={loading}
                                className="flex-1 mr-2"
                            >
                                <Text className="text-blue-600 text-center font-medium">
                                    Resend Code
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleGoBack}
                                disabled={loading}
                                className="flex-1 ml-2"
                            >
                                <Text className="text-gray-600 text-center font-medium">
                                    Go Back
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <>
                        {/* NAME FIELDS - Side by side */}
                        <View className="flex-row space-x-3 mb-4 gap-3">
                            <TextInput
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="First Name"
                                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-gray-700"
                                autoCapitalize="words"
                                autoComplete="given-name"
                            />
                            <TextInput
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Last Name"
                                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-gray-700"
                                autoCapitalize="words"
                                autoComplete="family-name"
                            />
                        </View>

                        {/* EMAIL FIELD */}
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Email"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 text-gray-700"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />

                        {/* PASSWORD FIELD */}
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Password (min 8 characters)"
                            secureTextEntry
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6 text-gray-700"
                            autoComplete="new-password"
                        />

                        <TouchableOpacity
                            onPress={handleEmailSignUp}
                            disabled={loading}
                            className={`rounded-lg py-3 mb-4 ${loading ? "bg-gray-400" : "bg-blue-600"
                                }`}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white text-center font-semibold">
                                    Sign Up
                                </Text>
                            )}
                        </TouchableOpacity>

                        <View className="flex-row items-center mb-4">
                            <View className="flex-1 h-px bg-gray-300" />
                            <Text className="px-2 text-gray-500">or</Text>
                            <View className="flex-1 h-px bg-gray-300" />
                        </View>

                        <TouchableOpacity
                            onPress={handleGoogleSignUp}
                            disabled={loading}
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