import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WorkerOnboardingStackParamList } from './OnboardingKycScreen';

type Props = NativeStackScreenProps<WorkerOnboardingStackParamList, 'OnboardingPlatform'>;

const platforms = ['UBER', 'OLA', 'SWIGGY', 'ZOMATO', 'URBAN_COMPANY', 'UPWORK'];

export default function OnboardingPlatformScreen({ navigation }: Props) {
  return (
    <ScrollView className="flex-1 bg-white px-6 pt-16">
      <Text className="text-3xl font-bold text-gray-900">Connect platforms</Text>
      <Text className="text-gray-600 mt-2">Connect at least one platform to build your trust score.</Text>

      <View className="mt-8 gap-3">
        {platforms.map((platform) => (
          <View key={platform} className="rounded-xl border border-gray-200 p-4 flex-row justify-between items-center">
            <Text className="font-semibold text-gray-900">{platform.replace('_', ' ')}</Text>
            <TouchableOpacity className="rounded-lg bg-sky-600 px-4 py-2">
              <Text className="text-white">Connect</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate('OnboardingProfile')}
        className="mt-8 mb-10 rounded-xl bg-gray-900 py-4"
      >
        <Text className="text-center text-white font-semibold text-lg">Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
