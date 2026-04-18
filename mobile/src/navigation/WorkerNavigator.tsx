import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import HomeDashboardScreen from '../screens/worker/HomeDashboardScreen';
import IdentityScreen from '../screens/worker/IdentityScreen';
import EarningsScreen from '../screens/worker/EarningsScreen';
import ShareScreen from '../screens/worker/ShareScreen';
import ProfileScreen from '../screens/worker/ProfileScreen';
import OnboardingKycScreen, { WorkerOnboardingStackParamList } from '../screens/worker/OnboardingKycScreen';
import OnboardingPlatformScreen from '../screens/worker/OnboardingPlatformScreen';
import OnboardingProfileScreen from '../screens/worker/OnboardingProfileScreen';
import { useAppStore } from '../stores/appStore';

export type WorkerTabParamList = {
  Home: undefined;
  Identity: undefined;
  Earnings: undefined;
  Share: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<WorkerTabParamList>();
const Stack = createNativeStackNavigator<WorkerOnboardingStackParamList>();

function WorkerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e5e5e5',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeDashboardScreen}
        options={{ tabBarIcon: ({ focused }: { focused: boolean }) => <Text style={{ fontSize: 18 }}>{focused ? '🏠' : '🏡'}</Text> }}
      />
      <Tab.Screen
        name="Identity"
        component={IdentityScreen}
        options={{ tabBarIcon: ({ focused }: { focused: boolean }) => <Text style={{ fontSize: 18 }}>{focused ? '🛡️' : '📇'}</Text> }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ tabBarIcon: ({ focused }: { focused: boolean }) => <Text style={{ fontSize: 18 }}>{focused ? '📈' : '📊'}</Text> }}
      />
      <Tab.Screen
        name="Share"
        component={ShareScreen}
        options={{ tabBarIcon: ({ focused }: { focused: boolean }) => <Text style={{ fontSize: 18 }}>{focused ? '🔗' : '📤'}</Text> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }: { focused: boolean }) => <Text style={{ fontSize: 18 }}>{focused ? '👤' : '👥'}</Text> }}
      />
    </Tab.Navigator>
  );
}

export default function WorkerNavigator() {
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!onboardingComplete ? (
        <>
          <Stack.Screen name="OnboardingKyc" component={OnboardingKycScreen} />
          <Stack.Screen name="OnboardingPlatform" component={OnboardingPlatformScreen} />
          <Stack.Screen name="OnboardingProfile" component={OnboardingProfileScreen} />
          <Stack.Screen name="WorkerTabs" component={WorkerTabNavigator} />
        </>
      ) : (
        <Stack.Screen name="WorkerTabs" component={WorkerTabNavigator} />
      )}
    </Stack.Navigator>
  );
}
