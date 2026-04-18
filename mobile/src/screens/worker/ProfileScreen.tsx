import React from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { useAppStore } from '../../stores/appStore';
import { flushOfflineQueue } from '../../services/appApi';
import { useAuthStore } from '../../stores/authStore';

export default function ProfileScreen() {
  const { lowBandwidthMode, setLowBandwidthMode, offlineMode, setOfflineMode } = useAppStore();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const syncQueue = async () => {
    const result = await flushOfflineQueue();
    Alert.alert('Offline sync', `Synced: ${result.synced}, Failed: ${result.failed}`);
  };

  return (
    <ScrollView className="flex-1 bg-zinc-50 px-4 pt-14">
      <Text className="text-3xl font-bold text-zinc-900">Profile</Text>
      <Text className="text-zinc-600 mt-1">Settings, language, and security preferences.</Text>

      <View className="mt-4 rounded-2xl bg-white p-4 border border-zinc-200">
        <Text className="font-semibold text-zinc-900">Low bandwidth mode</Text>
        <Text className="text-zinc-600 mt-1">Reduces payload size and image quality.</Text>
        <Switch value={lowBandwidthMode} onValueChange={setLowBandwidthMode} className="mt-2" />
      </View>

      <View className="mt-4 rounded-2xl bg-white p-4 border border-zinc-200">
        <Text className="font-semibold text-zinc-900">Offline mode support</Text>
        <Text className="text-zinc-600 mt-1">Queue actions and sync when network is stable.</Text>
        <Switch value={offlineMode} onValueChange={setOfflineMode} className="mt-2" />
        <TouchableOpacity onPress={syncQueue} className="mt-3 rounded-lg bg-emerald-700 py-3">
          <Text className="text-white text-center">Sync queued actions</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={clearAuth} className="mt-6 mb-8 rounded-xl bg-red-600 py-4">
        <Text className="text-center text-white font-semibold">Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
