import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import AdminOverviewScreen from '../screens/admin/AdminOverviewScreen';
import AdminWorkersScreen from '../screens/admin/AdminWorkersScreen';
import AdminLendersScreen from '../screens/admin/AdminLendersScreen';
import AdminCredentialsScreen from '../screens/admin/AdminCredentialsScreen';
import AdminLogsScreen from '../screens/admin/AdminLogsScreen';

export type AdminTabParamList = {
  Overview: undefined;
  Workers: undefined;
  Lenders: undefined;
  Credentials: undefined;
  Logs: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

export default function AdminNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Overview" component={AdminOverviewScreen} options={{ tabBarIcon: ({ focused }) => <Text>{focused ? '🧭' : '📊'}</Text> }} />
      <Tab.Screen name="Workers" component={AdminWorkersScreen} options={{ tabBarIcon: ({ focused }) => <Text>{focused ? '🧑' : '👷'}</Text> }} />
      <Tab.Screen name="Lenders" component={AdminLendersScreen} options={{ tabBarIcon: ({ focused }) => <Text>{focused ? '🏦' : '💼'}</Text> }} />
      <Tab.Screen name="Credentials" component={AdminCredentialsScreen} options={{ tabBarIcon: ({ focused }) => <Text>{focused ? '🪪' : '🗂️'}</Text> }} />
      <Tab.Screen name="Logs" component={AdminLogsScreen} options={{ tabBarIcon: ({ focused }) => <Text>{focused ? '🧾' : '📚'}</Text> }} />
    </Tab.Navigator>
  );
}
