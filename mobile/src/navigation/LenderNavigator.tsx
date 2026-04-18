import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';

const PlaceholderScreen = ({ title }: { title: string }) => (
  <View className="flex-1 justify-center items-center">
    <Text className="text-xl">{title}</Text>
  </View>
);

const LenderDashboardScreen = () => <PlaceholderScreen title="Lender Dashboard" />;

const Stack = createNativeStackNavigator();

export default function LenderNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="LenderDashboard" component={LenderDashboardScreen} />
    </Stack.Navigator>
  );
}