import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import LenderDashboardScreen from '../screens/lender/LenderDashboardScreen';
import LenderVerifyScreen from '../screens/lender/LenderVerifyScreen';
import LenderRequestsScreen from '../screens/lender/LenderRequestsScreen';
import LenderAccountScreen from '../screens/lender/LenderAccountScreen';

export type LenderTabParamList = {
  Dashboard: undefined;
  Verify: undefined;
  Requests: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<LenderTabParamList>();

export default function LenderNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Dashboard"
        component={LenderDashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <Text>{focused ? '📌' : '📍'}</Text> }}
      />
      <Tab.Screen
        name="Verify"
        component={LenderVerifyScreen}
        options={{ tabBarIcon: ({ focused }) => <Text>{focused ? '✅' : '🔍'}</Text> }}
      />
      <Tab.Screen
        name="Requests"
        component={LenderRequestsScreen}
        options={{ tabBarIcon: ({ focused }) => <Text>{focused ? '📨' : '📩'}</Text> }}
      />
      <Tab.Screen
        name="Account"
        component={LenderAccountScreen}
        options={{ tabBarIcon: ({ focused }) => <Text>{focused ? '🏢' : '🏦'}</Text> }}
      />
    </Tab.Navigator>
  );
}
