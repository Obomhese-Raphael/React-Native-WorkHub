import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyWorkScreen() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-blue-600">My Work</Text>
      <Text className="text-gray-600 mt-4">All tasks assigned to you</Text>
    </SafeAreaView>
  );
}