import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { triggerFullSync, refreshPendingCount } from '../store/syncSlice';
import { logoutUser } from '../store/authSlice';
import { seedTasksBenchmark } from '../store/taskSlice';
import { seedExpensesBenchmark } from '../store/expenseSlice';
import { syncQueue } from '../sync/syncQueue';
import { SyncMutation } from '../types/sync';
import { formatRelativeTime } from '../utils/date';

export const SyncDebugScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isOnline, status, pendingCount, lastSyncTime, lastError } = useAppSelector(
    (state) => state.sync
  );
  const currentUser = useAppSelector((state) => state.auth.user);

  const [pendingItems, setPendingItems] = useState<SyncMutation[]>([]);
  const [isWorking, setIsWorking] = useState(false);

  const loadPendingItems = useCallback(async () => {
    await syncQueue.init();
    setPendingItems(syncQueue.getAll());
    dispatch(refreshPendingCount());
  }, [dispatch]);

  useEffect(() => {
    loadPendingItems();
  }, [loadPendingItems, pendingCount]);

  const handleSyncNow = async () => {
    setIsWorking(true);
    await dispatch(triggerFullSync());
    await loadPendingItems();
    setIsWorking(false);
  };

  const handleSeedBoth = async () => {
    setIsWorking(true);
    await dispatch(seedTasksBenchmark(1000));
    await dispatch(seedExpensesBenchmark(500));
    await loadPendingItems();
    setIsWorking(false);
  };

  const handleClearQueue = async () => {
    const confirm = async () => {
      await syncQueue.clear();
      await loadPendingItems();
    };

    if (Alert && Alert.alert) {
      Alert.alert(
        'Clear Queue',
        'Discard all pending offline mutations?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', style: 'destructive', onPress: confirm },
        ]
      );
    } else {
      await confirm();
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>Sync & Connectivity</Text>

        <View style={styles.statusBox}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Network Connection</Text>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: isOnline ? '#10B981' : '#F59E0B' },
                ]}
              />
              <Text style={styles.statusValue}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Sync Status</Text>
            <Text style={styles.statusValue}>
              {status === 'synced'
                ? 'Synced'
                : status === 'syncing'
                ? 'Sync in progress'
                : status === 'offline'
                ? 'Offline mode'
                : 'Sync error'}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Pending Mutations</Text>
            <Text style={styles.statusValue}>{pendingCount} items in queue</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Last Synced</Text>
            <Text style={styles.statusValue}>
              {formatRelativeTime(lastSyncTime)}
            </Text>
          </View>

          {lastError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{lastError}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, isWorking && styles.buttonDisabled]}
            onPress={handleSyncNow}
            disabled={isWorking}
            testID="sync-now-button"
          >
            {isWorking ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Replay & Sync Now</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSeedBoth}
            disabled={isWorking}
            testID="seed-benchmark-button"
          >
            <Text style={styles.secondaryButtonText}>
              Seed 1,000 Tasks & 500 Expenses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleClearQueue}
            testID="clear-queue-button"
          >
            <Text style={styles.dangerButtonText}>Clear Pending Queue</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pending Mutations List */}
      <View style={styles.card}>
        <View style={styles.queueHeader}>
          <Text style={styles.heading}>Pending Queue ({pendingItems.length})</Text>
          <TouchableOpacity onPress={loadPendingItems}>
            <Text style={styles.refreshLink}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {pendingItems.length === 0 ? (
          <Text style={styles.emptyText}>Queue is empty. All local edits are synced.</Text>
        ) : (
          pendingItems.map((mut) => (
            <View key={mut.mutationId} style={styles.mutationItem}>
              <View style={styles.mutHeader}>
                <View style={styles.mutTagRow}>
                  <Text style={styles.mutAction}>{mut.action}</Text>
                  <Text style={styles.mutEntity}>{mut.entity.toUpperCase()}</Text>
                </View>
                <Text style={styles.mutTime}>
                  {formatRelativeTime(mut.timestamp)}
                </Text>
              </View>
              <Text style={styles.mutId}>ID: {mut.id}</Text>
              {mut.payload?.title && (
                <Text style={styles.mutTitle} numberOfLines={1}>
                  &ldquo;{mut.payload.title}&rdquo;
                </Text>
              )}
            </View>
          ))
        )}
      </View>

      {/* User Session */}
      <View style={styles.card}>
        <Text style={styles.heading}>Signed In As</Text>
        <Text style={styles.sessionName}>{currentUser?.name || 'Technician'}</Text>
        <Text style={styles.sessionEmail}>{currentUser?.email || 'vineet@fieldtrack.dev'}</Text>
        <Text style={styles.sessionRole}>{currentUser?.role || 'Field Engineer'}</Text>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          testID="logout-button"
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  statusBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  statusLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#991B1B',
  },
  actions: {
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD',
  },
  secondaryButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '600',
  },
  dangerButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  refreshLink: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    paddingVertical: 10,
    textAlign: 'center',
  },
  mutationItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  mutTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mutAction: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mutEntity: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  mutTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  mutId: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  mutTitle: {
    fontSize: 12,
    color: '#334155',
    fontStyle: 'italic',
    marginTop: 2,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  sessionEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  sessionRole: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 12,
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 13,
  },
});
