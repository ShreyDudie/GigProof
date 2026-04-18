import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getWithCache } from '../../services/appApi';

export default function LenderDashboardScreen() {
  const { data } = useQuery({
    queryKey: ['lender-dashboard'],
    queryFn: () => getWithCache<any>('lender-dashboard', '/verify/lender/dashboard'),
  });

  const stats = data?.stats || {};

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-14">
      <Text className="text-3xl font-bold text-gray-900">Lender Dashboard</Text>
      <Text className="text-gray-600 mt-1">Access requests, analytics, and worker lookup.</Text>

      <View className="mt-4 rounded-2xl border border-gray-200 p-4">
        <Text className="text-gray-700">Total Requests: {stats.totalRequests || 0}</Text>
        <Text className="text-gray-700 mt-1">Pending: {stats.pendingRequests || 0}</Text>
        <Text className="text-gray-700 mt-1">Approved: {stats.approvedRequests || 0}</Text>
      </View>
    </ScrollView>
  );
}
