import SearchBar from "@/components/SearchBar";
import icons from "@/constants/icons";
import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Image, View, Text, ScrollView, TouchableOpacity } from "react-native";

// Dummy Data
const teams = [
    { id: '1', name: 'Marketing', members: 5 },
    { id: '2', name: 'Engineering', members: 8 },
    { id: '3', name: 'Design', members: 4 },
    { id: '4', name: 'Development', members: 10 },
    { id: '5', name: 'Education', members: 3 },
];

const projects = [
    { id: '1', name: 'Website Redesign', team: 'Design', tasksOpen: 12 },
    { id: '2', name: 'New App Feature', team: 'Engineering', tasksOpen: 7 },
    { id: '3', name: 'Social Campaign', team: 'Marketing', tasksOpen: 4 },
    { id: '4', name: 'Learning Websockets', team: 'Development', tasksOpen: 5 },
    { id: '5', name: 'Studying for the exam', team: 'Education', tasksOpen: 3 },
];

const taskSummary = {
    todo: 8,
    inProgress: 5,
    done: 12,
    overdue: 4,
    upcoming: 3,
    reminders: 1
};

export default function HomeScreen() {
    const { user } = useUser();
    const [hourGreeting, setHourGreeting] = useState('')
    const getTimeOfDay = () => {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 12) {
            setHourGreeting("Morning");
        } else if (hour >= 12 && hour < 18) {
            setHourGreeting("Afternoon");
        } else {
            setHourGreeting("Evening");
        }
    }

    useEffect(() => {
        getTimeOfDay();
    }, []);
    return (
        <ScrollView className="flex-1 bg-white px-4 pt-8">
            <View>
                {/* HEADER SECTION */}
                <View className="mb-36">
                    {/*  */}
                    <View className="flex flex-row justify-between px-2 text-xl mb-6 mt-5">
                        <Text className="font-bold text-center justify-center flex my-auto">Good {hourGreeting}, {user?.firstName}</Text>
                        {/* User Button from clerk */}
                        <View className="flex-row items-center">
                            <TouchableOpacity onPress={() => router.push("/profile")}>
                                <Image
                                    source={user?.imageUrl ? { uri: user.imageUrl } : icons?.person}
                                    className="w-10 h-10 rounded-full"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* SEARCH */}
                    <View>
                        <View className="flex flex-row gap-2 justify-between my-auto items-center">
                            <SearchBar placeholder="Search for your Projects" />
                            <TouchableOpacity
                                className="flex-none w-12 h-14 border border-gray-400 bg-gray-200 rounded-md items-center justify-center mr-3"
                            >
                                <Image
                                    source={icons.filter}
                                    className="w-7 h-7"
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* TEAMS */}
                    <View>
                        <Text className="text-lg font-semibold mb-2 mt-10">Your Teams</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="mb-6"
                        >
                            {
                                teams.map((team, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        className="bg-blue-100 rounded-xl p-4 mr-4 w-40"
                                        onPress={() => console.log(`Go to Team ${team.name}`)}
                                    >
                                        <Text className="font-bold text-lg">{team.name}</Text>
                                        <Text className="text-gray-600">{team.members}</Text>
                                    </TouchableOpacity>
                                ))
                            }
                        </ScrollView>
                    </View>

                    {/* TASKS SUMMARIES */}
                    <View className="mb-2">
                        <Text className="text-lg font-semibold mb-2">Task Summaries</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="mb-6 gap-4"
                            contentContainerStyle={{ paddingHorizontal: 4 }}
                        >
                            <View className="bg-yellow-100 rounded-xl p-4 w-28 items-center mr-4">
                                <Text className="font-bold text-xl">{taskSummary.todo}</Text>
                                <Text className="text-gray-600">To Do</Text>
                            </View>
                            <View className="bg-slate-300 rounded-xl p-4 w-28 items-center mr-4">
                                <Text className="font-bold text-xl">{taskSummary.upcoming}</Text>
                                <Text className="text-gray-600">Upcoming</Text>
                            </View>
                            <View className="bg-indigo-100 rounded-xl p-4 w-28 items-center mr-4">
                                <Text className="font-bold text-xl">{taskSummary.reminders}</Text>
                                <Text className="text-gray-600">Reminders</Text>
                            </View>
                            <View className="bg-orange-100 rounded-xl p-4 w-28 items-center mr-4">
                                <Text className="font-bold text-xl">{taskSummary.inProgress}</Text>
                                <Text className="text-gray-600">In Progress</Text>
                            </View>
                            <View className="bg-red-100 rounded-xl p-4 w-28 items-center mr-4">
                                <Text className="font-bold text-xl">{taskSummary.overdue}</Text>
                                <Text className="text-gray-600">Overdue</Text>
                            </View>
                            <View className="bg-green-100 rounded-xl p-4 w-28 items-center">
                                <Text className="font-bold text-xl">{taskSummary.done}</Text>
                                <Text className="text-gray-600">Done</Text>
                            </View>
                        </ScrollView>
                    </View>

                    {/* PROJECTS */}
                    <View>
                        <Text className="text-lg font-semibold mb-2">Projects</Text>
                        <View className="mb-5">
                            {projects.map(project => (
                                <TouchableOpacity
                                    key={project.id}
                                    className="bg-green-100 rounded-xl p-4 mb-3"
                                    onPress={() =>
                                        router.push({
                                            pathname: "/details/[projectId]",
                                            params: { projectId: project.id },
                                        })
                                    }

                                >
                                    <Text className="font-bold text-lg">{project.name}</Text>
                                    <Text className="text-gray-600">{project.team} • {project.tasksOpen} open tasks</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView >
    );
}
