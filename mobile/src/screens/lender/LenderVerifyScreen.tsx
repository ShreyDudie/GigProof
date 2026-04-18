import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';

export default function LenderVerifyScreen() {
  const [workerId, setWorkerId] = useState('');
  const [accessToken, setAccessToken] = useState('');

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/verify/worker', { params: { workerId, accessToken } });
      return response.data.data;
    },
  });

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-14">
      <Text className="text-3xl font-bold text-gray-900">Verify Worker</Text>
      <Text className="text-gray-600 mt-1">Scan QR or paste worker ID and access token.</Text>

      <TextInput value={workerId} onChangeText={setWorkerId} placeholder="Worker ID" className="mt-5 rounded-xl border border-gray-300 px-4 py-3" />
      <TextInput value={accessToken} onChangeText={setAccessToken} placeholder="Access token" className="mt-3 rounded-xl border border-gray-300 px-4 py-3" />

      <TouchableOpacity onPress={() => verifyMutation.mutate()} className="mt-4 rounded-xl bg-black py-3">
        <Text className="text-white text-center">Verify</Text>
      </TouchableOpacity>

      {verifyMutation.data && (
        <View className="mt-5 rounded-2xl border border-gray-200 p-4">
          <Text className="font-semibold text-gray-900">Approval workflow data</Text>
          <Text className="text-gray-700 mt-2">Risk score: {verifyMutation.data.riskAssessment?.score}</Text>
        </View>
      )}
    </ScrollView>
  );
}
