import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Keyboard } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import * as SecureStore from 'expo-secure-store';

type OTPVerifyScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OTPVerify'>;
type OTPVerifyScreenRouteProp = RouteProp<AuthStackParamList, 'OTPVerify'>;

export default function OTPVerifyScreen() {
  const navigation = useNavigation<OTPVerifyScreenNavigationProp>();
  const route = useRoute<OTPVerifyScreenRouteProp>();
  const { t } = useTranslation();
  const { setAuth } = useAuthStore();

  const { phone, role } = route.params;
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: { phone: string; otp: string }) => {
      const response = await api.post('/auth/verify-otp', data);
      return response.data;
    },
    onSuccess: async (data) => {
      const { accessToken, refreshToken, user } = data.data;

      // Store tokens securely
      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      await SecureStore.setItemAsync('userData', JSON.stringify(user));

      setAuth(user, accessToken, refreshToken);

      // Navigate based on role - for now, just show success
      Alert.alert('Success', 'Login successful!', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to appropriate screen based on role
            // For now, stay on this screen
          },
        },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.error || t('errors.otpInvalid'));
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: async (data: { phone: string; role: string }) => {
      const response = await api.post('/auth/send-otp', data);
      return response.data;
    },
    onSuccess: () => {
      setCountdown(30);
      setCanResend(false);
      Alert.alert('Success', 'OTP sent successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.error || t('errors.generic'));
    },
  });

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = otp.split('');
    newOtp[index] = value;
    setOtp(newOtp.join(''));

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when 6 digits entered
    if (newOtp.join('').length === 6) {
      Keyboard.dismiss();
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleVerifyOtp = (otpValue: string) => {
    if (otpValue.length !== 6) {
      Alert.alert('Error', 'Please enter 6-digit OTP');
      return;
    }

    verifyOtpMutation.mutate({
      phone,
      otp: otpValue,
    });
  };

  const handleResendOtp = () => {
    resendOtpMutation.mutate({
      phone,
      role,
    });
  };

  return (
    <View className="flex-1 bg-white px-6 pt-12">
      <View className="flex-1 justify-center">
        <Text className="text-2xl font-bold text-center mb-4 text-gray-800">
          {t('auth.enterOtp')}
        </Text>

        <Text className="text-center mb-8 text-gray-600">
          We sent a 6-digit code to {phone}
        </Text>

        {/* OTP Input Boxes */}
        <View className="flex-row justify-center space-x-2 mb-8">
          {Array.from({ length: 6 }, (_, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref!)}
              value={otp[index] || ''}
              onChangeText={(value) => handleOtpChange(value, index)}
              keyboardType="numeric"
              maxLength={1}
              className="w-12 h-12 border-2 border-gray-300 rounded-lg text-center text-xl font-bold"
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Countdown Timer */}
        <View className="items-center mb-6">
          {canResend ? (
            <TouchableOpacity onPress={handleResendOtp}>
              <Text className="text-blue-500 font-semibold">
                {t('auth.resendOtp')}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text className="text-gray-600">
              Resend OTP in {countdown}s
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => handleVerifyOtp(otp)}
          disabled={verifyOtpMutation.isPending || otp.length !== 6}
          className={`bg-blue-500 py-4 rounded-lg ${
            verifyOtpMutation.isPending || otp.length !== 6 ? 'opacity-50' : ''
          }`}
        >
          <Text className="text-white text-center text-lg font-semibold">
            {verifyOtpMutation.isPending ? t('common.loading') : t('auth.verifyOtp')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}