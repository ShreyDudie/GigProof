import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';
import './src/utils/i18n';
import { queryClient } from './src/services/queryClient';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/stores/authStore';
import { startRealtimePolling, stopRealtimePolling } from './src/services/realtime';

export default function App() {
  const role = useAuthStore((s) => s.user?.role);

  useEffect(() => {
    startRealtimePolling(role);
    return () => stopRealtimePolling();
  }, [role]);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <AppNavigator />
        <StatusBar style="dark" />
      </NavigationContainer>
    </QueryClientProvider>
  );
}
