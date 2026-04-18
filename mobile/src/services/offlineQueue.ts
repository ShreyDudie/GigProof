import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QueuedAction {
  id: string;
  endpoint: string;
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  payload?: any;
}

const QUEUE_KEY = 'offline-action-queue';

export async function enqueueAction(action: Omit<QueuedAction, 'id'>): Promise<void> {
  const current = await getQueuedActions();
  current.push({
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    ...action,
  });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(current));
}

export async function getQueuedActions(): Promise<QueuedAction[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? (JSON.parse(raw) as QueuedAction[]) : [];
}

export async function clearQueuedActions(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
