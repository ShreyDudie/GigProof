import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function AdminCredentialsScreen() {
  return (
    <ScrollView className="flex-1 bg-white px-4 pt-14">
      <Text className="text-3xl font-bold text-gray-900">Credentials</Text>
      <Text className="text-gray-600 mt-1">Bulk operations and compliance monitoring.</Text>

      <View className="mt-4 rounded-2xl border border-gray-200 p-4">
        <Text className="font-semibold text-gray-900">Bulk Actions</Text>
        <Text className="text-gray-700 mt-2">Revoke expired credentials</Text>
        <Text className="text-gray-700">Recompute trust tiers</Text>
        <Text className="text-gray-700">Export audit package</Text>
      </View>
    </ScrollView>
  );
}
