import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateScreen() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-blue-600">Create</Text>
      <Text className="text-gray-600 mt-4">Quick create task, project, or team</Text>
    </SafeAreaView>
  );
}