export type MutationAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface SyncMutation<T = any> {
  mutationId: string;
  entity: 'task' | 'expense';
  action: MutationAction;
  id: string;
  payload: Partial<T>;
  timestamp: number;
  retryCount: number;
}

export interface SyncConflict<T = any> {
  id: string;
  clientTimestamp: number;
  serverTimestamp: number;
  serverRecord: T | null;
  resolution: 'server_wins' | 'client_wins';
}

export interface SyncBatchResponse<T = any> {
  applied: string[];
  conflicts: SyncConflict<T>[];
  currentRecords: T[];
}

export type SyncStateStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface SyncState {
  isOnline: boolean;
  status: SyncStateStatus;
  pendingCount: number;
  lastSyncTime: number | null;
  lastError: string | null;
}
