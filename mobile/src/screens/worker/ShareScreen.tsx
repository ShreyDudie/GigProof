import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useQuery } from '@tanstack/react-query';
import { getWithCache } from '../../services/appApi';

export default function ShareScreen() {
  const [showQr, setShowQr] = useState(false);

  const { data: requests } = useQuery({
    queryKey: ['access-requests'],
    queryFn: () => getWithCache<any[]>('access-requests', '/access/requests'),
  });

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-14">
      <Text className="text-3xl font-bold text-gray-900">Share</Text>
      <Text className="text-gray-600 mt-1">Manage lender access requests and generate QR links.</Text>

      <View className="mt-4 rounded-2xl border border-gray-200 p-4">
        <Text className="font-semibold text-gray-900">Access requests</Text>
        {(requests || []).slice(0, 5).map((req: any) => (
          <View key={req.id} className="mt-3 rounded-xl bg-gray-50 p-3">
            <Text className="font-semibold text-gray-800">{req.purpose}</Text>
            <Text className="text-gray-600">Status: {req.status}</Text>
          </View>
        ))}
      </View>

      <View className="mt-4 rounded-2xl border border-gray-200 p-4">
        <Text className="font-semibold text-gray-900">QR generation</Text>
        <TouchableOpacity
          onPress={() => setShowQr((s) => !s)}
          className="mt-3 rounded-lg bg-black px-4 py-3"
        >
          <Text className="text-white text-center">{showQr ? 'Hide QR' : 'Show QR'}</Text>
        </TouchableOpacity>

        {showQr && (
          <View className="mt-4 items-center">
            <QRCode value="gigproof://share/access" size={160} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}
