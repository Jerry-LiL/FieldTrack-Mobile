import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncMutation } from '../types/sync';

const QUEUE_KEY = '@fieldtrack/sync_queue';

export async function loadSyncQueueFromStorage(): Promise<SyncMutation[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SyncMutation[];
  } catch (error) {
    console.warn('Failed to load sync queue from storage:', error);
    return [];
  }
}

export async function saveSyncQueueToStorage(queue: SyncMutation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.warn('Failed to save sync queue to storage:', error);
  }
}

export async function clearSyncQueueFromStorage(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
  } catch (error) {
    console.warn('Failed to clear sync queue from storage:', error);
  }
}
