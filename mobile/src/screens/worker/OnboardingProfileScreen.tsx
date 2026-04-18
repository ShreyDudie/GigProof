import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WorkerOnboardingStackParamList } from './OnboardingKycScreen';
import { useAppStore } from '../../stores/appStore';

type Props = NativeStackScreenProps<WorkerOnboardingStackParamList, 'OnboardingProfile'>;

export default function OnboardingProfileScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('Hindi');
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete);

  const finish = () => {
    setOnboardingComplete(true);
    navigation.replace('WorkerTabs');
  };

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <Text className="text-3xl font-bold text-gray-900">Set up your profile</Text>
      <Text className="text-gray-600 mt-2">This helps lenders understand your work history quickly.</Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Full name"
        className="mt-8 rounded-xl border border-gray-300 px-4 py-4 text-lg"
      />
      <TextInput
        value={language}
        onChangeText={setLanguage}
        placeholder="Preferred language"
        className="mt-4 rounded-xl border border-gray-300 px-4 py-4 text-lg"
      />

      <TouchableOpacity onPress={finish} className="mt-8 rounded-xl bg-indigo-600 py-4">
        <Text className="text-center text-white font-semibold text-lg">Finish onboarding</Text>
      </TouchableOpacity>
    </View>
  );
}
