import { useAuth, useUser } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
  const { user } = useUser();
  const { signOut, getToken } = useAuth();

  const fetchJWT = async () => { 
    const token = await getToken();
    console.log("JWT: ", token);
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.log("Sign out error:", err);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0f0f1a] px-6">
      {/* Top Avatar & Info */}
      <View className="items-center mt-6">
        <Image
          source={{ uri: user?.imageUrl }}
          className="w-24 h-24 rounded-full border-4 border-purple-600"
        />
        <Text className="text-white text-xl font-bold mt-3">
          {user?.firstName || "User"}
        </Text>
        <Text className="text-gray-400">{user?.primaryEmailAddress?.emailAddress}</Text>
        <Text className="text-gray-500 text-sm">Tap photo to change</Text>
      </View>

      {/* Account Info */}
      <View className="mt-6 bg-[#1c1c2a] p-4 rounded-2xl">
        <Text className="text-white font-semibold mb-3">Account Information</Text>
        <View className="flex-row justify-between py-2 border-b border-gray-700">
          <Text className="text-gray-400">Name</Text>
          <Text className="text-white">{user?.fullName}</Text>
        </View>
        <View className="flex-row justify-between py-2 border-b border-gray-700">
          <Text className="text-gray-400">Email</Text>
          <Text className="text-white">{user?.primaryEmailAddress?.emailAddress}</Text>
        </View>
        <View className="flex-row justify-between py-2">
          <Text className="text-gray-400">Member Since</Text>
          <Text className="text-white">
            {new Date(user?.createdAt || "").toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Navigation */}
      <View className="mt-6 bg-[#1c1c2a] p-4 rounded-2xl">
        <Text className="text-white font-semibold mb-3">Navigation</Text>

        <Link href="/" asChild>
          <TouchableOpacity className="flex-row items-center justify-between py-3 border-b border-gray-700">
            <View className="flex-row items-center space-x-3">

              <Text className="text-white">Home</Text>
            </View>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/tasks" asChild>
          <TouchableOpacity className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center space-x-3">
              <Text className="text-white">Tasks</Text>
            </View>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        onPress={handleSignOut}
        className="mt-8 bg-red-600 py-3 rounded-xl"
      >
        <Text className="text-center text-white font-semibold text-lg">
          Sign Out
        </Text>
      </TouchableOpacity>

      {/* GET CLERK TOKEN */}
      <TouchableOpacity
        onPress={fetchJWT}
        className="mt-8 bg-red-600 py-3 rounded-xl"
      >
        <Text className="text-center text-white font-semibold text-lg">
          Get Token
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Profile;
