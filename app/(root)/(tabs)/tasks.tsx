import { Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

const Tasks = () => {
  return (
    <SafeAreaView className='flex-1 items-center justify-center bg-white'>
      <Text className='font-bold text-xl'>Tasks Page</Text>
    </SafeAreaView>
  )
}

export default Tasks