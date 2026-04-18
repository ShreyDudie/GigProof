import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

// Placeholder screens - will be implemented
const PlaceholderScreen = ({ title }: { title: string }) => (
  <View className="flex-1 justify-center items-center">
    <Text className="text-xl">{title}</Text>
  </View>
);

const WorkerHomeScreen = () => <PlaceholderScreen title="Worker Home" />;
const IdentityScreen = () => <PlaceholderScreen title="Identity" />;
const EarningsScreen = () => <PlaceholderScreen title="Earnings" />;
const ShareScreen = () => <PlaceholderScreen title="Share" />;
const ProfileScreen = () => <PlaceholderScreen title="Profile" />;

export type WorkerTabParamList = {
  Home: undefined;
  Identity: undefined;
  Earnings: undefined;
  Share: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<WorkerTabParamList>();

function WorkerTabNavigator() {
  const { t } = useTranslation();

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
        component={WorkerHomeScreen}
        options={{
          tabBarLabel: t('home.scoreLabel'),
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '🏠' : '🏡'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Identity"
        component={IdentityScreen}
        options={{
          tabBarLabel: t('identity.credentialTypes.identity'),
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '🛡️' : '⚔️'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{
          tabBarLabel: t('earnings.avgMonthly'),
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '📈' : '📊'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Share"
        component={ShareScreen}
        options={{
          tabBarLabel: t('share.heading'),
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '📱' : '📲'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('profile.connectedPlatforms'),
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '👤' : '👥'}</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const Stack = createNativeStackNavigator();

export default function WorkerNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="WorkerTabs" component={WorkerTabNavigator} />
    </Stack.Navigator>
  );
}