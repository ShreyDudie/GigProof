import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function AdminWorkersScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50 px-4 pt-14">
      <Text className="text-3xl font-bold text-gray-900">Workers</Text>
      <Text className="text-gray-600 mt-1">User management, KYC approvals, and fraud alerts.</Text>

      <View className="mt-4 rounded-2xl bg-white border border-gray-200 p-4">
        <Text className="font-semibold text-gray-900">Fraud alerts</Text>
        <Text className="text-gray-700 mt-2">No high-risk workers right now.</Text>
      </View>
    </ScrollView>
  );
}
