import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function LenderAccountScreen() {
  return (
    <ScrollView className="flex-1 bg-white px-4 pt-14">
      <Text className="text-3xl font-bold text-gray-900">Account</Text>
      <Text className="text-gray-600 mt-1">Profile, settings, and compliance checkpoints.</Text>

      <View className="mt-4 rounded-2xl border border-gray-200 p-4">
        <Text className="font-semibold text-gray-900">Compliance</Text>
        <Text className="text-gray-700 mt-2">KYC verification: Complete</Text>
        <Text className="text-gray-700">License verification: Active</Text>
        <Text className="text-gray-700">Audit readiness: Green</Text>
      </View>
    </ScrollView>
  );
}
