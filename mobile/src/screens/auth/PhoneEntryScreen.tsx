import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';

type PhoneEntryScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'PhoneEntry'>;

export default function PhoneEntryScreen() {
  const navigation = useNavigation<PhoneEntryScreenNavigationProp>();
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'WORKER' | 'LENDER' | 'ADMIN'>('WORKER');
  const [orgName, setOrgName] = useState('');

  const sendOtpMutation = useMutation({
    mutationFn: async (data: { phone: string; role: string }) => {
      const response = await api.post('/auth/send-otp', data);
      return response.data;
    },
    onSuccess: () => {
      navigation.navigate('OTPVerify', { phone: `+91${phone}`, role });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.error || t('errors.generic'));
    },
  });

  const handleSendOtp = () => {
    if (phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (role === 'LENDER' && !orgName.trim()) {
      Alert.alert('Error', 'Please enter organization name');
      return;
    }

    sendOtpMutation.mutate({
      phone: `+91${phone}`,
      role,
    });
  };

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    // Limit to 10 digits
    const limited = cleaned.substring(0, 10);
    setPhone(limited);
  };

  return (
    <View className="flex-1 bg-white px-6 pt-12">
      <View className="flex-1 justify-center">
        <Text className="text-2xl font-bold text-center mb-8 text-gray-800">
          {t('auth.welcome')}
        </Text>

        <Text className="text-lg text-center mb-8 text-gray-600">
          {t('auth.enterPhone')}
        </Text>

        {/* Role Selection */}
        <View className="flex-row mb-6">
          <TouchableOpacity
            onPress={() => setRole('WORKER')}
            className={`flex-1 py-3 rounded-l-lg border ${
              role === 'WORKER' ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
            }`}
          >
            <Text className={`text-center font-semibold ${
              role === 'WORKER' ? 'text-white' : 'text-gray-700'
            }`}>
              Worker
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setRole('LENDER')}
            className={`flex-1 py-3 rounded-r-lg border-t border-b border-r ${
              role === 'LENDER' ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
            }`}
          >
            <Text className={`text-center font-semibold ${
              role === 'LENDER' ? 'text-white' : 'text-gray-700'
            }`}>
              Lender
            </Text>
          </TouchableOpacity>
        </View>

        {/* Organization Name for Lender */}
        {role === 'LENDER' && (
          <TextInput
            placeholder="Organization Name"
            value={orgName}
            onChangeText={setOrgName}
            className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-lg"
          />
        )}

        {/* Phone Input */}
        <View className="flex-row items-center border border-gray-300 rounded-lg mb-6">
          <Text className="px-4 py-3 text-lg text-gray-600">+91</Text>
          <TextInput
            placeholder={t('auth.phonePlaceholder')}
            value={phone}
            onChangeText={formatPhoneNumber}
            keyboardType="numeric"
            maxLength={10}
            className="flex-1 px-4 py-3 text-lg"
            autoFocus
          />
        </View>

        <TouchableOpacity
          onPress={handleSendOtp}
          disabled={sendOtpMutation.isPending}
          className={`bg-blue-500 py-4 rounded-lg ${
            sendOtpMutation.isPending ? 'opacity-50' : ''
          }`}
        >
          <Text className="text-white text-center text-lg font-semibold">
            {sendOtpMutation.isPending ? t('common.loading') : t('auth.sendOtp')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}