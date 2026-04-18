import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getWithCache } from '../../services/appApi';

export default function AdminLogsScreen() {
  const { data } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => getWithCache<any[]>('admin-logs', '/access/consent-logs'),
  });

  return (
    <ScrollView className="flex-1 bg-zinc-50 px-4 pt-14">
      <Text className="text-3xl font-bold text-zinc-900">Logs</Text>
      <Text className="text-zinc-600 mt-1">Audit trails, security events, and API usage.</Text>

      {(data || []).slice(0, 30).map((log: any) => (
        <View key={log.id} className="mt-3 rounded-xl bg-white border border-zinc-200 p-3">
          <Text className="text-zinc-900 font-semibold">{log.action}</Text>
          <Text className="text-zinc-700">Worker: {log.worker_id}</Text>
          <Text className="text-zinc-700">When: {new Date(log.timestamp).toLocaleString()}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
