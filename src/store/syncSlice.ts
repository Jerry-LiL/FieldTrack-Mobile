import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SyncState, SyncStateStatus } from '../types/sync';
import { syncQueue } from '../sync/syncQueue';
import { syncManager, SyncExecutionResult } from '../sync/syncManager';
import { setTasks } from './taskSlice';
import { setExpenses } from './expenseSlice';

const initialState: SyncState = {
  isOnline: true,
  status: 'synced',
  pendingCount: 0,
  lastSyncTime: null,
  lastError: null,
};

export const triggerFullSync = createAsyncThunk<
  SyncExecutionResult,
  void,
  { state: { sync: SyncState } }
>('sync/triggerFullSync', async (_, { getState, dispatch, rejectWithValue }) => {
  const { isOnline } = getState().sync;
  try {
    const result = await syncManager.performFullSync(isOnline);
    if (!result.success && !isOnline) {
      return rejectWithValue('Device is offline');
    }
    // Update tasks and expenses in Redux store
    dispatch(setTasks(result.tasks));
    dispatch(setExpenses(result.expenses));
    return result;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Sync failed');
  }
});

export const refreshPendingCount = createAsyncThunk(
  'sync/refreshPendingCount',
  async () => {
    await syncQueue.init();
    return syncQueue.count();
  }
);

export const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setNetworkOnline: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
      if (!action.payload) {
        state.status = 'offline';
      } else if (state.pendingCount > 0) {
        state.status = 'syncing';
      } else {
        state.status = 'synced';
      }
    },
    setSyncStatus: (state, action: PayloadAction<SyncStateStatus>) => {
      state.status = action.payload;
    },
    setPendingCount: (state, action: PayloadAction<number>) => {
      state.pendingCount = action.payload;
      if (!state.isOnline) {
        state.status = 'offline';
      }
    },
    recordSyncSuccess: (state) => {
      state.status = state.isOnline ? 'synced' : 'offline';
      state.lastSyncTime = Date.now();
      state.lastError = null;
    },
    recordSyncFailure: (state, action: PayloadAction<string>) => {
      state.status = 'error';
      state.lastError = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(triggerFullSync.pending, (state) => {
        if (state.isOnline) {
          state.status = 'syncing';
        }
      })
      .addCase(triggerFullSync.fulfilled, (state, action) => {
        state.pendingCount = syncQueue.count();
        state.status = state.isOnline ? 'synced' : 'offline';
        state.lastSyncTime = Date.now();
        state.lastError = action.payload.error || null;
      })
      .addCase(triggerFullSync.rejected, (state, action) => {
        state.pendingCount = syncQueue.count();
        if (state.isOnline) {
          state.status = 'error';
          state.lastError = (action.payload as string) || 'Sync failed';
        } else {
          state.status = 'offline';
        }
      })
      .addCase(refreshPendingCount.fulfilled, (state, action) => {
        state.pendingCount = action.payload;
        if (!state.isOnline) {
          state.status = 'offline';
        }
      });
  },
});

export const {
  setNetworkOnline,
  setSyncStatus,
  setPendingCount,
  recordSyncSuccess,
  recordSyncFailure,
} = syncSlice.actions;

export default syncSlice.reducer;
