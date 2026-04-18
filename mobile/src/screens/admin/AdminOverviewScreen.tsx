import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getWithCache } from '../../services/appApi';

export default function AdminOverviewScreen() {
  const { data } = useQuery({
    queryKey: ['admin-health'],
    queryFn: () => getWithCache<any>('admin-health', '/verify/admin/health'),
  });

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-14">
      <Text className="text-3xl font-bold text-gray-900">Admin Overview</Text>
      <Text className="text-gray-600 mt-1">System metrics, user stats, and health.</Text>

      <View className="mt-4 rounded-2xl border border-gray-200 p-4">
        <Text className="text-gray-700">Users: {data?.users?.total || 0}</Text>
        <Text className="text-gray-700 mt-1">Workers: {data?.users?.workers || 0}</Text>
        <Text className="text-gray-700 mt-1">Lenders: {data?.users?.lenders || 0}</Text>
      </View>
    </ScrollView>
  );
}
