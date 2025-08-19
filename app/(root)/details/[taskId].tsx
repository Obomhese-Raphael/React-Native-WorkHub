import { View, Text } from 'react-native'
import React from 'react'
import { useLocalSearchParams } from 'expo-router'

const TaskId = () => {
    const { id } = useLocalSearchParams();
    return (
        <View>
            <Text>TaskId {id}</Text>
        </View>
    )
}

export default TaskId