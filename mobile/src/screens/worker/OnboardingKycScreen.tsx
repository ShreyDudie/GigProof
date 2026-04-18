import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type WorkerOnboardingStackParamList = {
  OnboardingKyc: undefined;
  OnboardingPlatform: undefined;
  OnboardingProfile: undefined;
  WorkerTabs: undefined;
};

type Props = NativeStackScreenProps<WorkerOnboardingStackParamList, 'OnboardingKyc'>;

export default function OnboardingKycScreen({ navigation }: Props) {
  const [aadhaarMasked, setAadhaarMasked] = useState('');

  const goNext = () => {
    if (aadhaarMasked.replace(/\D/g, '').length < 12) {
      Alert.alert('KYC', 'Please enter a valid Aadhaar number format.');
      return;
    }
    navigation.navigate('OnboardingPlatform');
  };

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <Text className="text-3xl font-bold text-gray-900">Verify your identity</Text>
      <Text className="text-gray-600 mt-2">Aadhaar is masked and stored as a hash only.</Text>

      <View className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <Text className="text-emerald-700 font-semibold">KYC Flow</Text>
        <Text className="text-emerald-800 mt-1">1. Aadhaar OTP</Text>
        <Text className="text-emerald-800">2. Face match</Text>
        <Text className="text-emerald-800">3. Confirm details</Text>
      </View>

      <TextInput
        value={aadhaarMasked}
        onChangeText={setAadhaarMasked}
        placeholder="XXXX-XXXX-XXXX"
        keyboardType="number-pad"
        className="mt-8 rounded-xl border border-gray-300 px-4 py-4 text-lg"
      />

      <TouchableOpacity onPress={goNext} className="mt-8 rounded-xl bg-emerald-600 py-4">
        <Text className="text-center text-white font-semibold text-lg">Continue</Text>
      </TouchableOpacity>
    </View>
  );
}
