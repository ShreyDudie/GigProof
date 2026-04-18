import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getWithCache } from '../../services/appApi';
import { useAppStore } from '../../stores/appStore';

export default function HomeDashboardScreen() {
  const notifications = useAppStore((s) => s.notifications);

  const { data: incomeAnalytics } = useQuery({
    queryKey: ['income-analytics'],
    queryFn: () => getWithCache<any>('income-analytics', '/income/analytics'),
  });

  const score = useMemo(() => {
    const totalIncome = incomeAnalytics?.analytics?.totalIncome || 0;
    const growthRate = incomeAnalytics?.analytics?.growthRate || 0;
    const consistency = incomeAnalytics?.analytics?.consistencyIndex || 0;
    const base = 40 + Math.min(35, totalIncome / 5000) + Math.min(15, growthRate / 5) + Math.min(10, consistency / 10);
    return Math.max(0, Math.min(100, Math.round(base)));
  }, [incomeAnalytics]);

  const boosters = [
    { label: 'Sync one more platform', points: '+8' },
    { label: 'Add 3 verified income entries', points: '+6' },
    { label: 'Get 2 peer attestations', points: '+5' },
  ];

  return (
    <ScrollView className="flex-1 bg-stone-50 px-4 pt-14">
      <Text className="text-3xl font-bold text-stone-900">Home Dashboard</Text>
      <Text className="text-stone-600 mt-1">Recent activity, score, and quick actions.</Text>

      <View className="mt-5 rounded-2xl bg-amber-100 p-5 border border-amber-200">
        <Text className="text-amber-900 font-semibold">GigProof Score</Text>
        <Text className="text-5xl font-bold text-amber-950 mt-2">{score}</Text>
        <Text className="text-amber-900 mt-2">Trust badge: {score >= 85 ? 'Gold' : score >= 70 ? 'Silver' : 'Bronze'}</Text>
      </View>

      <View className="mt-5 rounded-2xl bg-white p-4 border border-stone-200">
        <Text className="font-semibold text-stone-900 mb-2">Smart score boosters</Text>
        {boosters.map((b) => (
          <View key={b.label} className="flex-row justify-between py-2 border-b border-stone-100">
            <Text className="text-stone-700">{b.label}</Text>
            <Text className="text-emerald-700 font-semibold">{b.points}</Text>
          </View>
        ))}
      </View>

      <View className="mt-5 rounded-2xl bg-white p-4 border border-stone-200">
        <Text className="font-semibold text-stone-900">Quick actions</Text>
        <View className="flex-row gap-2 mt-3">
          <TouchableOpacity className="flex-1 rounded-xl bg-indigo-600 py-3">
            <Text className="text-white text-center font-semibold">Sync platforms</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 rounded-xl bg-teal-600 py-3">
            <Text className="text-white text-center font-semibold">Request attestation</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="mt-5 mb-8 rounded-2xl bg-white p-4 border border-stone-200">
        <Text className="font-semibold text-stone-900">Realtime notifications ({notifications.filter((n) => !n.read).length})</Text>
        {notifications.slice(0, 4).map((n) => (
          <Text key={n.id} className="text-stone-700 mt-2">• {n.title}: {n.message}</Text>
        ))}
      </View>
    </ScrollView>
  );
}
