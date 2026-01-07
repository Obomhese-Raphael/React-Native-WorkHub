import { useOAuth, useSignUp } from "@clerk/clerk-expo";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
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
import { SafeAreaView } from 'react-native-safe-area-context';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    
    // New state for password visibility
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    if (!isLoaded) return (
        <View className="flex-1 bg-[#0f172a] items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
        </View>
    );

    const handleEmailSignUp = async () => {
        if (!firstName || !lastName || !email || !password) {
            return Alert.alert("Required", "All identification fields must be populated.");
        }
        setLoading(true);
        try {
            await signUp.create({
                emailAddress: email,
                password: password,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
            });
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setPendingVerification(true);
        } catch (err: any) {
            Alert.alert("System Error", err.errors?.[0]?.message || "Failed to initialize identity");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        setLoading(true);
        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code: code.trim(),
            });
            if (completeSignUp.status === "complete") {
                await setActive({ session: completeSignUp.createdSessionId });
                router.replace("/");
            }
        } catch (err: any) {
            Alert.alert("Error", err.errors?.[0]?.message || "Invalid sequence.");
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
                    <ScrollView className="px-8 pt-6" showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <View className="flex-row items-center justify-between mb-10">
                            <TouchableOpacity 
                                onPress={() => pendingVerification ? setPendingVerification(false) : router.back()}
                                className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700"
                            >
                                <Ionicons name="chevron-back" size={24} color="#94a3b8" />
                            </TouchableOpacity>
                            <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[4px]">
                                Identity.Nexus
                            </Text>
                            <View className="w-12" />
                        </View>

                        <View className="mb-10">
                            <Text className="text-4xl font-black text-white tracking-tight">
                                {pendingVerification ? "Verify Email" : "New Account"}
                            </Text>
                            <Text className="text-slate-400 mt-2 font-medium">
                                {pendingVerification ? `Sequence sent to ${email}` : "Initialize your workspace credentials."}
                            </Text>
                        </View>

                        {pendingVerification ? (
                            /* --- VERIFICATION VIEW --- */
                            <View>
                                <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3 ml-1">6-Digit Sequence</Text>
                                <TextInput
                                    value={code}
                                    onChangeText={setCode}
                                    placeholder="000000"
                                    placeholderTextColor="#475569"
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    className="bg-slate-800/40 border border-slate-700/50 rounded-2xl px-6 py-5 text-white text-3xl text-center font-black tracking-[10px]"
                                />
                                <TouchableOpacity onPress={handleVerifyCode} className="mt-6 bg-blue-600 py-5 rounded-2xl">
                                    <Text className="text-white text-center font-black uppercase tracking-widest">Verify Sequence</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            /* --- REGISTRATION VIEW --- */
                            <View>
                                <View className="flex-row gap-4 mb-4">
                                    <View className="flex-1">
                                        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">First Name</Text>
                                        <TextInput
                                            value={firstName}
                                            onChangeText={setFirstName}
                                            placeholder="John"
                                            placeholderTextColor="#475569"
                                            className="bg-slate-800/40 border border-slate-700/50 rounded-2xl px-5 py-4 text-white font-medium"
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Last Name</Text>
                                        <TextInput
                                            value={lastName}
                                            onChangeText={setLastName}
                                            placeholder="Doe"
                                            placeholderTextColor="#475569"
                                            className="bg-slate-800/40 border border-slate-700/50 rounded-2xl px-5 py-4 text-white font-medium"
                                        />
                                    </View>
                                </View>

                                <View className="mb-4">
                                    <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Email Address</Text>
                                    <TextInput
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="operator@system.com"
                                        placeholderTextColor="#475569"
                                        className="bg-slate-800/40 border border-slate-700/50 rounded-2xl px-5 py-4 text-white font-medium"
                                    />
                                </View>

                                {/* Password Field with Toggle */}
                                <View className="mb-8">
                                    <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Access Password</Text>
                                    <View className="relative flex-row items-center">
                                        <TextInput
                                            value={password}
                                            onChangeText={setPassword}
                                            placeholder="Min. 8 characters"
                                            placeholderTextColor="#475569"
                                            secureTextEntry={!isPasswordVisible}
                                            className="flex-1 bg-slate-800/40 border border-slate-700/50 rounded-2xl px-5 py-4 text-white font-medium pr-14"
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
                                </View>

                                <TouchableOpacity onPress={handleEmailSignUp} className="overflow-hidden rounded-2xl">
                                    <LinearGradient colors={["#3b82f6", "#1d4ed8"]} className="py-5">
                                        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white text-center font-black uppercase tracking-widest">Create Identity</Text>}
                                    </LinearGradient>
                                </TouchableOpacity>

                                <View className="flex-row justify-center mt-10 pb-10">
                                    <Text className="text-slate-500 font-medium">Already registered?</Text>
                                    <TouchableOpacity onPress={() => router.push("/sign-in")}>
                                        <Text className="text-blue-400 font-black ml-2">Authorize</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}