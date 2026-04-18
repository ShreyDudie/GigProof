import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/auth/SplashScreen';
import LanguageSelectScreen from '../screens/auth/LanguageSelectScreen';
import PhoneEntryScreen from '../screens/auth/PhoneEntryScreen';
import OTPVerifyScreen from '../screens/auth/OTPVerifyScreen';

export type AuthStackParamList = {
  Splash: undefined;
  LanguageSelect: undefined;
  PhoneEntry: undefined;
  OTPVerify: { phone: string; role: 'WORKER' | 'LENDER' | 'ADMIN' };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} />
      <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
      <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />
    </Stack.Navigator>
  );
}