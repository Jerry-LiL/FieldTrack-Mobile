import { syncQueue } from './syncQueue';
import { syncTasksBatchApi, fetchTasksApi } from '../api/taskApi';
import { syncExpensesBatchApi, fetchExpensesApi } from '../api/expenseApi';
import { Task } from '../types/task';
import { Expense } from '../types/expense';
import {
  loadTasksFromStorage,
  saveTasksToStorage,
  loadExpensesFromStorage,
  saveExpensesToStorage,
} from '../storage/asyncStorage';

export interface SyncExecutionResult {
  success: boolean;
  appliedCount: number;
  conflictCount: number;
  tasks: Task[];
  expenses: Expense[];
  error?: string;
}

export class SyncManager {
  private isSyncing = false;

  public async performFullSync(isOnline = true): Promise<SyncExecutionResult> {
    if (!isOnline) {
      const localTasks = await loadTasksFromStorage();
      const localExpenses = await loadExpensesFromStorage();
      return {
        success: false,
        appliedCount: 0,
        conflictCount: 0,
        tasks: localTasks,
        expenses: localExpenses,
        error: 'Device is offline',
      };
    }

    if (this.isSyncing) {
      const localTasks = await loadTasksFromStorage();
      const localExpenses = await loadExpensesFromStorage();
      return {
        success: true,
        appliedCount: 0,
        conflictCount: 0,
        tasks: localTasks,
        expenses: localExpenses,
      };
    }

    this.isSyncing = true;
    let appliedCount = 0;
    let conflictCount = 0;

    try {
      await syncQueue.init();
      const taskMutations = syncQueue.getByEntity('task');
      const expenseMutations = syncQueue.getByEntity('expense');

      let currentTasks = await loadTasksFromStorage();
      let currentExpenses = await loadExpensesFromStorage();

      // 1. Replay task mutations
      if (taskMutations.length > 0) {
        const taskSyncRes = await syncTasksBatchApi(taskMutations);
        appliedCount += taskSyncRes.applied.length;
        conflictCount += taskSyncRes.conflicts.length;

        // Remove applied mutations from queue
        await syncQueue.remove(taskSyncRes.applied);

        // Process conflicts (server_wins)
        const serverWinningMap = new Map<string, Task>();
        for (const conflict of taskSyncRes.conflicts) {
          if (conflict.resolution === 'server_wins' && conflict.serverRecord) {
            serverWinningMap.set(conflict.id, conflict.serverRecord);
          }
        }

        // Merge canonical server records
        const localTasksMap = new Map<string, Task>(currentTasks.map((t) => [t.id, t]));
        for (const serverTask of taskSyncRes.currentRecords) {
          // If server won a conflict or local doesn't exist or local is older and not dirty
          const localItem = localTasksMap.get(serverTask.id);
          if (serverWinningMap.has(serverTask.id) || !localItem || !localItem.isDirty) {
            localTasksMap.set(serverTask.id, { ...serverTask, isDirty: false });
          }
        }
        currentTasks = Array.from(localTasksMap.values());
      } else {
        // No pending task mutations -> pull fresh from server
        try {
          const { tasks: serverTasks } = await fetchTasksApi();
          const localMap = new Map<string, Task>(currentTasks.map((t) => [t.id, t]));
          for (const s of serverTasks) {
            const local = localMap.get(s.id);
            if (!local || !local.isDirty) {
              localMap.set(s.id, { ...s, isDirty: false });
            }
          }
          currentTasks = Array.from(localMap.values());
        } catch (_fetchErr) {
          // Server fetch failed, continue with local
        }
      }

      // 2. Replay expense mutations
      if (expenseMutations.length > 0) {
        const expSyncRes = await syncExpensesBatchApi(expenseMutations);
        appliedCount += expSyncRes.applied.length;
        conflictCount += expSyncRes.conflicts.length;

        await syncQueue.remove(expSyncRes.applied);

        const serverWinningExp = new Map<string, Expense>();
        for (const conflict of expSyncRes.conflicts) {
          if (conflict.resolution === 'server_wins' && conflict.serverRecord) {
            serverWinningExp.set(conflict.id, conflict.serverRecord);
          }
        }

        const localExpMap = new Map<string, Expense>(currentExpenses.map((e) => [e.id, e]));
        for (const serverExp of expSyncRes.currentRecords) {
          const localItem = localExpMap.get(serverExp.id);
          if (serverWinningExp.has(serverExp.id) || !localItem || !localItem.isDirty) {
            localExpMap.set(serverExp.id, { ...serverExp, isDirty: false });
          }
        }
        currentExpenses = Array.from(localExpMap.values());
      } else {
        // No pending expense mutations -> pull fresh from server
        try {
          const { expenses: serverExpenses } = await fetchExpensesApi();
          const localExpMap = new Map<string, Expense>(currentExpenses.map((e) => [e.id, e]));
          for (const s of serverExpenses) {
            const local = localExpMap.get(s.id);
            if (!local || !local.isDirty) {
              localExpMap.set(s.id, { ...s, isDirty: false });
            }
          }
          currentExpenses = Array.from(localExpMap.values());
        } catch (_fetchErr) {
          // Continue with local
        }
      }

      // Persist updated records
      await saveTasksToStorage(currentTasks);
      await saveExpensesToStorage(currentExpenses);

      return {
        success: true,
        appliedCount,
        conflictCount,
        tasks: currentTasks,
        expenses: currentExpenses,
      };
    } catch (err: any) {
      const localTasks = await loadTasksFromStorage();
      const localExpenses = await loadExpensesFromStorage();
      return {
        success: false,
        appliedCount,
        conflictCount,
        tasks: localTasks,
        expenses: localExpenses,
        error: err.message || 'Sync failed',
      };
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncManager = new SyncManager();
