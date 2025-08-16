import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

export default function GoogleSignInButton() {
    const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

    const onGooglePress = async () => {
        try {
            const redirectUrl = Linking.createURL("/");

            const { createdSessionId, setActive } = await startOAuthFlow({
                redirectUrl,
            });

            if (createdSessionId) {
                await setActive!({ session: createdSessionId });
            }
        } catch (err) {
            console.error("Google sign-in failed", err);
        }
    };

    return (
        <TouchableOpacity
            onPress={onGooglePress}
            className="flex-row items-center justify-center bg-white border border-gray-300 rounded-lg p-3 shadow-sm mt-4"
        >
            <Text className="text-gray-800 font-medium">Continue with Google</Text>
        </TouchableOpacity>
    );
}
