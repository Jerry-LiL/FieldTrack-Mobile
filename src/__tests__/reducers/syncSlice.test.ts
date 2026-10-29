import syncReducer, {
  setNetworkOnline,
  setSyncStatus,
  setPendingCount,
  recordSyncSuccess,
  recordSyncFailure,
} from '../../store/syncSlice';
import { SyncState } from '../../types/sync';

describe('syncSlice', () => {
  const initialState: SyncState = {
    isOnline: true,
    status: 'synced',
    pendingCount: 0,
    lastSyncTime: null,
    lastError: null,
  };

  it('updates state when switching offline and online', () => {
    let state = syncReducer(initialState, setNetworkOnline(false));
    expect(state.isOnline).toBe(false);
    expect(state.status).toBe('offline');

    state = syncReducer(state, setNetworkOnline(true));
    expect(state.isOnline).toBe(true);
    expect(state.status).toBe('synced');
  });

  it('handles setPendingCount and updates status if offline', () => {
    let state = syncReducer({ ...initialState, isOnline: false }, setPendingCount(4));
    expect(state.pendingCount).toBe(4);
    expect(state.status).toBe('offline');

    state = syncReducer(initialState, setPendingCount(2));
    expect(state.pendingCount).toBe(2);
  });

  it('handles setSyncStatus', () => {
    const state = syncReducer(initialState, setSyncStatus('syncing'));
    expect(state.status).toBe('syncing');
  });

  it('handles recordSyncSuccess and recordSyncFailure', () => {
    let state = syncReducer(initialState, recordSyncFailure('Network timeout'));
    expect(state.status).toBe('error');
    expect(state.lastError).toBe('Network timeout');

    state = syncReducer(state, recordSyncSuccess());
    expect(state.status).toBe('synced');
    expect(state.lastError).toBeNull();
    expect(state.lastSyncTime).toBeGreaterThan(0);
  });
});
