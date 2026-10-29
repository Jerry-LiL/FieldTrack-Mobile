import { SyncMutation, MutationAction } from '../types/sync';
import {
  loadSyncQueueFromStorage,
  saveSyncQueueToStorage,
  clearSyncQueueFromStorage,
} from '../storage/syncQueueStorage';

export class SyncQueueManager {
  private queue: SyncMutation[] = [];
  private initialized = false;

  public async init(): Promise<void> {
    if (this.initialized) return;
    this.queue = await loadSyncQueueFromStorage();
    this.initialized = true;
  }

  public getAll(): SyncMutation[] {
    return [...this.queue];
  }

  public getByEntity(entity: 'task' | 'expense'): SyncMutation[] {
    return this.queue.filter((m) => m.entity === entity);
  }

  public count(): number {
    return this.queue.length;
  }

  /**
   * Enqueue a mutation with smart compaction:
   * 1. CREATE + UPDATE -> CREATE with merged payload
   * 2. CREATE + DELETE -> cancel both (never made it to server)
   * 3. UPDATE + UPDATE -> UPDATE with merged payload
   * 4. UPDATE + DELETE -> DELETE
   */
  public async enqueue(
    entity: 'task' | 'expense',
    action: MutationAction,
    id: string,
    payload: any,
    timestamp = Date.now()
  ): Promise<SyncMutation | null> {
    await this.init();

    const existingIndex = this.queue.findIndex(
      (m) => m.entity === entity && m.id === id
    );

    if (existingIndex !== -1) {
      const existing = this.queue[existingIndex];

      if (existing.action === 'CREATE' && action === 'UPDATE') {
        // Merge updates into pending CREATE
        existing.payload = { ...existing.payload, ...payload };
        existing.timestamp = timestamp;
        await this.persist();
        return existing;
      }

      if (existing.action === 'CREATE' && action === 'DELETE') {
        // Created offline and deleted before syncing to server
        this.queue.splice(existingIndex, 1);
        await this.persist();
        return null;
      }

      if (existing.action === 'UPDATE' && action === 'UPDATE') {
        existing.payload = { ...existing.payload, ...payload };
        existing.timestamp = timestamp;
        await this.persist();
        return existing;
      }

      if (existing.action === 'UPDATE' && action === 'DELETE') {
        existing.action = 'DELETE';
        existing.payload = {};
        existing.timestamp = timestamp;
        await this.persist();
        return existing;
      }
    }

    const mutation: SyncMutation = {
      mutationId: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entity,
      action,
      id,
      payload,
      timestamp,
      retryCount: 0,
    };

    this.queue.push(mutation);
    await this.persist();
    return mutation;
  }

  public async remove(mutationIds: string[]): Promise<void> {
    await this.init();
    const idSet = new Set(mutationIds);
    this.queue = this.queue.filter((m) => !idSet.has(m.mutationId));
    await this.persist();
  }

  public async clear(): Promise<void> {
    this.queue = [];
    this.initialized = true;
    await clearSyncQueueFromStorage();
  }

  private async persist(): Promise<void> {
    await saveSyncQueueToStorage(this.queue);
  }
}

export const syncQueue = new SyncQueueManager();
