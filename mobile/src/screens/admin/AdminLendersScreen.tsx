import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getWithCache } from '../../services/appApi';

export default function AdminLendersScreen() {
  const { data } = useQuery({
    queryKey: ['admin-lenders'],
    queryFn: () => getWithCache<any[]>('admin-lenders', '/verify/admin/lenders'),
  });

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-14">
      <Text className="text-3xl font-bold text-gray-900">Lenders</Text>
      <Text className="text-gray-600 mt-1">Registration approvals and license verification.</Text>

      {(data || []).slice(0, 20).map((l: any) => (
        <View key={l.id} className="mt-3 rounded-xl border border-gray-200 p-4">
          <Text className="font-semibold text-gray-900">{l.org_name}</Text>
          <Text className="text-gray-700">Verified: {String(l.verified)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
