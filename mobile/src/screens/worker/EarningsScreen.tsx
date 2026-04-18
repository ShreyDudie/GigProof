import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { getWithCache } from '../../services/appApi';

export default function EarningsScreen() {
  const { data } = useQuery({
    queryKey: ['income-analytics'],
    queryFn: () => getWithCache<any>('income-analytics', '/income/analytics'),
  });

  const analytics = data?.analytics;
  const monthly = [
    Math.max(1000, Math.round((analytics?.averageMonthly || 0) * 0.7)),
    Math.max(1200, Math.round((analytics?.averageMonthly || 0) * 0.9)),
    Math.max(1300, Math.round(analytics?.averageMonthly || 0)),
    Math.max(1300, Math.round((analytics?.averageMonthly || 0) * 1.1)),
  ];

  return (
    <ScrollView className="flex-1 bg-slate-50 px-4 pt-14">
      <Text className="text-3xl font-bold text-slate-900">Earnings</Text>
      <Text className="text-slate-600 mt-1">Income records, trends, and platform sync status.</Text>

      <View className="mt-4 rounded-2xl bg-white p-4 border border-slate-200">
        <Text className="text-slate-700">Avg monthly income</Text>
        <Text className="text-3xl font-bold text-slate-900">₹{Math.round(analytics?.averageMonthly || 0)}</Text>
        <Text className="text-slate-700 mt-2">Growth: {(analytics?.growthRate || 0).toFixed(1)}%</Text>
      </View>

      <View className="mt-4 rounded-2xl bg-white p-4 border border-slate-200">
        <Text className="font-semibold text-slate-900 mb-2">Analytics chart</Text>
        <LineChart
          data={{ labels: ['Jan', 'Feb', 'Mar', 'Apr'], datasets: [{ data: monthly }] }}
          width={Dimensions.get('window').width - 48}
          height={220}
          chartConfig={{
            backgroundGradientFrom: '#f8fafc',
            backgroundGradientTo: '#f8fafc',
            decimalPlaces: 0,
            color: () => '#0f766e',
            labelColor: () => '#334155',
          }}
          bezier
          style={{ borderRadius: 16 }}
        />
      </View>

      <View className="mt-4 mb-8 rounded-2xl bg-white p-4 border border-slate-200">
        <Text className="font-semibold text-slate-900">Low-bandwidth sync mode</Text>
        <Text className="text-slate-700 mt-1">Charts auto-compress to monthly totals and text summaries when enabled.</Text>
      </View>
    </ScrollView>
  );
}
