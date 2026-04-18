import React, { useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuthStore } from '../../stores/authStore';
import * as SecureStore from 'expo-secure-store';

type SplashScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Splash'>;

export default function SplashScreen() {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { setAuth } = useAuthStore();
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Check for existing token after 2 seconds
    const timer = setTimeout(async () => {
      try {
        const accessToken = await SecureStore.getItemAsync('accessToken');
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const userData = await SecureStore.getItemAsync('userData');

        if (accessToken && refreshToken && userData) {
          const user = JSON.parse(userData);
          setAuth(user, accessToken, refreshToken);

          // Navigate to appropriate role home
          // For now, navigate to LanguageSelect
          navigation.replace('LanguageSelect');
        } else {
          navigation.replace('LanguageSelect');
        }
      } catch (error) {
        navigation.replace('LanguageSelect');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation, setAuth, fadeAnim]);

  return (
    <View className="flex-1 justify-center items-center bg-blue-50">
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text className="text-4xl font-bold text-blue-600 mb-4">GigProof</Text>
        <Text className="text-lg text-gray-600">Your work. Your proof. Your identity.</Text>
      </Animated.View>
    </View>
  );
}