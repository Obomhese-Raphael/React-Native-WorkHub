import icons from '@/constants/icons';
import React from 'react';
import { Image, TextInput, View } from 'react-native';

interface Props {
  placeholder: string;
  onPress?: () => void;
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmitEditing?: () => void;
}

const SearchBar = ({ onPress, placeholder, value, onChangeText, onSubmitEditing }: Props) => {
  return (
    <View className='flex-row items-center bg-dark-200 px-5 py-2 border-gray-200 border w-[100%] rounded-2xl'>
      <Image source={icons.search} className='size-5' resizeMode='contain' tintColor={'#000'} />
      <TextInput
        onPress={onPress}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        placeholderTextColor={'#a8b5db'} 
        className='flex-1 ml-2 text-white rounded-full'
      />
    </View>
  )
}

export default SearchBar