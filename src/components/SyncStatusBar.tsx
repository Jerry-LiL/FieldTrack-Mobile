import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { triggerFullSync } from '../store/syncSlice';

interface Props {
  onPressDetails?: () => void;
}

export const SyncStatusBar: React.FC<Props> = ({ onPressDetails }) => {
  const dispatch = useAppDispatch();
  const { isOnline, status, pendingCount, lastError } = useAppSelector((state) => state.sync);

  const handleSyncPress = () => {
    if (onPressDetails) {
      onPressDetails();
    } else {
      dispatch(triggerFullSync());
    }
  };

  if (isOnline && status === 'synced' && pendingCount === 0) {
    return (
      <View testID="sync-status-bar" style={[styles.container, styles.syncedContainer]}>
        <View style={[styles.dot, styles.syncedDot]} />
        <Text style={styles.syncedText}>Online - All changes synced</Text>
      </View>
    );
  }

  if (!isOnline) {
    return (
      <TouchableOpacity
        testID="sync-status-bar"
        style={[styles.container, styles.offlineContainer]}
        onPress={handleSyncPress}
        activeOpacity={0.8}
      >
        <View style={[styles.dot, styles.offlineDot]} />
        <Text style={styles.offlineText}>
          Offline - {pendingCount} {pendingCount === 1 ? 'change' : 'changes'} pending
        </Text>
      </TouchableOpacity>
    );
  }

  if (status === 'syncing') {
    return (
      <View testID="sync-status-bar" style={[styles.container, styles.syncingContainer]}>
        <ActivityIndicator size="small" color="#2563EB" style={styles.spinner} />
        <Text style={styles.syncingText}>
          Syncing changes {pendingCount > 0 ? `(${pendingCount} remaining)` : ''}...
        </Text>
      </View>
    );
  }

  // Error state
  return (
    <TouchableOpacity
      testID="sync-status-bar"
      style={[styles.container, styles.errorContainer]}
      onPress={handleSyncPress}
      activeOpacity={0.8}
    >
      <View style={[styles.dot, styles.errorDot]} />
      <Text style={styles.errorText} numberOfLines={1}>
        Sync error: {lastError || 'Tap to retry'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  syncedContainer: {
    backgroundColor: '#ECFDF5',
  },
  offlineContainer: {
    backgroundColor: '#FEF3C7',
  },
  syncingContainer: {
    backgroundColor: '#EFF6FF',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  syncedDot: {
    backgroundColor: '#10B981',
  },
  offlineDot: {
    backgroundColor: '#F59E0B',
  },
  errorDot: {
    backgroundColor: '#EF4444',
  },
  spinner: {
    marginRight: 8,
  },
  syncedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#065F46',
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400E',
  },
  syncingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E40AF',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#991B1B',
    flex: 1,
  },
});
