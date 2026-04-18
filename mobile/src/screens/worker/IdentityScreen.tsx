import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'react-native-qrcode-svg';
import { getWithCache } from '../../services/appApi';

export default function IdentityScreen() {
  const { data } = useQuery({
    queryKey: ['credentials'],
    queryFn: () => getWithCache<any[]>('credentials', '/credentials'),
  });

  const credentials = Array.isArray(data) ? data : [];

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-14">
      <Text className="text-3xl font-bold text-gray-900">Identity</Text>
      <Text className="text-gray-600 mt-1">Credentials, attestations, and secure sharing.</Text>

      <View className="mt-4 rounded-2xl border border-gray-200 p-4">
        <Text className="font-semibold text-gray-900">Trust badges</Text>
        <Text className="text-gray-700 mt-2">Income Verified • KYC Verified • Peer Endorsed</Text>
      </View>

      <View className="mt-4 rounded-2xl border border-gray-200 p-4">
        <Text className="font-semibold text-gray-900">Credential list</Text>
        {credentials.length === 0 && <Text className="text-gray-600 mt-2">No credentials yet.</Text>}
        {credentials.map((cred: any) => (
          <View key={cred.id} className="mt-3 rounded-xl bg-gray-50 p-3">
            <Text className="font-semibold text-gray-900">{cred.type} • {cred.tier}</Text>
            <Text className="text-gray-600">Issuer: {cred.issuer}</Text>
          </View>
        ))}
      </View>

      <View className="mt-4 mb-8 rounded-2xl border border-gray-200 p-4 items-center">
        <Text className="font-semibold text-gray-900 mb-3">QR sharing</Text>
        <QRCode value="gigproof://worker/public-profile" size={150} />
        <TouchableOpacity className="mt-4 rounded-lg bg-gray-900 px-4 py-2">
          <Text className="text-white">Share public profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
