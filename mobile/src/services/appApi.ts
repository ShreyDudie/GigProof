import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { enqueueAction, getQueuedActions, clearQueuedActions } from './offlineQueue';

const CACHE_PREFIX = 'cache:';

async function readCache<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
  return raw ? (JSON.parse(raw) as T) : null;
}

async function writeCache<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(value));
}

export async function getWithCache<T>(key: string, endpoint: string): Promise<T> {
  try {
    const response = await api.get(endpoint);
    await writeCache(key, response.data.data ?? response.data);
    return (response.data.data ?? response.data) as T;
  } catch (error) {
    const cached = await readCache<T>(key);
    if (cached) return cached;
    throw error;
  }
}

export async function postWithOfflineQueue<T>(
  endpoint: string,
  payload: any,
  options?: { queueOnFail?: boolean }
): Promise<T> {
  try {
    const response = await api.post(endpoint, payload);
    return (response.data.data ?? response.data) as T;
  } catch (error) {
    if (options?.queueOnFail) {
      await enqueueAction({ endpoint, method: 'POST', payload });
    }
    throw error;
  }
}

export async function flushOfflineQueue(): Promise<{ synced: number; failed: number }> {
  const actions = await getQueuedActions();
  let synced = 0;
  let failed = 0;

  for (const action of actions) {
    try {
      if (action.method === 'POST') {
        await api.post(action.endpoint, action.payload);
      } else if (action.method === 'PATCH') {
        await api.patch(action.endpoint, action.payload);
      } else if (action.method === 'PUT') {
        await api.put(action.endpoint, action.payload);
      } else if (action.method === 'DELETE') {
        await api.delete(action.endpoint);
      }
      synced += 1;
    } catch (_error) {
      failed += 1;
    }
  }

  if (failed === 0) {
    await clearQueuedActions();
  }

  return { synced, failed };
}
