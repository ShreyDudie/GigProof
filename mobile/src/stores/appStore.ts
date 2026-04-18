import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface AppState {
  onboardingComplete: boolean;
  lowBandwidthMode: boolean;
  offlineMode: boolean;
  notifications: AppNotification[];
  setOnboardingComplete: (done: boolean) => void;
  setLowBandwidthMode: (enabled: boolean) => void;
  setOfflineMode: (enabled: boolean) => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      onboardingComplete: false,
      lowBandwidthMode: false,
      offlineMode: false,
      notifications: [],
      setOnboardingComplete: (done) => set({ onboardingComplete: done }),
      setLowBandwidthMode: (enabled) => set({ lowBandwidthMode: enabled }),
      setOfflineMode: (enabled) => set({ offlineMode: enabled }),
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              id: `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
              createdAt: new Date().toISOString(),
              read: false,
              ...notification,
            },
            ...state.notifications,
          ].slice(0, 100),
        })),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
