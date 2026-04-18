import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../stores/authStore';
import AuthNavigator from './AuthNavigator';
import WorkerNavigator from './WorkerNavigator';
import LenderNavigator from './LenderNavigator';
import AdminNavigator from './AdminNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  switch (user?.role) {
    case 'WORKER':
      return <WorkerNavigator />;
    case 'LENDER':
      return <LenderNavigator />;
    case 'ADMIN':
      return <AdminNavigator />;
    default:
      return <AuthNavigator />;
  }
}