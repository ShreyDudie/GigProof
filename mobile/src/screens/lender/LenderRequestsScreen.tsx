import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getWithCache } from '../../services/appApi';

export default function LenderRequestsScreen() {
  const { data } = useQuery({
    queryKey: ['lender-requests'],
    queryFn: () => getWithCache<any[]>('lender-requests', '/access/requests'),
  });

  return (
    <ScrollView className="flex-1 bg-gray-50 px-4 pt-14">
      <Text className="text-3xl font-bold text-gray-900">Requests</Text>
      <Text className="text-gray-600 mt-1">Pending and approved access request management.</Text>

      {(data || []).map((req: any) => (
        <View key={req.id} className="mt-4 rounded-xl bg-white border border-gray-200 p-4">
          <Text className="font-semibold text-gray-900">{req.purpose}</Text>
          <Text className="text-gray-700 mt-1">Status: {req.status}</Text>
          <Text className="text-gray-700">Scope: {(req.scope_requested || []).join(', ')}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
