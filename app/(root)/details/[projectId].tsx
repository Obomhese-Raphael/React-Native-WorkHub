import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

// Dummy Projects & Tasks
const projects = [
    { id: "1", name: "Website Redesign", team: "Design" },
    { id: "2", name: "New App Feature", team: "Engineering" },
    { id: "3", name: "Social Campaign", team: "Marketing" },
];

const tasks = [
    {
        id: "t1",
        projectId: "1",
        title: "Design landing page",
        status: "To Do",
        assignedUsers: ["Alice", "Bob", "Grace"],
        createdAt: "2025-08-15",
    },
    {
        id: "t2",
        projectId: "2",
        title: "Update color palette",
        status: "In Progress",
        assignedUsers: ["Charlie"],
        createdAt: "2025-08-14",
    },
    {
        id: "t5",
        projectId: "3",
        title: "Add footer section",
        status: "Done",
        assignedUsers: ["Alice", "Bob", "Charlie"],
        createdAt: "2025-08-12",
    },
];

export default function ProjectDetails() {
    const { projectId } = useLocalSearchParams();
    const [project, setProject] = useState<{ id: string; name: string; team: string } | null>(null);
    const [projectTasks, setProjectTasks] = useState<any[]>([]);

    useEffect(() => {
        const selectedProject = projects.find((p) => p.id === projectId);
        setProject(selectedProject || null);

        const tasksForProject = tasks.filter((t) => t.projectId === projectId);
        setProjectTasks(tasksForProject);
    }, [projectId]);

    if (!project) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-lg font-bold">Project not found</Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-white px-4 pt-8">
            {/* Project Header */}
            <View className="mb-6">
                <Text className="text-2xl font-bold mb-1">{project.name}</Text>
                <Text className="text-gray-600">Team: {project.team}</Text>
            </View>

            {/* Task List */}
            <View>
                <Text className="text-lg font-semibold mb-2">Tasks</Text>
                {projectTasks.length === 0 && (
                    <Text className="text-gray-500 mb-4">No tasks yet</Text>
                )}
                {projectTasks.map((task) => (
                    <TouchableOpacity
                        key={task.id}
                        className="bg-blue-50 rounded-xl p-4 mb-3 border-l-4 border-blue-400"
                        onPress={() =>
                            router.push(`/details/[taskId]?taskId=${task.id}`)
                        }
                    >
                        <View className="flex-row justify-between items-center mb-1">
                            {/* Status Checkbox */}
                            <Text className={`font-bold text-lg ${task.status === "Done" ? "line-through text-gray-400" : ""}`}>
                                {task.title}
                            </Text>
                            <Text className={`text-sm font-semibold ${task.status === "Done" ? "text-green-600" : "text-orange-600"}`}>
                                {task.status}
                            </Text>
                        </View>
                        {/* Assigned Users & Date */}
                        <View className="flex-row justify-between mt-1">
                            <Text className="text-gray-600 text-sm">
                                👥 {task.assignedUsers.length} assigned
                            </Text>
                            <Text className="text-gray-600 text-sm">
                                📅 {task.createdAt}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}
